import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const CustomerLayout: React.FC = () => {
  return (
    <>
      <Navbar />
      {/* Push content below fixed navbar (72px height) */}
      <div style={{ paddingTop: '72px' }}>
        <Outlet />
      </div>
    </>
  );
};

export default CustomerLayout;
