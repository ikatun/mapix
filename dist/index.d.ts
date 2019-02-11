import { AxiosInstance } from 'axios';
export declare type ApiCall<T> = () => {
    data: T;
    loading: boolean;
    error: Error;
    expired: boolean;
};
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
    cache: any;
    axios: AxiosInstance;
    constructor(axiosInstance?: AxiosInstance);
    createGetter: (path: string, method?: string, opts?: IMapixOptions) => (args?: {}, body?: undefined) => any;
    clearPath: (path: string, method?: string, args?: {}, body?: undefined) => void;
}
export declare const createGetter: (path: string, method?: string, opts?: IMapixOptions) => (args?: {}, body?: undefined) => any;
export declare const clearPath: (path: string, method?: string, args?: {}, body?: undefined) => void;
