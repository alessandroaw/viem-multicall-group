import { Address } from "viem";

export type FormatterFn<TResult> = (result: any) => TResult;

export type _Contract = {
  abi: any;
  address: Address;
  functionName: string;
  args?: any[];
};

export type MulticallContextKey = ReadonlyArray<unknown>;
