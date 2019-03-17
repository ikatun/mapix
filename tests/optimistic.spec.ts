import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { toJS, autorun } from 'mobx';
import { delay } from 'bluebird';

import { Mapix, expire } from '../index';

const mock = new MockAdapter(axios);

mock
  .onGet('/user/1')
  .reply(200, { name: 'test', lastName: 'test' });

const mapix = new Mapix(axios);

const user = mapix.createGetter<object>('/user/:userId');
autorun(() => {
  console.log('response', toJS(user({ userId: 1 })));
});

(async () => {
  await delay(100);
  const { data } = user({ userId: 1 });
  mapix.expireRequest(data);
})();
