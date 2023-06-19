import Table from 'react-bootstrap/Table';
import styled from 'styled-components/macro';

export default styled(Table)`
  color: var(--clr-white);
  border-color: var(--clr-white);

  tr:hover {
    color: var(--clr-gray) !important;
  }
`;
