import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Form, InputGroup } from 'react-bootstrap';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import { updateIssue } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import {
  GitLabIssue,
  GitLabProject,
  GitlabLabelDetail,
} from 'app/apis/gitlab/types';
import LoadingButton, {
  LoadingState,
} from 'app/components/common/LoadingButton';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import Label from './Label';

export type PropTypes = {
  issue?: GitLabIssue;
  project?: GitLabProject;
  labels: (GitlabLabelDetail | string)[];
  editable?: boolean;
  hideIcon?: boolean;
  small?: boolean;
};

const updateLabels = async (
  newLabels: (string | GitlabLabelDetail)[],
  issue: GitLabIssue | undefined,
  project: GitLabProject | undefined,
  gitLabUrl: string | undefined,
  setState: React.Dispatch<React.SetStateAction<LoadingState>>,
  onSuccess,
  dispatch,
) => {
  if (!issue) return;
  if (!project) return;
  if (!gitLabUrl) return;
  setState(LoadingState.loading);

  try {
    const newLabelNames = newLabels.map(label =>
      typeof label === 'string' ? label : label.name,
    );
    const updatedIssue = await updateIssue(
      project.id,
      issue.iid,
      {
        labels: newLabelNames.length > 0 ? newLabelNames : '',
      },
      project.path_with_namespace,
      gitLabUrl,
    );
    dispatch(gitLabActions.upsertIssue({ issue: updatedIssue }));
    onSuccess();
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
    setState(LoadingState.error);
  }
};

const LabelRow: React.FC<PropTypes> = props => {
  const [newLabel, setNewLabel] = useState('');
  const [state, setState] = useState<LoadingState>(LoadingState.pending);
  const [editing, showEditing] = useState(false);
  const gitLabUrl = useSelector(selectUrl);
  const dispatch = useDispatch();
  const onSuccess = () => {
    setState(LoadingState.success);
    setNewLabel('');
    setTimeout(() => setState(LoadingState.pending), 1000);
  };
  const labels = props.labels.map(label => (
    <Label
      editable={props.editable}
      disabled={state === LoadingState.loading}
      label={label}
      key={typeof label === 'string' ? label : label.name}
      small={props.small}
      onDelete={name => {
        const newLabels = props.labels.filter(l =>
          typeof l === 'string' ? l !== name : l.name !== name,
        );
        updateLabels(
          newLabels,
          props.issue,
          props.project,
          gitLabUrl,
          setState,
          onSuccess,
          dispatch,
        );
      }}
    />
  ));

  if (!props.editable && labels.length <= 0) return null;

  return (
    <Wrapper>
      <LabelsContainer
        style={{
          gap: props.small ? '0.5em' : '1em',
        }}
      >
        {!props.hideIcon && (props.labels.length > 0 || props.editable) && (
          <FontAwesomeIcon
            icon={state === LoadingState.loading ? 'sync' : 'tags'}
            spin={state === LoadingState.loading}
          />
        )}
        {labels}
        {props.editable && (
          <FontAwesomeIcon
            icon="pen-to-square"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              showEditing(true);
            }}
          />
        )}
      </LabelsContainer>
      {props.editable && editing && (
        <Form
          noValidate
          onSubmit={e => {
            e.stopPropagation();
            e.preventDefault();
            const labelNames = props.labels.map(l =>
              typeof l === 'string' ? l : l.name,
            );
            if (labelNames.includes(newLabel)) {
              displayGitLabErrorNotification(
                new Error('Label already exists'),
                dispatch,
              );
              return;
            }
            updateLabels(
              [...labelNames, newLabel],
              props.issue,
              props.project,
              gitLabUrl,
              setState,
              onSuccess,
              dispatch,
            );
          }}
        >
          <InputGroup>
            <Button
              variant="outline-secondary"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                showEditing(false);
              }}
            >
              Close
            </Button>
            <Form.Control
              size="sm"
              placeholder="Add Label"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              disabled={state === LoadingState.loading}
            />
            <LoadingButton variant="primary" type="submit" state={state}>
              <FontAwesomeIcon icon="plus" />
            </LoadingButton>
          </InputGroup>
        </Form>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  gap: 1em;
`;

const LabelsContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: start;

  & > svg:not(:first-child) {
    cursor: pointer;
    opacity: 0;
  }

  & > svg:not(:first-child):hover {
    filter: brightness(85%);
  }

  &:hover > svg {
    opacity: 1 !important;
    transition: opacity 0.25s ease-in-out;
  }
`;

export default LabelRow;
