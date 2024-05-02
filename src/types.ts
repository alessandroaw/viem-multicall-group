import { Address } from "viem";

export type FormatterFn<TResult> = (result: unknown[]) => TResult;

// TODO - add a type for the contract ABI
export type _Contract = {
  abi: any;
  address: Address;
  functionName: string;
  args?: unknown[];
};

export type MulticallContextKey = ReadonlyArray<unknown>;
