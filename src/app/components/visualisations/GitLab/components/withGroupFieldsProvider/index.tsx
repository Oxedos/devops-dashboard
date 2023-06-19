import React from 'react';
import { useSelector } from 'react-redux';
import { selectGroups } from 'app/data/gitLabSlice/selectors';
import { FieldType } from 'app/components/visualisations/components/withWidgetConfigurationModal';
import { VisualisationType } from 'app/data/VisualisationTypes';

type PropTypes = {
  id: string;
  group?: string;
  type: VisualisationType;
};

const withGroupFieldsProvider = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const availableGroups = ['[All Groups]']
      .concat(useSelector(selectGroups).map(group => group.full_name))
      .sort();

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

export default withGroupFieldsProvider;
