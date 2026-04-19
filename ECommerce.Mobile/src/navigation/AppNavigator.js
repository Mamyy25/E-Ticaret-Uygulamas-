import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// AnaSayfa tab'ı içinde stack navigator (Home → Products → ProductDetail)
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.surface,
      headerTitleStyle: { fontWeight: '700' },
      headerBackTitle: 'Geri',
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ title: 'Vitrin' }}
    />
    <Stack.Screen 
      name="Products" 
      component={ProductsScreen} 
      options={{ title: 'Ürünler' }}
    />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen} 
      options={({ route }) => ({ 
        title: route.params?.product?.name || route.params?.product?.Name || 'Ürün Detay' 
      })}
    />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.surface,
      headerTitleStyle: { fontWeight: '700' },
      headerBackTitle: 'Geri',
    }}
  >
    <Stack.Screen 
      name="CartMain" 
      component={CartScreen} 
      options={{ title: 'Sepetim' }}
    />
    <Stack.Screen 
      name="Checkout" 
      component={CheckoutScreen} 
      options={{ title: 'Ödemeyi Tamamla' }}
    />
  </Stack.Navigator>
);

const AuthenticatedTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { 
        backgroundColor: colors.surface, 
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
      },
      tabBarIcon: ({ focused }) => {
        let icon = '🏠';
        if (route.name === 'Sepet') icon = '🛒';
        else if (route.name === 'Siparisler') icon = '📋';
        else if (route.name === 'Profil') icon = '👤';
        return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
      },
    })}
  >
    <Tab.Screen name="AnaSayfa" component={HomeStack} options={{ title: 'Vitrin' }} />
    <Tab.Screen name="Sepet" component={CartStack} options={{ title: 'Sepetim', headerShown: false }} />
    <Tab.Screen name="Siparisler" component={OrdersScreen} options={{ title: 'Siparişlerim', headerShown: true, headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.surface }} />
    <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Hesabım', headerShown: true, headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.surface }} />
  </Tab.Navigator>
);

// Guest tab'ı içinde de aynı HomeStack kullanılır
const GuestHomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.surface,
      headerTitleStyle: { fontWeight: '700' },
      headerBackTitle: 'Geri',
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ title: 'Vitrin' }}
    />
    <Stack.Screen 
      name="Products" 
      component={ProductsScreen} 
      options={{ title: 'Ürünler' }}
    />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen} 
      options={({ route }) => ({ 
        title: route.params?.product?.name || route.params?.product?.Name || 'Ürün Detay' 
      })}
    />
  </Stack.Navigator>
);

const GuestTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { 
        backgroundColor: colors.surface, 
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
      },
      tabBarIcon: ({ focused }) => {
        let icon = '🏠';
        if (route.name === 'Login') icon = '🔑';
        return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
      },
    })}
  >
    <Tab.Screen name="AnaSayfa" component={GuestHomeStack} options={{ title: 'Vitrin' }} />
    <Tab.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap', headerShown: true, headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.surface }} />
    <Tab.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ 
            tabBarButton: () => null, 
            title: 'Kayıt Ol',
            headerShown: true,
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.surface,
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
