import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import birthdayImage from '../assets/kalyani-birthday.jpeg';
import '../styles/BirthdaySurprise.css';

const BirthdaySurprise = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 500);
  }, []);

  return (
    <div className="birthday-container">
      {/* Animated Background */}
      <div className="birthday-background">
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
      </div>

      {/* Main Content */}
      <div className={`birthday-content ${showContent ? 'show' : ''}`}>
        {/* Birthday Image */}
        <div className="birthday-image-container">
          <img src={birthdayImage} alt="Kalyani Birthday" className="birthday-image" />
        </div>

        {/* Birthday Cake Animation */}
        <div className="cake-container">
          <div className="cake">
            <div className="candle">
              <div className="flame"></div>
            </div>
          </div>
        </div>

        {/* Birthday Message */}
        <div className="birthday-message">
          <h1 className="birthday-title">
            🎉 Happy Birthday 🎉
          </h1>
          <h2 className="birthday-name">Kalyani Singana</h2>
          
          <div className="birthday-quote">
            <p>"On this special day, something beautiful begins..."</p>
          </div>

          <div className="birthday-dedication">
            <p className="dedication-text">
              Today marks not just your birthday, but the birth of something we've built together with love.
            </p>
            <p className="dedication-text">
              Just as you bring warmth and connection to everyone around you,
              this platform is designed to connect people and create meaningful relationships.
            </p>
            <p className="dedication-highlight">
              ✨ Launched with love on your special day ✨
            </p>
          </div>

          {/* Action Buttons */}
          <div className="birthday-actions">
            <button 
              className="btn-enter-app"
              onClick={() => navigate('/home')}
            >
              <span>🎁 Enter the App</span>
            </button>
          </div>

          {/* Date Badge */}
          <div className="launch-badge">
            <span className="badge-icon">🚀</span>
            <span className="badge-text">Launched: January 15, 2025</span>
          </div>
        </div>
      </div>

      {/* Floating Hearts */}
      <div className="hearts">
        <div className="heart">❤️</div>
        <div className="heart">💖</div>
        <div className="heart">💝</div>
        <div className="heart">💗</div>
        <div className="heart">💕</div>
      </div>
    </div>
  );
};

export default BirthdaySurprise;
