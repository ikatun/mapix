import axios, { AxiosError, AxiosInstance } from 'axios';
import { observable, toJS, action } from 'mobx';
import { get, set, keys, values, flatten, noop } from 'lodash';
import { resolvePath } from './resolve-path';

export interface ApiCall<T> {
  data?: T;
  loading: boolean;
  error?: Error;
  expired: boolean;
}

function getKey(path: string, method: string, args?: object, body?: object): Array<string> {
  return [path, method, JSON.stringify(args), JSON.stringify(body)];
}

function getCachedValues(cache: any, path: string, method?: string, args?: object, body?: object): Array<ApiCall<any>> {
  if (body && args && method) {
    return [get(cache, [path, method, JSON.stringify(args), JSON.stringify(body)])].filter(x => x);
  }
  if (args && method) {
    return values(get(cache, [path, method, JSON.stringify(args)]));
  }
  if (method) {
    return flatten(values(get(cache, [path, method])).map(values));
  }
  return flatten(flatten(values(get(cache, path)).map(values)).map(values));
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

function removeMobxFromData(data) {
  const dataWithoutMobx = {};
  for (const key of keys(data)) {
    dataWithoutMobx[key] = toJS(data[key]);
  }

  return dataWithoutMobx;
}

const allCreatedGetters: Function[] = [];

export interface IMapixConstructorOptions {
  defaultErrorHandler?: (error: AxiosError) => void;
}

export class Mapix {
  private cache: any = {};
  private axios: AxiosInstance;
  private mapixOptions: IMapixConstructorOptions;
  private defaultErrorHandler;

  constructor(axiosInstance?: AxiosInstance, mapixOptions: IMapixConstructorOptions = {}) {
    this.axios = axiosInstance || axios;
    this.mapixOptions = mapixOptions;
    this.defaultErrorHandler = mapixOptions.defaultErrorHandler || noop;
  }


  public createGetter = <T = any>(path: string, method: string = 'get', opts: IMapixOptions = {}) => {
    const log = (data: object) => {
      if (!opts.log) {
        return;
      }
      opts.log(removeMobxFromData(data) as any);
    }

    const getterForPath = (args: object = {}, body = undefined, requestOpts: IMapixOptions = {}): ApiCall<T> => {
      const resultingPath = resolvePath(path, args);

      const logData = { path, args, method, body, resultingPath };
      const cacheKey = getKey(path, method, args, body);
      const cachedResult = get(this.cache, cacheKey);
      if (cachedResult && !cachedResult.expired) {
        log({ ...logData, status: 'cached', result: cachedResult });
        return cachedResult;
      }

      const result = observable({ data: cachedResult && cachedResult.data, error: undefined, loading: true, expired: false });
      set(this.cache, cacheKey, result);
      (async () => {
        log({ ...logData, status: 'awaiting' });
        try {
          const { data } = await this.axios[method](resultingPath, body);
          action(() => { // make these statements a transaction
            result.data = data;
            result.loading = false;
            result.error = undefined;
          })();
          log({ ...logData, status: 'done', result });
        } catch (error) {
          action(() => { // make these statements a transaction
            result.data = undefined;
            result.loading = false;
            result.error = error;
          })();
          log({ ...logData, status: 'failed', result });
          if (opts.useHandler || requestOpts.useHandler) {
            this.defaultErrorHandler(error);
          }
        }
      })();

      return result as any;
    };

    (getterForPath as any).path = path;
    (getterForPath as any).method = method;
    (getterForPath as any).mapix = this;

    allCreatedGetters.push(getterForPath);

    return getterForPath;
  }

  private expirePath = (path: string, method?: string, args?: object, body = undefined) => {
    const cachedResults = getCachedValues(this.cache, path, method, args, body);
    action(() => {
      cachedResults.forEach((cachedResult) => {
        cachedResult.expired = true;
        cachedResult.loading = true;
      });
    })();
  }
}

export const expire = (getterForPath?: Function, args?: object, body = undefined) => {
  if (!getterForPath) {
    expireEverything();
    return;
  }

  const path = (getterForPath as any).path;
  const method = (getterForPath as any).method;
  const mapix = (getterForPath as any).mapix;

  mapix.expirePath(path, method, args, body);
}

const expireEverything = action(() => {
  allCreatedGetters.forEach(createdGetter => expire(createdGetter));
});

export const { createGetter } = new Mapix();
