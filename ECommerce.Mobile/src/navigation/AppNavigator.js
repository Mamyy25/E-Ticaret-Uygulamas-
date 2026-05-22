import { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

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
import AdminProfileScreen    from '../screens/AdminProfileScreen';
import DiscoverScreen        from '../screens/DiscoverScreen';
import ServicesScreen           from '../screens/ServicesScreen';
import SellerHomeScreen         from '../screens/SellerHomeScreen';
import SellerDashboardScreen    from '../screens/SellerDashboardScreen';
import CustomerRequestsScreen   from '../screens/CustomerRequestsScreen';
import CustomerRecordsScreen    from '../screens/CustomerRecordsScreen';
import PaymentRecordsScreen     from '../screens/PaymentRecordsScreen';
import JobRecordsScreen         from '../screens/JobRecordsScreen';
import ProviderProfileScreen    from '../screens/ProviderProfileScreen';
import BookingScreen            from '../screens/BookingScreen';
import FavoritesScreen          from '../screens/FavoritesScreen';
import InvoicesScreen           from '../screens/InvoicesScreen';
import MyAppealsScreen          from '../screens/MyAppealsScreen';
import AppointmentsScreen       from '../screens/AppointmentsScreen';
import SellerOrdersScreen       from '../screens/SellerOrdersScreen';

import BottomTabBar from '../components/BottomTabBar';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize } from '../theme/typography';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HEADER_STYLE = {
  headerStyle:      { backgroundColor: colors.surface },
  headerTintColor:  colors.primary,
  headerTitleStyle: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text },
  headerBackTitle:  'Geri',
  headerShadowVisible: false,
  headerBorderBottomColor: colors.borderSubtle,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.canvas },
};

const HEADER_DARK = {
  headerStyle:      { backgroundColor: '#110E1E' },
  headerTintColor:  '#A78BFA',
  headerTitleStyle: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: '#EAE8F4' },
  headerBackTitle:  'Geri',
  headerShadowVisible: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: '#080613' },
};

// ─── Stack'ler ────────────────────────────────────────────────

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ ...HEADER_STYLE, headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="HomeMain"          component={HomeScreen} />
    <Stack.Screen name="Orders"            component={OrdersScreen}        options={{ headerShown: true, title: 'Siparişlerim' }} />
    <Stack.Screen name="Products"          component={ProductsScreen}      options={{ headerShown: true, title: 'Ürünler' }} />
    <Stack.Screen name="ProductDetail"     component={ProductDetailScreen} options={({ route }) => ({ headerShown: true, title: route.params?.product?.name || 'Ürün Detay' })} />
    <Stack.Screen name="CustomerRequests"  component={CustomerRequestsScreen} options={{ headerShown: true, title: 'Taleplerim' }} />
    <Stack.Screen name="ProviderProfile"   component={ProviderProfileScreen}  options={{ headerShown: false }} />
    <Stack.Screen name="MyAppointments"    component={AppointmentsScreen}     options={{ headerShown: true, title: 'Randevularım' }} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="CartMain" component={CartScreen}     options={{ title: 'Sepetim' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Ödemeyi Tamamla' }} />
  </Stack.Navigator>
);

const MessageStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="MessagesList" component={MessagesListScreen} options={{ title: 'Sohbetler' }} />
    <Stack.Screen name="Chat"         component={ChatScreen} />
  </Stack.Navigator>
);

const DiscoverStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="DiscoverMain"      component={DiscoverScreen}           options={{ headerShown: false }} />
    <Stack.Screen name="Services"          component={ServicesScreen}           options={{ title: 'Hizmetler' }} />
    <Stack.Screen name="Products"          component={ProductsScreen}           options={{ title: 'Ürünler' }} />
    <Stack.Screen name="ProductDetail"     component={ProductDetailScreen}      options={({ route }) => ({ title: route.params?.product?.name || 'Ürün Detay' })} />
    <Stack.Screen name="CustomerRequests"  component={CustomerRequestsScreen}   options={{ title: 'Taleplerim' }} />
    <Stack.Screen name="ProviderProfile"   component={ProviderProfileScreen}    options={{ headerShown: false }} />
    <Stack.Screen name="Booking"           component={BookingScreen}            options={{ title: 'Rezervasyon' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen name="ProfileMain"       component={ProfileScreen}           options={{ title: 'Hesabım' }} />
    <Stack.Screen name="Orders"            component={OrdersScreen}            options={{ title: 'Siparişlerim' }} />
    <Stack.Screen name="Favoriler"         component={FavoritesScreen}         options={{ title: 'Favorilerim' }} />
    <Stack.Screen name="CustomerRequests"  component={CustomerRequestsScreen}  options={{ title: 'Taleplerim' }} />
    <Stack.Screen name="MyAppeals"         component={MyAppealsScreen}         options={{ title: 'İtirazlarım' }} />
    <Stack.Screen name="MyAppointments"    component={AppointmentsScreen}      options={{ title: 'Randevularım' }} />
  </Stack.Navigator>
);

// ─── Tab layout'ları ──────────────────────────────────────────

const ConsumerTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="AnaSayfa" component={HomeStack} />
    <Tab.Screen name="Kesfet"   component={DiscoverStack} options={{ tabBarLabel: 'Keşfet' }} />
    <Tab.Screen name="Sepet"    component={CartStack} />
    <Tab.Screen name="Mesajlar" component={MessageStack} />
    <Tab.Screen name="Profil"   component={ProfileStack} />
  </Tab.Navigator>
);

// Satıcı ana sayfa stack'i: dashboard + yönetim araçları
const SellerHomeStack = () => (
  <Stack.Navigator screenOptions={{ ...HEADER_STYLE, headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="SellerHomeMain"   component={SellerHomeScreen} />
    <Stack.Screen name="StoreManage"      component={StoreProfileScreen}    options={{ headerShown: true, title: 'Yönetim Paneli' }} />
    <Stack.Screen name="Siparisler"       component={SellerOrdersScreen}    options={{ headerShown: true, title: 'Gelen Siparişler' }} />
    <Stack.Screen name="CustomerRequests" component={CustomerRequestsScreen} options={{ headerShown: true, title: 'Taleplerim' }} />
    <Stack.Screen name="ProductDetail"    component={ProductDetailScreen} options={({ route }) => ({ headerShown: true, title: route.params?.product?.name || 'Ürün Detay' })} />
    <Stack.Screen name="Booking"          component={BookingScreen}       options={{ headerShown: true, title: 'Rezervasyon' }} />
  </Stack.Navigator>
);

// Satıcı iş paneli stack'i: gelir, SaaS araçlar
const SellerDashboardStack = () => (
  <Stack.Navigator screenOptions={{ ...HEADER_STYLE, headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="DashboardMain"   component={SellerDashboardScreen} />
    <Stack.Screen name="CustomerRecords" component={CustomerRecordsScreen} options={{ headerShown: true, title: 'Müşteri Defteri' }} />
    <Stack.Screen name="JobRecords"      component={JobRecordsScreen}      options={{ headerShown: true, title: 'İş Kayıtları' }} />
    <Stack.Screen name="PaymentRecords"  component={PaymentRecordsScreen}  options={{ headerShown: true, title: 'Ödeme Takibi' }} />
    <Stack.Screen name="Siparisler"      component={SellerOrdersScreen}    options={{ headerShown: true, title: 'Gelen Siparişler' }} />
    <Stack.Screen name="StoreManage"     component={StoreProfileScreen}    options={{ headerShown: true, title: 'Yönetim Paneli' }} />
    <Stack.Screen name="Invoices"        component={InvoicesScreen}        options={{ headerShown: true, title: 'Faturalar' }} />
  </Stack.Navigator>
);

// Satıcı vitrin stack'i: kendi mağazasını müşteri gibi görür
const SellerMagazamStack = () => {
  const { myStoreId } = useContext(AuthContext);
  const [resolvedId, setResolvedId] = useState(myStoreId);

  useEffect(() => {
    if (!resolvedId) {
      axios.get('/api/StoresApi/MyStore')
        .then(r => { if (r.data?.id) setResolvedId(r.data.id); })
        .catch(() => {});
    }
  }, []);

  if (!resolvedId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ ...HEADER_STYLE }}>
      <Stack.Screen name="StorePublicView" options={{ headerShown: false }}>
        {(props) => (
          <ProviderProfileScreen
            {...props}
            route={{
              ...props.route,
              params: {
                ...(props.route.params ?? {}),
                store: { id: resolvedId },
                isOwner: true,
              },
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Rezervasyon' }} />
    </Stack.Navigator>
  );
};

const StoreTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="AnaSayfa"  component={SellerHomeStack}      options={{ tabBarLabel: 'Ana Sayfa' }} />
    <Tab.Screen name="Dashboard" component={SellerDashboardStack} options={{ tabBarLabel: 'Panelim' }} />
    <Tab.Screen name="Magazam"   component={SellerMagazamStack}   options={{ tabBarLabel: 'Mağazam' }} />
    <Tab.Screen name="Mesajlar"  component={MessageStack} />
    <Tab.Screen name="Profil"    component={ProfileStack} />
  </Tab.Navigator>
);

const GuestTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="AnaSayfa" component={HomeStack} />
    <Tab.Screen name="Kesfet"   component={DiscoverStack} options={{ tabBarLabel: 'Keşfet' }} />
    <Tab.Screen name="GirisYap" component={LoginScreen}
      options={{ tabBarLabel: 'Giriş Yap', headerShown: false }} />
    <Tab.Screen name="KayitOl"  component={RegisterScreen}
      options={{ tabBarButton: () => null, tabBarLabel: 'Kayıt Ol', headerShown: false }} />
  </Tab.Navigator>
);

const AdminMessageStack = () => (
  <Stack.Navigator screenOptions={HEADER_DARK}>
    <Stack.Screen name="MessagesList" component={MessagesListScreen} options={{ title: 'Sohbetler' }} />
    <Stack.Screen name="Chat"         component={ChatScreen} />
  </Stack.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="AdminPanel"    component={AdminDashboardScreen}
      options={{ tabBarLabel: 'Denetim Masası' }} />
    <Tab.Screen name="AdminMesajlar" component={AdminMessageStack}
      options={{ tabBarLabel: 'Mesajlar' }} />
    <Tab.Screen name="AdminProfil"   component={AdminProfileScreen}
      options={{ tabBarLabel: 'Profil' }} />
  </Tab.Navigator>
);

// ─── Suspension Wall ──────────────────────────────────────────

const SuspensionWallScreen = () => {
  const { suspensionReason, storeStatus, logout } = useContext(AuthContext);
  const isStoreSuspended = storeStatus === 'Suspended';
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.dangerSoft,
        borderWidth: 1, borderColor: 'rgba(186,26,26,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
      }}>
        <Ionicons name="warning-outline" size={32} color={colors.danger} />
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text, marginBottom: 8, textAlign: 'center' }}>
        {isStoreSuspended ? 'Mağazanız Askıya Alındı' : 'Hesabınız Askıya Alındı'}
      </Text>
      {suspensionReason && (
        <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.danger, textAlign: 'center', marginBottom: 12, lineHeight: 20 }}>
          Sebep: {suspensionReason}
        </Text>
      )}
      <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>
        Platform kurallarının ihlali nedeniyle hesabınız kısıtlanmıştır.
      </Text>
      <TouchableOpacity onPress={logout} style={{
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
      }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.textSecondary, fontSize: fontSize.base }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Pending Application Screen ───────────────────────────────

const PendingApplicationScreen = () => {
  const { storeStatus, storeRejectionReason, logout } = useContext(AuthContext);
  const isRejected = storeStatus === 'Rejected';
  return (
    <ScrollView contentContainerStyle={{
      flexGrow: 1, justifyContent: 'center', alignItems: 'center',
      padding: 24, backgroundColor: colors.canvas,
    }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: isRejected ? colors.dangerSoft : colors.warningSoft,
        borderWidth: 1, borderColor: isRejected ? 'rgba(186,26,26,0.25)' : 'rgba(180,83,9,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
      }}>
        <Ionicons
          name={isRejected ? 'close-circle-outline' : 'time-outline'}
          size={32}
          color={isRejected ? colors.danger : colors.warning}
        />
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text, marginBottom: 8, textAlign: 'center' }}>
        {isRejected ? 'Başvurunuz Reddedildi' : 'Başvurunuz İnceleniyor'}
      </Text>
      {isRejected && storeRejectionReason && (
        <View style={{
          backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(186,26,26,0.25)',
          borderRadius: 12, padding: 12, marginBottom: 12, width: '100%',
        }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.danger, fontSize: fontSize.sm, marginBottom: 4 }}>Ret Sebebi:</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 }}>{storeRejectionReason}</Text>
        </View>
      )}
      <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>
        {isRejected
          ? 'Eksiklikleri gidererek yeniden başvurabilirsiniz.'
          : 'Onay süreci genellikle 1-3 iş günü içinde tamamlanmaktadır.'}
      </Text>
      <TouchableOpacity onPress={logout} style={{
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
      }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.textSecondary, fontSize: fontSize.base }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Ana Navigator ────────────────────────────────────────────

const AppNavigator = () => {
  const { isAuthenticated, loading, isAdmin, hasStore, isSuspended, storeStatus } = useContext(AuthContext);

  if (loading) return null;

  if (isAuthenticated && isSuspended) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SuspensionWall" component={SuspensionWallScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

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

export default AppNavigator;
