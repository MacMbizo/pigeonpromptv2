/* eslint-disable no-unused-vars */
declare module 'pg' {
  export class Client {
    constructor(_config?: any);
    connect(): Promise<void>;
    end(): Promise<void>;
    query<T = any>(_text: string, _params?: any[]): Promise<{ rows: T[]; rowCount?: number }>;
  }
}