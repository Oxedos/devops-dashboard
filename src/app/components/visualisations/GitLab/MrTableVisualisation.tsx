import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import TableVisualisation from '../components/TableVisualisation';
import { GitLabMR, GitLabPipeline, GitLabProject } from 'app/apis/gitlab/types';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from './components/withGitLabConfiguredCheck';
import SimpleMessage from '../components/SimpleMessage';
import withWidgetConfigurationModal from '../components/withWidgetConfigurationModal';
import withMrTableFieldsProvider from './components/withMrTableFieldsProvider';
import { PipelineStatus, StatusStyle } from 'app/components/GitLab/Status';
import styled from 'styled-components/macro';
import { selectMrsByGroupFiltered } from 'app/data/gitLabSlice/mrSelectors';
import { selectPipelinesByGroup } from 'app/data/gitLabSlice/pipelineSelectors';
import { selectProjectsByGroup } from 'app/data/gitLabSlice/projectSelectors';

type OuterPropTypes = {
  id: string;
};

type innerPropTypes = {
  group?: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
  mrs: GitLabMR[];
  pipelines?: GitLabPipeline[];
  assignedToUserOnly?: boolean;
  userAsReviewer?: boolean;
  includeWIP?: boolean;
} & OuterPropTypes;

function getMrTable(
  mrs: GitLabMR[],
  pipelines: GitLabPipeline[],
  projects: GitLabProject[],
) {
  let header: string[] = [];
  let values: any = undefined;

  header = ['Project', 'Pipeline', 'Title', 'Author', 'Assignee', 'Reviewer'];
  values = mrs.map(mr => {
    const project =
      projects && projects.find(project => mr.project_id === project.id);
    const pipeline =
      pipelines &&
      pipelines.find(pipeline => pipeline.ref.includes(`${mr.iid}`));
    return {
      project: project?.name,
      pipeline: pipeline && (
        <Centered>
          <PipelineStatus
            pipeline={pipeline}
            simple
            tooltip={pipeline?.status || 'unkown'}
            url={pipeline?.web_url || undefined}
            style={StatusStyle.simple}
          />
        </Centered>
      ),
      title: mr.title,
      author: <GitLabUser user={mr.author} imgOnly />,
      assignee: <GitLabUser user={mr.assignee} imgOnly />,
      reviewer: mr.reviewers && <GitLabUser user={mr.reviewers[0]} imgOnly />,
      clickHandler: (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(mr.web_url);
      },
    };
  });

  return { header, values };
}

const MrTableVisualisation: React.FC<innerPropTypes> = props => {
  const mrs = useSelector(state =>
    selectMrsByGroupFiltered(state, {
      groupName: props.group,
      includeReady: true,
      includeWIP: props.includeWIP,
      assignedToUserOnly: props.assignedToUserOnly,
      userAsReviewer: props.userAsReviewer,
    }),
  );

  const pipelines = useSelector(state =>
    selectPipelinesByGroup(state, { groupName: props.group }),
  );
  const projects = useSelector(state =>
    selectProjectsByGroup(state, { groupName: props.group }),
  );
  const visProps = getMrTable(mrs, pipelines, projects);
  let title = 'Merge Requests';
  let message = 'No Merge Requests to display';
  if (props.userAsReviewer) {
    title = 'Reviewing MRs';
    message = 'No reviews requested from you';
  } else if (props.assignedToUserOnly) {
    title = 'MRs assigned to you';
    message = 'No Merge Requests assigned to you';
  } else if (props.group) {
    title = `MRs in ${props.group}`;
    message = `No Merge Requests in ${props.group}`;
  }

  if (visProps.values.length <= 0) {
    return (
      <SimpleMessage
        id={props.id}
        title={title}
        onSettingsClick={props.onSettingsClick}
        message={message}
      />
    );
  }

  return (
    <TableVisualisation
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
      id={props.id}
      title={title}
      hover
      {...visProps}
    />
  );
};

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

MrTableVisualisation.defaultProps = {
  group: '[All Groups]',
};

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withMrTableFieldsProvider,
  withWidgetConfigurationModal(), // takes fields from withGroupFieldsProvider,
)(MrTableVisualisation);
