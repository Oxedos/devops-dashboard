import { GitLabMR } from 'app/apis/gitlab/types';
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

type PropTypes = {
  id: string;
  onSettingsClick?: Function;
};

function getUserAssignedMrs(mrs: GitLabMR[]) {
  const header = ['Project', 'Pipeline', 'Title', 'Author', 'Reviewer'];
  const values = mrs.map(mr => {
    return {
      project: mr.project?.name,
      pipeline: mr.pipeline && (
        <Centered>
          <PipelineStatus
            pipeline={mr.pipeline}
            simple
            tooltip={mr.pipeline?.status || 'unkown'}
            url={mr.pipeline?.web_url || undefined}
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

const UserAssignedMrTable: React.FC<PropTypes> = props => {
  const mrsUserAssigned = useSelector(selectMrsUserAssigned);
  const configured = useSelector(selectConfigured);
  const visProps = getUserAssignedMrs(mrsUserAssigned);
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
