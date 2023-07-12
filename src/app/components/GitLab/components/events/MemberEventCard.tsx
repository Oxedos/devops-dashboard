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

const MemberEventCard: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color:
      event.action_name === 'left' ? GlobalColours.red : GlobalColours.green,
    icon: event.action_name === 'left' ? 'user-minus' : 'user-plus',
  };

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={buildWebUrl(gitLabUrl, event, `/project_members`)}
    >
      {event.author.name} {event.action_name}{' '}
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
    </BasicEventCard>
  );
};

export default MemberEventCard;
