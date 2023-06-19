import React from 'react';
import Nav from 'react-bootstrap/Nav';
import styled from 'styled-components/macro';

type MenuItem = {
  id: string;
  label: string;
};

type PropTypes = {
  onMenuItemClick: Function;
  active: string;
  items: MenuItem[];
};

type NavItemPropTypes = {
  onMenuItemClick: Function;
  active: string;
  item: MenuItem;
};

const NavItem: React.FC<NavItemPropTypes> = props => {
  return (
    <Nav.Item>
      <Nav.Link
        as={props.active === props.item.id ? active : notActive}
        onClick={() => props.onMenuItemClick(props.item.id)}
      >
        {props.item.label}
      </Nav.Link>
    </Nav.Item>
  );
};

const NavBar: React.FC<PropTypes> = props => {
  return (
    <Nav>
      {props.items.map(item => (
        <NavItem
          active={props.active}
          onMenuItemClick={props.onMenuItemClick}
          item={item}
          key={item.id}
        />
      ))}
    </Nav>
  );
};

const active = styled.div`
  font-weight: bold;
  border-bottom: 2px solid var(--clr-blue);
  color: var(--clr-blue);
`;

const notActive = styled.div`
  border-bottom: 2px solid var(--clr-white);
  cursor: pointer;
`;

export default NavBar;
