// Utility functions for user data management
export const getCurrentUserId = () => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.userId || userData.id;
    }
    // Fallback to separate userId storage
    return localStorage.getItem('userId');
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};