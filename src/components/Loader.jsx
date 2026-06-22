import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 40%, #2D1B69 100%)',
    overflow: 'hidden',
  }}>
    {/* Ambient circles */}
    {[120, 200, 300].map((size, i) => (
      <motion.div
        key={i}
        style={{
          position: 'absolute',
          width: size, height: size,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
      />
    ))}

    {/* Logo container */}
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: 100, height: 100,
        background: 'white',
        borderRadius: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        position: 'relative', zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <motion.img
        src="/assets/login-logo.png"
        alt="Festive Guest"
        style={{ width: '90%', height: '90%', objectFit: 'cover', borderRadius: '1.5rem' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        onError={e => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<span style="font-size:3rem">🎉</span>';
        }}
      />
    </motion.div>

    {/* App name */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{ marginTop: '1.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}
    >
      <p style={{
        color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: 800, fontSize: '1.4rem', margin: '0 0 0.35rem', letterSpacing: '-0.01em'
      }}>
        Festive Guest
      </p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
        Connecting India's travellers & hosts
      </p>
    </motion.div>

    {/* Loading dots */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem', position: 'relative', zIndex: 1 }}
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }}
          animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </motion.div>
  </div>
);

export default Loader;
