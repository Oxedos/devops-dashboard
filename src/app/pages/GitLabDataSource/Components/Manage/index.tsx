import React from 'react';
import styled from 'styled-components/macro';
import { useGitLabSlice } from 'app/data/gitLabSlice';
import { selectToken, selectUrl } from 'app/data/gitLabSlice/selectors';
import { useDispatch, useSelector } from 'react-redux';
import ContentElement from '../../../../components/Design/ContentElement';
import Config from '../Config';
import { RedButton } from 'app/components/Design/Buttons';

const Manage: React.FC = props => {
  const { actions: gitLabActions } = useGitLabSlice();
  const dispatch = useDispatch();
  const url = useSelector(selectUrl);
  const token = useSelector(selectToken);

  return (
    <Wrapper>
      <Config
        token={token}
        url={url}
        saveConfig={({ token, url }) => {
          dispatch(gitLabActions.setToken(token));
          dispatch(gitLabActions.setUrl(url));
          dispatch(gitLabActions.setConfigured(true));
        }}
      />
      <ContentElement>
        <h2>Manage Configuration</h2>
        <StyledRedButton
          onClick={() => dispatch(gitLabActions.deleteConfiguration())}
        >
          Delete Configuration
        </StyledRedButton>
      </ContentElement>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  > * {
    margin-bottom: 3em;
  }
`;

const StyledRedButton = styled(RedButton)`
  width: 20em;
`;

export default Manage;
