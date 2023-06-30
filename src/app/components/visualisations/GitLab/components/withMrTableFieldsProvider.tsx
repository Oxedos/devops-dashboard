import React from 'react';
import { useSelector } from 'react-redux';
import { FieldType } from 'app/components/visualisations/components/withWidgetConfigurationModal';
import { VisualisationType } from 'app/data/VisualisationTypes';
import { selectGroupNames } from 'app/data/gitLabSlice/groupSelectors';

type PropTypes = {
  id: string;
  group?: string;
  type: VisualisationType;
};

const withGroupFieldsProvider = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const availableGroups = ['[All Groups]'].concat(
      useSelector(selectGroupNames),
    );

    const fields: FieldType[] = [
      {
        name: 'source-text',
        text: 'You can choose between displaying Merge Requests from a group, or all Merge Requests that are assigned to you',
      },
      {
        name: 'space1',
        space: true,
      },
      {
        name: 'group',
        label: 'Group',
        type: 'select',
        options: availableGroups,
      },
      {
        name: 'hr-1',
        hr: 'or',
      },
      {
        name: 'assignedToUserOnly',
        label: 'Merge Requests assigned to you',
        type: 'checkbox',
        disables: 'group',
        radioGroup: 'source',
      },
      {
        name: 'userAsReviewer',
        label: 'Merge Requests you are reviewing',
        type: 'checkbox',
        disables: 'group',
        radioGroup: 'source',
      },
      {
        name: 'hr-2',
        hr: true,
      },
      {
        name: 'space2',
        space: true,
      },
      {
        name: 'includeWIP',
        label: 'Include WIP / Draft MRs',
        type: 'checkbox',
      },
    ];

    return <WrappedComponent {...props} fields={fields} />;
  };
};

export default withGroupFieldsProvider;
