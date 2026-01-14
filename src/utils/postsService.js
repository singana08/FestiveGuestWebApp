import api from './api';

class PostsService {
  // Guest Posts
  async createGuestPost(postData) {
    const response = await api.post('guestposts', postData);
    return response.data;
  }

  async getGuestPosts() {
    const response = await api.get('guestposts');
    return response.data;
  }

  async getMyGuestPosts() {
    const response = await api.get('guestposts/my-posts');
    return response.data;
  }

  async deleteGuestPost(postId) {
    const response = await api.delete(`guestposts/${postId}`);
    return response.data;
  }

  async updateGuestPost(postId, postData) {
    const response = await api.put(`guestposts/${postId}`, postData);
    return response.data;
  }

  // Host Posts
  async createHostPost(postData) {
    const response = await api.post('hostposts', postData);
    return response.data;
  }

  async getHostPosts() {
    const response = await api.get('hostposts');
    return response.data;
  }

  async getMyHostPosts() {
    const response = await api.get('hostposts/my-posts');
    return response.data;
  }

  async deleteHostPost(postId) {
    const response = await api.delete(`hostposts/${postId}`);
    return response.data;
  }

  async updateHostPost(postId, postData) {
    const response = await api.put(`hostposts/${postId}`, postData);
    return response.data;
  }
}

export default new PostsService();