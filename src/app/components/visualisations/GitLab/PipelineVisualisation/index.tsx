import React, { ComponentType } from 'react';
import styled from 'styled-components/macro';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from '../components/withGitLabConfiguredCheck';
import { GitLabPipeline, GitLabMR } from 'app/apis/gitlab/types';
import withMrLoadingByGroup from '../components/withMrLoadingByGroup';
import withPipelineLoadingByGroup from '../components/withPipelineLoadingByGroup';
import VisualisationContainer from '../../components/VisualisationContainer';
import Pipeline from 'app/components/GitLab/Pipeline';
import moment from 'moment';
import withGroupFieldsProviderForPipelines from '../components/withGroupFieldsProviderForPipelines';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';
import SimpleMessage from '../../components/SimpleMessage';

type PropTypesNoHoc = {
  id: string;
  group?: string;
  compact?: boolean;
  pipelines_canceled?: boolean;
  pipelines_created?: boolean;
  pipelines_failed?: boolean;
  pipelines_running?: boolean;
  pipelines_success?: boolean;
  pipelines_manual?: boolean;
  displayPipelinesForBranches?: boolean;
  displayPipelinesForMRs?: boolean;
};

type PropTypes = {
  onSettingsClick: Function;
  afterVisRemove: Function;
  pipelines: GitLabPipeline[];
  mrs: GitLabMR[];
} & PropTypesNoHoc;

const sortByDate = (arg1: GitLabPipeline, arg2: GitLabPipeline) => {
  return moment(arg2.created_at).diff(moment(arg1.created_at));
};

const getSelectedPipelineStatus = (
  pipelines_canceled,
  pipelines_created,
  pipelines_failed,
  pipelines_running,
  pipelines_success,
  pipelines_manual,
) => {
  const status: string[] = [];
  if (pipelines_canceled) status.push('canceled');
  if (pipelines_created) status.push('created');
  if (pipelines_failed) status.push('failed');
  if (pipelines_running) status.push('running');
  if (pipelines_success) status.push('success');
  if (pipelines_manual) status.push('manual');
  return status;
};

const PipelineVisualisation: React.FC<PropTypes> = props => {
  const {
    id,
    pipelines,
    onSettingsClick,
    afterVisRemove,
    group,
    pipelines_canceled,
    pipelines_created,
    pipelines_failed,
    pipelines_running,
    pipelines_success,
    pipelines_manual,
    displayPipelinesForBranches,
    displayPipelinesForMRs,
    mrs,
  }: PropTypes = props;
  const title = `Pipelines in ${group}`;

  const selectedStatus = getSelectedPipelineStatus(
    pipelines_canceled,
    pipelines_created,
    pipelines_failed,
    pipelines_running,
    pipelines_success,
    pipelines_manual,
  );

  if (selectedStatus.length <= 0) {
    return (
      <SimpleMessage
        onSettingsClick={onSettingsClick}
        afterVisRemove={afterVisRemove}
        id={id}
        title={title}
        message="No Pipeline Status selected to display. Please configure Visualisation"
      />
    );
  }

  if (!displayPipelinesForMRs && !displayPipelinesForBranches) {
    return (
      <SimpleMessage
        onSettingsClick={onSettingsClick}
        afterVisRemove={afterVisRemove}
        id={id}
        title={title}
        message="Please select at least one source for pipelines. Use the configuation dialog for this setting"
      />
    );
  }

  let sortedPipelines = pipelines
    .slice()
    .sort(sortByDate)
    .filter(p => selectedStatus.includes(p.status));

  if (displayPipelinesForMRs && !displayPipelinesForBranches) {
    sortedPipelines = sortedPipelines.filter(p =>
      p.ref.startsWith('refs/merge-requests'),
    );
  } else if (!displayPipelinesForMRs && displayPipelinesForBranches) {
    sortedPipelines = sortedPipelines.filter(
      p => !p.ref.startsWith('refs/merge-requests'),
    );
  }

  return (
    <VisualisationContainer
      onSettingsClick={onSettingsClick}
      afterVisRemove={afterVisRemove}
      id={id}
      title={title}
    >
      <Wrapper>
        {sortedPipelines.map((pipeline, idx) => {
          let associatedMr;
          let pipelineToRender = pipeline;
          // Add MR labels to pipelines and find associated MR
          if (pipeline.ref.startsWith('refs/merge-requests')) {
            const pipelineRef = pipeline.ref;
            associatedMr = mrs.find(
              mr =>
                mr.project_id === pipeline.project_id &&
                mr.head_pipeline &&
                mr.head_pipeline.ref === pipelineRef,
            );
            if (associatedMr) {
              pipelineToRender = { ...pipeline, labels: associatedMr.labels };
            }
          }
          return (
            <div key={pipeline.id}>
              <Pipeline
                key={pipeline.id}
                pipeline={pipelineToRender}
                groupName={group || ''}
                compact={props.compact}
                mr={associatedMr}
              />
              {idx < pipelines.length - 1 && <StyledHr />}
            </div>
          );
        })}
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding: 0.5em;
`;

const StyledHr = styled.div`
  margin-top: 0.75em;
  margin-bottom: 0.75em;
`;

PipelineVisualisation.defaultProps = {
  group: '',
};

export default compose<ComponentType<PropTypesNoHoc>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProviderForPipelines,
  withWidgetConfigurationModal(),
  withPipelineLoadingByGroup,
  withMrLoadingByGroup,
)(PipelineVisualisation);
