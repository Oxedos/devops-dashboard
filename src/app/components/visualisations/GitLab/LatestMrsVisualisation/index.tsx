import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import { selectProjects } from 'app/data/gitLabSlice/selectors';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import TableVisualisation from '../../components/TableVisualisation';
import { GitLabMR, GitLabPipeline, GitLabProject } from 'app/apis/gitlab/types';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from '../components/withGitLabConfiguredCheck';
import withMrLoadingByGroup from '../components/withMrLoadingByGroup';
import SimpleMessage from '../../components/SimpleMessage';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';
import withGroupFieldsProvider from '../components/withGroupFieldsProvider';
import { PipelineStatus, StatusStyle } from 'app/components/GitLab/Status';
import styled from 'styled-components/macro';

type PropTypesNoHoc = {
  id: string;
  group?: string;
};

type PropTypes = {
  onSettingsClick: Function;
  mrs: GitLabMR[];
  pipelines?: GitLabPipeline[];
} & PropTypesNoHoc;

function getLatestMrs(
  mrs: GitLabMR[],
  projects: GitLabProject[],
  pipelines: GitLabPipeline[],
) {
  let header: string[] = [];
  let values: any = undefined;

  header = ['Project', 'Pipeline', 'Title', 'Author', 'Assignee', 'Reviewer'];
  values = mrs
    .filter(mr => !mr.work_in_progress)
    .sort((x, y) => {
      const dateX: any = new Date(x.updated_at || x.created_at);
      const dateY: any = new Date(y.updated_at || y.created_at);
      return dateY - dateX;
    })
    .map(mr => {
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
        assignee: <GitLabUser user={mr.assignee} imgOnly />,
        reviewer: mr.reviewers && <GitLabUser user={mr.reviewers[0]} imgOnly />,
        clickHandler: () => window.open(mr.web_url),
      };
    });

  return { header, values };
}

const ReadyMrsVisualisation: React.FC<PropTypes> = props => {
  const projects = useSelector(selectProjects);
  const visProps = getLatestMrs(props.mrs, projects, props.pipelines || []);
  const title = `Ready MRs in ${props.group || 'all Groups'}`;

  if (visProps.values.length <= 0) {
    return (
      <SimpleMessage
        id={props.id}
        title={title}
        onSettingsClick={props.onSettingsClick}
        message={`No MRs in ${props.group || 'all Groups'} are currently ready`}
      />
    );
  }

  return (
    <TableVisualisation
      onSettingsClick={props.onSettingsClick}
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

ReadyMrsVisualisation.defaultProps = {
  group: '[All Groups]',
};

export default compose<ComponentType<PropTypesNoHoc>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(), // takes fields from withGroupFieldsProvider,
  withMrLoadingByGroup,
)(ReadyMrsVisualisation);
