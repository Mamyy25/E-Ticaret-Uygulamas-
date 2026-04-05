import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const AuthenticatedTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.surface,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarIcon: ({ color }) => {
        let icon = '🏠';
        if (route.name === 'Sepet') icon = '🛒';
        else if (route.name === 'Siparisler') icon = '📋';
        else if (route.name === 'Profil') icon = '👤';
        return <Text style={{ fontSize: 20 }}>{icon}</Text>;
      },
    })}
  >
    <Tab.Screen name="AnaSayfa" component={HomeScreen} options={{ title: 'Vitrin' }} />
    <Tab.Screen name="Sepet" component={CartScreen} options={{ title: 'Sepetim' }} />
    <Tab.Screen name="Siparisler" component={OrdersScreen} options={{ title: 'Siparişlerim' }} />
    <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Hesabım' }} />
  </Tab.Navigator>
);

const GuestTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.surface,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarIcon: ({ color }) => {
        let icon = '🏠';
        if (route.name === 'Login') icon = '🔑';
        return <Text style={{ fontSize: 20 }}>{icon}</Text>;
      },
    })}
  >
    <Tab.Screen name="AnaSayfa" component={HomeScreen} options={{ title: 'Vitrin' }} />
    <Tab.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
    <Tab.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ 
            tabBarButton: () => null, 
            title: 'Kayıt Ol', 
            tabBarVisible: false 
        }} 
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedTabs /> : <GuestTabs />}
    </NavigationContainer>
  );
};

export default AppNavigator;
