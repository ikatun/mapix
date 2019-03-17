import RecursiveIterator from 'recursive-iterator';

export function setObjectKeys(obj: any, cachePath: string[]) {
  for (const { path, node } of Array.from(new RecursiveIterator(obj)) as any) {
    if (typeof node === 'object') {
      node['__mapixCachePath'] = { cachePath, path };
    }
  }

  obj['__mapixCachePath'] = { cachePath, path: [] };
}

export function setObjectValue(object: any, paths: string[], value: any, pathIndex: number = 0) {
  if (pathIndex === paths.length) {
    return { ...value, ...object };
  }

  const path = paths[pathIndex];

  return {
    ...object,
    [path]: setObjectValue(object[path], paths, value, pathIndex + 1)
  };
}

