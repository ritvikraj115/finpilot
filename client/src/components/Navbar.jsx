// client/src/components/Navbar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { isLoggedIn, clearToken } from "../utils/auth";
import { FiMenu, FiX } from "react-icons/fi"; // install react-icons if you haven’t

const Bar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  background-color: #fafafa;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const Logo = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #0070f3;
  cursor: pointer;
  &:hover { opacity: 0.8; }
`;

const StyledLink = styled(NavLink)`
  position: relative;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  text-decoration: none;
  padding: 0.25rem 0;

  &.active, &:hover {
    color: #0070f3;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -2px; left: 0;
    width: 0; height: 2px;
    background: #0070f3;
    transition: width 0.2s ease;
  }

  &.active::after, &:hover::after {
    width: 100%;
  }

  @media (max-width: 768px) {
    display: block;
    padding: 0.75rem 1.5rem;
  }
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoutButton = styled.button`
  background: #e00;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  &:hover { background: #c00; }
`;

// Hamburger icon container
const MenuToggle = styled.div`
  display: none;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

// Mobile menu container
const MobileMenu = styled.div`
  position: fixed;
  top: 0; right: 0;
  width: 75%;
  max-width: 300px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  padding: 4rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transform: translateX(${props => props.open ? '0' : '100%'});
  transition: transform 0.3s ease;
  z-index: 200;
`;

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const links = isLoggedIn()
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/transactions", label: "Transactions" },
        { to: "/insights", label: "Insights" },
        { to: "/planner", label: "Budget Planner" },
        { to: "/advisor", label: "AI Advisor" },
      ]
    : [
        { to: "/login", label: "Login" },
        { to: "/signup", label: "Sign Up" },
      ];

  return (
    <>
      <Bar>
        <LeftGroup>
          <Logo onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}>
            FinPilot
          </Logo>
          {/* Desktop links */}
          <div className="desktop-links">
            {links.map(l => (
              <StyledLink key={l.to} to={l.to}>{l.label}</StyledLink>
            ))}
          </div>
        </LeftGroup>

        <RightGroup>
          {isLoggedIn() && (
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          )}
          {/* Hamburger toggle */}
          <MenuToggle onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <FiX/> : <FiMenu/>}
          </MenuToggle>
        </RightGroup>
      </Bar>

      {/* Mobile sliding menu */}
      <MobileMenu open={menuOpen}>
        {links.map(l => (
          <StyledLink
            key={l.to}
            to={l.to}
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </StyledLink>
        ))}
        {isLoggedIn() && (
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
        )}
      </MobileMenu>
    </>
  );
}



