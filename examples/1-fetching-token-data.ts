import { Address, createPublicClient, erc20Abi, erc721Abi, http } from "viem";
import { arbitrum } from "viem/chains";
import { MulticallGroup } from "../src/multicall-group";

const tokens: Address[] = [
  // WETH
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  // ARB
  "0x912ce59144191c1204e64559fe8253a0e49e6548",
  // USDC
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  // USDC.e
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
];

const nfts: Address[] = [
  // XBOX
  "0xDeeDc540B58D2089e834876f5ecA778FfC507993",
  // Uniswap V3 NFT
  "0xc36442b4a4522e871399cd717abdd847ab11fe88",
];

async function main() {
  const client = createPublicClient({
    chain: arbitrum,
    transport: http(),
  });

  const mg = new MulticallGroup(client);

  const tokenInfos = tokens.map((address) => {
    return {
      tokenAddress: address,
      resolver: mg.addContext({
        contracts: [
          {
            address,
            abi: erc20Abi,
            functionName: "name",
          },
          {
            address,
            abi: erc20Abi,
            functionName: "decimals",
          },
          {
            address,
            abi: erc20Abi,
            functionName: "symbol",
          },
        ],
        formatter: (results) => ({
          name: results[0],
          decimals: results[1],
          symbol: results[2],
        }),
      }),
    };
  });

  const nftInfos = nfts.map((address) => {
    return {
      nftAddress: address,
      resolver: mg.addContext({
        contracts: [
          {
            address,
            abi: erc721Abi,
            functionName: "name",
          },
          {
            address,
            abi: erc721Abi,
            functionName: "symbol",
          },
        ],
        formatter: (results) => ({
          name: results[0],
          symbol: results[1],
        }),
      }),
    };
  });

  await mg.call();

  const formattedTokenInfo = tokenInfos.map((info) => ({
    tokenAddress: info.tokenAddress,
    ...info.resolver(),
  }));

  const formattedNftInfo = nftInfos.map((info) => ({
    nftAddress: info.nftAddress,
    ...info.resolver(),
  }));

  console.log(formattedTokenInfo);
  console.log(formattedNftInfo);
}

main();
