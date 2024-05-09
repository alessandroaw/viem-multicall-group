import { Address, createPublicClient, erc20Abi, http } from "viem";
import { arbitrum } from "viem/chains";
import { MulticallGroup } from "../src/multicall-group";

// WETH
const tokenAddress: Address = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";

async function main() {
  const client = createPublicClient({
    chain: arbitrum,
    transport: http(),
  });

  const mg = new MulticallGroup(client);

  const tokenInfo = mg.callContext({
    key: ["singular-call"],
    contracts: [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
    formatter: (res) => {
      return {
        name: res[0] as string,
        decimals: res[1] as bigint,
        symbol: res[2] as string,
      };
    },
  });
}

main();
