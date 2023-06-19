import React, { ComponentType } from 'react';
import Metric from '../../components/Metric';
import { useSelector } from 'react-redux';
import { selectGroups } from 'app/data/gitLabSlice/selectors';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from '../components/withGitLabConfiguredCheck';
import { GitLabMR } from 'app/apis/gitlab/types';
import withMrLoadingByGroup from '../components/withMrLoadingByGroup';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';
import withGroupFieldsProvider from '../components/withGroupFieldsProvider';

type PropTypesNoHoc = {
  id: string;
  group?: string;
};

type PropTypes = {
  onSettingsClick: Function;
  mrs: GitLabMR[];
} & PropTypesNoHoc;

const MergeRequestVisualisation: React.FC<PropTypes> = props => {
  const groups = useSelector(selectGroups);
  const title = `Open MRs in ${props.group}`;

  const group = groups.find(g => g.full_name === props.group);
  const clickHandler = group
    ? () => window.open(`${group.web_url}/-/merge_requests`)
    : undefined;

  return (
    <Metric
      onSettingsClick={props.onSettingsClick}
      onBodyClick={clickHandler}
      id={props.id}
      title={title}
      label="Open MRs"
      value={props.mrs.length}
    />
  );
};

MergeRequestVisualisation.defaultProps = {
  group: '[All Groups]',
};

export default compose<ComponentType<PropTypesNoHoc>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(),
  withMrLoadingByGroup,
)(MergeRequestVisualisation);
