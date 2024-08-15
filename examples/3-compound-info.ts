import { createPublicClient, http, parseAbi } from "viem";
import { arbitrum } from "viem/chains";
import { MulticallGroup } from "../src/multicall-group";

// COMET Contract
const COMET_INTERFACE = [
  "struct UserBasic { int104 principal; uint64 baseTrackingIndex; uint64 baseTrackingAccrued; uint16 assetsIn; }",
  "struct AssetInfo { uint8 offset; address asset; address priceFeed; uint64 scale; uint64 borrowCollateralFactor; uint64 liquidateCollateralFactor; uint64 liquidationFactor; uint128 supplyCap; }",
  "function userBasic(address user) external view returns (UserBasic)",
  // BASE TOKEN
  "function numAssets() external view returns (uint8)",
  "function decimals() external view returns (uint8)",
  "function baseToken() external view returns (address)",
  "function baseBorrowMin() public view returns (uint256)",
  "function baseTokenPriceFeed() public view returns (address)",
  "function priceScale() external returns (uint64)",
  // APR
  "function getUtilization() public view returns (uint)",
  "function getSupplyRate(uint utilization) public view returns (uint64)",
  "function getBorrowRate(uint utilization) public view returns (uint64)",
  "function getPrice(address priceFeed) public view returns (uint128)",
  // ASSET INFO
  "function getAssetInfo(uint8 i) public view returns (AssetInfo)",
  "function getAssetInfoByAddress(address asset) public view returns (AssetInfo)",
  // COLLATERAL / BORROW
  "function collateralBalanceOf(address account, address asset) external view returns (uint128)",
  "function balanceOf(address account) external view returns (uint128)",
  "function borrowBalanceOf(address account) external view returns (uint128)",
] as const;
const COMET_ABI = parseAbi(COMET_INTERFACE);

// Setting up constants
const INDEX_SCALE = BigInt(1e18);
const PRICE_SCALE = BigInt(1e8);
const BASE_TOKEN_SCALE = BigInt(1e6);
const DECIMAL_PRECISION = BigInt(1e4);

// Configuration
const userAddress = "0x08927125C4884C9b80f634e3B2a0bAd738B28DfD";
const cometAddress = "0xa5edbdd9646f8dff606d7448e414884c7d905dca";
const client = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

// In this example we will be fetching the user info on the Compound V3
async function main() {
  // Creating MulticallGroup Instance
  const mg = new MulticallGroup(client);

  // Setting Base user info context
  const userInfoResolver = mg.addContext({
    contracts: [
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "userBasic",
        args: [userAddress],
      },
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "borrowBalanceOf",
        args: [userAddress],
      },
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      },
    ],
    formatter: (results) => ({
      userBasic: results[0],
      borrowBalance: results[1],
      balance: results[2],
    }),
  });

  const generalMetricResolver = mg.addContext({
    contracts: [
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "numAssets",
      },
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "baseToken",
      },
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "decimals",
      },
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "getUtilization",
      },
    ],
    // Results are in order of the contracts
    // and automatically have the type returned by viem
    formatter: (results) => ({
      numAssets: results[0],
      baseToken: results[1],
      decimals: results[2],
      utilization: results[3],
    }),
  });

  // Batching the first multicall
  await mg.call();
  // Invoking the resolvers will return the formatted results
  const userInfo = userInfoResolver();
  const generalMetric = generalMetricResolver();

  // Compound specific things
  // Getting the assets that the user has
  const assetInMask = userInfo.userBasic.assetsIn;
  const userAssetIndexes = [...Array(generalMetric.numAssets).keys()].filter(
    (i) => {
      return (assetInMask & (1 << i)) !== 0;
    }
  );

  // You can group multiple context in an array of context
  // Hence simplifying the formatting of each result
  const assetInfoResolvers = userAssetIndexes.map((i) => {
    return mg.addContext({
      contracts: [
        {
          address: cometAddress,
          abi: COMET_ABI,
          functionName: "getAssetInfo",
          args: [i],
        },
      ],
      formatter: (results) => results[0],
    });
  });

  // You can also addContext without formatter
  // This way the result will be the same with
  // the result of the viem multicall
  const interestRateResolver = mg.addContext({
    contracts: [
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "getSupplyRate",
        args: [generalMetric.utilization],
      },
      {
        address: cometAddress,
        abi: COMET_ABI,
        functionName: "getBorrowRate",
        args: [generalMetric.utilization],
      },
    ],
  });

  // Batching the second multicall
  await mg.call();

  // Just like before invoking the resolvers will return the formatted results
  const assetInfos = assetInfoResolvers.map((resolver) => resolver());

  // You can also add additional data to the formatter
  const userAssetInfoResolvers = assetInfos.map((info) => {
    return mg.addContext({
      contracts: [
        {
          address: cometAddress,
          abi: COMET_ABI,
          functionName: "collateralBalanceOf",
          args: [userAddress, info.asset],
        },
        {
          address: cometAddress,
          abi: COMET_ABI,
          functionName: "getPrice",
          args: [info.priceFeed],
        },
      ],
      // In this formatter, we are formatting the data
      // based on the values of the asset info
      // which is not in the scope of the multicall
      formatter: (results) => {
        const collateralBalance = results[0];
        const price = results[1];
        const PRICE_TO_BASE_SCALE = PRICE_SCALE / BASE_TOKEN_SCALE;
        const collateralValue =
          (collateralBalance * price) / (info.scale * PRICE_TO_BASE_SCALE);
        const collateralLiquidationValue =
          (collateralValue * info.liquidationFactor) / INDEX_SCALE;

        return {
          collateralBalance,
          collateralValue,
          collateralLiquidationValue,
        };
      },
    });
  });

  // Referring to the interestRateResolver
  // the result will be the same with the result of the viem multicall
  // which is an array of values returned by the contracts
  const [supplyRate, borrowRate] = interestRateResolver();
  const YEAR_IN_SECONDS = BigInt(365 * 24 * 60 * 60);
  const PERCENT = BigInt(100);
  const supplyApy =
    Number(
      (supplyRate * YEAR_IN_SECONDS * DECIMAL_PRECISION * PERCENT) / INDEX_SCALE
    ) / Number(DECIMAL_PRECISION);

  const borrowApy =
    Number(
      (borrowRate * YEAR_IN_SECONDS * DECIMAL_PRECISION * PERCENT) / INDEX_SCALE
    ) / Number(DECIMAL_PRECISION);

  // Batching the last multicall
  await mg.call();
  const userAssetInfos = userAssetInfoResolvers.map((resolver) => resolver());

  // From here you can do whatever you want with the data
  const totalAssetValue = userAssetInfos.reduce((acc, info) => {
    return acc + info.collateralValue;
  }, userInfo.balance);

  const totalLiquidAssetValue = userAssetInfos.reduce((acc, info) => {
    return acc + info.collateralLiquidationValue;
  }, userInfo.balance);

  const ltv =
    Number((userInfo.borrowBalance * DECIMAL_PRECISION) / totalAssetValue) /
    Number(DECIMAL_PRECISION);

  const healthFactor =
    Number(
      (totalLiquidAssetValue * DECIMAL_PRECISION) / userInfo.borrowBalance
    ) / Number(DECIMAL_PRECISION);

  console.log({
    totalAssetValue,
    totalLiquidAssetValue,
    borrowBalance: userInfo.borrowBalance,
    ltv,
    healthFactor,
    supplyApy,
    borrowApy,
  });
}

main();
