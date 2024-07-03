import {
  AbiStateMutability,
  ContractFunctionParameters,
  MulticallContracts,
  Narrow,
} from "viem";

// createMulticallContext is a helper function to create
// type-safe MulticallContext objects.
export function createMulticallContext<T>(
  context: MulticallContext<T>
): MulticallContext<T> {
  return context;
}

// CreateMulticallContext is a proxy type for MulticallContext
// that allows the key to be generated non-explicitly
export type CreateMulticallContext<
  T,
  contracts extends readonly unknown[] = readonly ContractFunctionParameters[]
> = Omit<MulticallContext<T, contracts>, "key"> & {
  key?: MulticallContextKey;
};

// MulticallContext is a type-safe object that represents
// a specific (key based) multicall request with formatted function
export type MulticallContext<
  T,
  contracts extends readonly unknown[] = readonly ContractFunctionParameters[]
> = {
  key: MulticallContextKey;
  contracts: MulticallContracts<
    Narrow<contracts>,
    { mutability: AbiStateMutability }
  >;
  formatter: FormatterFn<T>;
};

// FormatteerFn is a function that takes the result of a multicall
// and formats it into a specific type
export type FormatterFn<TResult> = (result: unknown[]) => TResult;

// MulticallContextKey is a identifier to map multicall requests
export type MulticallContextKey = ReadonlyArray<unknown>;
