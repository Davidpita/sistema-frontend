// src/utils/auth.js

export const login = (token, usuario) => {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
  localStorage.setItem('papel', usuario.papel);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('papel');
  window.location.href = '/';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getPapel = () => {
  return localStorage.getItem('papel');
};