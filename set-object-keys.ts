import RecursiveIterator from 'recursive-iterator';

export function setObjectKeys(obj: any, cachePath: string[]) {
  for (const { path, node } of Array.from(new RecursiveIterator(obj)) as any) {
    if (typeof node === 'object' && node !== null) {
      node['__mapixCachePath'] = { cachePath, path };
    }
  }

  if (obj !== null) {
    obj['__mapixCachePath'] = { cachePath, path: [] };
  }
}

export function setObjectValue(object: any, paths: string[], value: any, pathIndex: number = 0) {
  if (pathIndex === paths.length) {
    return { ...object, ...value };
  }

  const path = paths[pathIndex];

  if (object.length === undefined) {
    return {
      ...object,
      [path]: setObjectValue(object[path], paths, value, pathIndex + 1)
    };
  }

  const array = [...object];
  array[path] = setObjectValue(object[path], paths, value, pathIndex + 1);
  return array;
}
