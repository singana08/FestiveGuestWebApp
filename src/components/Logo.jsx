import React from 'react';

const Logo = ({ className = '', style = {}, alt = 'FestiveGuest Logo', isLoginLogo = false }) => {
    const logoSrc = isLoginLogo ? '/assets/login-logo.png' : '/assets/logo.png';

    return (
        <img 
            src={logoSrc} 
            alt={alt} 
            className={className}
            style={style}
        />
    );
};

export default Logo;