import React from 'react';
import '../../styles/components/common/LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
}) => {
  return (
    <div className={`loading-spinner ${fullScreen ? 'full-screen' : ''}`}>
      <div className={`spinner spinner-${size}`}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
