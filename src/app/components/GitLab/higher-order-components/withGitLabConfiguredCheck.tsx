import React from 'react';
import { useSelector } from 'react-redux';
import SimpleMessage from 'app/components/visualisations/SimpleMessageVisualisation';
import { selectConfigured } from 'app/data/gitLabSlice/selectors/selectors';

type PropTypes = {
  id: string;
  group?: string;
};

const withGitLabConfiguredCheck = (WrappedComponent: React.FC<any>) => {
  return (props: PropTypes) => {
    const configured = useSelector(selectConfigured);

    if (!configured) {
      return (
        <SimpleMessage
          id={props.id}
          title="GitLab Widget"
          message="GitLab Data Source not configured"
        />
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withGitLabConfiguredCheck;
