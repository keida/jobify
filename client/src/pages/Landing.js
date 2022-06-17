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
            JOB<span>Tracking</span>
          </h1>
          <p>
            'm baby chartreuse migas flannel, blue bottle locavore chia coloring book
            venmo kombucha. Brooklyn woke kogi cold-pressed, 3 wolf moon copper mug
            unicorn farm-to-table. Hot chicken literally cloud bread keffiyeh offal four
            dollar toast. Unicorn XOXO air plant messenger bag.
          </p>
          <Link to="/register" className="btn btn-hero">
            Login/Register
          </Link>
        </div>
        <img src={main} alt="job hunt" className="img main-img" />
      </div>
    </Wrapper>
  );
};

export default Landing;
