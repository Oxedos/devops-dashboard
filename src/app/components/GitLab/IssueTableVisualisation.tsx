import React, { ComponentType, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from '@reduxjs/toolkit';
import { GitLabIssue, GitLabIssueState } from 'app/apis/gitlab/types';
import { selectIssuesByProjectId } from 'app/data/gitLabSlice/selectors/issueSelectors';
import { selectProjectByNameWithNamespace } from 'app/data/gitLabSlice/selectors/projectSelectors';
import SimpleMessage from '../visualisations/SimpleMessageVisualisation';
import VisualisationContainer from '../visualisations/VisualisationContainer';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';
import DueInDays from './components/DueInDays';
import GitLabMarkdown from './components/GitLabMarkdown';
import IssueModal from './components/IssueModal';
import IssueStateButton from './components/IssueStateButton';
import LabelRow from './components/LabelRow';
import TimeSpent from './components/TimeSpent';
import withFieldsProviderForIssuesTable from './higher-order-components/withFieldsProviderForIssuesTable';
import withGitLabConfiguredCheck from './higher-order-components/withGitLabConfiguredCheck';

type OuterPropTypes = {
  id: string;
};

type InnerPropTypes = {
  projectName: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
} & OuterPropTypes;

const EventsVisualisation: React.FC<InnerPropTypes> = props => {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<GitLabIssue | undefined>();
  const project = useSelector(state =>
    selectProjectByNameWithNamespace(state, {
      projectName: props.projectName,
    }),
  );

  const issues = useSelector(state =>
    selectIssuesByProjectId(state, { projectId: project?.id }),
  );

  if (!project) {
    return (
      <SimpleMessage
        id={props.id}
        title="Issues Widget"
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        message="Could not find associated project"
      />
    );
  }

  if (!props.projectName) {
    return (
      <SimpleMessage
        id={props.id}
        title="Issues Widget"
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        message="No Project Selected. Please use the setting menu to select one"
      />
    );
  }

  if (!issues) {
    return (
      <SimpleMessage
        id={props.id}
        title="Issues Widget"
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        message="No Issues to display"
      />
    );
  }

  return (
    <VisualisationContainer
      id={props.id}
      title={`Issues in ${props.projectName}`}
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
    >
      <Wrapper>
        {showIssueModal && (
          <IssueModal
            key="issue-modal"
            onHide={() => {
              setShowIssueModal(false);
              setEditingIssue(undefined);
            }}
            projectId={project?.id}
            issue={editingIssue}
          />
        )}
        <div className="button-row">
          <Button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowIssueModal(true);
            }}
          >
            <FontAwesomeIcon icon="plus" />
          </Button>
        </div>
        {issues.map(issue => {
          return (
            <CardWrapper key={`issue-${issue.id}`}>
              <div className="info">
                <DueInDays issue={issue} />
                <TimeSpent key="test" issue={issue} />
              </div>
              <div
                className={
                  issue.state === GitLabIssueState.opened
                    ? 'content'
                    : 'content gray'
                }
              >
                <p>
                  <strong>{issue.title}</strong>
                </p>
                {issue.description && (
                  <div className="description">
                    <GitLabMarkdown
                      project={project}
                      content={issue.description}
                    />
                  </div>
                )}
                {issue.labels && (
                  <div className="label-row">
                    <LabelRow labels={issue.labels} />
                  </div>
                )}
              </div>
              <div className="status">
                <IssueStateButton issue={issue} />
              </div>
              <div className="edit-button">
                <FontAwesomeIcon
                  icon="pen-to-square"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingIssue(issue);
                    setShowIssueModal(true);
                  }}
                />
              </div>
            </CardWrapper>
          );
        })}
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;

  .button-row {
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: end;
    gap: 1em;
    margin: 1em;
  }
`;

const CardWrapper = styled.div`
  display: flex;
  flex-flow: row-reverse;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5em 1em;
  border-radius: 0.5em;
  color: var(--clr-white);
  overflow-wrap: anywhere;
  padding: 1em;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  .status {
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: space-between;
    padding: 0 1em 0 0;

    & svg:hover {
      filter: brightness(85%);
    }
  }

  .info {
    display: flex;
    flex-flow: column;
    align-items: end;
    justify-content: space-between;
    gap: 1em;
  }

  .content {
    display: flex;
    flex-flow: column;
    flex-grow: 1;
    justify-content: space-evenly;
    p {
      margin: 0;
    }
  }

  .header {
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5em;
  }

  .gray {
    color: var(--clr-gray);
  }

  .label-row {
    flex: row;
  }

  .description {
    padding: 1em 1em 1em 0;
  }

  &:hover .edit-button > svg {
    opacity: 1;
    transition: opacity 0.25s ease-in-out;
  }

  .edit-button {
    & > svg {
      opacity: 0;
      position: absolute;
      bottom: 1em;
      left: 1em;
      cursor: pointer;
    }

    & > svg:hover {
      filter: brightness(85%);
    }
  }
`;

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withFieldsProviderForIssuesTable,
  withWidgetConfigurationModal(),
)(EventsVisualisation);
