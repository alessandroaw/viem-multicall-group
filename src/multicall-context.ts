import {
  AbiStateMutability,
  ContractFunctionParameters,
  MulticallContracts,
  Narrow,
} from "viem";

export function createMulticallContext<T>(
  context: MulticallContext<T>
): MulticallContext<T> {
  return context;
}

export type CreateMulticallContext<
  T,
  contracts extends readonly unknown[] = readonly ContractFunctionParameters[]
> = Omit<MulticallContext<T, contracts>, "key"> & {
  key?: MulticallContextKey;
};

export type MulticallContext<
  T,
  contracts extends readonly unknown[] = readonly ContractFunctionParameters[]
> = {
  key: MulticallContextKey;
  // contracts: _Contract[];
  contracts: MulticallContracts<
    Narrow<contracts>,
    { mutability: AbiStateMutability }
  >;
  formatter: FormatterFn<T>;
};

export type FormatterFn<TResult> = (result: unknown[]) => TResult;

export type MulticallContextKey = ReadonlyArray<unknown>;
