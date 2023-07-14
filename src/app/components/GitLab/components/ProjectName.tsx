import { GitLabProject } from 'app/apis/gitlab/types';
import React from 'react';
import { styled } from 'styled-components';

type PropTypes = {
  project?: GitLabProject;
};

const ProjectName: React.FC<PropTypes> = props => {
  const { project } = props;
  if (!project) return null;
  const Wrapper = project.web_url ? ClickableSpan : NonClickableSpan;

  return (
    <Wrapper
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (project.web_url) {
          window.open(project.web_url);
        }
      }}
    >
      {project.name}
    </Wrapper>
  );
};

const NonClickableSpan = styled.span``;

const ClickableSpan = styled.span`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export default ProjectName;
