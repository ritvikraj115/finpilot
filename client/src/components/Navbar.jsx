// client/src/components/Navbar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { isLoggedIn, clearToken } from "../utils/auth";
import { FiMenu, FiX } from "react-icons/fi";

const Bar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  background-color: #fafafa;
  border-bottom: 1px solid #e6e6e6;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;           /* comfortable spacing on desktop */

  @media (max-width: 768px) {
    gap: 1rem;         /* slightly smaller on tablet */
  }
`;

const Logo = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #0070f3;
  cursor: pointer;
`;

const DesktopLinks = styled.div`
  display: flex;
  gap: 2.5rem;         /* nice wide gap between links */

  @media (max-width: 768px) {
    display: none;     /* hide on mobile */
  }
`;

const StyledLink = styled(NavLink)`
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  text-decoration: none;

  &.active {
    color: #0070f3;
  }

  &:hover {
    color: #0070f3;
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
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #c00;
  }

  @media (max-width: 768px) {
    display: none;    /* move logout into mobile menu */
  }
`;

const MenuToggle = styled.div`
  display: none;
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;   /* show hamburger on mobile */
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0; right: 0;
  width: 80%;
  max-width: 300px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  padding: 1rem;
  transform: translateX(${p => (p.open ? "0" : "100%")});
  transition: transform 0.3s ease;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CloseButton = styled.div`
  align-self: flex-end;
  font-size: 1.5rem;
  cursor: pointer;
`;

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = isLoggedIn()
    ? [
        { to: "/dashboard", text: "Dashboard" },
        { to: "/transactions", text: "Transactions" },
        { to: "/insights", text: "Insights" },
        { to: "/planner", text: "Planner" },
        { to: "/advisor", text: "Advisor" },
      ]
    : [
        { to: "/login", text: "Login" },
        { to: "/signup", text: "Sign Up" },
      ];

  const handleLogout = () => {
    clearToken();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <>
      <Bar>
        <LeftGroup>
          <Logo onClick={() => navigate("/dashboard")}>FinPilot</Logo>
          <DesktopLinks>
            {links.map(l => (
              <StyledLink key={l.to} to={l.to}>
                {l.text}
              </StyledLink>
            ))}
          </DesktopLinks>
        </LeftGroup>

        <RightGroup>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          <MenuToggle onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </MenuToggle>
        </RightGroup>
      </Bar>

      <MobileMenu open={menuOpen}>
        <CloseButton onClick={() => setMenuOpen(false)}>
          <FiX />
        </CloseButton>
        {links.map(l => (
          <StyledLink
            key={l.to}
            to={l.to}
            onClick={() => setMenuOpen(false)}
          >
            {l.text}
          </StyledLink>
        ))}
        {isLoggedIn() && (
          <LogoutButton as="div" onClick={handleLogout}>
            Logout
          </LogoutButton>
        )}
      </MobileMenu>
    </>
  );
}




