Use observer+rerender to await api call promises.


Library is still in development.


Documentation is in process of being created :)

Here's an usage example:

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

  searchProducersBySubstring = createGetter('/api/producers/search/:producerName');
}

export const apiStore = new ApiStore();
```

```tsx
import * as React from 'react';
import { observer } from 'mobx-react';

import { Spinner } from '../components/Spinner';
import { apiStore } from '../api-store';

@observer
export class ProductsList extends React.Component {
  render() {
    const { data, loading, error } = apiStore.searchProductsBySubstring({ productName: 'my test product' });
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
