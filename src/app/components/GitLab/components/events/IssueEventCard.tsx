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

const IssueEventCard: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  const { event } = props;
  const eventIconProps: EventIconProps = {
    color: GlobalColours.green,
    icon: 'plus',
  };

  return (
    <BasicEventCard
      event={event}
      eventIconProps={eventIconProps}
      webUrl={buildWebUrl(gitLabUrl, event, `/issues/${event.target_iid}`)}
    >
      {event.author.name} {event.action_name} issue{' '}
      <EventCardHighlight>{event.target_title}</EventCardHighlight> in project{' '}
      <EventCardHighlight>{event.project?.name}</EventCardHighlight>
    </BasicEventCard>
  );
};

export default IssueEventCard;
