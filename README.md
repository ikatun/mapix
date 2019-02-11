*Installation*
```
npm install mapix
```

Use observer+rerender to await api call promises. 

Library is still in development. Documentation is in process of being created :)

*Usage example:*
```typescript
// api-store.js (or api-store.ts)
import { createGetter, ApiCall } from 'mapix';

import { IProduct } from './IProduct';
import { IApiDetails } from './IApiDetails';

export class ApiStore {
    // use typing for the response if you know it
  apiDetails: ApiCall<IApiDetails> = createGetter('/api/details');
   
   // skip typing if you don't
  searchProductsBySubstring = createGetter('/api/products/search/:productName');
  // note that `productName` must be used as a variable when api is called later

  searchProducersBySubstring = createGetter('/api/producers/search/:producerName');
}

export const apiStore = new ApiStore();
```

*Usage example with custom axios instance:*
```typescript
// api-store.js (or api-store.ts)
import { Mapix, ApiCall } from 'mapix';
import axios from 'axios';

import { IProduct } from './IProduct';
import { IApiDetails } from './IApiDetails';

const axiosInstance = axios.create();
const { createGetter } = new Mapix(axiosInstance);

export class ApiStore {
    // use typing for the response if you know it
  apiDetails: ApiCall<IApiDetails> = createGetter('/api/details');
   
   // skip typing if you don't
  searchProductsBySubstring = createGetter('/api/products/search/:productName');
  // note that `productName` must be used as a variable when api is called later

  searchProducersBySubstring = createGetter('/api/producers/search/:producerName');
}

export const apiStore = new ApiStore();
```

*Calling the API:*
```tsx
import * as React from 'react';
import { observer } from 'mobx-react';

import { Spinner } from '../components/Spinner';
import { apiStore } from '../api-store';

@observer
export class ProductsList extends React.Component {
  render() {
    const { data, loading, error } = 
        apiStore.searchProductsBySubstring({ productName: 'my test product' });
        // here's that `productName` variable from before

    if (loading) {
      return <Spinner />;
    }

    return (
      <ul>
        {data.map(product => (<li>{product.name}</li>))}
      </ul>
    );
  }
}
```
