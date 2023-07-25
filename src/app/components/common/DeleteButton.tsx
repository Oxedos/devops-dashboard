import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { MouseEvent, useState } from 'react';
import { Button } from 'react-bootstrap';

type PropTypes = {
  label: string;
  isLoading?: boolean;
  onDelete: () => void;
};

enum DeleteButtonState {
  pending = 'pending',
  confirm = 'CONFIRM',
}

const DeleteButton: React.FC<PropTypes> = props => {
  const [state, setState] = useState<DeleteButtonState>(
    DeleteButtonState.pending,
  );

  const firstClick = () => {
    setState(DeleteButtonState.confirm);
    setTimeout(() => setState(DeleteButtonState.pending), 1000);
  };

  const buttonClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (state === DeleteButtonState.confirm) {
      props.onDelete();
    } else {
      firstClick();
    }
  };

  let buttonContent: any = props.label;
  if (state === DeleteButtonState.confirm) {
    buttonContent = 'Please confirm';
  }
  if (props.isLoading) {
    buttonContent = <FontAwesomeIcon icon="sync" spin />;
  }

  return (
    <Button variant="danger" onClick={buttonClick} disabled={props.isLoading}>
      {buttonContent}
    </Button>
  );
};

export default DeleteButton;
