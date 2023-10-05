import React from 'react';
import ReactMarkdown, {
  defaultUrlTransform as uriTransformer,
} from 'react-markdown';
import { useSelector } from 'react-redux';
import Table from 'react-bootstrap/esm/Table';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabProject } from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { GlobalColours } from 'styles/global-styles';

const prependGitlabUrl = (
  uri: any,
  project: GitLabProject | undefined,
  gitLabUrl: string | undefined,
) => {
  const baseResult = uriTransformer(uri);
  // eslint-disable-next-line no-script-url
  if (baseResult === 'javascript:void(0)') return baseResult;
  if (!project) return baseResult;
  if (!gitLabUrl) return baseResult;
  if (!baseResult.startsWith('/uploads')) return baseResult;
  return new URL(
    `${project.path_with_namespace}${baseResult}`,
    gitLabUrl,
  ).toString();
};

type PropTypes = {
  project?: GitLabProject;
  content?: string;
};

const GitLabMarkdown: React.FC<PropTypes> = props => {
  const gitLabUrl = useSelector(selectUrl);
  if (!props.content) return null;
  return (
    <ReactMarkdown
      urlTransform={(url, _, node) => {
        if (node && node.tagName === 'img') {
          return prependGitlabUrl(url, props.project, gitLabUrl);
        }
        return url;
      }}
      children={props.content}
      rehypePlugins={[rehypeSanitize]}
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children, key, ...props }) => (
          <StyledTable striped bordered hover size="sm" key={key}>
            {children}
          </StyledTable>
        ),
        input: ({ checked, key, ...props }) =>
          checked ? (
            <FontAwesomeIcon
              icon={['far', 'square-check']}
              size="lg"
              key={key}
              color={GlobalColours.green}
            />
          ) : (
            <FontAwesomeIcon icon={['far', 'square']} size="lg" key={key} />
          ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              window.open(href);
            }}
          >
            {children}
          </a>
        ),
      }}
    />
  );
};

const StyledTable = styled(Table)`
  width: unset !important;
`;

export default GitLabMarkdown;
