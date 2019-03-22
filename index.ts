import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { observable, toJS, action, observe } from 'mobx';
import { get, set, keys, values, flatten, noop } from 'lodash';
import { resolvePath } from './resolve-path';
import { setObjectKeys, setObjectValue } from './set-object-keys';

export interface ApiCall<T> extends Promise<AxiosResponse<T>>{
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

      const requestPromise = this.axios[method](resultingPath, body);

      const result = observable({
        data: cachedResult && cachedResult.data,
        error: undefined,
        loading: true,
        expired: false,
        then: requestPromise.then.bind(requestPromise),
        'catch': requestPromise.catch.bind(requestPromise),
      });

      set(this.cache, cacheKey, result);
      (async () => {
        log({ ...logData, status: 'awaiting' });
        try {
          const { data } = await requestPromise;
          action(() => { // make these statements a transaction
            setObjectKeys(data, cacheKey);
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

    const expirationPromises = cachedResults.map(result => {
      return new Promise((resolve) => {
        const stopObserving = observe(result, 'loading', ({ newValue }) => {
          if (newValue === false) {
            resolve();
            stopObserving();
          }
        });
      })
    });

    return Promise.all(expirationPromises);
  }

  public setOptimisticResponse = async (partOfResponse: any, value: any, promises: Promise<any>[] = []) => {
    const { cachePath = undefined, path = undefined } = partOfResponse['__mapixCachePath'] || {};
    if (!cachePath || !path) {
      throw new Error('Optimistic response part must be returned from mapix');
    }
    const result = get(this.cache, cachePath);

    if (!result) {
      return;
    }

    const newValue = setObjectValue(result.data, path, value);
    result.data = newValue;
    try {
      await Promise.all(promises);
    } catch (e) {
      this.expireRequest(partOfResponse);
      throw e;
    }
  }

  public expireRequest = (partOfResponse: any) => {
    const { cachePath = undefined, path = undefined } = partOfResponse['__mapixCachePath'] || {};
    if (!cachePath || !path) {
      throw new Error('Response part must be returned from mapix');
    }
    const cachedResult = get(this.cache, cachePath);
    action(() => {
      cachedResult.expired = true;
      cachedResult.loading = true;
    })();
  }
}

export const expire = async (getterForPath?: Function, args?: object, body = undefined) => {
  if (!getterForPath) {
    expireEverything();
    return;
  }

  const path = (getterForPath as any).path;
  const method = (getterForPath as any).method;
  const mapix = (getterForPath as any).mapix;

  return mapix.expirePath(path, method, args, body);
}

const expireEverything = action(() => {
  allCreatedGetters.forEach(createdGetter => expire(createdGetter));
});

export const { createGetter } = new Mapix();
