import React, { memo } from 'react';
import { GitLabJob } from 'app/apis/gitlab/types';
import { useDispatch, useSelector } from 'react-redux';
import { gitLabActions } from 'app/data/gitLabSlice';
import { selectLoaders } from 'app/data/globalSlice/selectors';
import Status, { StatusStyle } from './Status';
import { GlobalColours } from 'styles/global-styles';

type PropTypes = {
  job: GitLabJob;
  groupName: string;
  mrIid: number;
  projectId: number;
};

const PlayButton: React.FC<PropTypes> = props => {
  const { job, groupName, mrIid, projectId } = props;
  const dispatch = useDispatch();
  const loadingIdToCheck = `[GitLab] playJob ${projectId} ${job.id}`;

  const loadingIds = useSelector(selectLoaders);
  const isLoading = loadingIds.includes(loadingIdToCheck);

  if (job.status !== 'manual') {
    return null;
  }

  const rerun = (e: MouseEvent) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      gitLabActions.playJob({
        groupName,
        projectId,
        jobId: job.id,
        mrIid,
      }),
    );
  };

  return (
    <Status
      icon={isLoading ? 'sync' : 'play'}
      tooltip="Play Job"
      style={StatusStyle.round}
      color={GlobalColours.white}
      background={GlobalColours.widget}
      onClick={rerun}
      spin={isLoading}
      disabled={isLoading}
    />
  );
};

export default memo(PlayButton);
