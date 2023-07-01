import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useDispatch, useSelector } from 'react-redux';
import {
  getDashbaordId,
  selectDashboards,
} from 'app/data/globalSlice/selectors';
import Button from 'react-bootstrap/Button';
import { useParams } from 'react-router';
import { globalActions } from 'app/data/globalSlice';
import {
  getAfterVisualisationRemovedActions,
  getAfterVisualisationUpdatedActions,
  VisualisationType,
} from 'app/data/VisualisationTypes';
import styled from 'styled-components/macro';

export type FieldType = {
  name: string; // unique. Used as key in props
  label?: string; // Optional label to display
  type?: 'password' | 'checkbox' | 'select' | 'toggle';
  options?: string[]; // If type is select, the options must be provided
  prepend?: string | JSX.Element; // Text or Element to prepend before input field
  append?: string | JSX.Element; // Text or Element to append before input field
  required?: boolean; // Will display a * after label. If true this field will be checked for presence on submit
  text?: string; // Highest precedence. If text is set, a Form.Text will be displayed
  hr?: boolean | string; // Second highest precedende. If hr is provided, a <hr /> will be displayed
  space?: boolean; // just an invisible spacer
  disables?: string; // A checkbox can disable another input
};

const FormField: React.FC<{
  field: FieldType;
  value: any;
  onChange: (name: string, value: string | boolean) => void;
  disabled: boolean;
}> = props => {
  const {
    field: {
      name,
      label,
      type,
      options,
      text,
      prepend,
      append,
      required,
      hr,
      space,
    },
    value,
    disabled,
    onChange,
  } = props;

  if (text) {
    return <Form.Text>{text}</Form.Text>;
  }

  if (hr) {
    if (typeof hr === 'string') {
      return <Seperator>{hr}</Seperator>;
    }
    return <hr />;
  }

  if (space) {
    return <Spacer />;
  }

  if (type === 'checkbox') {
    return (
      <Form.Group>
        <Form.Check
          type="checkbox"
          label={label}
          checked={value || false}
          disabled={disabled || false}
          onChange={e => onChange(name, e.target.checked)}
        />
      </Form.Group>
    );
  }

  if (type === 'toggle') {
    return (
      <Form.Group>
        <Form.Switch
          label={label}
          checked={value || false}
          disabled={disabled || false}
          onChange={e => onChange(name, e.target.checked)}
        />
      </Form.Group>
    );
  }

  if (type === 'select' && options) {
    return (
      <Form.Group>
        {label && <Form.Label>{label}</Form.Label>}
        <Form.Control
          as="select"
          onChange={({ target: { value } }) => onChange(name, value)}
          value={value || options[0]}
          disabled={disabled || false}
        >
          {(options || []).map(option => (
            <option key={option}>{option}</option>
          ))}
        </Form.Control>
      </Form.Group>
    );
  }

  return (
    <Form.Group>
      {label && <Form.Label>{`${label} ${required ? '*' : ''}`}</Form.Label>}
      <InputGroup>
        {prepend && <InputGroup.Text>{prepend}</InputGroup.Text>}
        <Form.Control
          placeholder={label}
          value={value || ''}
          type={type}
          onChange={({ target: { value } }) => onChange(name, value)}
        />
        {append && <InputGroup.Text>{append}</InputGroup.Text>}
      </InputGroup>
    </Form.Group>
  );
};

type InnerProps = {
  id: string;
  fields?: FieldType[];
  type: VisualisationType;
};

const submit = (fieldsToUse, dispatch, props, newProps, setModalOpen) => {
  // Find required fields that are not filled
  const requiredUnfilledFileds = fieldsToUse
    .filter(field => field.required && !newProps[field.name])
    .map(field => (field.label ? field.label : field.name));

  if (requiredUnfilledFileds.length > 0) {
    dispatch(
      globalActions.addErrorNotification(
        `The following fields cannot be empty: ${requiredUnfilledFileds.join(
          ', ',
        )}`,
      ),
    );
    return;
  }

  // Trim values
  const trimmedProps = Object.fromEntries(
    Object.keys(newProps).map(key => {
      const associatedField = fieldsToUse.find(field => field.name === key);
      if (
        !associatedField ||
        associatedField.type === 'password' ||
        associatedField.type === 'checkbox' ||
        !newProps[key]
      ) {
        return [key, newProps[key]];
      }
      return [key, newProps[key].trim()];
    }),
  );

  dispatch(
    globalActions.setVisualisationProps({
      id: props.id,
      props: trimmedProps,
    }),
  );

  // Execute actions that need to be executed after a visualisation was updated
  getAfterVisualisationUpdatedActions(
    props.type,
    props.id,
    trimmedProps,
  ).forEach(action => dispatch(action));

  setModalOpen(false);
};

const withWidgetConfigurationModal =
  (useDefaultFields = true, fields?: FieldType[]) =>
  (WrappedComponent: React.FC<any>) => {
    return (props: InnerProps) => {
      // Use the fields either passed via outer function or passed via props
      // Outer Function has precedence
      let fieldsToUse = fields || props.fields || [];

      const [isModalOpen, setModalOpen] = useState(false);
      const dispatch = useDispatch();
      const { dashboardId }: any = useParams();
      // Get current dashboard and current visualisation
      const dashboards = useSelector(selectDashboards);
      const dId = getDashbaordId(dashboards, dashboardId) || '';
      const visualisations = dashboards.get(dId)?.visualisations || [];
      const vis = visualisations.find(v => v.id === props.id);
      const [newProps, setNewProps] = useState<any>(vis?.props || {});

      if (useDefaultFields) {
        const defaultFields: FieldType[] = [
          {
            name: 'title',
            label: 'Title',
          },
          {
            name: 'text-title',
            text: 'You can optionally provide your own title to be displayed above the widget',
          },
          {
            name: 'hr-title',
            hr: true,
          },
        ];
        fieldsToUse = defaultFields.concat(fieldsToUse);
      }

      const onFieldChange = (name: string, value: string | boolean) => {
        const newState = {
          ...newProps,
          [name]: value,
        };
        setNewProps(newState);
      };

      const afterVisRemove = () => {
        getAfterVisualisationRemovedActions(
          props.type,
          props.id,
          vis?.props,
        ).forEach(action => dispatch(action));
      };

      return (
        <>
          <WrappedComponent
            onSettingsClick={() => setModalOpen(true)}
            afterVisRemoved={afterVisRemove}
            {...props}
          />
          <Modal show={isModalOpen} centered onHide={() => setModalOpen(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Configure Widget</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                {fieldsToUse.map((field, idx) => {
                  const disabled = fieldsToUse
                    .filter(f => f.disables === field.name)
                    .filter(f => !!newProps[f.name]);

                  return (
                    <FormField
                      key={`field ${idx}`}
                      field={field}
                      onChange={onFieldChange}
                      value={newProps[field.name]}
                      disabled={disabled.length > 0}
                    />
                  );
                })}
                <hr />
                <Button
                  onClick={() =>
                    submit(fieldsToUse, dispatch, props, newProps, setModalOpen)
                  }
                >
                  Save
                </Button>
              </Form>
            </Modal.Body>
          </Modal>
        </>
      );
    };
  };

const Spacer = styled.div`
  margin: 0.5em 0;
`;

const Seperator = styled.div`
  display: flex;
  margin: 1em 0em;
  align-items: center;
  text-align: center;

  &:before,
  &:after {
    content: '';
    flex: 1;
    border-bottom: 2px solid var(--clr-dark-gray);
  }

  &:before {
    margin-left: 3em;
  }

  &:not(:empty)::before {
    margin-right: 0.25em;
  }

  &:after {
    margin-right: 3em;
  }

  &:not(:empty)::after {
    margin-left: 0.25em;
  }
`;

export default withWidgetConfigurationModal;
