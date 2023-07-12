import React from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { GitLabEvent } from 'app/apis/gitlab/types';
import { GlobalColours } from 'styles/global-styles';
import { BasicEventCard, EventCardHighlight } from './EventCard';

type PropTypes = {
  event: GitLabEvent;
};

const getIcon = (event: GitLabEvent): { color: string; icon: IconProp } => {
  const actionName = event.action_name;
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

const FallbackEventCard: React.FC<PropTypes> = props => {
  const { event } = props;

  return (
    <BasicEventCard
      event={event}
      eventIconProps={getIcon(event)}
      webUrl={event.project?.web_url}
    >
      {event.author.name} {event.action_name} {event.target_type} in
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
    </BasicEventCard>
  );
};

export default FallbackEventCard;
