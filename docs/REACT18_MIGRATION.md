# React 18 Uppgradering

## Problem

Detta projekt använder React 18 och vi vill använda det nya React 18 API:et med `createRoot`. Dock stötte vi på problem med webpack-konfigurationen som förhindrade att `react-dom/client` modulen kunde importeras direkt.

## Aktuell lösning

Vi har skapat en lokal wrapper i `src/renderer/utils/react-dom-client.ts` som tillhandahåller ett API som matchar React 18:s `createRoot` men som internt använder den äldre `ReactDOM.render` metoden:

```tsx
// src/renderer/utils/react-dom-client.ts
import * as React from 'react';
import ReactDOM from 'react-dom';

export const createRoot = (container: Element | DocumentFragment) => {
  return {
    render(element: React.ReactElement | React.ReactNode) {
      ReactDOM.render(element as React.ReactElement, container);
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container);
    }
  };
};
```

Vi använder denna wrapper i `src/renderer/index.tsx`:

```tsx
import { createRoot } from './utils/react-dom-client';

const root = createRoot(container);
root.render(<App />);
```

Detta ger oss möjlighet att använda React 18:s nya API-syntax i vår kod, även om den internt fortfarande använder den äldre metoden. Denna lösning gör det enklare att uppgradera i framtiden när webpack-konfigurationen kan hantera `react-dom/client` korrekt.

## Varningar

När appen körs kommer följande varning att visas i konsolen:

```
Warning: ReactDOM.render is no longer supported in React 18. Use createRoot instead. Until you switch to the new API, your app will behave as if it's running React 17.
```

Detta är förväntat och normalt eftersom vi faktiskt använder `ReactDOM.render` under huven i vår wrapper. Varningen påverkar inte appens funktionalitet och är bara en påminnelse om att React 18 föredrar det nya API:et.

## Lösningar vi har provat utan framgång

Vi har provat följande lösningar utan framgång:

1. **Direkt import av `react-dom/client`**:
   ```tsx
   import { createRoot } from 'react-dom/client';
   ```
   Detta resulterade i ett webpack-fel: `Cannot find module 'react-dom/client'`

2. **Alias i webpack-konfigurationen**:
   ```js
   alias: {
     'react-dom/client': require.resolve('react-dom/client')
   }
   ```
   Detta gav fortfarande samma fel.

3. **ProvidePlugin**:
   ```js
   new webpack.ProvidePlugin({
     createRoot: ['react-dom/client', 'createRoot']
   })
   ```
   Detta lösning fungerade inte heller.

## För framtida utvecklare

För att helt åtgärda detta problem behöver webpack-konfigurationen modifieras för att korrekt hitta och importera `react-dom/client` modulen. Detta kan innebära:

1. Uppgradera electron-forge och webpack-plugin till nyare versioner
2. Uppdatera webpack-konfigurationen med korrekt hantering av react-dom/client
3. Eventuellt uppgradera Node.js och npm

När problemet är löst kan du:
1. Ta bort `src/renderer/utils/react-dom-client.ts`
2. Uppdatera `src/renderer/index.tsx` för att importera direkt från `react-dom/client`:
   ```tsx
   import { createRoot } from 'react-dom/client';
   ``` 