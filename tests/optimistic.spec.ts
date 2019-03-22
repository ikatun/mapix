import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { toJS, autorun } from 'mobx';
import { delay } from 'bluebird';

import { Mapix } from '../index';

const mock = new MockAdapter(axios);

const initialData = {
  name: 'test',
  lastName: 'test',
  child: { c1: 'x', c2: 'y' },
  arr: [{ c1: 'x1', c2: 'y1' }, { c1: 'x2', c2: 'y2' }, { c1: 'x2', c2: 'y2' }]
};

mock
  .onGet('/user/1')
  .reply(200, initialData);

const mapix = new Mapix(axios);

const user = mapix.createGetter<typeof initialData>('/user/:userId');
autorun(() => {
  console.log('response', toJS(user({ userId: 1 })));
});

(async () => {
  await delay(100);
  const { data } = user({ userId: 1 });
  const { child } = data;

  mock
    .onGet('/user/1')
    .reply(200, {
      name: 'test2',
      lastName: 'test2',
      child: { c1: 'x', c2: 'y' },
      arr: [{ c1: 'x4', c2: 'y4' }, { c1: 'x2', c2: 'y2' }]
    });

  await delay(100);
  mapix.setOptimisticResponse(child, { c1: 'hm', c2: 'hm hm' }, [Promise.reject('lalala')])
    .catch(() => undefined);
})();
