import api from './Api';

export const authService = {
  login: (email, password) => {
    return api.post('/login', { email, password });
  },

  register: (userData) => {
    return api.post('/register', userData);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  },
};