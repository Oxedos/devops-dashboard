import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { compose } from '@reduxjs/toolkit';
import { GitLabEvent } from 'app/apis/gitlab/types';
import GitLabMarkdown from 'app/components/GitLab/components/GitLabMarkdown';
import GitLabUser from 'app/components/GitLab/components/GitLabUser';
import RelativeTime from 'app/components/GitLab/components/RelativeTimestamp';
import { selectEventsByGroup } from 'app/data/gitLabSlice/selectors/eventSelectors';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import { GlobalColours } from 'styles/global-styles';
import SimpleMessage from '../visualisations/SimpleMessageVisualisation';
import VisualisationContainer from '../visualisations/VisualisationContainer';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';
import withGroupFieldsProvider from './higher-order-components/withEventFieldsProvider';
import withGitLabConfiguredCheck from './higher-order-components/withGitLabConfiguredCheck';

type OuterPropTypes = {
  id: string;
};

type InnerPropTypes = {
  group: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
} & OuterPropTypes;

const getWebUrl = (event: GitLabEvent, gitLabUrl: string | undefined) => {
  if (!event.project) return;
  if (!gitLabUrl) {
    return event.project.web_url;
  }
  const actionName = event.action_name;
  const targetType = event.target_type || event.push_data?.ref_type;
  const basePath = `/${event.project.path_with_namespace}/-`;
  if (targetType === 'MergeRequest') {
    return new URL(
      `${basePath}/merge_requests/${event.target_iid}`,
      gitLabUrl,
    ).toString();
  }
  if (targetType === 'Issue') {
    return new URL(
      `${basePath}/issues/${event.target_iid}`,
      gitLabUrl,
    ).toString();
  }
  if (targetType === 'branch' && actionName === 'pushed new') {
    return new URL(
      `${basePath}/tree/${event.push_data?.ref}`,
      gitLabUrl,
    ).toString();
  }
  if (targetType === 'branch' && actionName === 'pushed to') {
    return new URL(
      `${basePath}/commit/${event.push_data?.commit_to}`,
      gitLabUrl,
    ).toString();
  }
  if (actionName === 'joined') {
    return new URL(
      `${basePath}/project_members?search=${event.author.name}`,
      gitLabUrl,
    ).toString();
  }
  if (
    actionName === 'commented on' &&
    event.note?.noteable_type === 'MergeRequest'
  ) {
    return new URL(
      `${basePath}/merge_requests/${event.note?.noteable_iid}#note_${event.note?.id}`,
      gitLabUrl,
    ).toString();
  }
  return event.project.web_url;
};

const getAdditionalInfo = (event: GitLabEvent) => {
  if (!event) return;
  // commit push
  if (
    event.action_name === 'pushed to' &&
    event.push_data &&
    event.push_data.commit_title
  ) {
    return event.push_data.commit_title;
  }
  // new branch
  if (
    (event.action_name === 'created' || event.action_name === 'pushed new') &&
    event.push_data &&
    event.push_data.ref_type === 'branch' &&
    event.push_data.ref
  ) {
    return undefined;
  }
  if (event.action_name === 'opened' && event.target_type === 'Issue') {
    return event.target_title;
  }
  if (event.note && event.note.body) {
    return event.note.body;
  }
};

const getFriendlyTarget = (event: GitLabEvent) => {
  const targetType = event.target_type || event.push_data?.ref_type;
  switch (targetType) {
    case 'DiffNote':
    case 'DiscussionNote':
    case 'Note':
      return `${getFriendlyTargetRaw(targetType)} in ${getFriendlyTargetRaw(
        event.note?.noteable_type,
      )}`;
    default:
      return getFriendlyTargetRaw(targetType);
  }
};

const getFriendlyTargetRaw = (targetType: string | undefined) => {
  // Possibly a problem -> any other events without a targetType?
  if (!targetType) return 'project';
  switch (targetType) {
    case 'MergeRequest':
      return 'merge request';
    case 'DiscussionNote':
      return 'discussion';
    case 'DiffNote':
      return 'code changes';
    case 'Note':
      return 'note';
    case 'Issue':
      return 'issue';
    default:
      return targetType;
  }
};

const getIcon = (
  actionName: string,
  target: string | undefined,
): { color: string; icon: IconProp } => {
  // Merge Requests
  if (actionName === 'opened' && target === 'MergeRequest') {
    return { color: GlobalColours.white, icon: 'code-pull-request' };
  }
  if (actionName === 'closed' && target === 'MergeRequest') {
    return { color: GlobalColours.red, icon: 'code-pull-request' };
  }
  if (actionName === 'accepted' && target === 'MergeRequest') {
    return { color: GlobalColours.green, icon: 'code-pull-request' };
  }

  // Branches
  if (actionName === 'pushed to' && target === 'branch') {
    return { color: GlobalColours.white, icon: 'code-commit' };
  }
  if (actionName === 'pushed new' && target === 'branch') {
    return { color: GlobalColours.white, icon: 'code-branch' };
  }
  if (actionName === 'deleted' && target === 'branch') {
    return { color: GlobalColours.red, icon: 'code-branch' };
  }

  // General
  if (actionName === 'joined') {
    return { color: GlobalColours.green, icon: 'user-plus' };
  }
  if (actionName === 'deleted') {
    return { color: GlobalColours.red, icon: 'trash' };
  }
  if (actionName === 'accepted') {
    return { color: GlobalColours.green, icon: 'check' };
  }
  if (actionName === 'approved') {
    return { color: GlobalColours.green, icon: 'check' };
  }
  if (actionName === 'commented on') {
    return { color: GlobalColours.white, icon: 'comment' };
  }
  if (actionName === 'created') {
    return { color: GlobalColours.green, icon: 'plus' };
  }
  if (actionName === 'opened') {
    return { color: GlobalColours.green, icon: 'plus' };
  }
  if (actionName === 'left') {
    return { color: GlobalColours.red, icon: 'user-minus' };
  }

  // Fallback
  return { color: GlobalColours.gray, icon: 'circle' };
};

const getProjectDescription = (event: GitLabEvent) => {
  const project = event.project?.name;
  if (!project) return undefined;
  if (event.target_title)
    return (
      <>
        in <div className="gray">{project}</div>
      </>
    );
  if (
    (event.action_name === 'created' ||
      event.action_name === 'joined' ||
      event.action_name === 'left') &&
    !event.target_type
  ) {
    return (
      <>
        <div className="gray">{project}</div>
      </>
    );
  }
  return (
    <>
      <div className="gray">{project} / </div>
    </>
  );
};

const EventsVisualisation: React.FC<InnerPropTypes> = props => {
  const events = useSelector(state =>
    selectEventsByGroup(state, { groupName: props.group, maxCount: 15 }),
  );
  const gitLabUrl = useSelector(selectUrl);

  if (!props.group) {
    return (
      <SimpleMessage
        id={props.id}
        title="Events Widget"
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        message="No Group Selected. Please use the setting menu to select one"
      />
    );
  }

  return (
    <VisualisationContainer
      id={props.id}
      title={`Events in ${props.group}`}
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
    >
      <Wrapper>
        {events.map(event => {
          if (!event) {
            return null;
          }
          const iconProps = getIcon(
            event.action_name,
            event.target_type || event.push_data?.ref_type,
          );
          const actionDescription = `${event.author.name} ${
            event.action_name
          } ${getFriendlyTarget(event)} `;
          const eventTarget =
            event.push_data?.ref || event.push_data?.commit_title;
          const additionalInfo = getAdditionalInfo(event);
          const webUrl = getWebUrl(event, gitLabUrl);
          const card = (
            <CardWrapper key={`eventCard ${event.id}`}>
              <div className="header-row">
                <GitLabUser user={event.author} imgOnly iconProps={iconProps} />
                <RelativeTime timestamp={event.created_at} />
              </div>
              <div className="container">
                {actionDescription}
                {getProjectDescription(event)}
                <div className="gray">{eventTarget}</div>
                {additionalInfo && (
                  <div className="extra-content">
                    <GitLabMarkdown
                      project={event.project}
                      content={additionalInfo}
                    />
                  </div>
                )}
              </div>
            </CardWrapper>
          );
          if (webUrl) {
            return (
              <UnstyledA
                key={`eventCard ${event.id} a`}
                href={webUrl}
                target="_blank"
                rel="noreferrer"
              >
                {card}
              </UnstyledA>
            );
          }
          return card;
        })}
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
`;

const UnstyledA = styled.a`
  color: inherit;
  text-decoration: inherit;
  &:hover {
    color: inherit;
  }
`;

const CardWrapper = styled.div`
  display: flex;
  flex-flow: column;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5em 1em;
  border-radius: 0.5em;
  color: var(--clr-white);
  overflow-wrap: anywhere;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  .header-row {
    width: 100%;
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: space-between;
    padding: 1em 1em 0 1em;
  }

  .container {
    display: flex;
    flex-flow: column;
    padding: 1em;
    display: inline;
    width: 100%;
  }

  .gray {
    display: inline !important;
    color: var(--clr-gray);
  }

  .extra-content {
    color: var(--clr-gray);
    white-space: pre-line;
    margin-top: 0.5em;
    margin-left: 0.5em;
    padding-left: 1em;
    border-left: 3px solid rgba(0, 0, 0, 0.3);
    img {
      max-width: 100%;
      object-fit: contain;
    }
  }
`;

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(),
)(EventsVisualisation);
