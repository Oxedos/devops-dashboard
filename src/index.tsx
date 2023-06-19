/**
 * index.tsx
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */

import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Provider } from 'react-redux';

// Styling
import 'sanitize.css/sanitize.css';
import '../node_modules/react-grid-layout/css/styles.css';
import '../node_modules/react-resizable/css/styles.css';

// Import root app
import { App } from 'app';
import { HelmetProvider } from 'react-helmet-async';
import { configureAppStore } from 'store/configureStore';

const store = configureAppStore();
const MOUNT_NODE = document.getElementById('root') as HTMLElement;

const root = ReactDOMClient.createRoot(MOUNT_NODE);
root.render(
  <Provider store={store}>
    <HelmetProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </HelmetProvider>
  </Provider>,
);
