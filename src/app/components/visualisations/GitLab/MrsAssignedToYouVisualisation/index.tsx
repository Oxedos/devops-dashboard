import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import {
  selectConfigured,
  selectProjects,
  selectMrsUserAssigned,
} from 'app/data/gitLabSlice/selectors';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import TableVisualisation from '../../components/TableVisualisation';
import { GitLabMR, GitLabProject } from 'app/apis/gitlab/types';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from '../components/withGitLabConfiguredCheck';
import SimpleMessage from '../../components/SimpleMessage';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';
import { PipelineStatus, StatusStyle } from 'app/components/GitLab/Status';
import styled from 'styled-components/macro';

type PropTypes = {
  id: string;
  onSettingsClick?: Function;
};

function getUserAssignedMrs(mrs: GitLabMR[], projects: GitLabProject[]) {
  const header = ['Project', 'Pipeline', 'Title', 'Author', 'Reviewer'];
  const values = mrs.map(mr => ({
    project: projects.find(p => p.id === mr.project_id)?.name,
    pipeline: (
      <Centered>
        <PipelineStatus
          pipeline={mr.head_pipeline}
          simple
          tooltip={mr.head_pipeline.status}
          url={mr.head_pipeline.web_url}
          style={StatusStyle.simple}
        />
      </Centered>
    ),
    title: mr.title,
    author: <GitLabUser user={mr.author} imgOnly />,
    reviewer: mr.reviewers && <GitLabUser user={mr.reviewers[0]} imgOnly />,
    clickHandler: () => window.open(mr.web_url),
  }));
  return { header, values };
}

const MrAssignedToYouVisualisation: React.FC<PropTypes> = props => {
  const mrsUserAssigned = useSelector(selectMrsUserAssigned);
  const projects = useSelector(selectProjects);
  const configured = useSelector(selectConfigured);

  const visProps = getUserAssignedMrs(mrsUserAssigned, projects);

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
