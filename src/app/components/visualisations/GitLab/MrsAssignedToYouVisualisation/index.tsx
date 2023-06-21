import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import {
  selectConfigured,
  selectProjects,
  selectMrsUserAssigned,
  selectAllMrs,
} from 'app/data/gitLabSlice/selectors';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import TableVisualisation from '../../components/TableVisualisation';
import { GitLabMR, GitLabPipeline, GitLabProject } from 'app/apis/gitlab/types';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from '../components/withGitLabConfiguredCheck';
import SimpleMessage from '../../components/SimpleMessage';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';
import { PipelineStatus, StatusStyle } from 'app/components/GitLab/Status';
import styled from 'styled-components/macro';
import { selectPipelines } from 'app/data/gitLabSlice/pipelineSelectors';

type PropTypes = {
  id: string;
  onSettingsClick?: Function;
};

function getUserAssignedMrs(
  mrs: GitLabMR[],
  projects: GitLabProject[],
  pipelines: GitLabPipeline[],
) {
  const header = ['Project', 'Pipeline', 'Title', 'Author', 'Reviewer'];
  const values = mrs.map(mr => {
    const pipeline = pipelines.find(
      pipeline =>
        pipeline && pipeline.ref && pipeline.ref.includes(`${mr.iid}`),
    );
    return {
      project: projects.find(p => p.id === mr.project_id)?.name,
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
      clickHandler: () => window.open(mr.web_url),
    };
  });
  return { header, values };
}

const MrAssignedToYouVisualisation: React.FC<PropTypes> = props => {
  const mrIdsUserAssigned = useSelector(selectMrsUserAssigned);
  const mrs = useSelector(selectAllMrs);
  const projects = useSelector(selectProjects);
  const pipelines = useSelector(selectPipelines);
  const configured = useSelector(selectConfigured);

  const visProps = getUserAssignedMrs(
    mrs.filter(mr => mrIdsUserAssigned.includes(mr.id)),
    projects,
    pipelines,
  );

  const title = 'MRs Assigned To You';

  let error = '';
  if (!configured) {
    error = 'GitLab Data Source not configured';
  } else if (visProps.values.length <= 0) {
    error = 'No MRs are currently assigned to you';
  }

  let component;

  if (error) {
    component = (
      <SimpleMessage
        onSettingsClick={props.onSettingsClick}
        id={props.id}
        title={title}
        message={error}
      />
    );
  } else {
    component = (
      <TableVisualisation
        onSettingsClick={props.onSettingsClick}
        hover
        id={props.id}
        title={title}
        {...visProps}
      />
    );
  }

  return <>{component}</>;
};

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

export default compose<ComponentType<PropTypes>>(
  withWidgetConfigurationModal(),
  withGitLabConfiguredCheck,
)(MrAssignedToYouVisualisation);
