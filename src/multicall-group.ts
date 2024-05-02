import { Address, PublicClient } from "viem";

export class MulticallGroup {
  private client: PublicClient;
  private _contracts: _Contract[] = [];
  private _results: any[] = [];
  private contextMap: Record<string, { start: number; end: number }> = {};

  constructor(client: PublicClient) {
    this.client = client;
  }

  public async call() {
    this._results = await this.client.multicall({
      contracts: this._contracts,
      allowFailure: false,
    });
  }

  public addContext<T>(context: MulticallContext<T>) {
    const key = this.constructKey(context.label);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    this.contextMap[key] = { start, end };
  }

  public getFormatted<T>(context: MulticallContext<T>) {
    const key = this.constructKey(context.label);
    const { start, end } = this.contextMap[key];
    const result = this._results.slice(start, end);
    return context.formatter(result);
  }

  private constructKey(label: string | unknown[]) {
    return JSON.stringify(label);
  }
}

export type FormatterFn<T> = (result: any) => T;

export function createMulticallContext<T>(
  context: MulticallContext<T>
): MulticallContext<T> {
  return context;
}

export type _Contract = {
  abi: any;
  address: Address;
  functionName: string;
  args?: any[];
};

export type MulticallContext<T> = {
  label: string | unknown[];
  contracts: _Contract[];
  formatter: FormatterFn<T>;
};
