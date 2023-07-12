import React from 'react';
import { GitLabEvent } from 'app/apis/gitlab/types';
import { GlobalColours } from 'styles/global-styles';
import {
  BasicEventCard,
  EventCardHighlight,
  EventIconProps,
} from './EventCard';

type PropTypes = {
  event: GitLabEvent;
};

const ProjectEventCard: React.FC<PropTypes> = props => {
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color: GlobalColours.green,
    icon: 'plus',
  };

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={event.project?.web_url}
    >
      {event.author.name} {event.action_name}{' '}
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
    </BasicEventCard>
  );
};

export default ProjectEventCard;
