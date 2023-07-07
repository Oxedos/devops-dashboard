import React from 'react';
import { useSelector } from 'react-redux';
import SimpleMessage from 'app/components/visualisations/SimpleMessageVisualisation';
import { selectFeeds } from 'app/data/rssSlice/selectors';

type PropTypes = {
  id: string;
  onSettingsClick?: Function;
  afterVisRemove?: Function;
};

const withUrlConfiguredCheck = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const feeds = useSelector(selectFeeds);
    if (!feeds.has(props.id)) {
      return (
        <SimpleMessage
          id={props.id}
          title="RSS Widget"
          message="Widget not configured"
          onSettingsClick={props.onSettingsClick}
          afterVisRemoved={props.afterVisRemove}
        />
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withUrlConfiguredCheck;
