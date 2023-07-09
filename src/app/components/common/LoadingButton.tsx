import React from 'react';
import Button, { ButtonProps } from 'react-bootstrap/esm/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export enum LoadingState {
  loading = 'LOADING',
  success = 'SUCCESS',
  error = 'ERROR',
  pending = 'PENDING', // Just displaying the button
}

type PropTypes = {
  state: LoadingState;
} & ButtonProps;

const LoadingButton: React.FC<PropTypes> = props => {
  const { state, ...buttonProps } = props;

  if (state === LoadingState.loading) {
    return (
      <Button {...buttonProps} disabled>
        <FontAwesomeIcon icon="sync" spin />
      </Button>
    );
  }

  if (state === LoadingState.success) {
    const { variant: outerVariant } = buttonProps;
    let variant = 'success';
    if (outerVariant && outerVariant.startsWith('outline')) {
      variant = 'outline-success';
    }
    return (
      <Button {...buttonProps} variant={variant}>
        <FontAwesomeIcon icon="check" />
      </Button>
    );
  }

  if (state === LoadingState.error) {
    const { variant: outerVariant } = buttonProps;
    let variant = 'danger';
    if (outerVariant && outerVariant.startsWith('outline')) {
      variant = 'outline-danger';
    }
    return (
      <Button {...buttonProps} variant={variant}>
        <FontAwesomeIcon icon="times" />
      </Button>
    );
  }

  return <Button {...buttonProps}>{props.children}</Button>;
};

export default LoadingButton;
