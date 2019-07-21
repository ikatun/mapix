import { ApiCall } from './index';
export declare function transform<TIn, TOut>(input: ApiCall<TIn>, f: (x: TIn) => TOut | undefined): ApiCall<TOut>;
