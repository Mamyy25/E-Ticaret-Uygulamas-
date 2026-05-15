import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import HomeScreen            from '../screens/HomeScreen';
import ProductsScreen        from '../screens/ProductsScreen';
import ProductDetailScreen   from '../screens/ProductDetailScreen';
import LoginScreen           from '../screens/LoginScreen';
import RegisterScreen        from '../screens/RegisterScreen';
import CartScreen            from '../screens/CartScreen';
import CheckoutScreen        from '../screens/CheckoutScreen';
import OrdersScreen          from '../screens/OrdersScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import StoreProfileScreen    from '../screens/StoreProfileScreen';
import MessagesListScreen    from '../screens/MessagesListScreen';
import ChatScreen            from '../screens/ChatScreen';
import AdminDashboardScreen  from '../screens/AdminDashboardScreen';
import DiscoverScreen        from '../screens/DiscoverScreen';
import ProviderProfileScreen from '../screens/ProviderProfileScreen';
import BookingScreen         from '../screens/BookingScreen';

import { AuthContext }  from '../context/AuthContext';
import { useTheme }     from '../context/ThemeContext';
import { colors }       from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcon = (name, focused) => {
  const icons = {
    AnaSayfa: '🏠', Kesfet: '🧭', Sepet: '🛒', Mesajlar: '✉️',
    Siparisler: '📋', Profil: '👤', Magazam: '📊', Platform: '🛒'
  };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[name] || '•'}</Text>;
};

// ─── Stack'ler ───────────────────────────────────────────────
const HomeStack = () => {
  const { theme } = useTheme();
  const hs = makeHeaderStyle(theme);
  return (
    <Stack.Navigator screenOptions={hs}>
      <Stack.Screen name="HomeMain"      component={HomeScreen}         options={{ title: 'Vitrin' }} />
      <Stack.Screen name="Products"      component={ProductsScreen}     options={{ title: 'Ürünler' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params?.product?.name || 'Ürün Detay' })} />
    </Stack.Navigator>
  );
};

const CartStack = () => {
  const { theme } = useTheme();
  const hs = makeHeaderStyle(theme);
  return (
    <Stack.Navigator screenOptions={hs}>
      <Stack.Screen name="CartMain" component={CartScreen}     options={{ title: 'Sepetim' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Ödemeyi Tamamla' }} />
    </Stack.Navigator>
  );
};

const MessageStack = () => {
  const { theme } = useTheme();
  const hs = makeHeaderStyle(theme);
  return (
    <Stack.Navigator screenOptions={hs}>
      <Stack.Screen name="MessagesList" component={MessagesListScreen} options={{ title: 'Sohbetler' }} />
      <Stack.Screen name="Chat"         component={ChatScreen} />
    </Stack.Navigator>
  );
};

const DiscoverStack = () => {
  const { theme } = useTheme();
  const hs = makeHeaderStyle(theme);
  return (
    <Stack.Navigator screenOptions={hs}>
      <Stack.Screen name="DiscoverMain"    component={DiscoverScreen}        options={{ title: 'Keşfet' }} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen}
        options={{ title: 'Profil', headerTransparent: true, headerTitle: '' }} />
      <Stack.Screen name="Booking"         component={BookingScreen}         options={{ title: 'Rezervasyon' }} />
    </Stack.Navigator>
  );
};

// ─── Tab layout'ları ─────────────────────────────────────────
const ConsumerTabs = () => {
  const { theme } = useTheme();
  const tbs = makeTabBarStyle(theme);
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   theme.accent,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarStyle: tbs,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
    })}>
      <Tab.Screen name="AnaSayfa"   component={HomeStack}     options={{ title: 'Vitrin' }} />
      <Tab.Screen name="Kesfet"     component={DiscoverStack} options={{ title: 'Keşfet' }} />
      <Tab.Screen name="Sepet"      component={CartStack}     options={{ title: 'Sepetim' }} />
      <Tab.Screen name="Mesajlar"   component={MessageStack}  options={{ title: 'Mesajlar' }} />
      <Tab.Screen name="Siparisler" component={OrdersScreen}
        options={{ title: 'Siparişlerim', headerShown: true, ...makeHeaderStyle(theme) }} />
      <Tab.Screen name="Profil"     component={ProfileScreen}
        options={{ title: 'Hesabım', headerShown: true, ...makeHeaderStyle(theme) }} />
    </Tab.Navigator>
  );
};

const StoreTabs = () => {
  const { theme } = useTheme();
  const tbs = makeTabBarStyle(theme);
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   theme.primaryHover,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarStyle: tbs,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
    })}>
      <Tab.Screen name="Magazam"    component={StoreProfileScreen} options={{ title: 'Panelim' }} />
      <Tab.Screen name="Platform"   component={HomeStack}          options={{ title: 'Platform' }} />
      <Tab.Screen name="Mesajlar"   component={MessageStack}       options={{ title: 'Sohbetler' }} />
      <Tab.Screen name="Siparisler" component={OrdersScreen}
        options={{ title: 'İşlemler', headerShown: true, ...makeHeaderStyle(theme) }} />
      <Tab.Screen name="Profil"     component={ProfileScreen}
        options={{ title: 'Hesabım', headerShown: true, ...makeHeaderStyle(theme) }} />
    </Tab.Navigator>
  );
};

const GuestTabs = () => {
  const { theme } = useTheme();
  const tbs = makeTabBarStyle(theme);
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   theme.accent,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarStyle: tbs,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarIcon: ({ focused }) => {
        const icon = route.name === 'Login' ? '🔑' : '🏠';
        return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
      },
    })}>
      <Tab.Screen name="AnaSayfa" component={HomeStack}      options={{ title: 'Vitrin' }} />
      <Tab.Screen name="Login"    component={LoginScreen}    options={{ title: 'Giriş Yap', headerShown: true, ...makeHeaderStyle(theme) }} />
      <Tab.Screen name="Register" component={RegisterScreen} options={{ tabBarButton: () => null, title: 'Kayıt Ol', headerShown: true, ...makeHeaderStyle(theme) }} />
    </Tab.Navigator>
  );
};

const AdminTabs = () => {
  const { theme } = useTheme();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: true, ...makeHeaderStyle(theme),
      tabBarActiveTintColor: theme.primary,
      tabBarIcon: () => <Text style={{ fontSize: 22 }}>🛡️</Text>,
    }}>
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Denetim Masası' }} />
      <Tab.Screen name="AdminMessages"  component={MessageStack}         options={{ title: 'Destek/Mesaj', tabBarIcon: () => <Text style={{ fontSize: 22 }}>✉️</Text> }} />
    </Tab.Navigator>
  );
};

// ─── Suspension Wall ────────────────────────────────────────
const SuspensionWallScreen = () => {
  const { suspensionReason, storeStatus, logout } = useContext(AuthContext);
  const isStoreSuspended = storeStatus === 'Suspended';
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(251,113,133,0.12)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 28 }}>⚠️</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
        {isStoreSuspended ? 'Mağazanız Askıya Alındı' : 'Hesabınız Askıya Alındı'}
      </Text>
      {suspensionReason && (
        <Text style={{ fontSize: 14, color: '#FB7185', textAlign: 'center', marginBottom: 12, lineHeight: 20 }}>
          Sebep: {suspensionReason}
        </Text>
      )}
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
        Platform kurallarının ihlali nedeniyle hesabınız kısıtlanmıştır.
      </Text>
      <TouchableOpacity onPress={logout} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Pending Application Screen ──────────────────────────────
const PendingApplicationScreen = () => {
  const { storeStatus, storeRejectionReason, logout } = useContext(AuthContext);
  const isRejected = storeStatus === 'Rejected';
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.canvas }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isRejected ? 'rgba(251,113,133,0.1)' : 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: isRejected ? 'rgba(251,113,133,0.3)' : 'rgba(251,191,36,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 28 }}>{isRejected ? '❌' : '⏳'}</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
        {isRejected ? 'Başvurunuz Reddedildi' : 'Başvurunuz İnceleniyor'}
      </Text>
      {isRejected && storeRejectionReason && (
        <View style={{ backgroundColor: 'rgba(251,113,133,0.08)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.25)', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%' }}>
          <Text style={{ color: '#FB7185', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Ret Sebebi:</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{storeRejectionReason}</Text>
        </View>
      )}
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
        {isRejected
          ? 'Eksiklikleri gidererek yeniden başvurabilirsiniz.'
          : 'Onay süreci genellikle 1-3 iş günü içinde tamamlanmaktadır.'}
      </Text>
      <TouchableOpacity onPress={logout} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Ana Navigator ───────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, loading, isAdmin, hasStore, isSuspended, storeStatus } = useContext(AuthContext);

  if (loading) return null;

  // Askılı kullanıcı — tüm route'lardan önce
  if (isAuthenticated && isSuspended) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SuspensionWall" component={SuspensionWallScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Satıcı — store Pending veya Rejected
  if (isAuthenticated && hasStore && (storeStatus === 'Pending' || storeStatus === 'Rejected')) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PendingApplication" component={PendingApplicationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated
        ? <GuestTabs />
        : isAdmin
          ? <AdminTabs />
          : hasStore
            ? <StoreTabs />
            : <ConsumerTabs />
      }
    </NavigationContainer>
  );
};

// ─── Yardımcı factory'ler ─────────────────────────────────────
const makeHeaderStyle = (theme) => ({
  headerStyle:      { backgroundColor: theme.surface },
  headerTintColor:  theme.accent,
  headerTitleStyle: { fontWeight: '700', color: theme.text },
  headerBackTitle:  'Geri',
});

const makeTabBarStyle = (theme) => ({
  backgroundColor: theme.surface,
  borderTopColor:  theme.borderSubtle,
  height: 60,
  paddingBottom: 8,
  paddingTop: 4,
});

export default AppNavigator;
