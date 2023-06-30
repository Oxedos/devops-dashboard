import React from 'react';
import { useSelector } from 'react-redux';
import { FieldType } from 'app/components/visualisations/components/withWidgetConfigurationModal';
import { VisualisationType } from 'app/data/VisualisationTypes';
import { selectGroupNames } from 'app/data/gitLabSlice/selectors/groupSelectors';

type PropTypes = {
  id: string;
  group?: string;
  type: VisualisationType;
};

const withEventFieldsProvider = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const availableGroups = ['[All Groups]'].concat(
      useSelector(selectGroupNames),
    );

    const fields: FieldType[] = [
      {
        name: 'group',
        label: 'Group',
        type: 'select',
        options: availableGroups,
      },
    ];

    return <WrappedComponent {...props} fields={fields} />;
  };
};

export default withEventFieldsProvider;
