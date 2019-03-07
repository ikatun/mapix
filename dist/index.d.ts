import { AxiosError, AxiosInstance } from 'axios';
export interface ApiCall<T> {
    data?: T;
    loading: boolean;
    error?: Error;
    expired: boolean;
}
export interface ILogArgs {
    path: string;
    args: Object;
    method: string;
    body: Object;
    resultingPath: string;
    status: 'awaiting' | 'done' | 'cached' | 'failed';
    result: Object;
}
export interface IMapixOptions {
    log?(args: ILogArgs): void;
    useHandler?: boolean;
}
export interface IMapixConstructorOptions {
    defaultErrorHandler?: (error: AxiosError) => void;
}
export declare class Mapix {
    private cache;
    private axios;
    private mapixOptions;
    private defaultErrorHandler;
    constructor(axiosInstance?: AxiosInstance, mapixOptions?: IMapixConstructorOptions);
    createGetter: <T = any>(path: string, method?: string, opts?: IMapixOptions) => (args?: object, body?: undefined, requestOpts?: IMapixOptions) => ApiCall<T>;
    private expirePath;
}
export declare const expire: (getterForPath?: Function | undefined, args?: object | undefined, body?: undefined) => void;
export declare const createGetter: <T = any>(path: string, method?: string, opts?: IMapixOptions) => (args?: object, body?: undefined, requestOpts?: IMapixOptions) => ApiCall<T>;
