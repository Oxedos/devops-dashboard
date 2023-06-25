import { RedButton } from 'app/components/Design/Buttons';
import { useGitLabSlice } from 'app/data/gitLabSlice';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import styled from 'styled-components/macro';
import ContentElement from '../../../../components/Design/ContentElement';
import Config from '../Config';

function path(p) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + p;
  }
  return p;
}

const Manage: React.FC = props => {
  const { actions: gitLabActions } = useGitLabSlice();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <Wrapper>
      <Config />
      <ContentElement>
        <h2>Manage Configuration</h2>
        <StyledRedButton
          onClick={() => {
            dispatch(gitLabActions.deleteConfiguration());
            navigate(path('/data/gitlab'));
          }}
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
