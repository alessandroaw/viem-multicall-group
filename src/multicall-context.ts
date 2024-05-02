import { FormatterFn, MulticallContextKey, _Contract } from "./types";

export type MulticallContext<T> = {
  key: MulticallContextKey;
  contracts: _Contract[];
  formatter: FormatterFn<T>;
};

export function createMulticallContext<T>(
  context: MulticallContext<T>
): MulticallContext<T> {
  return context;
}
