import { GitLabJob, GitLabMR, GitLabPipeline } from 'app/apis/gitlab/types';
import React from 'react';
import Job from './Job';
import styled from 'styled-components';

type PropTypes = {
  pipeline: GitLabPipeline;
  groupName: string;
  mr?: GitLabMR;
};

const Jobs: React.FC<PropTypes> = props => {
  const { pipeline, groupName, mr } = props;

  const sortedJobs: GitLabJob[] = pipeline.jobs
    .slice()
    .sort((j1, j2) => j1.id - j2.id);

  return (
    <JobsRowWrapper>
      {sortedJobs.map((job, idx) => (
        <JobWrapper>
          <Job
            key={`${job.id}-job`}
            job={job}
            nextJob={
              idx < sortedJobs.length - 2 ? sortedJobs[idx + 1] : undefined
            }
            withDivider={idx < sortedJobs.length - 1}
            groupName={groupName}
            mr={mr}
          />
        </JobWrapper>
      ))}
    </JobsRowWrapper>
  );
};

const JobWrapper = styled.div`
  margin-bottom: 0.5em;
  margin-top: 0.5em;
  display: flex;
  flex-flow: row;
  align-items: center;
`;

const JobsRowWrapper = styled.div`
  margin: 0;
  padding-right: 3em;
  width: 100%;
  min-height: 2.5em;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
`;

export default Jobs;
