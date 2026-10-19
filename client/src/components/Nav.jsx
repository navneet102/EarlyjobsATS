import { Link, NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          EarlyJobs <span>ATS</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/candidates">Candidates</NavLink>
          <NavLink to="/board">Board</NavLink>
        </nav>
      </div>
    </header>
  );
}
