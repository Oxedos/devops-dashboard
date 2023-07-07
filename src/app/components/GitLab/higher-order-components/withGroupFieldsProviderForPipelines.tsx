import React from 'react';
import { useSelector } from 'react-redux';
import { FieldType } from 'app/components/visualisations/higher-order-components/WithWidgetConfigurationModal';
import { selectGroupNames } from 'app/data/gitLabSlice/selectors/groupSelectors';

type PropTypes = {
  id: string;
  group?: string;
};

const withGroupFieldsProviderForPipelines = (
  WrappedComponent: React.FC<any>,
) => {
  return (props: PropTypes) => {
    const availableGroups = [''].concat(useSelector(selectGroupNames));

    const fields: FieldType[] = [
      {
        name: 'group',
        label: 'Group',
        type: 'select',
        options: availableGroups,
      },
      {
        name: 'pipeline-status-hr',
        hr: true,
      },
      {
        name: 'compact',
        type: 'checkbox',
        label: 'Compact View',
      },
      {
        name: 'pipeline-status-hr',
        hr: true,
      },
      {
        name: 'pipeline-status-title',
        text: 'Select which status of pipelines should be shown',
      },
      {
        name: 'pipelines_failed',
        label: 'Failed',
        type: 'checkbox',
      },
      {
        name: 'pipelines_success',
        label: 'Succeeded',
        type: 'checkbox',
      },
      {
        name: 'pipelines_canceled',
        label: 'Canceled',
        type: 'checkbox',
      },
      {
        name: 'pipelines_running',
        label: 'Running',
        type: 'checkbox',
      },
      {
        name: 'pipelines_created',
        label: 'Created',
        type: 'checkbox',
      },
      {
        name: 'pipelines_manual',
        label: 'Manual',
        type: 'checkbox',
      },
      {
        name: 'pipeline-ref-hr',
        hr: true,
      },
      {
        name: 'pipeline-ref-title',
        text: 'Select which sources for pipelines should be displayed',
      },
      {
        name: 'displayPipelinesForBranches',
        label: 'Branches',
        type: 'checkbox',
      },
      {
        name: 'displayPipelinesForMRs',
        label: 'Merge Requests',
        type: 'checkbox',
      },
    ];

    return <WrappedComponent {...props} fields={fields} />;
  };
};

export default withGroupFieldsProviderForPipelines;
