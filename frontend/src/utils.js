import { jwtDecode } from 'jwt-decode';

export const getDecodedToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getUsernameFromToken = () => {
  const decoded = getDecodedToken();
  return decoded?.username || null;
};
