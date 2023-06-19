import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useDispatch, useSelector } from 'react-redux';
import {
  getDashbaordId,
  selectDashboards,
} from 'app/data/globalSlice/selectors';
import DarkModal from 'app/components/Design/DarkModal';
import DarkForm from 'app/components/Design/DarkForm';
import DarkInputGroupText from 'app/components/Design/DarkInputGroupText';
import { BlueButton } from 'app/components/Design/Buttons';
import { useParams } from 'react-router';
import { globalActions } from 'app/data/globalSlice';
import {
  getAfterVisualisationRemovedActions,
  getAfterVisualisationUpdatedActions,
  VisualisationType,
} from 'app/data/VisualisationTypes';

export type FieldType = {
  name: string; // unique. Used as key in props
  label?: string; // Optional label to display
  type?: 'password' | 'checkbox' | 'select';
  options?: string[]; // If type is select, the options must be provided
  prepend?: string | JSX.Element; // Text or Element to prepend before input field
  append?: string | JSX.Element; // Text or Element to append before input field
  required?: boolean; // Will display a * after label. If true this field will be checked for presence on submit
  text?: string; // Highest precedence. If text is set, a Form.Text will be displayed
  hr?: boolean; // Second highest precedende. If hr is provided, a <hr /> will be displayed
};

const FormField: React.FC<{
  field: FieldType;
  value: any;
  onChange: (name: string, value: string | boolean) => void;
}> = props => {
  const {
    field: { name, label, type, options, text, prepend, append, required, hr },
    value,
    onChange,
  } = props;

  if (text) {
    return <Form.Text className="mb-3">{text}</Form.Text>;
  }

  if (hr) {
    return <hr />;
  }

  if (type === 'checkbox') {
    return (
      <Form.Group>
        <Form.Check
          type="checkbox"
          label={label}
          checked={value || false}
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
        {prepend && <DarkInputGroupText>{prepend}</DarkInputGroupText>}
        <Form.Control
          placeholder={label}
          value={value || ''}
          type={type}
          onChange={({ target: { value } }) => onChange(name, value)}
        />
        {append && <DarkInputGroupText>{append}</DarkInputGroupText>}
      </InputGroup>
    </Form.Group>
  );
};

type InnerProps = {
  id: string;
  fields?: FieldType[];
  type: VisualisationType;
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

      const submit = () => {
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
            const associatedField = fieldsToUse.find(
              field => field.name === key,
            );
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
            afterVisRemove={afterVisRemove}
            {...props}
          />
          <DarkModal
            show={isModalOpen}
            centered
            onHide={() => setModalOpen(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Configure Widget</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <DarkForm>
                {fieldsToUse.map((field, idx) => (
                  <FormField
                    key={`field ${idx}`}
                    field={field}
                    onChange={onFieldChange}
                    value={newProps[field.name]}
                  />
                ))}
                <hr />
                <BlueButton onClick={() => submit()}>Save</BlueButton>
              </DarkForm>
            </Modal.Body>
          </DarkModal>
        </>
      );
    };
  };

export default withWidgetConfigurationModal;
