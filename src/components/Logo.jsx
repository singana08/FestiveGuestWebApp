import React, { useState, useEffect } from 'react';

const Logo = ({ className = '', style = {}, alt = 'FestiveGuest Logo' }) => {
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const response = await fetch('https://api.festiveguest.com/api/getimageurl?logo=true');
            if (response.ok) {
                const data = await response.json();
                setLogoUrl(data.imageUrl);
            } else {
                setError('Logo not found');
            }
        } catch (err) {
            console.error('Error fetching logo:', err);
            setError('Failed to load logo');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={`logo-placeholder ${className}`} style={style}>Loading...</div>;
    }

    if (error || !logoUrl) {
        return (
            <div className={`logo-fallback ${className}`} style={style}>
                <span>FestiveGuest</span>
            </div>
        );
    }

    return (
        <img 
            src={logoUrl} 
            alt={alt} 
            className={className}
            style={style}
            onError={() => setError('Failed to load logo')}
        />
    );
};

export default Logo;