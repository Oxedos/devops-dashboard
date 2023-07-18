import { selectProjects } from 'app/data/gitLabSlice/selectors/projectSelectors';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import GitLabUser from '../GitLabUser';
import LabelRow from '../LabelRow';
import ProjectName from '../ProjectName';
import RelativeTime from '../RelativeTimestamp';
import { PipelineStatus, StatusStyle } from '../Status';
import Jobs from './Jobs';
import { PipelinePropTypes, getPipelineBackgroundColor } from './Pipeline';
import PipelineTitle from './PipelineTitle';
import RerunButton from './RerunButton';
import Stages from './Stages';

const RelaxedPipeline: React.FC<PipelinePropTypes> = props => {
  const { pipeline, mr, showStages } = props;
  const project = useSelector(selectProjects).find(
    project => project.id === props.pipeline.project_id,
  );

  const backgroundColour = getPipelineBackgroundColor(pipeline);

  return (
    <Wrapper
      style={{
        background: backgroundColour,
      }}
    >
      <div className="flex-row justify-space-between">
        <div className="flex-column align-start">
          <ProjectName project={project} />
          <strong>
            <PipelineTitle pipeline={pipeline} mr={mr} />
          </strong>
        </div>
        {pipeline.jobs && pipeline.jobs.length > 0 && (
          <GitLabUser user={pipeline.jobs[0].user} imgOnly />
        )}
      </div>
      <div className="flex-row justify-start">
        {showStages ? (
          <Stages pipeline={pipeline} mr={mr} />
        ) : (
          <Jobs pipeline={pipeline} mr={mr} />
        )}
      </div>
      {pipeline.labels && (
        <div className="flex-row justify-start">
          <LabelRow labels={pipeline.labels} />
        </div>
      )}
      <div className="flex-row justify-space-between">
        <div className="flex-row em-gap">
          <PipelineStatus
            pipeline={pipeline}
            style={StatusStyle.boxed}
            tooltip={pipeline.status}
            url={pipeline.web_url}
          />
          <RerunButton pipeline={pipeline} groupName={props.groupName} />
        </div>
        <RelativeTime timestamp={pipeline.created_at} />
      </div>
    </Wrapper>
  );
};

const Wrapper: any = styled.div`
  padding: 0.5em;
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1.5em;
  border-radius: 0.5em;

  .flex-column {
    display: flex;
    flex-flow: column;
    align-items: center;
    width: 100%;
  }

  .flex-row {
    display: flex;
    flex-flow: row;
    align-items: center;
    width: 100%;
  }

  .em-gap {
    gap: 1em;
  }

  .justify-space-between {
    justify-content: space-between;
  }

  .justify-start {
    justify-content: flex-start;
  }

  .align-start {
    align-items: start;
  }
`;

export default RelaxedPipeline;
