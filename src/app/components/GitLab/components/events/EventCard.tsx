import React from 'react';
import styled from 'styled-components';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { GitLabEvent } from 'app/apis/gitlab/types';
import GitLabUser from '../GitLabUser';
import RelativeTime from '../RelativeTimestamp';
import BranchEventCard from './BranchEventCard';
import CommentEventCard from './CommentEventCard';
import CommitEventCard from './CommitEventCard';
import FallbackEventCard from './FallbackEventCard';
import IssueEventCard from './IssueEventCard';
import MemberEventCard from './MemberEventCard';
import MergeRequestEventCard from './MergeRequestEventCard';
import ProjectEventCard from './ProjectEventCard';

export type EventIconProps = {
  icon: IconProp;
  color: string;
};

type PropTypes = {
  event: GitLabEvent;
  eventIconProps: EventIconProps;
  webUrl?: string;
  children?: React.ReactNode;
};

export const buildWebUrl = (
  gitLabUrl: string | undefined,
  event: GitLabEvent,
  path: string | undefined,
) => {
  if (!gitLabUrl) return undefined;
  if (!event.project) return undefined;
  if (!path) {
    return event.project.web_url;
  }
  const basePath = `/${event.project.path_with_namespace}/-`;
  return new URL(`${basePath}${path}`, gitLabUrl).toString();
};

export const getFriendlyTarget = (targetType: string | undefined) => {
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

export const BasicEventCard: React.FC<PropTypes> = props => {
  const { event, eventIconProps, children, webUrl } = props;
  return (
    <CardWrapper
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        window.open(webUrl);
      }}
    >
      <div className="header-row">
        <GitLabUser user={event.author} imgOnly iconProps={eventIconProps} />
        <RelativeTime timestamp={event.created_at} />
      </div>
      <div className="container">{children}</div>
    </CardWrapper>
  );
};

export const EventCardExtraContent = styled.div`
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
`;

export const EventCardHighlight = styled.div`
  display: inline;
  color: var(--clr-gray);
`;

const CardWrapper = styled.div`
  display: flex;
  flex-flow: column;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5em 1em;
  border-radius: 0.5em;
  color: var(--clr-white);
  overflow-wrap: anywhere;
  cursor: pointer;

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

type EventCardPropTypes = {
  event: GitLabEvent;
};

const EventCard: React.FC<EventCardPropTypes> = props => {
  const { event } = props;
  if (!event) {
    return null;
  }
  if (event.action_name === 'commented on') {
    return <CommentEventCard event={event} />;
  }
  if (
    event.action_name === 'pushed to' &&
    event.push_data?.ref_type === 'branch'
  ) {
    return <CommitEventCard event={event} />;
  }
  if (
    (event.action_name === 'pushed new' ||
      event.action_name === 'created' ||
      event.action_name === 'deleted') &&
    event.push_data?.ref_type === 'branch'
  ) {
    return <BranchEventCard event={event} />;
  }
  if (event.target_type === 'MergeRequest') {
    return <MergeRequestEventCard event={event} />;
  }
  if (event.target_type === 'Issue') {
    return <IssueEventCard event={event} />;
  }
  if (event.action_name === 'joined' || event.action_name === 'left') {
    return <MemberEventCard event={event} />;
  }
  if (event.action_name === 'created' && !event.target_type) {
    return <ProjectEventCard event={event} />;
  }
  return <FallbackEventCard event={event} />;
};

export default EventCard;
