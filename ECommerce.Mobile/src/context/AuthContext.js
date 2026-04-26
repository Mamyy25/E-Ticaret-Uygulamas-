import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userMode, setUserModeState] = useState(null); // 'buyer' | 'seller' | null
  const [loading, setLoading] = useState(true);

  const API_IP = '172.20.10.2'; // Hotspot IP Adresiniz (Otomatik tespit edildi)

  axios.defaults.baseURL = `http://${API_IP}:5133`;
  axios.defaults.timeout = 15000;


  const setUserMode = async (mode) => {
    setUserModeState(mode);
    if (mode) {
      await AsyncStorage.setItem('userMode', mode);
    } else {
      await AsyncStorage.removeItem('userMode');
    }
  };

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedMode = await AsyncStorage.getItem('userMode');
      if (storedToken) {
        authenticate(storedToken);
      }
      if (storedMode) {
        setUserModeState(storedMode);
      }
    } catch (e) {
      console.warn('Guvensiz AsyncStorage erisimi:', e);
    }
    setLoading(false);
  };

  const authenticate = (newToken) => {
    try {
      const decoded = jwtDecode(newToken);
      
      let isAdmin = false;
      let isSeller = false;

      const roleClaimKey = Object.keys(decoded).find(k => k.includes("role") || k.includes("IsAdmin"));
      if (roleClaimKey && (decoded[roleClaimKey] === "Admin" || String(decoded[roleClaimKey]).toLowerCase() === "true")) {
          isAdmin = true;
      }

      const sellerClaimKey = Object.keys(decoded).find(k => k.includes("IsSeller"));
      if (sellerClaimKey && String(decoded[sellerClaimKey]).toLowerCase() === "true") {
          isSeller = true;
      }

      setUser({ ...decoded, isAdmin, isSeller });
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
    } catch (e) {
      console.error('Token gecersiz:', e);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/AccountApi/login', { email, password });
      let newToken = response.data.token || response.data;
      if (newToken && typeof newToken === 'object' && newToken.token) {
          newToken = newToken.token;
      }

      if (newToken && typeof newToken === 'string') {
        await AsyncStorage.setItem('userToken', newToken);
        authenticate(newToken);
        return true;
      }
      return false;
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || 'Bilinmeyen bir iletişim hatası.';
      throw new Error(`${errorMsg} (Bağlanılan adres: ${axios.defaults.baseURL})`);
    }

  };

  const register = async (fullName, email, password, confirmPassword, isSeller) => {
    try {
        await axios.post("/api/AccountApi/register", { fullName, email, password, confirmPassword, isSeller });
        return true;
    } catch (e) {
        throw new Error(e.response?.data?.message || e.message || "Kayit basarisiz oldu");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userMode');
    setToken(null);
    setUser(null);
    setUserModeState(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, userMode, setUserMode, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
