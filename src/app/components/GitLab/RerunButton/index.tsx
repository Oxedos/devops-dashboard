import React, { memo } from 'react';
import { GitLabPipeline } from 'app/apis/gitlab/types';
import { useDispatch, useSelector } from 'react-redux';
import { gitLabActions } from 'app';
import { selectLoaders } from 'app/data/globalSlice/selectors';
import Status, { StatusStyle } from '../Status';
import { GlobalColours } from 'styles/global-styles';

type PropTypes = {
  pipeline: GitLabPipeline;
  groupName: string;
};

const RerunButton: React.FC<PropTypes> = props => {
  const { pipeline, groupName } = props;
  const dispatch = useDispatch();
  const loadingIdToCheck = `[GitLab] rerunPipelines ${pipeline.project_id} ${pipeline.ref}`;
  const loadingIds = useSelector(selectLoaders);
  const isLoading = loadingIds.includes(loadingIdToCheck);

  if (
    pipeline.status !== 'failed' &&
    pipeline.status !== 'canceled' &&
    pipeline.status !== 'success'
  ) {
    return null;
  }

  const rerun = () => {
    if (isLoading) return;
    dispatch(
      gitLabActions.reloadPipeline({
        groupName: groupName,
        projectId: pipeline.project_id,
        ref: pipeline.ref,
      }),
    );
  };

  return (
    <Status
      icon="sync"
      tooltip="Rerun Pipeline"
      style={StatusStyle.round}
      color={GlobalColours.white}
      background={GlobalColours.widget}
      onClick={rerun}
      spin={isLoading}
    />
  );
};

export default memo(RerunButton);
