import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Figure from 'react-bootstrap/Figure';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import NavigationBar from 'app/components/Dashboard/NavigationBar';
import {
  selectApplicationId,
  selectConfigured,
  selectUrl,
  selectUserData,
} from 'app/data/gitLabSlice/selectors/selectors';
import { REDIRECT_URI, redirectToGitlabAuth } from 'app/util/OAuthUtil';

function path(p) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + p;
  }
  return p;
}

export function GitLabDataSource() {
  const [loginDisabled, setLoginDisabled] = useState(false);
  const [clientID, setNewClientID] = useState(useSelector(selectApplicationId));
  const [newUrl, setNewUrl] = useState(useSelector(selectUrl));
  const configured = useSelector(selectConfigured);
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
            <Form>
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
              <BlueButton
                disabled={loginDisabled}
                onClick={() => {
                  setLoginDisabled(true);
                  redirectToGitlabAuth(newUrl, clientID, dispatch);
                }}
              >
                <FontAwesomeIcon icon={['fab', 'gitlab']} />
                Authenticate with GitLab
              </BlueButton>
            </Form>
          </ContentElement>
          {configured && (
            <ContentElement>
              <Button
                onClick={() => {
                  setNewClientID('');
                  setNewUrl('');
                  dispatch(gitLabActions.deleteConfiguration());
                  navigate(path('/data/gitlab'));
                }}
                variant="danger"
              >
                Delete Configuration
              </Button>
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

const BlueButton: any = styled(Button)`
  width: 100%;
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
`;
