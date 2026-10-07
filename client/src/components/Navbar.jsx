import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Vote, BarChart2, Building, Users2, FilePlus, Landmark } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-badge">
            <Landmark size={20} color="#ffffff" />
          </div>
          <div className="brand-title">
            <span className="brand-main">Delta State Elections</span>
            <span className="brand-subtitle">Official Results Archive</span>
          </div>
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart2 size={16} />
                <span>Overview</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/polling-units" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Building size={16} />
                <span>Polling Units</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/lga-results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Vote size={16} />
                <span>LGA Results</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/parties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users2 size={16} />
                <span>Political Parties</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/new-result" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FilePlus size={16} />
                <span>Record Result</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
