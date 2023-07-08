import React, { ComponentType, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from '@reduxjs/toolkit';
import { gitLabActions } from 'app';
import { updateIssue } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import {
  GitLabIssue,
  GitLabIssueState,
  GitLabProject,
} from 'app/apis/gitlab/types';
import { selectIssuesByProjectId } from 'app/data/gitLabSlice/selectors/issueSelectors';
import { selectProjectByNameWithNamespace } from 'app/data/gitLabSlice/selectors/projectSelectors';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import { GlobalColours } from 'styles/global-styles';
import SimpleMessage from '../visualisations/SimpleMessageVisualisation';
import VisualisationContainer from '../visualisations/VisualisationContainer';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';
import DueInDays from './components/DueInDays';
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

function parseDataSource(dataSource: string) {
  const splitDataSource = dataSource.split('-');
  const start = splitDataSource[0];
  const end = splitDataSource[1];
  return {
    start: {
      line: parseInt(start.split(':')[0], 10) - 1,
      col: parseInt(start.split(':')[1], 10) - 1,
    },
    end: {
      line: parseInt(end.split(':')[0], 10) - 1,
      col: parseInt(end.split(':')[1], 10) - 1,
    },
  };
}

async function handleClickOnTodoItem(
  e: React.MouseEvent,
  lockedDescriptions: number[],
  issue: GitLabIssue,
  project: GitLabProject,
  gitLabUrl: string | undefined,
  dispatch,
  setLockedDescriptions,
) {
  if (lockedDescriptions.includes(issue.id)) return;
  if (!(e.nativeEvent.target instanceof HTMLElement)) return;
  const target = e.nativeEvent.target;
  if (target.tagName !== 'LI' && target.tagName !== 'INPUT') return;

  let input: HTMLInputElement | null = null;
  let dataSource: string | null | undefined = null;
  if (target.tagName === 'LI') {
    input = target.querySelector('input');
    dataSource = target.getAttribute('data-sourcepos');
  } else if (target.tagName === 'INPUT' && target instanceof HTMLInputElement) {
    input = target;
    dataSource = input.parentElement?.getAttribute('data-sourcepos');
  }

  if (!input) return;
  if (!dataSource) return;
  if (!gitLabUrl) return;

  setLockedDescriptions([...lockedDescriptions, issue.id]);
  const pos = parseDataSource(dataSource);

  let splitDescription = issue.description.split(/\r?\n/);
  let lines = splitDescription.slice(pos.start.line, pos.end.line + 1);

  if (lines[0].match(/\[\W?\]/)) {
    lines[0] = lines[0].replace(/\[\W?\]/, '[X]');
    input.checked = true;
  } else {
    lines[0] = lines[0].replace(/\[((x)|(X))\]/, '[ ]');
    input.checked = false;
  }

  splitDescription.splice(pos.start.line, lines.length, ...lines);
  const updatedIssue: GitLabIssue = {
    ...issue,
    description: splitDescription.join('\n'),
  };
  // Quickly update our own state to enable the user to quickly tick off checkboxes
  dispatch(gitLabActions.upsertIssue({ issue: updatedIssue }));
  try {
    // And sync that with gitlab
    const newIssue = await updateIssue(
      issue.project_id,
      issue.iid,
      { description: updatedIssue.description },
      project.path_with_namespace,
      gitLabUrl,
    );
    dispatch(gitLabActions.upsertIssue({ issue: newIssue }));
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLockedDescriptions(lockedDescriptions.filter(l => l !== issue.id));
  }
}

const EventsVisualisation: React.FC<InnerPropTypes> = props => {
  const dispatch = useDispatch();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [descriptionLocked, setLockedDescriptions] = useState<number[]>([]);
  const [editingIssue, setEditingIssue] = useState<GitLabIssue | undefined>();
  const gitLabUrl = useSelector(selectUrl);
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
            project={project}
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
                {issue.description && issue.renderedDescription && (
                  <div
                    className="description"
                    style={{
                      color: descriptionLocked.includes(issue.id)
                        ? GlobalColours.gray
                        : GlobalColours.white,
                    }}
                  >
                    <div
                      onClick={e =>
                        handleClickOnTodoItem(
                          e,
                          descriptionLocked,
                          issue,
                          project,
                          gitLabUrl,
                          dispatch,
                          setLockedDescriptions,
                        )
                      }
                      // renderedDescription is rendered by GitLab via POST /markdown
                      // additionally, we pass the rendered input to sanitize-html in our API implementation
                      dangerouslySetInnerHTML={{
                        __html: issue.renderedDescription,
                      }}
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
                <IssueStateButton issue={issue} project={project} />
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
    & .table {
      width: unset !important;
    }

    & li:has(input),
    & li input {
      cursor: pointer;
    }

    & li:has(input):hover {
      filter: brightness(85%);
    }
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
