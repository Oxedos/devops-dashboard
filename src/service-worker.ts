/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
// import needed to make the ignored self reference work
import { OAuthToken, PkceValues } from 'app/data/gitLabSlice/types';
import moment from 'moment';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createHandlerBoundToURL } from 'workbox-precaching';
import { normalizeUrl } from 'app/apis/apiHelper';

declare const self: ServiceWorkerGlobalScope;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ignored = self.__WB_MANIFEST;

type SW_STATE = {
  gitlabUrl: string | undefined;
  oauth: OAuthToken | undefined;
  pkceValues: PkceValues | undefined;
  authorizationCode: string | undefined;
  applicationId: string | undefined;
};

export enum SW_MESSAGE_TYPES {
  SAVE_OAUTH_DATA = 'SAVE_OAUTH_DATA',
  LOG_STATE = 'LOG_STATE',
  RECEIVE_PKCE_STATE = 'RECEIVE_PKCE_STATE',
  SAVE_AUTHORIZATION_CODE = 'SAVE_AUTHORIZATION_CODE',
  SW_ERROR = 'SW_ERROR',
  SW_SUCCESS = 'SW_SUCCESS',
  IS_AUTHENTICATED = 'IS_AUTHENTICATED',
  CHECK_AUTHENTICATED = 'CHECK_AUTHENTICATED',
}

const OAUTH_REFRESH_THRESHOLD = 5; // Minutes

const REDIRECT_URI =
  process.env.PUBLIC_URL.startsWith('.') || !process.env.PUBLIC_URL
    ? 'http://localhost:3000/data/gitlab/oauth'
    : `${process.env.HOMEPAGE}/data/gitlab/oauth`;

(() => {
  const state: SW_STATE = {
    gitlabUrl: undefined,
    oauth: undefined,
    pkceValues: undefined,
    authorizationCode: undefined,
    applicationId: undefined,
  };

  self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
  });

  // This allows the web app to trigger skipWaiting via
  // registration.waiting.postMessage({type: 'SKIP_WAITING'})
  self.addEventListener('message', async (event: ExtendableMessageEvent) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      event.waitUntil(self.skipWaiting());
      return;
    }
    const handleMessage = async () => {
      if (!event.data || !event.data.type) {
        return;
      }
      if (!event.source) return;

      switch (event.data.type) {
        case SW_MESSAGE_TYPES.SAVE_OAUTH_DATA: {
          const { url, pkce, applicationId } = event.data.payload;
          state.gitlabUrl = url;
          state.pkceValues = pkce;
          state.applicationId = applicationId;
          return;
        }
        case SW_MESSAGE_TYPES.SAVE_AUTHORIZATION_CODE: {
          const { code } = event.data.payload;
          state.authorizationCode = code;
          if (!state.gitlabUrl) return;
          if (!state.applicationId) return;
          if (!state.authorizationCode) return;
          if (!state.pkceValues) return;
          const initialToken = await getTokenWithCode(
            state.gitlabUrl,
            state.applicationId,
            state.authorizationCode,
            state.pkceValues?.codeVerifier,
            undefined,
          );
          if (!initialToken) return;
          state.oauth = initialToken;
          // Tell the FE that we succeeded
          (await self.clients.matchAll()).forEach(client => {
            client.postMessage({
              type: SW_MESSAGE_TYPES.SW_SUCCESS,
            });
          });
          return;
        }
        case SW_MESSAGE_TYPES.LOG_STATE: {
          if (process.env.NODE_ENV === 'development') {
            console.log(state);
          }
          return;
        }
        case SW_MESSAGE_TYPES.RECEIVE_PKCE_STATE: {
          event.source.postMessage({
            type: SW_MESSAGE_TYPES.RECEIVE_PKCE_STATE,
            payload: { state: state.pkceValues?.state },
          });
          return;
        }
        case SW_MESSAGE_TYPES.CHECK_AUTHENTICATED: {
          (await self.clients.matchAll()).forEach(client => {
            client.postMessage({
              type: SW_MESSAGE_TYPES.IS_AUTHENTICATED,
              payload: {
                authenticated: !!state.authorizationCode,
              },
            });
          });
          return;
        }
        default: {
          return;
        }
      }
    };
    if (!!event.waitUntil) {
      event.waitUntil(handleMessage());
    } else {
      handleMessage();
    }
  });

  self.addEventListener('fetch', async event => {
    const fetchHandler = async () => {
      if (!isConfigured(state)) return fetch(event.request);
      if (!state.gitlabUrl) return fetch(event.request);
      if (!state.authorizationCode) return fetch(event.request);
      if (!state.pkceValues || !state.pkceValues.codeVerifier)
        return fetch(event.request);
      if (!state.applicationId) return fetch(event.request);
      if (!isGitlabFetch(state, event)) return fetch(event.request);
      if (isPictureFech(event)) return fetch(event.request);
      if (!isAuthenticated(state)) return fetch(event.request);
      if (!isTokenAvailable(state)) {
        // Get initial token with authorizationCode
        const initialToken = await getTokenWithCode(
          state.gitlabUrl,
          state.applicationId,
          state.authorizationCode,
          state.pkceValues?.codeVerifier,
          event.clientId,
        );
        if (!initialToken) return fetch(event.request);
        state.oauth = initialToken;
      }
      if (!state.oauth) return fetch(event.request); // Can't happen, but makes TS happy :)
      if (isTokenExpired(state)) {
        // refresh token with state.oauth.refreshToken
        const newToken = await getTokenWithRefreshToken(
          state.gitlabUrl,
          state.applicationId,
          state.oauth?.refreshToken,
          state.pkceValues.codeVerifier,
          event.clientId,
        );
        if (!newToken) return fetch(event.request);
        state.oauth = newToken;
      }
      return fetchInitialRequestWithTokens(state.oauth, event);
    };

    event.respondWith(fetchHandler());
  });

  const isConfigured = (state: SW_STATE) =>
    !!state.gitlabUrl && !!state.pkceValues;

  const isGitlabFetch = (state: SW_STATE, event: FetchEvent) =>
    state.gitlabUrl && event.request.url.startsWith(state.gitlabUrl);

  const isPictureFech = (event: FetchEvent) =>
    event.request.url.endsWith('.png');

  const isAuthenticated = (state: SW_STATE) => !!state.authorizationCode;

  const isTokenAvailable = (state: SW_STATE) => !!state.oauth;

  const isTokenExpired = (state: SW_STATE) => {
    if (!state.oauth) return true; // true and false are both not really good here...
    const now = moment();
    const thresholdTime = moment
      .unix(state.oauth.createdAt)
      .add(state.oauth.expiresIn, 'seconds')
      .subtract(OAUTH_REFRESH_THRESHOLD, 'minutes');
    return now.isAfter(thresholdTime) || now.isSame(thresholdTime);
  };

  const signalError = async (error, clientId) => {
    if (!clientId) return;
    const client = await self.clients.get(clientId);
    if (!client) return;
    client.postMessage({
      type: SW_MESSAGE_TYPES.SW_ERROR,
      error,
    });
  };

  const getTokenWithCode = async (
    gitlabUrl: string,
    applicationId: string,
    authorizationCode: string,
    codeVerifier: string,
    frontendClientId: string | undefined,
  ) => {
    try {
      return requestAccessTokenWithCode(
        gitlabUrl,
        applicationId,
        authorizationCode,
        codeVerifier,
        REDIRECT_URI,
      );
    } catch (error) {
      signalError(error, frontendClientId);
      return undefined;
    }
  };

  const getTokenWithRefreshToken = async (
    gitlabUrl: string,
    applicationId: string,
    refreshToken: string,
    codeVerifier: string,
    frontendClientId: string,
  ) => {
    try {
      return requestAccessTokenWithRefreshToken(
        gitlabUrl,
        applicationId,
        refreshToken,
        codeVerifier,
        REDIRECT_URI,
      );
    } catch (error) {
      signalError(error, frontendClientId);
      return undefined;
    }
  };

  const fetchInitialRequestWithTokens = async (
    oauth: OAuthToken,
    event: FetchEvent,
  ) => {
    // Create a new request, but add the Authorization Header
    const request = new Request(event.request.url, {
      method: event.request.method,
      body: event.request.body,
      headers: {
        ...event.request.headers,
        Authorization: `${oauth.tokenType} ${oauth.authoriationToken}`,
      },
    });
    // TODO: Check response for header.error === 'invalid_token' and try to recover
    return fetch(request);
  };
})();

async function requestAccessTokenWithCode(
  url: string,
  clientID: string,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<OAuthToken> {
  const link =
    normalizeUrl(url, '/oauth/token?') +
    new URLSearchParams({
      client_id: clientID,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
  const request = new Request(link, {
    method: 'POST',
  });
  const response = await fetch(request);
  // TODO: Errorhandling
  const tokenResponse = await response.json();
  return {
    authoriationToken: tokenResponse['access_token'],
    refreshToken: tokenResponse['refresh_token'],
    expiresIn: tokenResponse['expires_in'],
    createdAt: tokenResponse['created_at'],
    tokenType: tokenResponse['token_type'],
  };
}
async function requestAccessTokenWithRefreshToken(
  url: string,
  clientID: string,
  refreshToken: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<OAuthToken> {
  const link =
    normalizeUrl(url, '/oauth/token?') +
    new URLSearchParams({
      client_id: clientID,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
  const request = new Request(link, { method: 'POST' });
  const response = await fetch(request);
  // TODO: Error Handling
  const tokenResponse = await response.json();
  return {
    authoriationToken: tokenResponse['access_token'],
    refreshToken: tokenResponse['refresh_token'],
    expiresIn: tokenResponse['expires_in'],
    createdAt: tokenResponse['created_at'],
    tokenType: tokenResponse['token_type'],
  };
}
