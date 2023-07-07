import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabIssue, GitLabIssueState } from 'app/apis/gitlab/types';
import compose from 'app/components/compose';
import { selectIssuesByProjectId } from 'app/data/gitLabSlice/selectors/issueSelectors';
import { selectProjectByNameWithNamespace } from 'app/data/gitLabSlice/selectors/projectSelectors';
import React, { ComponentType, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import withFieldsProviderForIssuesTable from '../../visualisations/GitLab/components/withFieldsProviderForIssuesTable';
import withGitLabConfiguredCheck from '../../visualisations/GitLab/components/withGitLabConfiguredCheck';
import SimpleMessage from '../../visualisations/components/SimpleMessage';
import VisualisationContainer from '../../visualisations/components/VisualisationContainer';
import withWidgetConfigurationModal from '../../visualisations/components/withWidgetConfigurationModal';
import IssueStateButton from './components/IssueStateButton';
import IssueModal from './components/IssueModal';
import moment from 'moment';
import { GlobalColours } from 'styles/global-styles';
import LabelRow from '../LabelRow';
import GitLabMarkdown from '../GitLabMarkdown';

type OuterPropTypes = {
  id: string;
};

type InnerPropTypes = {
  projectName: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
} & OuterPropTypes;

const isToday = (issue: GitLabIssue) => {
  if (!issue.due_date) return false;
  const issueDue = moment(issue.due_date);
  const today = moment();
  return issueDue.isSameOrBefore(today, 'date');
};

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
        <IssueModal
          show={showIssueModal}
          onHide={() => {
            setShowIssueModal(false);
            setEditingIssue(undefined);
          }}
          projectId={project?.id}
          issue={editingIssue}
        />
        <div className="button-row">
          <Button onClick={() => setShowIssueModal(true)}>
            <FontAwesomeIcon icon="plus" />
          </Button>
        </div>
        {issues.map(issue => {
          return (
            <CardWrapper
              key={`issue-${issue.id}`}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                setEditingIssue(issue);
                setShowIssueModal(true);
              }}
            >
              <div className="info">
                {issue.due_date && (
                  <div
                    className="header"
                    style={{
                      color: isToday(issue)
                        ? GlobalColours.red
                        : GlobalColours.gray,
                    }}
                  >
                    <FontAwesomeIcon icon="flag" />
                    {issue.due_date}
                  </div>
                )}
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
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  .status {
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: start;
    padding: 0 1em 0 0;
    & :hover {
      filter: brightness(85%);
    }
  }

  .info {
    display: flex;
    flex-flow: column;
    align-items: start;
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
`;

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withFieldsProviderForIssuesTable,
  withWidgetConfigurationModal(),
)(EventsVisualisation);
