import React from 'react';
import styled from 'styled-components/macro';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import { ConfiguredVisualisation } from 'app/data/VisualisationTypes';
import Visualisation from '../visualisations';
import { useDispatch } from 'react-redux';
import { globalActions } from 'app';

const ReactGridLayout = WidthProvider(GridLayout);

type PropTypes = {
  dashboardId: string;
  visualisations?: ConfiguredVisualisation[];
};

const Dashboard: React.FC<PropTypes> = props => {
  const { dashboardId } = props;
  const dispatch = useDispatch();

  if (!props.visualisations || props.visualisations.length <= 0) {
    return (
      <NoVisWrapper>
        <div className="content">
          <h1>Empty Dashboard</h1>
          <p>Add a widget by using the menu on the left</p>
        </div>
      </NoVisWrapper>
    );
  }

  const layout = props.visualisations.map(vis => {
    return {
      i: vis.id,
      x: vis.x,
      y: vis.y,
      minW: vis.minW,
      minH: vis.minH,
      w: vis.w,
      h: vis.h,
    };
  });

  return (
    <Wrapper>
      <ReactGridLayout
        layout={layout}
        cols={36}
        rowHeight={20}
        draggableHandle=".visContainerDraggableHandle"
        onLayoutChange={layout =>
          dispatch(globalActions.updateDashboardLayout({ dashboardId, layout }))
        }
      >
        {props.visualisations.map(visualisation => (
          <div key={visualisation.id}>
            <Visualisation
              type={visualisation.type}
              id={visualisation.id}
              props={visualisation.props}
            />
          </div>
        ))}
      </ReactGridLayout>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100vh;
  overflow: auto;
`;

const NoVisWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: auto;
  .content {
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: space-evenly;
    p {
      font-family: Arial, Helvetica, sans-serif;
    }
  }

  .arrow {
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    position: fixed;

    h3 {
      padding: 0;
      margin: 0;
    }
  }

  .menu {
    top: 0em;
    left: 5em;
  }

  .sync {
    top: 4em;
    left: 5em;
  }

  .add {
    top: 8em;
    left: 5em;
  }

  .dashboards {
    top: 0em;
    right: 5em;
  }
`;

export default Dashboard;
