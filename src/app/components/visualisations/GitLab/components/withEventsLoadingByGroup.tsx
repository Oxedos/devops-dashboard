import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectEvents,
  selectProjectsByGroup,
} from 'app/data/gitLabSlice/selectors';
import SimpleMessage from '../../components/SimpleMessage';

type PropTypes = {
  id: string;
  group?: string;
  onSettingsClick: Function;
  afterVisRemove: Function;
};

const withEventsLoadingByGroup = (WrappedComponent: React.FC<any>) => {
  const WrapperComponent: React.FC<PropTypes> = props => {
    const allEvents = useSelector(selectEvents);
    const projectsByGroup = useSelector(selectProjectsByGroup);

    if (!props.group) {
      return (
        <SimpleMessage
          id={props.id}
          title="GitLab Widget"
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          message="No Group Selected"
        />
      );
    }

    const projects = projectsByGroup.get(props.group);

    if (!projects) {
      return <WrappedComponent {...props} events={[]} />;
    }

    const events = projects
      .flatMap(project => allEvents.get(project.id))
      .filter(event => event !== undefined);

    if (!events || events.length <= 0) {
      return (
        <SimpleMessage
          id={props.id}
          title="GitLab Events"
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          message="No Events"
        />
      );
    }

    return <WrappedComponent {...props} events={events} />;
  };

  return WrapperComponent;
};

export default withEventsLoadingByGroup;
