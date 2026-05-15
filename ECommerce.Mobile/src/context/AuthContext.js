import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [storeRejectionReason, setStoreRejectionReason] = useState(null);
  const pollingRef = useRef(null);

  const API_IP = '172.20.10.2';
  axios.defaults.baseURL = `http://${API_IP}:5133`;
  axios.defaults.timeout = 15000;

  useEffect(() => { loadToken(); }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (storedToken) await authenticate(storedToken);
    } catch (e) {
      console.warn('AsyncStorage erişim hatası:', e);
    }
    setLoading(false);
  };

  const authenticate = async (newToken) => {
    try {
      const decoded = jwtDecode(newToken);
      const userTypeKey    = Object.keys(decoded).find(k => k.includes('UserType'));
      const subPlanKey     = Object.keys(decoded).find(k => k.includes('SubscriptionPlan'));
      const userType         = userTypeKey ? decoded[userTypeKey] : 'Consumer';
      const subscriptionPlan = subPlanKey  ? decoded[subPlanKey]  : 'Free';
      setUser({ ...decoded, userType, subscriptionPlan });
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
      await fetchAccountStatus(newToken);
      startPolling();
    } catch (e) {
      console.error('Token geçersiz:', e);
      await logout();
    }
  };

  const fetchAccountStatus = async (overrideToken) => {
    try {
      const headers = overrideToken ? { Authorization: 'Bearer ' + overrideToken } : {};
      const res = await axios.get('/api/AccountApi/me', { headers });
      setIsSuspended(!!res.data.isSuspended);
      setSuspensionReason(res.data.suspensionReason || null);
      setStoreStatus(res.data.storeStatus || null);
      setStoreRejectionReason(res.data.storeRejectionReason || null);
    } catch {
      // sessiz kal
    }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(() => fetchAccountStatus(), 60000);
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/AccountApi/login', { email, password });
      let newToken = response.data.token || response.data;
      if (newToken && typeof newToken === 'object' && newToken.token) newToken = newToken.token;
      if (newToken && typeof newToken === 'string') {
        const data = response.data;
        if (data.user) {
          setIsSuspended(!!data.user.isSuspended);
          setSuspensionReason(data.user.suspensionReason || null);
          setStoreStatus(data.user.storeStatus || null);
        }
        await AsyncStorage.setItem('userToken', newToken);
        await authenticate(newToken);
        return true;
      }
      return false;
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Bilinmeyen bir bağlantı hatası.';
      throw new Error(`${msg} (${axios.defaults.baseURL})`);
    }
  };

  const register = async (fullName, email, password, confirmPassword, userType = 'Consumer') => {
    try {
      const res = await axios.post('/api/AccountApi/register', {
        fullName, email, password, confirmPassword, userType
      });
      return { success: true, isPending: res.data.isPending ?? false, message: res.data.message };
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Kayıt başarısız oldu');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    setIsSuspended(false);
    setSuspensionReason(null);
    setStoreStatus(null);
    stopPolling();
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin    = user?.userType === 'Admin';
  const isSeller   = user?.userType === 'Seller';
  const isArtisan  = user?.userType === 'LocalArtisan';
  const isProvider = user?.userType === 'OnlineServiceProvider';
  const isConsumer = user?.userType === 'Consumer';
  const hasStore   = isSeller || isArtisan || isProvider;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout,
      isAuthenticated: !!user,
      isAdmin, isSeller, isArtisan, isProvider, isConsumer, hasStore,
      isSuspended, suspensionReason,
      storeStatus, storeRejectionReason,
      refreshAccountStatus: fetchAccountStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
