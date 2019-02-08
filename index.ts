import axios from 'axios';
import { observable, toJS } from 'mobx';
import { get, set, keys } from 'lodash';

const cache = {};

export type ApiCall<T> = () => { data: T, loading: boolean, error: Error };
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

export function createGetter(path: string, method = 'get', options: IMapixOptions) {
  const opts = { ...defaultOptions, ...options };
  const log = (data: object) => {
    if (!opts.log) {
      return;
    }

    const dataWithoutMobx = {};
    for (const key of keys(data)) {
      dataWithoutMobx[key] = toJS(data[key]);
    }

    opts.log(dataWithoutMobx as any);
  }

  const getterForPath = (args = {}, body = undefined) => {
    let resultingPath = path;
    for (const key of keys(args)) {
      const value = args[key];
      resultingPath = resultingPath.replace(`:${key}`, value);
    }
    const logData = { path, args, method, body, resultingPath };
    const cachedResult = get(cache, getKey(path, method, args, body));
    if (cachedResult) {
      log({ ...logData, status: 'cached', result: cachedResult });
      return cachedResult;
    }

    const result = observable({ data: undefined, error: undefined, loading: true });
    set(cache, getKey(path, method, args, body), result);
    (async () => {
      log({ ...logData, status: 'awaiting' });
      const { data } = await axios[method](resultingPath, body);
      result.data = data;
      result.loading = false;
      result.error = undefined;
      log({ ...logData, status: 'done', result });
    })();

    return result;
  };

  return getterForPath;
}

export function clearPath(path: string, method = 'get', args = {}, body = undefined) {
  const cachedResult = get(cache, [path, method]);
  if (cachedResult) {
    cachedResult.data = undefined;
  }
}
