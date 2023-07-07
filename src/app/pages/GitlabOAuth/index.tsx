import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { globalActions } from 'app';
import ContentWrapper from 'app/components/Dashboard/ContentWrapper';
import NavigationBar from 'app/components/Dashboard/NavigationBar';
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
  const dispatch = useDispatch();
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
    // Setup eventListener
    const eventListener = event => {
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
      navigator.serviceWorker.controller.postMessage({
        type: SW_MESSAGE_TYPES.SAVE_AUTHORIZATION_CODE,
        payload: { code },
      });
      // we don't need ourselves anymore
      navigator.serviceWorker.removeEventListener('message', eventListener);
      dispatch(
        globalActions.addNotification('Successfully authenticated with GitLab'),
      );
      navigate(path('/'));
    };
    navigator.serviceWorker.addEventListener('message', eventListener);
    // Request PKCE state
    navigator.serviceWorker.controller.postMessage({
      type: SW_MESSAGE_TYPES.RECEIVE_PKCE_STATE,
    });
  }, [code, state, navigate, dispatch]);

  return (
    <>
      <NavigationBar />
      <ContentWrapper>
        <>{message}</>
      </ContentWrapper>
    </>
  );
};
