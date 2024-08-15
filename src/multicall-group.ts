import { MulticallReturnType, PublicClient } from "viem";
import {
  CreateMulticallContext,
  MulticallContext,
  MulticallContextKey,
} from "./multicall-context";

// MulticallGroup is a class to group multiple multicall request
// and execute them in a single multicall request and get the
// formatted result grouped by each context
export class MulticallGroup {
  private _client: PublicClient;
  private _contracts: unknown[] = [];
  private _results: unknown[] = [];
  private _lastCalled: number = 0;
  private _contractSlice: Record<string, SliceDelimiter> = {};

  constructor(client: PublicClient) {
    this._client = client;
  }

  public get client() {
    return this._client;
  }

  // callContext is special function to execute
  // direct isolated multicall requests
  public async callContext<
    const contracts extends readonly unknown[],
    FormatterFnReturn = MulticallReturnType<contracts, false>
  >(
    context: CreateMulticallContext<contracts, FormatterFnReturn>
  ): Promise<FormatterFnReturn> {
    const result = await this._client.multicall({
      contracts: context.contracts,
      allowFailure: false,
    });

    if (!context.formatter) {
      return result as FormatterFnReturn;
    }
    return context.formatter(result);
  }

  // call is a function to execute all multicall context
  // that were added to the group
  public async call() {
    const start = this._lastCalled;
    const end = this._contracts.length;

    if (start === end) {
      console.warn("No multicall context to call");
      return;
    }

    const contractBatch = this._contracts.slice(start, end);
    const nextResults = await this._client.multicall({
      contracts: contractBatch as readonly unknown[],
      allowFailure: false,
    });

    this._results.push(...nextResults);
    this._lastCalled = this._results.length;
  }

  // addContext is a function to add a multicall context
  // to the group and return a function to get the formatted result
  public addContext<
    const contracts extends readonly unknown[],
    FormatterFnReturn = MulticallReturnType<contracts, false>
  >(
    context: CreateMulticallContext<contracts, FormatterFnReturn>
  ): () => FormatterFnReturn {
    const keySeed = context.key ?? this._generateKey();
    const key = this._constructKey(keySeed);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    this._contractSlice[key] = { start, end };

    return () => {
      return this.getFormatted({
        formatter: (result) => result as FormatterFnReturn,
        ...context,
        key: keySeed,
      });
    };
  }

  // getFormatted is a function to get the formatted result
  // based on the multicall context key
  public getFormatted<
    const contracts extends readonly unknown[],
    FormatterFnReturn
  >(context: MulticallContext<contracts, FormatterFnReturn>) {
    const key = this._constructKey(context.key);
    const { start, end } = this._contractSlice[key];

    if (end > this._lastCalled) {
      throw new Error(
        "MulticallGroup.call() must be called before getFormatted"
      );
    }

    const result = this._results.slice(start, end);

    return context.formatter(result as MulticallReturnType<contracts, false>);
  }

  // _constructKey is a function to construct a key
  // from multiple values
  private _constructKey(key: MulticallContextKey) {
    return JSON.stringify(key);
  }

  // _generateKey is a function to generate a random key
  private _generateKey(): MulticallContextKey {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    return [timestamp, randomString];
  }
}

type SliceDelimiter = { start: number; end: number };
