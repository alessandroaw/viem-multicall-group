import { PublicClient } from "viem";
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
  private _isCalled = false;
  private _contractSlice: Record<string, SliceDelimiter> = {};

  constructor(client: PublicClient) {
    this._client = client;
  }

  public get client() {
    return this._client;
  }

  // callContext is special function to execute
  // direct isolated multicall requests
  public async callContext<TResult>(
    context: CreateMulticallContext<TResult>
  ): Promise<TResult> {
    const result = await this._client.multicall({
      contracts: context.contracts,
      allowFailure: false,
    });

    return context.formatter(result);
  }

  // call is a function to execute all multicall context
  // that were added to the group
  public async call() {
    this._results = await this._client.multicall({
      contracts: this._contracts as readonly unknown[],
      allowFailure: false,
    });
    this._isCalled = true;
  }

  // addContext is a function to add a multicall context
  // to the group and return a function to get the formatted result
  public addContext<TResult, const contracts extends readonly unknown[]>(
    context: CreateMulticallContext<TResult, contracts>
  ): () => TResult {
    const keySeed = context.key ?? this._generateKey();
    const key = this._constructKey(keySeed);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    this._contractSlice[key] = { start, end };

    return () => {
      return this.getFormatted({ ...context, key: keySeed });
    };
  }

  // getFormatted is a function to get the formatted result
  // based on the multicall context key
  public getFormatted<TResult, const contracts extends readonly unknown[]>(
    context: MulticallContext<TResult, contracts>
  ) {
    if (!this._isCalled) {
      throw new Error(
        "MulticallGroup.call() must be called before getFormatted"
      );
    }

    const key = this._constructKey(context.key);
    const { start, end } = this._contractSlice[key];
    const result = this._results.slice(start, end);
    return context.formatter(result);
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
