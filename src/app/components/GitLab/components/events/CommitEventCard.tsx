import React from 'react';
import { useSelector } from 'react-redux';
import { GitLabEvent } from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import { GlobalColours } from 'styles/global-styles';
import {
  BasicEventCard,
  EventCardExtraContent,
  EventCardHighlight,
  EventIconProps,
  buildWebUrl,
} from './EventCard';

type PropTypes = {
  event: GitLabEvent;
};

const CommitEventCard: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color: GlobalColours.white,
    icon: 'code-commit',
  };

  const commitCount = event.push_data?.commit_count || 0;

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={buildWebUrl(
        gitLabUrl,
        event,
        `/commit/${event.push_data?.commit_to}`,
      )}
    >
      {event.author.name} pushed {commitCount}{' '}
      {commitCount !== 1 ? 'commits' : 'commit'} to{' '}
      <EventCardHighlight>{event.push_data?.ref}</EventCardHighlight> in project{' '}
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
      <EventCardExtraContent>
        {event.push_data?.commit_title}
      </EventCardExtraContent>
    </BasicEventCard>
  );
};

export default CommitEventCard;
