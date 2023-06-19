import React, { ComponentType } from 'react';
import Metric from '../../components/Metric';
import { useSelector } from 'react-redux';
import {
  selectGroups,
  selectIssueStatistics,
  selectIssueStatisticsAll,
} from 'app/data/gitLabSlice/selectors';
import compose from 'app/components/compose';
import withGitLabConfiguredCheck from '../components/withGitLabConfiguredCheck';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';
import withGroupFieldsProvider from '../components/withGroupFieldsProvider';

type PropTypesAfterHoc = {
  id: string;
  group?: string;
};

type PropTypes = {
  onSettingsClick: Function; // HOC
} & PropTypesAfterHoc;

const IssueVisualisation: React.FC<PropTypes> = props => {
  const allIssueStats = useSelector(selectIssueStatisticsAll);
  const issueStatsByGroup = useSelector(selectIssueStatistics);
  const groups = useSelector(selectGroups);

  const groupName =
    props.group && props.group !== '[All Groups]' ? props.group : undefined;

  const issueStats = !groupName
    ? allIssueStats
    : issueStatsByGroup.get(groupName);

  const title = `Open Issues in ${groupName || 'all Groups'}`;

  const group = groups.find(g => g.full_name === groupName);
  const clickHandler = group
    ? () => window.open(`${group.web_url}/-/issues`)
    : undefined;

  return (
    <Metric
      onSettingsClick={props.onSettingsClick}
      onBodyClick={clickHandler}
      id={props.id}
      title={title}
      label="Open Issues"
      value={issueStats?.statistics?.counts?.opened || 0}
    />
  );
};

IssueVisualisation.defaultProps = {
  group: '[All Groups]',
};

export default compose<ComponentType<PropTypesAfterHoc>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(), // Takes fields from withGroupFieldsProvider
)(IssueVisualisation);
