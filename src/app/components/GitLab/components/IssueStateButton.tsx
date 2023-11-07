import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import { setIssueState } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import {
  GitLabIssue,
  GitLabIssueState,
  GitLabProject,
} from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import { GlobalColours } from 'styles/global-styles';

export type IssueStateButtonProps = {
  project: GitLabProject;
  issue: GitLabIssue;
};

const toggleIssueState = async (
  issue: GitLabIssue,
  project: GitLabProject,
  gitLabUrl: string | undefined,
  dispatch,
  setLoading,
) => {
  if (!issue) return;
  if (!gitLabUrl) return;
  const newState = issue.state === GitLabIssueState.closed ? 'reopen' : 'close';
  try {
    setLoading(true);
    const newIssue = await setIssueState(
      issue.project_id,
      issue.iid,
      newState,
      project.path_with_namespace,
      gitLabUrl,
    );
    dispatch(gitLabActions.upsertIssue({ issue: newIssue }));
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLoading(false);
  }
};

const IssueStateButton: React.FC<IssueStateButtonProps> = props => {
  const [isLoading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const url = useSelector(selectUrl);
  const { issue } = props;
  if (isLoading) {
    return (
      <Container>
        <FontAwesomeIcon
          icon="sync"
          color={GlobalColours.gray}
          size="xl"
          spin
        />
      </Container>
    );
  }

  if (issue.state === GitLabIssueState.opened) {
    return (
      <Container>
        <FontAwesomeIcon
          cursor="pointer"
          icon={['far', 'square']}
          color={GlobalColours.gray}
          size="2x"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleIssueState(issue, props.project, url, dispatch, setLoading);
          }}
        />
      </Container>
    );
  } else {
    return (
      <Container>
        <FontAwesomeIcon
          cursor="pointer"
          icon={['far', 'square-check']}
          size="2x"
          color={GlobalColours.green}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleIssueState(issue, props.project, url, dispatch, setLoading);
          }}
        />
      </Container>
    );
  }
};

const Container = styled.div`
  min-width: 2em;
  min-height: 2em;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
`;

export default IssueStateButton;
