import { GitLabJob, GitLabMR, GitLabPipeline } from 'app/apis/gitlab/types';
import React from 'react';
import Stage from './Stage';
import styled from 'styled-components';

type PropTypes = {
  pipeline: GitLabPipeline;
  groupName: string;
  mr?: GitLabMR;
};

const Stages: React.FC<PropTypes> = props => {
  const { pipeline, groupName, mr } = props;

  const stages = (pipeline.jobs || [])
    .slice()
    .sort((j1, j2) => j1.id - j2.id)
    .reduce(function (stages: { name: string; jobs: GitLabJob[] }[], job) {
      const stage_name = job.stage;
      let stage_id = stages.findIndex(s => s['name'] === stage_name);
      if (!~stage_id) {
        stage_id = stages.length;
        stages.push({ name: stage_name, jobs: [] });
      }
      stages[stage_id].jobs.push(job);
      return stages;
    }, []);

  return (
    <StagesRowWrapper>
      {stages.map((stage, idx) => (
        <StageWrapper>
          <Stage
            key={`${stage.name}-job`}
            stage={stage.name}
            jobs={stage.jobs}
            nextJobs={
              idx < stages.length - 2 ? stages[idx + 1].jobs : undefined
            }
            withDivider={idx < stages.length - 1}
            groupName={groupName}
            mr={mr}
          />
        </StageWrapper>
      ))}
    </StagesRowWrapper>
  );
};

const StageWrapper = styled.div`
  margin-bottom: 0.5em;
  margin-top: 0.5em;
  display: flex;
  flex-flow: row;
  align-items: center;
`;

const StagesRowWrapper = styled.div`
  margin: 0;
  padding-right: 3em;
  width: 100%;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
`;

export default Stages;
