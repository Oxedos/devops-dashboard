import Form from 'react-bootstrap/Form';
import styled from 'styled-components/macro';

export default styled(Form)`
  input,
  select,
  .custom-select,
  .form-control,
  .form-control:focus {
    background: var(--clr-widget);
    color: var(--clr-white);
  }

  select:disabled {
    color: var(--clr-gray);
    border-color: var(--clr-gray);
  }

  .form-check-input {
    background: var(--clr-background);
    border-color: var(--clr-white);
  }

  label,
  .form-check-label {
    font-family: Arial, Helvetica, sans-serif;
  }

  .form-text {
    color: var(--clr-white);
  }
`;

export const DarkFormControl = styled(Form.Control)`
  background: var(--clr-widget) !important;
  color: var(--clr-white) !important;
`;
