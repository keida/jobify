import { useAppContext } from '../context/appContext';
import StatItem from './StatItem';
import { FaChartLine, FaTasks, FaCheckCircle } from 'react-icons/fa';
import Wrapper from '../assets/wrappers/StatsContainer';

const StatsContainer = () => {
  const { stats } = useAppContext();
  const defaultStats = [
    {
      title: 'draft reports',
      count: stats.draft || 0,
      icon: <FaTasks />,
      color: '#e9b949',
      bcg: '#fcefc7',
    },
    {
      title: 'reports in review',
      count: stats.review || 0,
      icon: <FaChartLine />,
      color: '#647acb',
      bcg: '#e0e8f9',
    },
    {
      title: 'published reports',
      count: stats.published || 0,
      icon: <FaCheckCircle />,
      color: '#d66a6a',
      bcg: '#ffeeee',
    },
  ];
  return (
    <Wrapper>
      {defaultStats.map((item, index) => {
        return <StatItem key={index} {...item} />;
      })}
    </Wrapper>
  );
};

export default StatsContainer;
