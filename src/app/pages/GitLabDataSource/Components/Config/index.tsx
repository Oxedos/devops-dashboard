import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import ContentElement from '../../../../components/Design/ContentElement';
import { useDispatch } from 'react-redux';
import { useGlobalSlice } from 'app/data/globalSlice';
import { BlueButton } from 'app/components/Design/Buttons';
import DarkForm from 'app/components/Design/DarkForm';
import InputGroup from 'react-bootstrap/InputGroup';
import DarkInputGroupText from 'app/components/Design/DarkInputGroupText';
import { API_SUFFIX } from 'app/apis/gitlab';

type ConfigProps = {
  token: string | undefined;
  url: string | undefined;
  saveConfig: Function;
};

const Config: React.FC<ConfigProps> = props => {
  const [newToken, setNewToken] = useState(props.token);
  const [newUrl, setNewUrl] = useState(props.url);
  const dispatch = useDispatch();
  const { actions: globalActions } = useGlobalSlice();

  const saveConfig = () => {
    if (!newUrl) {
      dispatch(globalActions.addErrorNotification("GitLab Url can't be empty"));
      return;
    }
    if (!newToken) {
      dispatch(globalActions.addErrorNotification("token can't be empty"));
      return;
    }
    props.saveConfig({ token: newToken, url: newUrl.trim() });
  };

  return (
    <ContentElement>
      <h2>GitLab Settings</h2>
      <DarkForm>
        <Form.Group>
          <Form.Label>GitLab Url</Form.Label>
          <InputGroup>
            <Form.Control
              placeholder="https://gitlab.com/api/v4"
              value={newUrl || ''}
              onChange={({ target: { value } }) => setNewUrl(value)}
            />
            <DarkInputGroupText>{API_SUFFIX}</DarkInputGroupText>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>Private Access Token</Form.Label>
          <Form.Control
            placeholder="Private Access Token"
            value={newToken || ''}
            type="password"
            onChange={({ target: { value } }) => setNewToken(value)}
          />
        </Form.Group>
        <BlueButton onClick={saveConfig}>Save</BlueButton>
      </DarkForm>
    </ContentElement>
  );
};

export default Config;
