import axios, { AxiosInstance } from 'axios';
import { observable, toJS, action } from 'mobx';
import { get, set, keys, values, flatten } from 'lodash';
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
}

function removeMobxFromData(data) {
  const dataWithoutMobx = {};
  for (const key of keys(data)) {
    dataWithoutMobx[key] = toJS(data[key]);
  }

  return dataWithoutMobx;
}

const allCreatedGetters: Function[] = [];

export class Mapix {
  private cache: any = {};
  private axios: AxiosInstance;

  constructor(axiosInstance?: AxiosInstance) {
    this.axios = axiosInstance || axios;
  }

  public createGetter = <T = any>(path: string, method: string = 'get', opts: IMapixOptions = {}) => {
    const log = (data: object) => {
      if (!opts.log) {
        return;
      }
      opts.log(removeMobxFromData(data) as any);
    }

    const getterForPath = (args = {}, body = undefined): ApiCall<T> => {
      const resultingPath = resolvePath(path, args);

      const logData = { path, args, method, body, resultingPath };
      const cachedResult = get(this.cache, getKey(path, method, args, body));
      if (cachedResult && !cachedResult.expired && !cachedResult.error) {
        log({ ...logData, status: 'cached', result: cachedResult });
        return cachedResult;
      }

      const result = observable({ data: undefined, error: undefined, loading: true, expired: false });
      set(this.cache, getKey(path, method, args, body), result);
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
        cachedResult.data = undefined;
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
