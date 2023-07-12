import React from 'react';
import { useSelector } from 'react-redux';
import { GitLabEvent } from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import { GlobalColours } from 'styles/global-styles';
import GitLabMarkdown from '../GitLabMarkdown';
import {
  BasicEventCard,
  EventCardExtraContent,
  EventCardHighlight,
  EventIconProps,
  buildWebUrl,
  getFriendlyTarget,
} from './EventCard';

type PropTypes = {
  event: GitLabEvent;
};

const getWebUrl = (event: GitLabEvent, gitLabUrl: string | undefined) => {
  if (!event) return buildWebUrl(gitLabUrl, event, undefined);
  if (!event.project) return buildWebUrl(gitLabUrl, event, undefined);
  if (!gitLabUrl) return buildWebUrl(gitLabUrl, event, undefined);
  if (!event.note) return buildWebUrl(gitLabUrl, event, undefined);
  switch (event.note.noteable_type) {
    case 'MergeRequest': {
      return buildWebUrl(
        gitLabUrl,
        event,
        `/merge_requests/${event.note?.noteable_iid}#note_${event.note?.id}`,
      );
    }
    case 'Commit': {
      return buildWebUrl(
        gitLabUrl,
        event,
        `/commit/${event.note.position?.head_sha}#note_${event.note?.id}`,
      );
    }
    default:
      return buildWebUrl(gitLabUrl, event, undefined);
  }
};

const getExtraTarget = (event: GitLabEvent) => {
  if (!event.note) return null;
  if (event.note.noteable_type === 'MergeRequest') {
    return ` ${event.target_title}`;
  }
  return null;
};

const CommentEventCard: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color: GlobalColours.white,
    icon: 'comment',
  };

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={getWebUrl(event, gitLabUrl)}
    >
      {event.author.name} commented on {getFriendlyTarget(event.target_type)} in{' '}
      {getFriendlyTarget(event.note?.noteable_type)}
      <EventCardHighlight>{getExtraTarget(event)}</EventCardHighlight> of
      project <EventCardHighlight>{event.project?.name}</EventCardHighlight>
      <EventCardExtraContent>
        <GitLabMarkdown project={event.project} content={event.note?.body} />
      </EventCardExtraContent>
    </BasicEventCard>
  );
};

export default CommentEventCard;
