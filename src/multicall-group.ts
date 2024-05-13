import { PublicClient } from "viem";
import {
  CreateMulticallContext,
  MulticallContext,
  MulticallContextKey,
} from "./multicall-context";

export class MulticallGroup {
  private client: PublicClient;
  private _contracts: unknown[] = [];
  private _results: unknown[] = [];
  private _isCalled = false;
  private contractSlice: Record<string, SliceDelimiter> = {};

  constructor(client: PublicClient) {
    this.client = client;
  }

  public async call() {
    this._results = await this.client.multicall({
      contracts: this._contracts as readonly unknown[],
      allowFailure: false,
    });
    this._isCalled = true;
  }

  public async callContext<TResult>(
    context: CreateMulticallContext<TResult>
  ): Promise<TResult> {
    const result = await this.client.multicall({
      contracts: context.contracts,
      allowFailure: false,
    });

    return context.formatter(result);
  }

  public addContext<TResult, const contracts extends readonly unknown[]>(
    context: CreateMulticallContext<TResult, contracts>
  ): () => TResult {
    const keySeed = context.key ?? this._generateKey();
    const key = this._constructKey(keySeed);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    this.contractSlice[key] = { start, end };

    return () => {
      return this.getFormatted({ ...context, key: keySeed });
    };
  }

  public getFormatted<TResult, const contracts extends readonly unknown[]>(
    context: MulticallContext<TResult, contracts>
  ) {
    if (!this._isCalled) {
      throw new Error(
        "MulticallGroup.call() must be called before getFormatted"
      );
    }

    const key = this._constructKey(context.key);
    const { start, end } = this.contractSlice[key];
    const result = this._results.slice(start, end);
    return context.formatter(result);
  }

  private _constructKey(key: MulticallContextKey) {
    return JSON.stringify(key);
  }

  private _generateKey(): MulticallContextKey {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    return [timestamp, randomString];
  }
}

type SliceDelimiter = { start: number; end: number };
