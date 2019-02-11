import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { toJS, autorun } from 'mobx';

import { Mapix } from '../index';

const mock = new MockAdapter(axios);
mock.onGet('/fail/1').reply(500);

const mapix = new Mapix(axios);

const failUser = mapix.createGetter<object>('/fail/:userId');

const failResponse = failUser({ userId: 1 });
autorun(() => {
  console.log('fail response', toJS(failResponse));
});
