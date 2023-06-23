import { GitLabPipeline } from 'app/apis/gitlab/types';
import Pipeline from 'app/components/GitLab/Pipeline';
import compose from 'app/components/compose';
import { selectPipelinesFiltered } from 'app/data/gitLabSlice/pipelineSelectors';
import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import VisualisationContainer from '../components/VisualisationContainer';
import withWidgetConfigurationModal from '../components/withWidgetConfigurationModal';
import withGitLabConfiguredCheck from './components/withGitLabConfiguredCheck';
import withGroupFieldsProviderForPipelines from './components/withGroupFieldsProviderForPipelines';
import withPipelineConfigurationCheck from './components/withPipelineConfigurationCheck';

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
  afterVisRemoved: Function;
  pipelines: GitLabPipeline[];
} & PropTypesNoHoc;

const PipelineVisualisation: React.FC<PropTypes> = props => {
  const title = `Pipelines in ${props.group}`;
  const pipelines = useSelector(state =>
    selectPipelinesFiltered(state, {
      groupName: props.group,
      includeBranchPipelines: props.displayPipelinesForBranches,
      includeMrPipelines: props.displayPipelinesForMRs,
      includeCancelled: props.pipelines_canceled,
      includeCreated: props.pipelines_created,
      includeFailed: props.pipelines_failed,
      includeRunning: props.pipelines_running,
      includeSuccess: props.pipelines_success,
      includeManual: props.pipelines_manual,
    }),
  );

  return (
    <VisualisationContainer
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
      id={props.id}
      title={title}
    >
      <Wrapper>
        {pipelines.map(pipeline => {
          return (
            <div key={pipeline.id}>
              <Pipeline
                key={pipeline.id}
                pipeline={pipeline}
                groupName={props.group || ''}
                compact={props.compact}
                mr={pipeline.associatedMr}
              />
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
  display: flex;
  flex-flow: column nowrap;
  gap: 1.5em;
`;

PipelineVisualisation.defaultProps = {
  group: '',
};

export default compose<ComponentType<PropTypesNoHoc>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProviderForPipelines,
  withWidgetConfigurationModal(),
  withPipelineConfigurationCheck,
)(PipelineVisualisation);
