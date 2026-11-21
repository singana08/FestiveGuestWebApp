import api from './api';

class LocationService {
  constructor() {
    this.locations = null;
    this.pending = null;
  }

  // Concurrent callers share one request, so a failure rejects for all of
  // them (polling a loading flag used to hand later callers null).
  getLocations() {
    if (this.locations) return Promise.resolve(this.locations);
    this.pending ||= api.get('location/states-with-cities')
      .then((response) => (this.locations = response.data))
      .catch((error) => {
        console.error('Failed to fetch locations from API:', error);
        throw new Error('Unable to load location data (API Error). Please try again later.');
      })
      .finally(() => { this.pending = null; });
    return this.pending;
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