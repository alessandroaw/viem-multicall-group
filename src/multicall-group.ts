import { Address, PublicClient } from "viem";
import { MulticallContext } from "./multicall-context";
import { MulticallContextKey, _Contract } from "./types";

export class MulticallGroup {
  private client: PublicClient;
  private _contracts: _Contract[] = [];
  private _results: any[] = [];
  private _isCalled = false;
  private contextMap: Record<string, { start: number; end: number }> = {};

  constructor(client: PublicClient) {
    this.client = client;
  }

  public async call() {
    this._results = await this.client.multicall({
      contracts: this._contracts,
      allowFailure: false,
    });
    this._isCalled = true;
  }

  public addContext<TResult>(
    context: MulticallContext<TResult>
  ): () => TResult {
    const key = this._constructKey(context.key);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    this.contextMap[key] = { start, end };

    return () => {
      return this.getFormatted(context);
    };
  }

  public getFormatted<T>(context: MulticallContext<T>) {
    if (!this._isCalled) {
      throw new Error(
        "MulticallGroup.call() must be called before getFormatted"
      );
    }
    const key = this._constructKey(context.key);
    const { start, end } = this.contextMap[key];
    const result = this._results.slice(start, end);
    return context.formatter(result);
  }

  private _constructKey(key: MulticallContextKey) {
    return JSON.stringify(key);
  }
}
