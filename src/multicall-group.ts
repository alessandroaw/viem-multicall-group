import { PublicClient } from "viem";
import { MulticallContext, MulticallContextKey } from "./multicall-context";

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
    context: MulticallContext<TResult>
  ): Promise<TResult> {
    const result = await this.client.multicall({
      contracts: context.contracts,
      allowFailure: false,
    });

    return context.formatter(result);
  }

  public addContext<TResult>(
    context: MulticallContext<TResult>
  ): () => TResult {
    const key = this._constructKey(context.key);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    this.contractSlice[key] = { start, end };

    return () => {
      return this.getFormatted(context);
    };
  }

  public getFormatted<TResult>(context: MulticallContext<TResult>) {
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
}

type SliceDelimiter = { start: number; end: number };
