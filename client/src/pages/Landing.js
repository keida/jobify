import main from '../assets/images/main.svg';
import Wrapper from '../assets/wrappers/LandingPage';
import { Link } from 'react-router-dom';
import { Logo } from '../components';

const Landing = () => {
  return (
    <Wrapper>
      <nav>
        <Logo />
      </nav>
      <div className="container page">
        {/* info */}
        <div className="info">
          <h1>
            Insight<span>Reports</span>
          </h1>
          <p>
            Build a private dashboard for the reports your team needs. Create sales, marketing, finance,
            and operations reports, track review status, and monitor report output trends from one
            secure workspace.
          </p>
          <Link to="/register" className="btn btn-hero">
            Login/Register
          </Link>
        </div>
        <img src={main} alt="data reports dashboard" className="img main-img" />
      </div>
    </Wrapper>
  );
};

export default Landing;
