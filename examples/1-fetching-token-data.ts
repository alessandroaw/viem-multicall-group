import { createPublicClient, erc20Abi, http } from "viem";
import { arbitrum } from "viem/chains";
import { MulticallGroup, createMulticallContext } from "../src/multicall-group";

async function main() {
  const client = createPublicClient({
    chain: arbitrum,
    transport: http(),
  });

  const mg = new MulticallGroup(client);

  const tokenInfoCtx = createMulticallContext({
    label: "token-info",
    formatter: (result: string[]) => ({
      name: result[0],
      symbol: result[1],
    }),
    contracts: [
      {
        abi: erc20Abi,
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
        functionName: "name",
      },
      {
        abi: erc20Abi,
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
        functionName: "symbol",
      },
    ],
  });

  mg.addContext(tokenInfoCtx);

  await mg.call();

  const res = mg.getFormatted(tokenInfoCtx);
  console.log(res);
}

main();
