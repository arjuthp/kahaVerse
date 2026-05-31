import React from 'react';
import '../../styles/components/common/Toast.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
  autoCloseDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  onClose,
  autoCloseDuration = 3000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [id, autoCloseDuration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ',
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
