import { ApiCall } from './index';

export function transform<TIn, TOut>(input: ApiCall<TIn>, f: (x: TIn) => TOut | undefined): ApiCall<TOut> {
  const { data, ...rest } = input;
  if (!data) {
    return rest as any;
  }

  return {
    ...rest,
    data: f(data),
  } as any;
}
