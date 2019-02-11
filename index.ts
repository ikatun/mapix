import axios, { AxiosInstance } from 'axios';
import { observable, toJS } from 'mobx';
import { get, set, keys } from 'lodash';
import { resolvePath } from './resolve-path';

// const cache = {};

export type ApiCall<T> = () => { data: T, loading: boolean, error: Error, expired: boolean };
function getKey(path: string, method: string, args: object, body: object | undefined) {
  return [path, method, JSON.stringify(args), JSON.stringify(body)];
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
  log(args: ILogArgs): void;
}

const defaultOptions: IMapixOptions = {
  log(){}
};

function removeMobxFromData(data) {
  const dataWithoutMobx = {};
  for (const key of keys(data)) {
    dataWithoutMobx[key] = toJS(data[key]);
  }

  return dataWithoutMobx;
}

export class Mapix {
  cache: any = {};
  axios: AxiosInstance;

  constructor(axiosInstance = undefined) {
    this.axios = axiosInstance || axios;
  }

  createGetter = (path: string, method = 'get', options: IMapixOptions) => {
    const opts = { ...defaultOptions, ...options };
    const log = (data: object) => {
      if (!opts.log) {
        return;
      }
      opts.log(removeMobxFromData(data) as any);
    }

    const getterForPath = (args = {}, body = undefined) => {
      const resultingPath = resolvePath(path, args);

      const logData = { path, args, method, body, resultingPath };
      const cachedResult = get(this.cache, getKey(path, method, args, body));
      if (cachedResult && !cachedResult.expired) {
        log({ ...logData, status: 'cached', result: cachedResult });
        return cachedResult;
      }

      const result = observable({ data: undefined, error: undefined, loading: true, expired: false });
      set(this.cache, getKey(path, method, args, body), result);
      (async () => {
        log({ ...logData, status: 'awaiting' });
        try {
          const { data } = await axios[method](resultingPath, body);
          result.data = data;
          result.loading = false;
          result.error = undefined;
          log({ ...logData, status: 'done', result });
        } catch (error) {
          result.data = undefined;
          result.loading = false;
          result.error = error;
          log({ ...logData, status: 'failed', result });
        }
      })();

      return result;
    };

    return getterForPath;
  }

  clearPath = (path: string, method = 'get', args = {}, body = undefined) => {
    const cachedResult = get(this.cache, getKey(path, method, args, body));

    if (cachedResult) {
      cachedResult.data = undefined;
      cachedResult.expired = true;
      cachedResult.loading = true;
    }
  }
}

const defaultMapix = new Mapix();
export const createGetter = defaultMapix.createGetter;
export const clearPath = defaultMapix.clearPath;
