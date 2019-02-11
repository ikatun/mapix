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
  mock
    .onGet('/user/1')
    .reply(200, { name: 'test2', lastName: 'test2' });
  console.log('CLEARING for path');
  expire(user);
  console.log('CLEARED!');

  await delay(100);

  mock
    .onGet('/user/1')
    .reply(200, { name: 'test4', lastName: 'test4' });
  await delay(100);
  console.log('CLEARING for path and method and args');
  expire(user, { userId: 1 });
  console.log('CLEARED!');

  await delay(100);
  console.log('CLEARING for path and method and nonexisting args');
  expire(user,{ userId: 2 });
  console.log('CLEARED!');
})();
