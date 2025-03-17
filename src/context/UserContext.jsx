import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded) {
        localStorage.setItem('user', JSON.stringify(decoded));
        setUser(decoded);
      }
    } catch (error) {
      console.error('Ошибка при расшифровке токена:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && !storedUser) {
      decodeToken(token);
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, []);

  return user && <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
}

// Хук для использования пользователя
export function useUser() {
  return useContext(UserContext);
}
