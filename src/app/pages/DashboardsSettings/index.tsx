import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { globalActions } from 'app';
import ContentElement from 'app/components/Dashboard/ContentElement';
import ContentWrapper from 'app/components/Dashboard/ContentWrapper';
import NavigationBar from 'app/components/Dashboard/NavigationBar';
import { selectDashboards } from 'app/data/globalSlice/selectors';
import { Dashboard } from 'app/data/globalSlice/types';
import AddSharedDashboardModal from './components/AddSharedDashboardModal';
import DeleteButton from './components/DeleteButton';
import ShareButton from './components/ShareButton';

const ID_FIELD_WIDTH = {
  sm: 12,
  md: 3,
};

const NAME_FIELD_WIDTH = {
  sm: 12,
  md: 3,
};

const CHECKBOX_FIELD_WIDTH = {
  sm: 8,
  md: 3,
};

const BUTTON_FIELD_WIDTH = {
  sm: 4,
  md: 1,
};

const CENTER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const DashboardSettings: React.FC = props => {
  const dispatch = useDispatch();
  const dashboards = useSelector(selectDashboards);
  const [dashboardName, setDashboardName] = useState('');
  const [isMainDashboard, setNewMainDashboard] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const addDashboard = () => {
    if (!dashboardName) {
      dispatch(globalActions.addErrorNotification('Name cannot be empty'));
      return;
    }
    dispatch(
      globalActions.addDashboard({
        name: dashboardName,
        isMainDashboard,
      }),
    );
    setDashboardName('');
    setNewMainDashboard(false);
  };

  const setMainDashboard = (dashboard: Dashboard, dashboardId) => {
    if (dashboard.isMainDashboard) return;
    dispatch(globalActions.setMainDashboard({ dashboardId }));
  };

  return (
    <>
      <Helmet>
        <title>Configure Dashboards</title>
        <meta name="description" content="A DevOps Dashboard" />
      </Helmet>
      <NavigationBar />
      <AddSharedDashboardModal
        show={isModalOpen}
        onHide={() => setModalOpen(false)}
      />
      <ContentWrapper>
        <ContentElement>
          <h2 className="mb-4">Configured Dashboards</h2>
          <br />
          <Container fluid>
            <Row>
              <Col {...ID_FIELD_WIDTH}>
                <H3>ID</H3>
              </Col>
              <Col {...NAME_FIELD_WIDTH}>
                <H3>Name</H3>
              </Col>
              <Col {...CHECKBOX_FIELD_WIDTH} style={CENTER_STYLE}>
                <H3>Main Dashboard</H3>
              </Col>
              <Col {...BUTTON_FIELD_WIDTH} />
              <Col {...BUTTON_FIELD_WIDTH} />
            </Row>
            {Array.from(dashboards.keys()).map(dashboardId => {
              const dashboard = dashboards.get(dashboardId);
              if (!dashboard) return null;
              return (
                <Row key={dashboardId} className="mb-2">
                  <Col {...ID_FIELD_WIDTH}>{dashboardId}</Col>
                  <Col {...NAME_FIELD_WIDTH}>{dashboard.name}</Col>
                  <Col {...CHECKBOX_FIELD_WIDTH} style={CENTER_STYLE}>
                    <BigCheckBox
                      id={`big-checkbox-${dashboardId}`}
                      checked={dashboard.isMainDashboard}
                      onChange={() => setMainDashboard(dashboard, dashboardId)}
                    />
                  </Col>
                  <Col {...BUTTON_FIELD_WIDTH}>
                    <DeleteButton
                      dashboardId={dashboardId}
                      dashboard={dashboard}
                      isLastDashboard={dashboards.size <= 1}
                    />
                  </Col>
                  <Col {...BUTTON_FIELD_WIDTH}>
                    <ShareButton
                      dashboardId={dashboardId}
                      dashboard={dashboard}
                    />
                  </Col>
                </Row>
              );
            })}
          </Container>
          <hr />
          <h3 className="mb-4">Add a New Dashboard</h3>
          <Container fluid>
            <Row>
              <Col {...ID_FIELD_WIDTH} />
              <Col {...NAME_FIELD_WIDTH}>
                <Form.Control
                  placeholder="Name"
                  value={dashboardName}
                  onChange={({ target: { value } }) => setDashboardName(value)}
                />
              </Col>
              <Col {...CHECKBOX_FIELD_WIDTH} style={CENTER_STYLE}>
                <BigCheckBox
                  id="big-checkbox"
                  checked={isMainDashboard}
                  onChange={e => setNewMainDashboard(e.target.checked)}
                />
              </Col>
              <Col {...BUTTON_FIELD_WIDTH}>
                <Button onClick={addDashboard} variant="success">
                  <FontAwesomeIcon icon="plus" />
                </Button>
              </Col>
              <Col {...BUTTON_FIELD_WIDTH} />
            </Row>
          </Container>
          <hr />
          <h3 className="mb-4">Shared Dashboards</h3>
          <Button
            style={{ maxWidth: '20em' }}
            onClick={() => setModalOpen(true)}
          >
            Import a shared Dashboard
          </Button>
        </ContentElement>
      </ContentWrapper>
    </>
  );
};

const H3 = styled.h3`
  min-width: 3em;
  overflow-wrap: normal;
`;

const BigCheckBox = styled(Form.Check)`
  .form-check-input {
    width: 20px;
    height: 20px;
  }
`;

export default DashboardSettings;
