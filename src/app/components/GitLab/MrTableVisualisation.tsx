import {
  IconDefinition,
  findIconDefinition,
} from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from '@reduxjs/toolkit';
import {
  GitLabMR,
  GitLabPipeline,
  GitLabUserReference,
} from 'app/apis/gitlab/types';
import GitLabUser from 'app/components/GitLab/components/GitLabUser';
import MrMergeStatus from 'app/components/GitLab/components/MrMergeStatus';
import {
  PipelineStatus,
  StatusStyle,
} from 'app/components/GitLab/components/Status';
import { selectMrsFiltered } from 'app/data/gitLabSlice/selectors/mrSelectors';
import { selectPipelines } from 'app/data/gitLabSlice/selectors/pipelineSelectors';
import React, { ComponentType, MouseEvent } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import { GlobalColours } from 'styles/global-styles';
import SimpleMessage from '../visualisations/SimpleMessageVisualisation';
import VisualisationContainer from '../visualisations/VisualisationContainer';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';
import withGitLabConfiguredCheck from './higher-order-components/withGitLabConfiguredCheck';
import withMrTableFieldsProvider from './higher-order-components/withMrTableFieldsProvider';
import LabelRow from './components/LabelRow';

type OuterPropTypes = {
  id: string;
};

type innerPropTypes = {
  group?: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
  mrs: GitLabMR[];
  pipelines?: GitLabPipeline[];
  assignedToUserOnly?: boolean;
  userAsReviewer?: boolean;
  includeWIP?: boolean;
} & OuterPropTypes;

const isApproved = (
  mr: GitLabMR,
  reviewer: GitLabUserReference | undefined,
) => {
  if (!reviewer) return;
  if (!mr || !mr.approvalState) return;
  for (let approvalRule of mr.approvalState.rules) {
    if (!approvalRule.approved) continue;
    if (!approvalRule.approved_by || approvalRule.approved_by.length <= 0)
      continue;
    const approvedByIds = approvalRule.approved_by.map(approver => approver.id);
    if (approvedByIds.includes(reviewer.id)) return true;
  }
  return false;
};

const MrTableVisualisation: React.FC<innerPropTypes> = props => {
  const mrs = useSelector(state =>
    selectMrsFiltered(state, {
      groupName: props.group,
      includeReady: true,
      includeWIP: props.includeWIP,
      assignedToUserOnly: props.assignedToUserOnly,
      userAsReviewer: props.userAsReviewer,
    }),
  );

  const pipelines = useSelector(selectPipelines);

  let title = 'Merge Requests';
  let message = 'No Merge Requests to display';
  if (props.userAsReviewer) {
    title = 'Reviewing MRs';
    message = 'No reviews requested from you';
  } else if (props.assignedToUserOnly) {
    title = 'MRs assigned to you';
    message = 'No Merge Requests assigned to you';
  } else if (props.group) {
    title = `MRs in ${props.group}`;
    message = `No Merge Requests in ${props.group}`;
  }

  if (mrs.length <= 0) {
    return (
      <SimpleMessage
        id={props.id}
        title={title}
        onSettingsClick={props.onSettingsClick}
        message={message}
      />
    );
  }

  const rowClick = (e: MouseEvent, mr: GitLabMR) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(mr.web_url);
  };

  const pipelineLookup: any = { prefix: 'custom', iconName: 'pipeline' };
  const pipelineIcon: IconDefinition = findIconDefinition(pipelineLookup);

  return (
    <VisualisationContainer
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
      id={props.id}
      title={title}
    >
      <Container>
        <Row className="header">
          <NameCol>
            <strong>Project</strong>
          </NameCol>
          <TitleCol>
            <strong>Title</strong>
          </TitleCol>
          <StatusCol>
            <Col>
              <OverlayTrigger
                placement="left"
                overlay={overlayProps => (
                  <Tooltip id="pipeline-status" {...overlayProps}>
                    Pipeline Status
                  </Tooltip>
                )}
              >
                <FontAwesomeIcon icon={pipelineIcon} />
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger
                placement="left"
                overlay={overlayProps => (
                  <Tooltip id="assignee" {...overlayProps}>
                    Assignee
                  </Tooltip>
                )}
              >
                <FontAwesomeIcon icon="user-gear" />
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger
                placement="left"
                overlay={overlayProps => (
                  <Tooltip id="reviewer" {...overlayProps}>
                    Reviewer
                  </Tooltip>
                )}
              >
                <div>
                  <FontAwesomeIcon icon="magnifying-glass" />
                  <FontAwesomeIcon icon="user" />
                </div>
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger
                placement="left"
                overlay={overlayProps => (
                  <Tooltip id="reviewer" {...overlayProps}>
                    Merge Status
                  </Tooltip>
                )}
              >
                <FontAwesomeIcon icon="code-merge" />
              </OverlayTrigger>
            </Col>
          </StatusCol>
        </Row>
        {mrs.map(mr => {
          const pipeline =
            pipelines &&
            pipelines.find(pipeline => pipeline.ref.includes(`${mr.iid}`));
          return (
            <Row key={mr.id} onClick={e => rowClick(e, mr)}>
              <NameCol>
                {/* my-group/my-subgroup/my-project!123 */}
                {mr.references.full.split('!')[0].split('/').slice(-1)}
              </NameCol>
              <TitleCol>
                {mr.title}
                <LabelRow labels={mr.labels} hideIcon small />
              </TitleCol>
              <StatusCol>
                <Col>
                  {pipeline && (
                    <PipelineStatus
                      pipeline={pipeline}
                      simple
                      tooltip={pipeline?.status || 'unkown'}
                      url={pipeline?.web_url || undefined}
                      style={StatusStyle.boxed}
                    />
                  )}
                </Col>
                <Col>
                  <GitLabUser user={mr.assignee} imgOnly />
                </Col>
                <Col>
                  {mr.reviewers && (
                    <GitLabUser
                      user={mr.reviewers[0]}
                      imgOnly
                      iconProps={
                        isApproved(mr, mr.reviewers[0])
                          ? {
                              color: GlobalColours.green,
                              icon: 'thumbs-up',
                            }
                          : undefined
                      }
                    />
                  )}
                </Col>
                <Col>
                  <MrMergeStatus mr={mr} />
                </Col>
              </StatusCol>
            </Row>
          );
        })}
      </Container>
    </VisualisationContainer>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  padding: 0.5em;
  gap: 1em;
  cursor: pointer;

  &.header {
    padding-bottom: 0.5em;
    border-bottom: 1px solid var(--clr-dark-gray);
    cursor: unset;
  }
  &.header:hover {
    background: unset !important;
  }
  &:hover {
    background: color-mix(in oklab, var(--clr-widget) 90%, black) !important;
  }
  &:nth-child(even) {
    background: color-mix(in oklab, var(--clr-widget) 95%, black);
  }
`;

const Col = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-around;
  min-width: 3em;
  max-width: 3em;
  width: 3em;
`;

const NameCol = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  max-width: 12em;
  width: clamp(4em, 10em, 12em);
  min-width: 4em;
  overflow: hidden;
  white-space: nowrap;
`;

const TitleCol = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: start;
  justify-content: flex-start;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusCol = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-around;
  width: 15em;
  min-width: 15em;
`;

MrTableVisualisation.defaultProps = {
  group: '[All Groups]',
};

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withMrTableFieldsProvider,
  withWidgetConfigurationModal(), // takes fields from withGroupFieldsProvider,
)(MrTableVisualisation);
