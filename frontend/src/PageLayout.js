import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Overview' },
  { to: '/client', label: 'Client Workspace' },
  { to: '/admin', label: "Anna's Dashboard" }
];

const PageLayout = ({ title, subtitle, actionSlot, children }) => {
  const location = useLocation();

  return (
    <div className="page-shell">
      <div className="hero-card page-card page-hero">
        <span className="eyebrow">Anna Johnson Cleaning Co.</span>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {actionSlot && <div style={{ marginTop: 24 }}>{actionSlot}</div>}
      </div>

      <nav className="nav-bar">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="page-card">{children}</div>
    </div>
  );
};

export default PageLayout;
