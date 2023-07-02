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
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Styling
import 'styles/bootstrap.scss';
import 'sanitize.css/sanitize.css';
import '../node_modules/react-grid-layout/css/styles.css';
import '../node_modules/react-resizable/css/styles.css';
import { loadFromStorage } from 'app/apis/persistance';

// Import root app
import { App } from 'app';
import { HelmetProvider } from 'react-helmet-async';
import { configureAppStore } from 'store/configureStore';
import { GitLabState } from 'app/data/gitLabSlice/types';
import { LOCALSTORAGE_KEY, gitLabActions } from 'app/data/gitLabSlice';

export const reduxApplicationStore = configureAppStore();
const MOUNT_NODE = document.getElementById('root') as HTMLElement;

loadFromStorage(LOCALSTORAGE_KEY).then((gitlabState: GitLabState) => {
  reduxApplicationStore.dispatch(gitLabActions.setFullState(gitlabState));
  const root = ReactDOMClient.createRoot(MOUNT_NODE);
  root.render(
    <Provider store={reduxApplicationStore}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider>,
  );
});
serviceWorkerRegistration.register();
