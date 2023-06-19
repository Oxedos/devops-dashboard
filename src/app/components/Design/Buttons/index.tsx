import Button from 'react-bootstrap/Button';
import styled from 'styled-components/macro';

export const GreenButton = styled(Button)`
  background: var(--clr-green);
  border-color: var(--clr-green);
  color: var(--clr-background);

  :hover {
    background: var(--clr-green-lighter);
    border-color: var(--clr-green-lighter);
    color: var(--clr-widget);
  }

  &[disabled] {
    background: var(--clr-green-lighter);
    border-color: var(--clr-green-lighter);
    color: var(--clr-widget);
  }
`;

export const BlueButton = styled(Button)`
  background: var(--clr-blue);
  border-color: var(--clr-blue);
  color: var(--clr-white);

  :hover {
    background: var(--clr-blue-lighter);
    border-color: var(--clr-blue-lighter);
    color: var(--clr-white);
  }

  &[disabled] {
    background: var(--clr-blue-lighter);
    border-color: var(--clr-blue-lighter);
    color: var(--clr-white);
  }
`;

export const RedButton = styled(Button)`
  background: var(--clr-red);
  border-color: var(--clr-red);
  color: var(--clr-white);

  :hover {
    background: var(--clr-red-lighter);
    border-color: var(--clr-red-lighter);
    color: var(--clr-white);
  }

  &[disabled] {
    background: var(--clr-red-lighter);
    border-color: var(--clr-red-lighter);
    color: var(--clr-white);
  }
`;

export const OrangeButton = styled(Button)`
  background: var(--clr-orange);
  border-color: var(--clr-orange);
  color: var(--clr-white);

  :hover {
    background: var(--clr-orange-lighter);
    border-color: var(--clr-orange-lighter);
    color: var(--clr-white);
  }

  &[disabled] {
    background: var(--clr-orange-lighter);
    border-color: var(--clr-orange-lighter);
    color: var(--clr-white);
  }
`;
