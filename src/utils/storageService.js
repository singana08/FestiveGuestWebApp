import api from './api';

const storageService = {
  sasCache: new Map(),
  
  async getSasUrl(fileName, container = 'logos') {
    const cacheKey = `${container}/${fileName}`;
    
    // Check cache first
    const cached = this.sasCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    try {
      const response = await api.get(`storage/get-sas-url`, {
        params: { fileName, container }
      });
      
      const sasUrl = response.data.url;
      
      // Cache for 50 minutes (tokens expire in 1 hour)
      this.sasCache.set(cacheKey, {
        url: sasUrl,
        expiresAt: Date.now() + 50 * 60 * 1000
      });
      
      return sasUrl;
    } catch (error) {
      console.error('Error fetching SAS URL:', error);
      // Fallback to direct URL (will fail if container is private)
      return `https://festivegueststorage.blob.core.windows.net/${container}/${fileName}`;
    }
  },

  clearCache() {
    this.sasCache.clear();
  }
};

export default storageService;
