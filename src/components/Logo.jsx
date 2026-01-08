import React, { useState, useEffect } from 'react';
import storageService from '../utils/storageService';

const Logo = ({ className = '', style = {}, alt = 'FestiveGuest Logo', isLoginLogo = false }) => {
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLogo = async () => {
            try {
                const fileName = isLoginLogo ? 'login-logo.png' : 'logo.png';
                const url = await storageService.getSasUrl(fileName, 'logos');
                setLogoUrl(url);
            } catch (error) {
                console.error('Error loading logo:', error);
                // Fallback to local assets
                setLogoUrl(isLoginLogo ? '/assets/login-logo.png' : '/assets/logo.png');
            } finally {
                setLoading(false);
            }
        };

        loadLogo();
    }, [isLoginLogo]);

    if (loading) {
        return <div className={className} style={{ ...style, background: '#f0f0f0' }} />;
    }

    return (
        <img 
            src={logoUrl} 
            alt={alt} 
            className={className}
            style={style}
        />
    );
};

export default Logo;