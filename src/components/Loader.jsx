import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="logo-loader">
        <img src="/assets/login-logo.png" alt="FestiveGuest" className="loader-logo" />
      </div>
    </div>
  );
};

export default Loader;