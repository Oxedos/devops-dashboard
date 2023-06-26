import React from 'react';
import styled from 'styled-components/macro';
import { GitLabJob, GitLabMR, GitLabPipeline } from 'app/apis/gitlab/types';
import Job from '../Job';
import { useSelector } from 'react-redux';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RerunButton from '../RerunButton';
import Stage from '../Stage';
import { GlobalColours } from 'styles/global-styles';
import Badge from 'react-bootstrap/Badge';
import { PipelineStatus, StatusStyle } from '../Status';
import { selectProjects } from 'app/data/gitLabSlice/projectSelectors';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

type PropTypes = {
  pipeline: GitLabPipeline;
  groupName: string;
  compact?: boolean;
  mr?: GitLabMR;
};

const calcuclateUptime = (pipeline: GitLabPipeline) => {
  const now = moment();
  const start = moment(pipeline.created_at);
  const diff = now.diff(start, 'seconds');
  return moment.duration(diff, 'seconds').humanize();
};

const getBackgroundColour = (pipeline: GitLabPipeline) => {
  const alpha = '20';
  if (pipeline.status === 'failed') {
    return GlobalColours.red + alpha;
  } else if (pipeline.status === 'running') {
    return GlobalColours.blue + alpha;
  } else if (pipeline.status === 'created') {
    return undefined;
  } else if (pipeline.status === 'success') {
    return GlobalColours.green + alpha;
  } else if (pipeline.status === 'manual') {
    return undefined;
  }
  return undefined;
};

const Pipeline: React.FC<PropTypes> = props => {
  const { pipeline }: PropTypes = props;

  const project = useSelector(selectProjects).find(
    project => project.id === props.pipeline.project_id,
  );

  let sortedJobs: GitLabJob[] = props.pipeline.jobs
    .slice()
    .sort((j1, j2) => j1.id - j2.id);

  const stages = sortedJobs.reduce(function (
    stages: { name: string; jobs: GitLabJob[] }[],
    job,
  ) {
    const stage_name = job.stage;
    let stage_id = stages.findIndex(s => s['name'] === stage_name);
    if (!~stage_id) {
      stage_id = stages.length;
      stages.push({ name: stage_name, jobs: [] });
    }
    stages[stage_id].jobs.push(job);
    return stages;
  },
  []);

  const backgroundColour = getBackgroundColour(pipeline);

  let blobs: JSX.Element[] = [];
  if (props.compact) {
    blobs = stages.map((stage, idx) => (
      <JobWrapper key={`${stage.name}-${idx}`}>
        <Stage
          key={`${stage.name}-job`}
          stage={stage.name}
          jobs={stage.jobs}
          nextJobs={idx < stages.length - 2 ? stages[idx + 1].jobs : undefined}
          withDivider={idx < stages.length - 1}
          groupName={props.groupName}
          mr={props.mr}
        />
      </JobWrapper>
    ));
  } else {
    blobs = sortedJobs.map((job, idx) => (
      <JobWrapper key={`${job.name}-${idx}`}>
        <Job
          key={`${job.id}-job`}
          job={job}
          nextJob={
            idx < sortedJobs.length - 2 ? sortedJobs[idx + 1] : undefined
          }
          withDivider={idx < sortedJobs.length - 1}
          groupName={props.groupName}
          mr={props.mr}
        />
      </JobWrapper>
    ));
  }

  const labels =
    pipeline.labels &&
    pipeline.labels.map((label, idx) => {
      const labelComponent = (
        <ColoredBadged
          pill
          key={`${label}-${idx} Badge`}
          background={label.color}
          color={label.text_color}
        >
          {label.name}
        </ColoredBadged>
      );
      if (!label.description) {
        return labelComponent;
      }
      return (
        <OverlayTrigger
          key={`${label}-${idx} Overlay`}
          placement="bottom"
          overlay={overlayProps => (
            <Tooltip id="button-tooltip" {...overlayProps}>
              {label.description}
            </Tooltip>
          )}
        >
          {labelComponent}
        </OverlayTrigger>
      );
    });

  return (
    <Wrapper backgroundColor={backgroundColour}>
      <Header>
        <TitelWrapper>
          <span>{project?.name}</span>
          <span>
            <strong
              onClick={() =>
                pipeline.mr_web_url ? window.open(pipeline.mr_web_url) : {}
              }
              style={pipeline.mr_web_url ? { cursor: 'pointer' } : undefined}
            >
              {pipeline.title || pipeline.ref}
            </strong>
          </span>
        </TitelWrapper>
        {pipeline?.jobs[0] && (
          <GitLabUser user={pipeline.jobs[0].user} imgOnly />
        )}
      </Header>
      <JobsRowWrapper>{blobs}</JobsRowWrapper>
      {labels && labels.length > 0 && (
        <LabelsRowWrapper>{labels}</LabelsRowWrapper>
      )}
      <Footer>
        <Buttons>
          <PipelineStatus
            pipeline={pipeline}
            style={StatusStyle.boxed}
            tooltip={pipeline.status}
            url={pipeline.web_url}
          />
          <RerunButton pipeline={pipeline} groupName={props.groupName} />
        </Buttons>
        <TimeWrapper>
          <FontAwesomeIcon color="gray" icon="clock" className="mr-2" />
          <span>{calcuclateUptime(pipeline)} ago</span>
        </TimeWrapper>
      </Footer>
    </Wrapper>
  );
};

const Wrapper: any = styled.div`
  padding: 0 0.5em;
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1em;
  border-radius: 0.5em;
  padding: 0.5em;
  background: ${(props: any) =>
    props.backgroundColor ? props.backgroundColor : 'unset'};
  & > * {
    width: 100%;
  }
`;

const TitelWrapper = styled.div`
  display: flex;
  flex-flow: column;
  margin-right: 1em;
`;

const Buttons = styled.div`
  display: flex;
  flex-flow: row;
  gap: 1em;
`;

const Header = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;
`;

const Footer = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;
`;

const JobWrapper = styled.div`
  margin-bottom: 0.5em;
  display: flex;
  flex-flow: row;
  align-items: center;
`;

const JobsRowWrapper = styled.div`
  width: 100%;
  margin-bottom: 1em;
  min-height: 2.5em;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  margin: 0;
  padding-right: 3em;
`;

const LabelsRowWrapper = styled.div`
  width: 100%;
  margin-bottom: 1em;
  min-height: 2.5em;
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  margin: 0;
  gap: 0.5em;
`;

const ColoredBadged = styled(Badge)`
  background: ${(props: any) =>
    props.background
      ? `${props.background} !important`
      : 'var(--clr-blue-lighter)'};
  color: ${(props: any) => (props.color ? props.color : 'var(--clr-white)')};
`;

const TimeWrapper = styled.div`
  padding-right: 2em;
  white-space: nowrap;
  & > span {
    padding-left: 0.5em;
  }
`;

export default Pipeline;
