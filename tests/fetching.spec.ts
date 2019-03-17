import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { toJS, autorun } from 'mobx';

import { Mapix } from '../index';

const mock = new MockAdapter(axios);

mock.onGet('/user/1').reply(200, { name: 'test', lastName: 'test' });

const mapix = new Mapix(axios);

const user = mapix.createGetter<object>('/user/:userId');

const response = user({ userId: 1 });
autorun(() => {
  console.log('response', toJS(response));
});

(async () => {
  const x = await response;
  console.log('awaited data', x.data);
})();
