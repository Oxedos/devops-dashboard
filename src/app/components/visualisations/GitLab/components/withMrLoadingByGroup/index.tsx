import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllMrs, selectMrsByGroup } from 'app/data/gitLabSlice/selectors';

type PropTypes = {
  id: string;
  group?: string;
};

const withMrLoadingByGroup = (WrappedComponent: React.FC<any>) => {
  const WrapperComponent: React.FC<PropTypes> = props => {
    const allMrs = useSelector(selectAllMrs);
    const groupMrs = useSelector(selectMrsByGroup);

    const groupName =
      props.group && props.group !== '[All Groups]' ? props.group : undefined;

    const mrs = !groupName ? allMrs : groupMrs.get(groupName) || [];

    return <WrappedComponent {...props} mrs={mrs} />;
  };

  WrapperComponent.defaultProps = {
    group: '[All Groups]',
  };

  return WrapperComponent;
};

export default withMrLoadingByGroup;
