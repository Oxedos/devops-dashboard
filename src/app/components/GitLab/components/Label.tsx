import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitlabLabelDetail } from 'app/apis/gitlab/types';
import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Badge from 'react-bootstrap/Badge';
import styled from 'styled-components/macro';
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

const Label: React.FC<PropTypes> = props => {
  const { label, onDelete, disabled, editable } = props;
  if (!label) return null;
  const labelProperties = getLabelProperties(props.label);

  let labelComponent: React.ReactNode;
  if (labelProperties.name.includes('::')) {
    const [key, value] = labelProperties.name.split('::');
    labelComponent = (
      <ScopedLabel
        style={{
          boxShadow: `inset 0 0 0 3px ${labelProperties.backgroundColor}`,
          color: labelProperties.textColor,
        }}
      >
        <LabelKey
          style={{
            background: labelProperties.backgroundColor,
          }}
        >
          {key}
        </LabelKey>
        <LabelValue $buttonHoverColor={labelProperties.backgroundColor}>
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
                onDelete(labelProperties.name);
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
                color={labelProperties.textColor}
              />
            </span>
          )}
        </LabelValue>
      </ScopedLabel>
    );
  } else {
    labelComponent = (
      <ColoredBadge
        pill
        $background={labelProperties.backgroundColor}
        $color={labelProperties.textColor}
      >
        {labelProperties.name}
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
              onDelete(labelProperties.name);
            }}
          >
            <FontAwesomeIcon
              icon="circle"
              color={labelProperties.backgroundColor}
            />
            <FontAwesomeIcon icon="times" inverse transform="shrink-3" />
          </span>
        )}
      </ColoredBadge>
    );
  }

  if (labelProperties.description) {
    labelComponent = (
      <OverlayTrigger
        placement="bottom"
        overlay={overlayProps => (
          <Tooltip id={`tooltip-${labelProperties.name}`} {...overlayProps}>
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

const ColoredBadge = styled(Badge)`
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
