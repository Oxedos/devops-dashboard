import React from 'react';
import { useSelector } from 'react-redux';
import { FieldType } from 'app/components/visualisations/higher-order-components/WithWidgetConfigurationModal';
import { selectProjects } from 'app/data/gitLabSlice/selectors/projectSelectors';

type PropTypes = {
  id: string;
  group?: string;
};

const withFieldsProviderForIssuesTable = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const availableProjects = useSelector(selectProjects).map(
      project => project.name_with_namespace,
    );

    const fields: FieldType[] = [
      {
        name: 'projectName',
        label: 'Project',
        type: 'select',
        options: availableProjects,
      },
    ];

    return <WrappedComponent {...props} fields={fields} />;
  };
};

export default withFieldsProviderForIssuesTable;
