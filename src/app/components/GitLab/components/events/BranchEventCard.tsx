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

const BranchEventCard: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color:
      event.action_name === 'deleted' ? GlobalColours.red : GlobalColours.white,
    icon: 'code-branch',
  };

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={buildWebUrl(gitLabUrl, event, `/tree/${event.push_data?.ref}`)}
    >
      {event.author.name} {event.action_name} branch{' '}
      <EventCardHighlight>{event.push_data?.ref}</EventCardHighlight>{' '}
      {event.action_name === 'deleted' ? 'in' : 'to'} project{' '}
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
    </BasicEventCard>
  );
};

export default BranchEventCard;
