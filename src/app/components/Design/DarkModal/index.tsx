import Modal from 'react-bootstrap/Modal';
import styled from 'styled-components/macro';

export default styled(Modal)`
  .modal-content {
    background: var(--clr-widget) !important;
  }

  .close {
    color: var(--clr-white);
  }
`;
