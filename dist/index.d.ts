export declare type ApiCall<T> = () => {
    data: T;
    loading: boolean;
    error: Error;
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
    log(args: ILogArgs): void;
}
export declare function createGetter(path: string, method: string | undefined, options: IMapixOptions): (args?: {}, body?: undefined) => any;
export declare function clearPath(path: string, method?: string, args?: {}, body?: undefined): void;
