// Test script for location APIs
// Run this in browser console or as a standalone script

const API_BASE = 'https://api.festiveguest.com/api';

async function testLocationAPIs() {
  try {
    console.log('Testing location APIs...');
    
    // Test seeding locations
    console.log('1. Seeding locations...');
    const seedResponse = await fetch(`${API_BASE}/seedLocations`, {
      method: 'POST'
    });
    const seedResult = await seedResponse.json();
    console.log('Seed result:', seedResult);
    
    // Test getting locations
    console.log('2. Getting locations...');
    const getResponse = await fetch(`${API_BASE}/getLocations`);
    const locations = await getResponse.json();
    console.log('Locations:', locations);
    
    console.log('Location APIs test completed successfully!');
    return { seedResult, locations };
  } catch (error) {
    console.error('Location APIs test failed:', error);
    throw error;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testLocationAPIs };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.testLocationAPIs = testLocationAPIs;
}