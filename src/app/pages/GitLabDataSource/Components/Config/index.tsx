import { API_SUFFIX } from 'app/apis/gitlab';
import { GitLabMR } from 'app/apis/gitlab/types';
import { BlueButton, GreenButton } from 'app/components/Design/Buttons';
import DarkForm from 'app/components/Design/DarkForm';
import DarkInputGroupText from 'app/components/Design/DarkInputGroupText';
import { gitLabActions } from 'app/data/gitLabSlice';
import { selectApplicationId, selectUrl } from 'app/data/gitLabSlice/selectors';
import { PkceValues } from 'app/data/gitLabSlice/types';
import { useGlobalSlice } from 'app/data/globalSlice';
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useDispatch, useSelector } from 'react-redux';
import { SW_MESSAGE_TYPES } from 'service-worker';
import ContentElement from '../../../../components/Design/ContentElement';

const REDIRECT_URI =
  process.env.PUBLIC_URL.startsWith('.') || !process.env.PUBLIC_URL
    ? 'http://localhost:3000/data/gitlab/oauth'
    : `${process.env.HOMEPAGE}/data/gitlab/oauth`;

const generatePkceValues = async () => {
  const dec2hex = dec => {
    return dec.toString(16).padStart(2, '0');
  };

  const generateRandomString = len => {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join('');
  };

  const codeVerifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return {
    state: generateRandomString(10),
    codeVerifier,
    codeChallenge: encodeURIComponent(base64Digest),
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
    console.log('no service worker found');
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

const Config: React.FC = props => {
  const stateUrl = useSelector(selectUrl);
  const stateClientID = useSelector(selectApplicationId);
  const [clientID, setNewClientID] = useState(stateClientID);
  const [newUrl, setNewUrl] = useState(stateUrl);
  const dispatch = useDispatch();
  const { actions: globalActions } = useGlobalSlice();

  const saveConfig = async () => {
    if (!newUrl) {
      dispatch(globalActions.addErrorNotification("GitLab Url can't be empty"));
      return;
    }
    if (!clientID) {
      dispatch(
        globalActions.addErrorNotification("Application ID can't be empty"),
      );
      return;
    }
    const pkceValues = await generatePkceValues();
    dispatch(gitLabActions.setUrl(newUrl));
    dispatch(gitLabActions.setApplicationId(clientID));
    sendOAuthDataToServiceWorker(pkceValues, newUrl, clientID);
    window.open(
      `${newUrl}/oauth/authorize?redirect_uri=${encodeURIComponent(
        REDIRECT_URI,
      )}&client_id=${clientID}&response_type=code&state=${
        pkceValues.state
      }&scope=api&code_challenge=${
        pkceValues.codeChallenge
      }&code_challenge_method=S256`,
    );
  };

  return (
    <ContentElement>
      <h2>GitLab Settings</h2>
      <DarkForm>
        <Form.Group>
          <Form.Label>GitLab Url</Form.Label>
          <InputGroup>
            <Form.Control
              placeholder="https://gitlab.com/api/v4"
              value={newUrl || ''}
              onChange={({ target: { value } }) => setNewUrl(value)}
            />
            <DarkInputGroupText>{API_SUFFIX}</DarkInputGroupText>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>Private Access Token</Form.Label>
          <Form.Control
            placeholder="Client ID"
            value={clientID || ''}
            onChange={({ target: { value } }) => setNewClientID(value)}
          />
        </Form.Group>
        <BlueButton onClick={saveConfig}>Save</BlueButton>
        <GreenButton
          onClick={() => {
            const mrs: GitLabMR[] = [];
            dispatch(gitLabActions.setMrs({ mrs }));
          }}
        >
          Fire!
        </GreenButton>
        <GreenButton
          onClick={async () => {
            await fetch('http://localhost:3001/hello');
          }}
        >
          Fetch!
        </GreenButton>
        <GreenButton
          onClick={async () => {
            if (
              !navigator ||
              !navigator.serviceWorker ||
              !navigator.serviceWorker.controller
            ) {
              console.log('no service worker found');
              return;
            }
            navigator.serviceWorker.controller.postMessage({
              type: 'LOG_STATE',
            });
          }}
        >
          Send Message!
        </GreenButton>
      </DarkForm>
    </ContentElement>
  );
};

export default Config;
