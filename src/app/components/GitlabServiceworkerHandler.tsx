import { gitLabActions } from 'app/data/gitLabSlice';
import { selectApplicationId, selectUrl } from 'app/data/gitLabSlice/selectors';
import { globalActions } from 'app/data/globalSlice';
import { PUBLIC_URL, redirectToGitlabAuth } from 'app/util/OAuthUtil';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { SW_MESSAGE_TYPES } from 'service-worker';

export const GitlabServiceworkerHandler: React.FC = () => {
  const dispatch = useDispatch();
  const gitlabHost = useSelector(selectUrl);
  const applicationId = useSelector(selectApplicationId);

  // Keep the service worker alive
  useEffect(() => {
    const intervalId = setInterval(function () {
      fetch(`${PUBLIC_URL}/favicon.ico`);
    }, 10 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle Service Worker Messages
  useEffect(() => {
    const eventListener = event => {
      if (!event || !event.data || !event.data.type) return;
      switch (event.data.type) {
        // Display Error Notifications
        case SW_MESSAGE_TYPES.SW_ERROR: {
          const error = event.data.payload.error;
          if (error instanceof Error) {
            dispatch(
              globalActions.addErrorNotification(`[GitLab] ${error.message}`),
            );
          } else {
            dispatch(
              globalActions.addErrorNotification(`[GitLab] Unknown Error`),
            );
          }
          break;
        }
        // Load data when successfully authenticated
        case SW_MESSAGE_TYPES.SW_SUCCESS: {
          // TODO: Just load profile data
          dispatch(gitLabActions.reload());
          break;
        }
        // Handle SW Message if we are authenticated or not (redo authentication after idleing)
        case SW_MESSAGE_TYPES.IS_AUTHENTICATED: {
          if (!gitlabHost || !applicationId) return;
          const authenticated = event.data.payload.authenticated;
          if (!authenticated) {
            console.log('not authenticated!');
            setTimeout(
              () => redirectToGitlabAuth(gitlabHost, applicationId, dispatch),
              1000,
            );
          }
          return;
        }
        default:
          return;
      }
    };
    navigator.serviceWorker.addEventListener('message', eventListener);
    return () =>
      navigator.serviceWorker.removeEventListener('message', eventListener);
  }, [dispatch, gitlabHost, applicationId]);

  // Ask the Serviceworker if we are authenticated
  useEffect(() => {
    if (!gitlabHost || !applicationId) return;
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return;
    }
    navigator.serviceWorker.controller.postMessage({
      type: SW_MESSAGE_TYPES.CHECK_AUTHENTICATED,
    });
  }, [gitlabHost, applicationId]);

  return null;
};

export default GitlabServiceworkerHandler;
