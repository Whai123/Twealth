import { memo } from 'react';

interface SparklineProps {
  data: number[];
  color?: 'green' | 'red' | 'blue' | 'purple' | 'gray';
  className?: string;
}

function Sparkline({ data, color = 'blue', className = '' }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={`sparkline-container ${className}`}></div>;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClasses = {
    green: 'stroke-green-600 dark:stroke-green-400',
    red: 'stroke-red-600 dark:stroke-red-400',
    blue: 'stroke-blue-600 dark:stroke-blue-400',
    purple: 'stroke-blue-600 dark:stroke-blue-400',
    gray: 'stroke-gray-400 dark:stroke-gray-500'
  };

  return (
    <svg 
      className={`sparkline-container ${className}`} 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className={colorClasses[color]}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default memo(Sparkline);
