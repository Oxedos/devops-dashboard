import React from 'react';
import ContentElement from '../../../../components/Design/ContentElement';
import { GitLabMR, GitLabProject } from 'app/apis/gitlab/types';
import GitLabUser from '../../../../components/GitLab/GitLabUser';
import { useSelector } from 'react-redux';
import { selectProjects } from 'app/data/gitLabSlice/selectors';
import styled from 'styled-components/macro';
import DarkTable from 'app/components/Design/DarkTable';
import { selectAllMrs } from 'app/data/gitLabSlice/mrSelectors';

type GetMrRowPropTypes = {
  mrs: GitLabMR[];
  projects: GitLabProject[];
};

const getMrRows = (props: GetMrRowPropTypes) => {
  return props.mrs.map(mr => (
    <Tr key={mr.id} onClick={() => window.open(mr.web_url)}>
      <td>
        {props.projects.find(project => project.id === mr.project_id)?.name}
      </td>
      <td>{mr.title}</td>
      <td>
        <GitLabUser user={mr.author} />
      </td>
      <td>
        {(mr.assignees || []).map(user => (
          <GitLabUser key={user.username} user={user} imgOnly />
        ))}
      </td>
      <td>
        {(mr.reviewers || []).map(user => (
          <GitLabUser key={user.username} user={user} imgOnly />
        ))}
      </td>
    </Tr>
  ));
};

const MergeRequests: React.FC = props => {
  const mrs = useSelector(selectAllMrs);
  const projects = useSelector(selectProjects);

  if (mrs.length <= 0) {
    return (
      <ContentElement>
        <h2>No Merge Requests found</h2>
      </ContentElement>
    );
  }

  return (
    <ContentElement>
      <DarkTable hover>
        <thead>
          <tr>
            <th>Project</th>
            <th>Title</th>
            <th>Author</th>
            <th>Asignees</th>
            <th>Reviewers</th>
          </tr>
        </thead>
        <tbody>{getMrRows({ mrs, projects })}</tbody>
      </DarkTable>
    </ContentElement>
  );
};

const Tr = styled.tr`
  cursor: pointer;
`;

export default MergeRequests;
