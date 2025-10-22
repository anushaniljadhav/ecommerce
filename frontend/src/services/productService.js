import api from './Api';

export const productService = {
  getAllProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getProductsByCategory: async (category) => {
    try {
      const response = await api.get(`/products?category=${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await api.get(`/products?search=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};