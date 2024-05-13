# Multicall Group

Multicall Group library serves as a [viem](https://github.com/wevm/viem) wrapper, designed to simplify the management of multiple multicall contexts within your blockchain applications. By streamlining the handling of numerous calls, our tool aims to enhance both the readability and maintainability of your code, especially when dealing with complex, multi-contract interactions.

## The Problem

Working with multicall functionalities in blockchain applications, developers often face two significant challenges:

1. **Context Management**: The core of multicall's utility lies in its ability to execute multiple contract calls in a single request. However, as the number of calls grows, maintaining the context of each call becomes a daunting task. Developers find themselves struggling to map the responses back to their respective calls, leading to increased complexity and the potential for errors.

2. **Lack of Composability**: Traditional multicall usage requires all calls to be defined within a single multicall request. This approach severely limits the ability to compose calls from smaller, reusable functions. As a result, developers are forced into a pattern of code duplication and reduced modularity, hindering maintainability and scalability.

### Example

Consider a scenario where you need to fetch token metadata for both WETH and USDC tokens:

```ts
// Token addresses
const weth = "0x..";
const usdc = "0x...";

const client = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

// Constructing the multicall contracts array
const contracts = [
  {
    address: weth,
    abi: erc20Abi,
    functionName: "symbol",
  },
  {
    address: weth,
    abi: erc20Abi,
    functionName: "decimals",
  },
  {
    address: usdc,
    abi: erc20Abi,
    functionName: "symbol",
  },
  {
    address: usdc,
    abi: erc20Abi,
    functionName: "decimals",
  },
] as const;

// Executing the multicall
const results = await client.multicall({ contracts });
// Developers must manually track the order of calls to interpret the results correctly.
```

Moreover let's say if for some optimization we need to add call that have different context like erc721 call. It's make it more complext destruct all the result properly since it's have multiple context.

```ts
// Including an NFT contract
const bayc = "0x...";

const contracts = [
  // Existing ERC20 token calls...
  {
    address: bayc,
    abi: erc721Abi,
    functionName: "baseUri",
  },
] as const;

const results = await client.multicall({ contracts });
// The addition of different contract types exacerbates the difficulty in result management.
```

These examples highlight the key issues with traditional multicall practices: loss of context and composability. Without a structured way to manage these calls, developers are left to manually ensure each call's context is preserved and correctly interpreted, a task that becomes exponentially more complex with the addition of more calls and contract types.

## The Solution

The Multicall Group introduces a simpler and more flexible approach to managing multicall functionalities, ensuring both the scalability and modularity of your code. By abstracting the intricacies of multicall context management, our multicall group enables developers to effortlessly compose, execute, and interpret multiple contract calls.

### Key Features

- **Contextual Grouping**: Multicall Group allows you to group related calls into distinct contexts. This grouping not only organizes the calls better but also simplifies the mapping and interpretation of responses, ensuring each response is automatically associated with its corresponding call.

- **Composable Call Structures**: Unlike traditional multicall patterns that confine calls to a single request, our library supports the composition of calls from reusable, smaller units. This leads to less code duplication and promotes the development of more modular and maintainable codebases.

- **Integrated Response Formatting**: To further reduce complexity, the library offers an integrated response formatting feature. Developers can define custom formatters for each group of calls, which automatically processes and formats the responses upon call completion. This eliminates the manual tracking and handling of raw responses.

### Improved Example

Let's revisit the earlier scenario where you need to fetch token metadata for multiple tokens using both ERC20 and potentially ERC721 standards:

```ts
// Token addresses
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
        name: results[0] as string,
        decimals: results[1] as bigint,
        symbol: results[2] as string,
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
        name: results[0] as string,
        symbol: results[1] as string,
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
```

In this improved example, each token's related calls are grouped and formatted in one go, demonstrating how this relatively simple module can greatly simplifies interaction with multiple contracts by reducing the complexity and improving code readability and maintainability. This approach not only clarifies the management of different contract types but also showcases the ease of integrating diverse contract calls, like ERC20 and ERC721, within the same framework.
