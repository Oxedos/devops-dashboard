import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import { compose } from '@reduxjs/toolkit';
import { selectEventsByGroup } from 'app/data/gitLabSlice/selectors/eventSelectors';
import SimpleMessage from '../visualisations/SimpleMessageVisualisation';
import VisualisationContainer from '../visualisations/VisualisationContainer';
import withWidgetConfigurationModal from '../visualisations/higher-order-components/WithWidgetConfigurationModal';
import EventCard from './components/events/EventCard';
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

const EventsVisualisation: React.FC<InnerPropTypes> = props => {
  const events = useSelector(state =>
    selectEventsByGroup(state, { groupName: props.group, maxCount: 15 }),
  );

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
        {events.map(event => (
          <EventCard event={event} key={event.id} />
        ))}
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
`;

export default compose<ComponentType<OuterPropTypes>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(),
)(EventsVisualisation);
