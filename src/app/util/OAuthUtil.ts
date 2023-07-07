import { gitLabActions } from 'app';
import { globalActions } from 'app';
import { PkceValues } from 'app/data/gitLabSlice/types';
import { SW_MESSAGE_TYPES } from 'service-worker';

export const PUBLIC_URL =
  process.env.PUBLIC_URL.startsWith('.') || !process.env.PUBLIC_URL
    ? 'http://localhost:3000'
    : process.env.HOMEPAGE;

export const REDIRECT_URI =
  process.env.PUBLIC_URL.startsWith('.') || !process.env.PUBLIC_URL
    ? 'http://localhost:3000/data/gitlab/oauth'
    : `${process.env.HOMEPAGE}/data/gitlab/oauth`;

const dec2hex = dec => {
  return dec.toString(16).padStart(2, '0');
};

const generateRandomString = len => {
  var arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join('');
};

const generatePkceValues = async () => {
  const codeVerifier = generateRandomString(128)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64Digest = window
    .btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return {
    state: generateRandomString(10),
    codeVerifier,
    codeChallenge: base64Digest,
    code: undefined,
  };
};

const sendOAuthDataToServiceWorker = (
  pkce: PkceValues,
  url: string,
  applicationId: string,
) => {
  if (
    !navigator ||
    !navigator.serviceWorker ||
    !navigator.serviceWorker.controller
  ) {
    return;
  }
  navigator.serviceWorker.controller.postMessage({
    type: SW_MESSAGE_TYPES.SAVE_OAUTH_DATA,
    payload: {
      pkce,
      url,
      applicationId,
    },
  });
};

export const redirectToGitlabAuth = async (
  gitlabHost: string | undefined,
  applicationId: string | undefined,
  dispatch: Function,
) => {
  if (!gitlabHost) {
    dispatch(globalActions.addErrorNotification("GitLab Url can't be empty"));
    return;
  }
  if (!applicationId) {
    dispatch(
      globalActions.addErrorNotification("Application ID can't be empty"),
    );
    return;
  }
  const pkceValues = await generatePkceValues();
  dispatch(gitLabActions.setUrl(gitlabHost));
  dispatch(gitLabActions.setApplicationId(applicationId));
  sendOAuthDataToServiceWorker(pkceValues, gitlabHost, applicationId);
  document.location.href = `${gitlabHost}/oauth/authorize?redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
  )}&client_id=${applicationId}&response_type=code&state=${
    pkceValues.state
  }&scope=api&code_challenge=${
    pkceValues.codeChallenge
  }&code_challenge_method=S256`;
};
