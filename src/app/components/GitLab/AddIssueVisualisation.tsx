import { selectProjectByNameWithNamespace } from 'app/data/gitLabSlice/selectors/projectSelectors';
import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
import VisualisationContainer from '../visualisations/VisualisationContainer';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';
import AddIssueForm from './components/AddIssueForm';
import withFieldsProviderForIssuesTable from './higher-order-components/withFieldsProviderForIssuesTable';
import withGitLabConfiguredCheck from './higher-order-components/withGitLabConfiguredCheck';

type OuterPropTypes = {
  id: string;
};

type innerPropTypes = {
  projectName: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
} & OuterPropTypes;

const AddIssueVisualisation: React.FC<innerPropTypes> = props => {
  const project = useSelector(state =>
    selectProjectByNameWithNamespace(state, {
      projectName: props.projectName,
    }),
  );

  return (
    <VisualisationContainer
      id={props.id}
      title={`Create Issue${
        project ? ` in ${project.name_with_namespace}` : ''
      }`}
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
    >
      <div className="m-3">
        <AddIssueForm project={project} />
      </div>
    </VisualisationContainer>
  );
};

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withFieldsProviderForIssuesTable,
  withWidgetConfigurationModal(),
)(AddIssueVisualisation);
