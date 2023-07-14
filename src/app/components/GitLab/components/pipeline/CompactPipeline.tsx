import { selectProjects } from 'app/data/gitLabSlice/selectors/projectSelectors';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import GitLabUser from '../GitLabUser';
import LabelRow from '../LabelRow';
import ProjectName from '../ProjectName';
import RelativeTime from '../RelativeTimestamp';
import RerunButton from './RerunButton';
import { PipelineStatus, StatusStyle } from '../Status';
import Jobs from './Jobs';
import { PipelinePropTypes, getPipelineBackgroundColor } from './Pipeline';
import PipelineTitle from './PipelineTitle';
import Stages from './Stages';

const CompactPipeline: React.FC<PipelinePropTypes> = props => {
  const { pipeline, mr, groupName, showStages } = props;
  const project = useSelector(selectProjects).find(
    project => project.id === props.pipeline.project_id,
  );

  const backgroundColour = getPipelineBackgroundColor(pipeline);

  return (
    <Wrapper style={{ background: backgroundColour }}>
      <div className="flex-row">
        <div className="flex-column flex-grow gap">
          <div className="flex-row align-center justify-start text-gap">
            <ProjectName project={project} />
            <strong>
              <PipelineTitle pipeline={pipeline} mr={mr} />
            </strong>
          </div>
          <div className="flex-row align-center justify-start">
            <div className="padded-right">
              <PipelineStatus
                pipeline={pipeline}
                style={StatusStyle.boxed}
                tooltip={pipeline.status}
                url={pipeline.web_url}
              />
            </div>
            {showStages ? (
              <Stages pipeline={pipeline} groupName={groupName} mr={mr} />
            ) : (
              <Jobs pipeline={pipeline} groupName={groupName} mr={mr} />
            )}
          </div>
        </div>
        <div className="flex-column justify-space-between height-100 gap">
          <GitLabUser user={pipeline.jobs[0].user} imgOnly />
          <RerunButton pipeline={pipeline} groupName={props.groupName} />
        </div>
      </div>
      <div className="flex-row align-center justify-space-between">
        {pipeline.labels ? (
          <LabelRow labels={pipeline.labels} />
        ) : (
          <div className="dummy" />
        )}
        <RelativeTime timestamp={pipeline.created_at} />
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  padding: 0.25em 0.5em;
  gap: 0.5em;
  border-radius: 0.5em;

  .flex-row {
    display: flex;
    flex: row wrap;
  }

  .flex-column {
    display: flex;
    flex: column nowrap;
  }

  .flex-grow {
    flex-grow: 1;
  }

  .align-center {
    align-items: center;
  }

  .justify-start {
    justify-content: start;
  }

  .justify-space-between {
    justify-content: space-between;
  }

  .dummy {
    min-width: 1em;
  }

  .text-gap {
    gap: 0.5em;
  }

  .gap {
    gap: 0.5em;
  }

  .padded-right {
    padding-right: 1em;
  }

  .height-100 {
    min-height: 100%;
  }

  .footer {
  }
`;

export default CompactPipeline;
