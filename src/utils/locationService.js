import axios from 'axios';
import api from './api';

class LocationService {
  constructor() {
    this.locations = null;
    this.loading = false;
  }

  async getLocations() {
    if (this.locations) {
      return this.locations;
    }

    if (this.loading) {
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.locations;
    }

    this.loading = true;
    try {
      // Use standard axios with lowercase route as per Azure deployment
      const response = await axios.get('https://api.festiveguest.com/api/getlocations');
      this.locations = response.data;
      return this.locations;
    } catch (error) {
      console.error('DEBUG: Failed to fetch locations from API:', error);
      throw new Error('Unable to load location data (API Error). Please try again later.');
    } finally {
      this.loading = false;
    }
  }

  async seedLocations() {
    try {
      const response = await api.post('seedlocations');
      this.locations = null;
      return response.data;
    } catch (error) {
      console.error('Failed to seed locations:', error);
      throw error;
    }
  }

  clearCache() {
    this.locations = null;
  }
}

export default new LocationService();