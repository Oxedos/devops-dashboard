import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  BlueButton as BlueButtonRaw,
  RedButton,
} from 'app/components/Design/Buttons';
import DarkForm from 'app/components/Design/DarkForm';
import NavigationBar from 'app/components/NavigationBar';
import { gitLabActions } from 'app/data/gitLabSlice';
import {
  selectApplicationId,
  selectConfigured,
  selectUrl,
  selectUserData,
} from 'app/data/gitLabSlice/selectors';
import { PkceValues } from 'app/data/gitLabSlice/types';
import { globalActions } from 'app/data/globalSlice';
import { useState } from 'react';
import Figure from 'react-bootstrap/Figure';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Helmet } from 'react-helmet-async';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { SW_MESSAGE_TYPES } from 'service-worker';
import styled from 'styled-components/macro';

function path(p) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + p;
  }
  return p;
}

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

export function GitLabDataSource() {
  const [clientID, setNewClientID] = useState(useSelector(selectApplicationId));
  const [newUrl, setNewUrl] = useState(useSelector(selectUrl));
  const configured = useSelector(selectConfigured);
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    <>
      <Helmet>
        <title>Configure GitLab Data Source</title>
        <meta name="description" content="A DevOps Dashboard" />
      </Helmet>
      <PageWrapper>
        <NavigationBar />
        <ContentWrapper>
          {userData && (
            <UserTitleWrapper>
              <StyledFigure>
                <Figure.Image
                  style={{ height: '5em' }}
                  src={userData.avatar_url}
                />
              </StyledFigure>
              <h3>
                {userData.name} - @{userData.username}
              </h3>
            </UserTitleWrapper>
          )}
          <ContentElement>
            <h2>GitLab Settings</h2>
            <span className="mb-3">
              You need to create an Application on your GitLab profile
              preferences page with the following settings:
            </span>
            <ul>
              <li>Name: DevOps Dashboard</li>
              <li>Redirect URI: {REDIRECT_URI}</li>
              <li>Confidential: unchecked</li>
              <li>Scopes: api</li>
            </ul>
            <span>
              You will need the Application ID after you have saved the
              Application
            </span>
            <hr />
            <DarkForm>
              <Form.Group className="mb-3">
                <Form.Label>GitLab URL</Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder="https://gitlab.com"
                    value={newUrl || ''}
                    onChange={({ target: { value } }) => setNewUrl(value)}
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Application ID</Form.Label>
                <Form.Control
                  placeholder="Application ID"
                  value={clientID || ''}
                  onChange={({ target: { value } }) => setNewClientID(value)}
                />
              </Form.Group>
              <BlueButton onClick={saveConfig}>
                <FontAwesomeIcon icon={['fab', 'gitlab']} />
                Authenticate with GitLab
              </BlueButton>
            </DarkForm>
          </ContentElement>
          {configured && (
            <ContentElement>
              <RedButton
                onClick={() => {
                  setNewClientID('');
                  setNewUrl('');
                  dispatch(gitLabActions.deleteConfiguration());
                  navigate(path('/data/gitlab'));
                }}
              >
                Delete Configuration
              </RedButton>
            </ContentElement>
          )}
        </ContentWrapper>
      </PageWrapper>
    </>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-flow: row no-wrap;
  width: 100%;
  height: 100%;
`;

const ContentWrapper = styled.div`
  width: 100%;
  height: 100vh;
  overflow: auto;
  display: flex;
  flex-flow: column;
  gap: 3em;
  align-items: center;
  justify-content: start;
`;

const ContentElement = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  justify-items: space-between;
  border-radius: 0.5em;
  padding: 1em;
  max-width: 50em;
  // unter, bevorz, ober
  width: clamp(5em, 30em, calc(100vh - 20em));
  background: var(--clr-widget);
  > * {
    width: 100%;
  }
  > h2 {
    margin-top: 0;
  }
`;

const UserTitleWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
  background: var(--clr-widget);
  min-height: 10em;
  * {
    padding-top: 1em;
  }
`;

const StyledFigure = styled(Figure)`
  margin: 0;
  padding: 0;
  padding-top: 1em;
  img {
    margin: 0;
    padding: 0;
    border-radius: 50%;
  }
`;

const BlueButton = styled(BlueButtonRaw)`
  width: 100%;
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
`;
