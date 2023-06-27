// This optional code is used to register a service worker.
// register() is not called by default.

import { gitLabActions } from 'app/data/gitLabSlice';
import { selectApplicationId, selectUrl } from 'app/data/gitLabSlice/selectors';
import { globalActions } from 'app/data/globalSlice';
import { PUBLIC_URL, redirectToGitlabAuth } from 'app/util/OAuthUtil';
import { reduxApplicationStore } from 'index';
import { SW_MESSAGE_TYPES } from 'service-worker';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
    ),
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  // The URL constructor is available in all browsers that support SW.
  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      // This is running on localhost. Let's check if a service worker still exists or not.
      checkValidServiceWorker(swUrl, config);
    } else {
      // Is not localhost. Just register service worker
      registerValidSW(swUrl);
    }
    // Register some stuff when our SW is ready
    navigator.serviceWorker.ready.then(registration => {
      // Event Listener for bidirectional communication to SW
      navigator.serviceWorker.addEventListener(
        'message',
        onMessageEventListener,
      );

      // keep the service worker alive
      setInterval(function () {
        fetch(`${PUBLIC_URL}/favicon.ico`);
      }, 10 * 1000);

      // onfocus listener to check if we are authenticated with gitlab
      window.onfocus = () => {
        setTimeout(() => {
          if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
            return;
          }
          navigator.serviceWorker.controller.postMessage({
            type: SW_MESSAGE_TYPES.CHECK_AUTHENTICATED,
          });
        }, 1000);
      };
    });
  });
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker.register(swUrl);
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl);
      }
    })
    .catch(error => {
      console.log('error setting up service worker');
      console.log(error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

function onMessageEventListener(event: MessageEvent) {
  if (!event || !event.data || !event.data.type) return;
  switch (event.data.type) {
    // Display Error Notifications
    case SW_MESSAGE_TYPES.SW_ERROR: {
      const error = event.data.payload.error;
      if (error instanceof Error) {
        reduxApplicationStore.dispatch(
          globalActions.addErrorNotification(`[GitLab] ${error.message}`),
        );
      } else {
        reduxApplicationStore.dispatch(
          globalActions.addErrorNotification(`[GitLab] Unknown Error`),
        );
      }
      break;
    }
    // Load data when successfully authenticated
    case SW_MESSAGE_TYPES.SW_SUCCESS: {
      reduxApplicationStore.dispatch(gitLabActions.reload());
      break;
    }
    // Handle SW Message if we are authenticated or not (redo authentication after idleing)
    case SW_MESSAGE_TYPES.IS_AUTHENTICATED: {
      const rootState = reduxApplicationStore.getState();
      const gitlabHost = selectUrl(rootState);
      const applicationId = selectApplicationId(rootState);
      if (!gitlabHost || !applicationId) return;
      const authenticated = event.data.payload.authenticated;
      if (!authenticated) {
        redirectToGitlabAuth(
          gitlabHost,
          applicationId,
          reduxApplicationStore.dispatch,
        );
      }
      return;
    }
    default:
      return;
  }
}
