import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
export interface ApiCall<T> extends Promise<AxiosResponse<T>> {
    data?: T;
    loading: boolean;
    error?: Error;
    expired: boolean;
    expirationReason?: any;
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
export interface IMapixOptions<PostProcessT = any> {
    log?(args: ILogArgs): void;
    useHandler?: boolean;
    postProcess?(data: any): Promise<PostProcessT>;
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
    createGetter: <T = any>(path: string, method?: string, opts?: IMapixOptions<any>) => (args?: object, body?: any, requestOpts?: IMapixOptions<T>) => ApiCall<T>;
    private expirePath;
    setOptimisticResponse: (partOfResponse: any, value: any, promises?: Promise<any>[]) => Promise<void>;
    expireRequest: (partOfResponse: any) => void;
}
export declare const expire: (getterForPath?: Function | undefined, args?: object | undefined, body?: undefined, expirationReason?: any) => void;
export declare const createGetter: <T = any>(path: string, method?: string, opts?: IMapixOptions<any>) => (args?: object, body?: any, requestOpts?: IMapixOptions<T>) => ApiCall<T>;
