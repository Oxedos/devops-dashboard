import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import {
  selectUrl,
  selectVulnerabilities,
} from 'app/data/whitesourceSlice/selectors';
import { compose } from '@reduxjs/toolkit';
import withWhitesourceConfiguredCheck from './higher-order-components/WithWhitesourceConfiguredCheck';
import {
  WhitesourceVulnerability,
  WhitesourceVulnerabilitySeverity,
} from 'app/apis/whitesource/types';
import SimpleMessage from '../visualisations/SimpleMessageVisualisation';
import Badge from 'react-bootstrap/Badge';
import TableVisualisation from '../visualisations/TableVisualisation';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';

type OuterPropTypes = {
  id: string;
  aggregation?: 'project' | 'vulnerability';
};

type InnerPropTypes = {
  onSettingsClick: Function;
} & OuterPropTypes;

const getWebUrl = (whitesourceUrl: string) => {
  const parser = document.createElement('a');
  parser.href = whitesourceUrl;
  return `${parser.protocol}//${parser.host}`;
};

const severityToVariant = (severity: string) => {
  switch (severity) {
    case WhitesourceVulnerabilitySeverity.high:
      return 'danger';
    case WhitesourceVulnerabilitySeverity.medium:
      return 'warning';
    case WhitesourceVulnerabilitySeverity.low:
      return 'info';
    default:
      return 'danger';
  }
};

const severityToNumber = (severity: string) => {
  switch (severity) {
    case WhitesourceVulnerabilitySeverity.high:
      return 3;
    case WhitesourceVulnerabilitySeverity.medium:
      return 2;
    case WhitesourceVulnerabilitySeverity.low:
      return 1;
    default:
      return 0;
  }
};

const getHighestSeverity = (vuls: WhitesourceVulnerability[]) => {
  let highest = 0;
  let highestAsString = 'info';
  for (let vul of vuls) {
    const severityNumber = severityToNumber(vul.severity);
    if (severityNumber > highest) {
      highest = severityNumber;
      highestAsString = vul.severity;
    }
  }
  return highestAsString;
};

function getVulnerabilitesRows(
  vuls: WhitesourceVulnerability[],
  whitesourceUrl: string,
) {
  const header = ['Project', 'Name', 'Severity', 'Library'];

  const values = vuls.map(vul => ({
    project: vul.project,
    name: vul.name,
    severity: (
      <h5>
        <Badge bg={severityToVariant(vul.severity)}>{vul.severity}</Badge>
      </h5>
    ),
    library: vul.library.name,
    clickHandler: () => window.open(getWebUrl(whitesourceUrl)),
  }));
  return { header, values };
}

function getVulnerabilitesPerProject(
  vuls: WhitesourceVulnerability[],
  whitesourceUrl: string,
) {
  const header = ['Project', 'Count', 'Highest Severity'];

  const vulnerableProjects = [...new Set(vuls.map(vul => vul.project))];
  const values = vulnerableProjects.map(project => {
    const vulsForProject = vuls.filter(vul => vul.project === project);
    const highestSeverity = getHighestSeverity(vulsForProject);
    return {
      project,
      count: vulsForProject.length,
      highestSeverity: (
        <h5>
          <Badge bg={severityToVariant(highestSeverity)}>
            {highestSeverity}
          </Badge>
        </h5>
      ),
      clickHandler: () => window.open(getWebUrl(whitesourceUrl)),
    };
  });
  return { header, values };
}

function getUniqueVulnerabilities(
  vuls: WhitesourceVulnerability[],
  whitesourceUrl: string,
) {
  const header = ['Name', 'Library', 'Affected Projects', 'Severity'];

  const uniqueVulnerabilities = [...new Set(vuls.map(vul => vul.name))];

  const values = uniqueVulnerabilities.map(name => {
    const projectsForVulnerability = vuls.filter(vul => vul.name === name);
    const severity = projectsForVulnerability[0].severity;
    const library = projectsForVulnerability[0].library.name;
    return {
      name,
      library,
      affectedProjects: projectsForVulnerability.length,
      severity: (
        <h5>
          <Badge bg={severityToVariant(severity)}>{severity}</Badge>
        </h5>
      ),
      clickHandler: () => window.open(getWebUrl(whitesourceUrl)),
    };
  });
  return { header, values };
}

const VulnerabilitiesTable: React.FC<InnerPropTypes> = props => {
  const vulnerabilities = useSelector(selectVulnerabilities) || [];
  const url = useSelector(selectUrl);
  let visProps;
  let title;
  if (!props.aggregation) {
    title = 'Vulnerabilties';
    visProps = getVulnerabilitesRows(vulnerabilities, url || '');
  } else if (props.aggregation === 'project') {
    title = 'Vulnerable Projects';
    visProps = getVulnerabilitesPerProject(vulnerabilities, url || '');
  } else {
    title = 'Vulnerable Dependencies';
    visProps = getUniqueVulnerabilities(vulnerabilities, url || '');
  }

  let error = '';
  if (visProps.values.length <= 0) {
    error = 'No Vulnerabilties found';
  }

  let component;

  if (error) {
    component = (
      <SimpleMessage
        onSettingsClick={props.onSettingsClick}
        id={props.id}
        title={title}
        message={error}
      />
    );
  } else {
    component = (
      <TableVisualisation
        onSettingsClick={props.onSettingsClick}
        hover
        id={props.id}
        title={title}
        {...visProps}
      />
    );
  }

  return <>{component}</>;
};

export default compose<ComponentType<OuterPropTypes>>(
  withWhitesourceConfiguredCheck,
  withWidgetConfigurationModal(),
)(VulnerabilitiesTable);
