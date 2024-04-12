import { Address, PublicClient } from "viem";

export class MulticallGroup {
  private client: PublicClient;
  private _contracts: _Contract[] = [];
  private _results: any[] = [];
  private contextMap: Record<
    string,
    { start: number; end: number; formatter: FormatterFn<unknown> }
  > = {};

  constructor(client: PublicClient) {
    this.client = client;
  }

  public async call() {
    this._results = await this.client.multicall({
      contracts: this._contracts,
      allowFailure: false,
    });
  }

  public addContext(context: MulticallContext) {
    const key = this.constructKey(context.label);
    const start = this._contracts.length;
    this._contracts.push(...context.contracts);
    const end = this._contracts.length;
    const formatter = context.formatter;
    this.contextMap[key] = { start, end, formatter };
  }

  public getFormatted(context: MulticallContext) {
    const key = this.constructKey(context.label);
    const { start, end, formatter } = this.contextMap[key];
    const result = this._results.slice(start, end);
    return formatter(result);
  }

  private constructKey(label: string | unknown[]) {
    return JSON.stringify(label);
  }
}

export type FormatterFn<T> = (result: unknown[]) => T;
export type _Contract = {
  abi: any;
  address: Address;
  functionName: string;
  args?: any[];
};

export type MulticallContext<T extends any = {}> = {
  label: string | unknown[];
  contracts: _Contract[];
  formatter: FormatterFn<T>;
};
