import styled from 'styled-components';

export default styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  justify-items: space-between;
  border-radius: 0.5em;
  padding: 1em;
  min-width: 80vw;
  background: var(--clr-widget);
  > * {
    width: 100%;
  }
  > h2 {
    margin-top: 0;
  }
  @media (max-width: 1200px) {
    width: 100vw;
  }
`;
