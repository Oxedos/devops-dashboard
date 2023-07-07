import React from 'react';
import { useSelector } from 'react-redux';
import { selectConfigured } from 'app/data/whitesourceSlice/selectors';
import SimpleMessage from 'app/components/visualisations/SimpleMessageVisualisation';

type PropTypes = {
  id: string;
};

const withWhitesourceConfiguredCheck = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const configured = useSelector(selectConfigured);

    if (!configured) {
      return (
        <SimpleMessage
          id={props.id}
          title="Whitesource Widget"
          message="Whitesource Data Source not configured"
        />
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withWhitesourceConfiguredCheck;
