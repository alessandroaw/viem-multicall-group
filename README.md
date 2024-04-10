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

// Constructing the multicall contracts array
const contracts = [
  {
    address: weth, 
    abi: erc20Abi,
    functionName: 'symbol',
  },
  {
    address: weth, 
    abi: erc20Abi,
    functionName: 'decimals',
  },
  {
    address: usdc,
    abi: erc20Abi,
    functionName: 'symbol',
  },
  {
    address: usdc,
    abi: erc20Abi,
    functionName: 'decimals',
  },
] as const;

// Executing the multicall
const results = await multicall(client, { contracts });
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
    functionName: 'baseUri',
  },
] as const;

const results = await multicall(client, { contracts });
// The addition of different contract types exacerbates the difficulty in result management.
```

These examples highlight the key issues with traditional multicall practices: loss of context and composability. Without a structured way to manage these calls, developers are left to manually ensure each call's context is preserved and correctly interpreted, a task that becomes exponentially more complex with the addition of more calls and contract types.


