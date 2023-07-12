import React from 'react';
import { useSelector } from 'react-redux';
import { GitLabEvent } from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import { GlobalColours } from 'styles/global-styles';
import {
  BasicEventCard,
  EventCardHighlight,
  EventIconProps,
  buildWebUrl,
} from './EventCard';

type PropTypes = {
  event: GitLabEvent;
};

const getColor = (action: string) => {
  switch (action) {
    case 'opened':
      return GlobalColours.white;
    case 'closed':
      return GlobalColours.red;
    case 'accepted':
      return GlobalColours.green;
    default:
      return GlobalColours.white;
  }
};

const MergeRequestEventCard: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color: getColor(event.action_name),
    icon: 'code-pull-request',
  };

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={buildWebUrl(
        gitLabUrl,
        event,
        `/merge_requests/${event.target_iid}`,
      )}
    >
      {event.author.name} {event.action_name} merge request{' '}
      <EventCardHighlight>{event.target_title}</EventCardHighlight> in project{' '}
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
    </BasicEventCard>
  );
};

export default MergeRequestEventCard;
