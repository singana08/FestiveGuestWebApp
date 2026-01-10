import React, { useState, useEffect } from 'react';
import storageService from '../utils/storageService';

const ImageWithSas = ({ 
  src, 
  alt, 
  className, 
  style,
  fallbackText = 'No Image',
  userId = null
}) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fallbackSvg = `data:image/svg+xml;base64,${btoa(`
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" rx="8" fill="#f1f5f9"/>
      <text x="75" y="80" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14">${fallbackText.replace(/[^\x00-\x7F]/g, 'User')}</text>
    </svg>
  `)}`;

  useEffect(() => {
    const loadImage = async () => {
      if (!src || hasError) {
        setImgSrc(fallbackSvg);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if it's a blob storage URL that needs SAS token
        if (src.includes('blob.core.windows.net') && !src.includes('?')) {
          // Extract filename from URL
          const urlParts = src.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const container = urlParts[urlParts.length - 2] || 'logos';
          
          // Get SAS URL
          const sasUrl = await storageService.getSasUrl(fileName, container);
          if (sasUrl) {
            setImgSrc(sasUrl);
          } else {
            setImgSrc(fallbackSvg);
          }
        } else {
          // Use URL directly
          setImgSrc(src);
        }
      } catch (error) {
        console.error('Error loading image with SAS:', error);
        setImgSrc(fallbackSvg);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [src, hasError, fallbackSvg]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSvg);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          color: '#64748b',
          fontSize: '12px'
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <img 
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
    />
  );
};

export default ImageWithSas;