import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Badge from 'react-bootstrap/Badge';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitlabLabelDetail } from 'app/apis/gitlab/types';
import { GlobalColours } from 'styles/global-styles';

type PropTypes = {
  label: GitlabLabelDetail | string;
  editable?: boolean;
  onDelete?: (name) => void;
  disabled?: boolean;
};

type LabelProperties = {
  backgroundColor: string;
  textColor: string;
  description: string | undefined;
  name: string;
};

const getLabelProperties = (
  label: GitlabLabelDetail | string,
): LabelProperties => {
  if (typeof label !== 'string') {
    return {
      backgroundColor: label.color,
      textColor: label.text_color,
      description: label.description,
      name: label.name,
    };
  }
  return {
    backgroundColor: GlobalColours.blue,
    textColor: GlobalColours.white,
    description: undefined,
    name: `${label}`, // to force this to always be a string
  };
};

type LabelComponentProps = {
  onDelete?: (name) => void;
  editable?: boolean;
  disabled?: boolean;
};

const SimpleLabelComponent: React.FC<
  LabelProperties & LabelComponentProps
> = props => {
  const { backgroundColor, textColor, name, onDelete, editable, disabled } =
    props;
  return (
    <ColoredBadged pill $background={backgroundColor} $color={textColor}>
      {name}
      {editable && (
        <span
          className="fa-layers"
          style={{
            cursor: disabled ? 'unset' : 'pointer',
          }}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled) return;
            if (!onDelete) return;
            onDelete(name);
          }}
        >
          <FontAwesomeIcon icon="circle" color={backgroundColor} />
          <FontAwesomeIcon icon="times" inverse transform="shrink-3" />
        </span>
      )}
    </ColoredBadged>
  );
};

const ScopedLabelComponent: React.FC<
  LabelProperties & LabelComponentProps
> = props => {
  const { backgroundColor, textColor, name, onDelete, editable, disabled } =
    props;
  const [key, value] = name.split('::');

  return (
    <ScopedLabel
      style={{
        boxShadow: `inset 0 0 0 3px ${backgroundColor}`,
        color: textColor,
      }}
    >
      <LabelKey
        style={{
          background: backgroundColor,
        }}
      >
        {key}
      </LabelKey>
      <LabelValue $buttonHoverColor={backgroundColor}>
        <span>{value}</span>
        {editable && (
          <span
            className="fa-layers"
            style={{
              cursor: disabled ? 'unset' : 'pointer',
            }}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              if (disabled) return;
              if (!onDelete) return;
              onDelete(name);
            }}
          >
            <FontAwesomeIcon
              icon="circle"
              transform="shrink-2"
              color={GlobalColours.widget}
            />
            <FontAwesomeIcon
              icon="times"
              inverse
              transform="shrink-6"
              color={textColor}
            />
          </span>
        )}
      </LabelValue>
    </ScopedLabel>
  );
};

const Label: React.FC<PropTypes> = props => {
  const { label } = props;
  if (!label) return null;
  const labelProperties = getLabelProperties(props.label);

  let labelComponent: React.ReactNode;
  if (labelProperties.name.includes('::')) {
    labelComponent = (
      <ScopedLabelComponent
        {...labelProperties}
        onDelete={props.onDelete}
        editable={props.editable}
        disabled={props.disabled}
      />
    );
  } else {
    labelComponent = (
      <SimpleLabelComponent
        {...labelProperties}
        onDelete={props.onDelete}
        editable={props.editable}
        disabled={props.disabled}
      />
    );
  }

  if (labelProperties.description) {
    labelComponent = (
      <OverlayTrigger
        placement="bottom"
        overlay={overlayProps => (
          <Tooltip id="button-tooltip" {...overlayProps}>
            {labelProperties.description}
          </Tooltip>
        )}
      >
        {labelComponent}
      </OverlayTrigger>
    );
  }
  return labelComponent;
};

const ColoredBadged = styled(Badge)`
  background: ${(props: any) =>
    props.$background
      ? `${props.$background} !important`
      : 'var(--clr-blue-lighter)'};
  color: ${(props: any) => (props.$color ? props.$color : 'var(--clr-white)')};
  display: flex;
  flex-flow: row nowrap;
  gap: 0.5em;

  .fa-layers {
    cursor: pointer;
  }

  .fa-layers:hover svg:not([class*='fa-inverse']) {
    color: var(--clr-widget);
  }
`;

const ScopedLabel = styled.div`
  text-align: center;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: 0.15rem;
  overflow: hidden;
  border-radius: 0.75rem;
  font-weight: bold;
`;

const LabelKey = styled.span`
  padding-left: 0.5rem;
  line-height: 1rem;
  font-size: 0.75rem;
  padding-right: 0.25rem;
  height: 100%;
`;

const LabelValue: any = styled.span`
  line-height: 1rem;
  font-size: 0.75rem;
  padding-left: 0.25rem;
  padding-right: 0.15rem;

  & > :first-child {
    padding-right: 0.25rem;
  }

  & .fa-layers {
    cursor: pointer;
  }

  .fa-layers:hover svg:not([class*='fa-inverse']) {
    color: ${(props: any) =>
      props.$buttonHoverColor ? props.$buttonHoverColor : 'unset'};
  }
`;

export default Label;
