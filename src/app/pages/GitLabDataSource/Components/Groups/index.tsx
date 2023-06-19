import React from 'react';
import { GitLabGroup } from 'app/apis/gitlab/types';
import styled from 'styled-components/macro';
import ContentElement from '../../../../components/Design/ContentElement';
import Figure from 'react-bootstrap/Figure';
import {
  selectGroups,
  selectListenedGroups,
} from 'app/data/gitLabSlice/selectors';
import { useSelector } from 'react-redux';
import DarkTable from 'app/components/Design/DarkTable';

type GroupRowPropTypes = {
  group: GitLabGroup;
  listenedGroups: string[];
};

const GroupRow = (props: GroupRowPropTypes) => {
  const { group, listenedGroups } = props;
  const isListened = !!listenedGroups.find(
    groupName => group.full_name === groupName,
  );

  return (
    <Tr key={group.id} onClick={() => window.open(group.web_url)}>
      <td>
        {group.avatar_url ? (
          <StyledFigure>
            <Figure.Image src={group.avatar_url} />
          </StyledFigure>
        ) : (
          <DefaultLogoWrapper>{group.name[0].toUpperCase()}</DefaultLogoWrapper>
        )}
      </td>
      <td>{group.id}</td>
      <td>{group.full_path}</td>
      <td>{isListened ? 'Listened' : ''}</td>
    </Tr>
  );
};

const Groups: React.FC = props => {
  const groups = useSelector(selectGroups);
  const listenedGroups = useSelector(selectListenedGroups);

  if (groups.length <= 0) {
    return (
      <ContentElement>
        <h2>User is not member of any groups</h2>
      </ContentElement>
    );
  }

  return (
    <ContentElement>
      <DarkTable hover>
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Name</th>
            <th>Polling</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <GroupRow
              key={group.id}
              group={group}
              listenedGroups={listenedGroups}
            />
          ))}
        </tbody>
      </DarkTable>
    </ContentElement>
  );
};

const DefaultLogoWrapper = styled.div`
  color: black;
  background: var(--clr-gray);
  width: 3em;
  height: 3em;
  border-radius: 0.5em;
  display: flex;
  align-items: center;
  justify-content: space-around;
  user-select: none;
`;

const StyledFigure = styled(Figure)`
  padding: 0;
  margin: 0;
  width: 3em;
  height: 3em;
  display: flex;
  align-items: center;
  justify-content: space-around;
  user-select: none;
  img {
    padding: 0;
    margin: 0;
  }
`;

const Tr = styled.tr`
  cursor: pointer;
`;

export default Groups;
