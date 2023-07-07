import { VisualisationType } from 'app/data/VisualisationTypes';
import React from 'react';
import MrTableVisualisation from './GitLab/MrTableVisualisation';
import PipelineVisualisation from './GitLab/PipelineVisualisation';
import VulnerabilitesTable from './Whitesource/VulnerabilitesTable';
import RssFeedVisualisation from './RSS/RssFeedVisualisation';
import SimpleMessage from './components/SimpleMessage';
import EventsVisualisation from './GitLab/EventsVisualisation';
import IssuesTableVisualisation from '../GitLab/IssueTableVisualisation';

type PropTypes = {
  type: VisualisationType;
  id: string;
  props?: {
    [key: string]: any;
  };
};

const Visualisation: React.FC<PropTypes> = props => {
  const visulisationProps = {
    type: props.type,
    id: props.id,
    ...props.props,
  };
  switch (props.type) {
    case VisualisationType.GITLAB_MR_TABLE:
      return <MrTableVisualisation {...visulisationProps} />;
    case VisualisationType.GITLAB_PIPELINES_TABLE:
      return <PipelineVisualisation {...visulisationProps} />;
    case VisualisationType.WS_VULNERABILITIES_TABLE:
      return <VulnerabilitesTable {...visulisationProps} />;
    case VisualisationType.WS_VULNERABLE_SERVICES_TABLE:
      return (
        <VulnerabilitesTable {...visulisationProps} aggregation="project" />
      );
    case VisualisationType.WS_VULNERABLE_DEPENDENCIES_TABLE:
      return (
        <VulnerabilitesTable
          {...visulisationProps}
          aggregation="vulnerability"
        />
      );
    case VisualisationType.RSS_FEED_VISUALISATION:
      return <RssFeedVisualisation {...visulisationProps} />;
    case VisualisationType.GITLAB_EVENTS:
      return <EventsVisualisation {...visulisationProps} />;
    case VisualisationType.GITLAB_ISSUES:
      return <IssuesTableVisualisation {...visulisationProps} />;
    default:
      return (
        <SimpleMessage
          title="Unrecognized Visualisation ID"
          message={`Type ${props.type} not recognized`}
          {...visulisationProps}
        />
      );
  }
};

export default Visualisation;
