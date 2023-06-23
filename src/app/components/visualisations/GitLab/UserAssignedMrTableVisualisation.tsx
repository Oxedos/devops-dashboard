import { GitLabMR, GitLabPipeline, GitLabProject } from 'app/apis/gitlab/types';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import { PipelineStatus, StatusStyle } from 'app/components/GitLab/Status';
import compose from 'app/components/compose';
import { selectMrsUserAssigned } from 'app/data/gitLabSlice/mrSelectors';
import { selectConfigured } from 'app/data/gitLabSlice/selectors';
import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import SimpleMessage from '../components/SimpleMessage';
import TableVisualisation from '../components/TableVisualisation';
import withWidgetConfigurationModal from '../components/withWidgetConfigurationModal';
import withGitLabConfiguredCheck from './components/withGitLabConfiguredCheck';
import { selectPipelines } from 'app/data/gitLabSlice/pipelineSelectors';
import { selectProjects } from 'app/data/gitLabSlice/projectSelectors';

type PropTypes = {
  id: string;
};

type InnerPropTypes = {
  onSettingsClick: Function;
} & PropTypes;

function getUserAssignedMrs(
  mrs: GitLabMR[],
  pipelines: GitLabPipeline[],
  projects: GitLabProject[],
) {
  const header = ['Project', 'Pipeline', 'Title', 'Author', 'Reviewer'];
  const values = mrs.map(mr => {
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

const UserAssignedMrTable: React.FC<InnerPropTypes> = props => {
  const mrsUserAssigned = useSelector(selectMrsUserAssigned);
  const configured = useSelector(selectConfigured);
  const pipelines = useSelector(selectPipelines);
  const projects = useSelector(selectProjects);
  const visProps = getUserAssignedMrs(mrsUserAssigned, pipelines, projects);
  const title = 'MRs Assigned To You';

  let error = '';
  if (!configured) {
    error = 'GitLab Data Source not configured';
  } else if (visProps.values.length <= 0) {
    error = 'No MRs are currently assigned to you';
  }

  if (error) {
    return (
      <SimpleMessage
        onSettingsClick={props.onSettingsClick}
        id={props.id}
        title={title}
        message={error}
      />
    );
  }

  return (
    <TableVisualisation
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={() => {}}
      hover
      id={props.id}
      title={title}
      {...visProps}
    />
  );
};

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

export default compose<ComponentType<PropTypes>>(
  withWidgetConfigurationModal(),
  withGitLabConfiguredCheck,
)(UserAssignedMrTable);
