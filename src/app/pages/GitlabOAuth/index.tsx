import ContentWrapper from 'app/components/Design/ContentWrapper';
import NavigationBar from 'app/components/NavigationBar';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SW_MESSAGE_TYPES } from 'service-worker';

function path(p) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + p;
  }
  return p;
}

export const OAuth: React.FC = props => {
  const [message, setMessage] = useState('Initial State');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    if (!code || !state) {
      setMessage('Code or state missing');
      return;
    }
    if (
      !navigator ||
      !navigator.serviceWorker ||
      !navigator.serviceWorker.controller
    ) {
      setMessage('No ServiceWorker found');
      return;
    }
    setMessage('Requesting PKCE State from ServiceWorker');
    navigator.serviceWorker.controller.postMessage({
      type: SW_MESSAGE_TYPES.RECEIVE_PKCE_STATE,
    });
  }, [code, state]);

  navigator.serviceWorker.addEventListener('message', event => {
    if (!event || !event.data || !event.data.type) return;
    if (event.data.type !== SW_MESSAGE_TYPES.RECEIVE_PKCE_STATE) return;
    const storedState = event.data.payload.state;
    if (!storedState) {
      setMessage('No state stored');
      return;
    }
    if (state !== storedState) {
      setMessage('Received incorrect state');
      return;
    }
    if (
      !navigator ||
      !navigator.serviceWorker ||
      !navigator.serviceWorker.controller
    ) {
      setMessage('No ServiceWorker found');
      return;
    }
    setMessage('State correct! Requesting Token Pair');
    console.log('state', state);
    console.log('code', code);
    navigator.serviceWorker.controller.postMessage({
      type: SW_MESSAGE_TYPES.SAVE_AUTHORIZATION_CODE,
      payload: { code },
    });
    navigate(path('/data/gitlab'));
  });

  return (
    <>
      <NavigationBar />
      <ContentWrapper>
        <>{message}</>
      </ContentWrapper>
    </>
  );
};
