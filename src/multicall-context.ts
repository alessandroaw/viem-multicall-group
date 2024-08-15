import {
  AbiStateMutability,
  ContractFunctionParameters,
  MulticallContracts,
  MulticallReturnType,
  Narrow,
} from "viem";

// CreateMulticallContext is a proxy type for MulticallContext
// that allows the key to be generated non-explicitly
export type CreateMulticallContext<
  contracts extends readonly unknown[] = readonly ContractFunctionParameters[],
  FormatterFnReturn = MulticallReturnType<contracts, false>
> = Pick<MulticallContext<contracts, FormatterFnReturn>, "contracts"> & {
  key?: MulticallContextKey;
  formatter?: FormatterFn<
    MulticallReturnType<contracts, false>,
    FormatterFnReturn
  >;
};

// MulticallContext is a type-safe object that represents
// a specific (key based) multicall request with formatted function
export type MulticallContext<
  contracts extends readonly unknown[] = readonly ContractFunctionParameters[],
  FormatterFnReturn = MulticallReturnType<contracts, false>
> = {
  key: MulticallContextKey;
  contracts: MulticallContracts<
    Narrow<contracts>,
    { mutability: AbiStateMutability }
  >;
  formatter: FormatterFn<
    MulticallReturnType<contracts, false>,
    FormatterFnReturn
  >;
};

// FormatteerFn is a function that takes the result of a multicall
// and formats it into a specific type
export type FormatterFn<Params, ReturnType> = (result: Params) => ReturnType;

// MulticallContextKey is a identifier to map multicall requests
export type MulticallContextKey = ReadonlyArray<unknown>;
