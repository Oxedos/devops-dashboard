import React from 'react';
import Badge from 'react-bootstrap/Badge';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import styled from 'styled-components/macro';
import { GitlabLabelDetail } from 'app/apis/gitlab/types';
import { GlobalColours } from 'styles/global-styles';

export type PropTypes = {
  labels: (GitlabLabelDetail | string)[];
};

const LabelRow: React.FC<PropTypes> = props => {
  const labels = props.labels.map((label, idx) => {
    let background = GlobalColours.blue;
    let color = GlobalColours.white;
    let description = '';
    let name = `${label}`; // to force this to always be a string
    if (typeof label !== 'string') {
      background = label.color;
      color = label.text_color;
      description = label.description;
      name = label.name;
    }
    let labelComponent = (
      <ColoredBadged
        pill
        $background={background}
        $color={color}
        key={`${label}-${idx} Badge`}
      >
        {name}
      </ColoredBadged>
    );
    if (name.includes('::')) {
      const splitName = name.split('::');
      labelComponent = (
        <ScopedLabel
          style={{
            boxShadow: `inset 0 0 0 1px ${background}`,
            color,
          }}
        >
          <LabelKey
            style={{
              background: background,
            }}
          >
            {splitName[0]}
          </LabelKey>
          <LabelValue style={{ color: GlobalColours.white }}>
            {splitName[1]}
          </LabelValue>
        </ScopedLabel>
      );
    }
    if (!description) {
      return labelComponent;
    }
    return (
      <OverlayTrigger
        key={`${label}-${idx} Overlay`}
        placement="bottom"
        overlay={overlayProps => (
          <Tooltip id="button-tooltip" {...overlayProps}>
            {description}
          </Tooltip>
        )}
      >
        {labelComponent}
      </OverlayTrigger>
    );
  });
  return <>{labels}</>;
};

const ColoredBadged = styled(Badge)`
  background: ${(props: any) =>
    props.$background
      ? `${props.$background} !important`
      : 'var(--clr-blue-lighter)'};
  color: ${(props: any) => (props.$color ? props.$color : 'var(--clr-white)')};
`;

const ScopedLabel = styled.div`
  align-items: center;
  overflow: hidden;
  display: inline-flex;
  border-radius: 0.75rem;
  font-size: 0.875rem;
`;

const LabelKey = styled.span`
  padding-left: 0.5rem;
  line-height: 1rem;
  font-size: 0.75rem;
  padding-right: 0.25rem;
`;

const LabelValue = styled.span`
  padding-left: 0.25rem;
  padding-right: 0.5rem;
  line-height: 1rem;
  font-size: 0.75rem;
`;

export default LabelRow;
