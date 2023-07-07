import React, { FunctionComponent, memo } from 'react';
import styled from 'styled-components/macro';
import VisualisationContainer from 'app/components/visualisations/VisualisationContainer';
import Table from 'react-bootstrap/Table';

type PropTypes = {
  id: string;
  title: string;
  header?: string[];
  values: object[]; // objects with key clickHandler will add call clickHandler for event onClick
  onSettingsClick: Function;
  afterVisRemoved: Function;
  hover?: boolean;
};

const TableVisualisation: FunctionComponent<PropTypes> = props => {
  return (
    <VisualisationContainer
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
      id={props.id}
      title={props.title}
    >
      <Wrapper>
        <StyledTable borderless striped size="sm" hover={props.hover}>
          {props.header && (
            <thead>
              <tr>
                {props.header.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {props.values.map((val: any, idx) => {
              const { clickHandler, ...restVal } = val;
              const Tr = clickHandler ? ClickableTr : DefaultTr;
              return (
                <Tr key={idx} onClick={clickHandler}>
                  {Object.keys(restVal).map((key, idx) => (
                    <td key={`${val[key]}-${idx}`}>{val[key]}</td>
                  ))}
                </Tr>
              );
            })}
          </tbody>
        </StyledTable>
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
`;

const StyledTable = styled(Table)`
  width: 100%;

  th {
    min-width: 3em;
    max-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  tbody tr td {
    vertical-align: middle;
  }
`;

const ClickableTr = styled.tr`
  cursor: pointer;
`;

const DefaultTr = styled.tr``;

TableVisualisation.defaultProps = {
  hover: false,
};

export default memo(TableVisualisation);
