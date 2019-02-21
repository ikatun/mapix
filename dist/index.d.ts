import { AxiosInstance } from 'axios';
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
}
export declare class Mapix {
    private cache;
    private axios;
    constructor(axiosInstance?: AxiosInstance);
    createGetter: <T = any>(path: string, method?: string, opts?: IMapixOptions) => (args?: object, body?: undefined) => ApiCall<T>;
    private expirePath;
}
export declare const expire: (getterForPath?: Function | undefined, args?: object | undefined, body?: undefined) => void;
export declare const createGetter: <T = any>(path: string, method?: string, opts?: IMapixOptions) => (args?: object, body?: undefined) => ApiCall<T>;
