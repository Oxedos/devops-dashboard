/**
 * index.tsx
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import * as ReactDOMClient from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
// Import root app
import { App } from 'app';
// Styling
import 'sanitize.css/sanitize.css';
import { register as registerServiceWorker } from 'serviceWorkerRegistration';
import { configureAppStore } from 'store/configureStore';
import 'styles/bootstrap.scss';
import '../node_modules/react-grid-layout/css/styles.css';
import '../node_modules/react-resizable/css/styles.css';

export const reduxApplicationStore = configureAppStore();
const MOUNT_NODE = document.getElementById('root') as HTMLElement;
const root = ReactDOMClient.createRoot(MOUNT_NODE);

root.render(
  <Provider store={reduxApplicationStore}>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </Provider>,
);

registerServiceWorker();
