import { gitLabActions } from 'app';
import { loadPipelineForMr, playJob as playJobApi } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import { GitLabJob } from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import React, { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlobalColours } from 'styles/global-styles';
import Status, { StatusStyle } from '../Status';

type PropTypes = {
  job: GitLabJob;
  mrIid: number;
  projectId: number;
};

const PlayButton: React.FC<PropTypes> = props => {
  const { job, mrIid, projectId } = props;
  const dispatch = useDispatch();
  const gitLabUrl = useSelector(selectUrl);
  const [isLoading, setLoading] = useState(false);

  if (job.status !== 'manual') {
    return null;
  }

  const rerun = async (e: MouseEvent) => {
    if (!gitLabUrl) return;
    if (isLoading) return;
    setLoading(true);
    e.preventDefault();
    e.stopPropagation();
    try {
      await playJobApi(gitLabUrl, projectId, job.id);
      const pipelineResponse = await loadPipelineForMr(
        gitLabUrl,
        projectId,
        mrIid,
      );
      dispatch(gitLabActions.updatePipeline({ pipeline: pipelineResponse }));
    } catch (error) {
      displayGitLabErrorNotification(error, dispatch);
    } finally {
      setLoading(false);
    }
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
