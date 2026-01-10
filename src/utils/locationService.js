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
      // Use the same API instance as the rest of the app
      const response = await api.get('location/states-with-cities');
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
      const response = await api.post('location/seed');
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