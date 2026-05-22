import { useRef, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, radius, space } from '../theme/typography';

const DARK = {
  bg:         '#110E1E',
  border:     'rgba(167,139,250,0.16)',
  active:     '#A78BFA',
  activeSoft: 'rgba(167,139,250,0.14)',
  muted:      '#6B6385',
  shadow:     'rgba(0,0,0,0.50)',
  badgeBorder:'#110E1E',
};

const ICON_MAP = {
  AnaSayfa:         { focused: 'home',             outline: 'home-outline' },
  'Ana Sayfa':      { focused: 'home',             outline: 'home-outline' },
  Keşfet:           { focused: 'compass',           outline: 'compass-outline' },
  Sepet:            { focused: 'bag',               outline: 'bag-outline' },
  Mesajlar:         { focused: 'chatbubbles',       outline: 'chatbubbles-outline' },
  Profil:           { focused: 'person',            outline: 'person-outline' },
  Magazam:          { focused: 'storefront',        outline: 'storefront-outline' },
  Mağazam:          { focused: 'storefront',        outline: 'storefront-outline' },
  Dashboard:        { focused: 'stats-chart',       outline: 'stats-chart-outline' },
  Panelim:          { focused: 'stats-chart',       outline: 'stats-chart-outline' },
  Platform:         { focused: 'grid',              outline: 'grid-outline' },
  Siparişler:       { focused: 'receipt',           outline: 'receipt-outline' },
  'Giriş Yap':      { focused: 'log-in',            outline: 'log-in-outline' },
  'Denetim Masası': { focused: 'shield-checkmark',  outline: 'shield-checkmark-outline' },
};

export default function BottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useContext(AuthContext);

  // Temaya göre renk seti seç
  const C = isAdmin ? {
    bg:         DARK.bg,
    border:     DARK.border,
    active:     DARK.active,
    activeSoft: DARK.activeSoft,
    muted:      DARK.muted,
    shadow:     DARK.shadow,
    badgeBorder:DARK.badgeBorder,
  } : {
    bg:         colors.surface,
    border:     colors.borderSubtle,
    active:     colors.primary,
    activeSoft: colors.primarySoft,
    muted:      colors.textMuted,
    shadow:     colors.shadowCard,
    badgeBorder:colors.surface,
  };

  const visible = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => descriptors[route.key]?.options?.tabBarButton == null);

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: C.bg,
        borderTopColor: C.border,
        paddingBottom: insets.bottom || space[2],
        ...Platform.select({
          ios:     { shadowColor: C.shadow },
          android: {},
        }),
      },
    ]}>
      {visible.map(({ route, index }) => {
        const isFocused = state.index === index;
        const label = descriptors[route.key]?.options?.tabBarLabel ?? route.name;
        const badgeCount = descriptors[route.key]?.options?.tabBarBadge;
        const iconSet = ICON_MAP[label] ?? ICON_MAP[route.name] ?? { focused: 'ellipse', outline: 'ellipse-outline' };

        const scale = useRef(new Animated.Value(1)).current;
        useEffect(() => {
          if (isFocused) {
            Animated.sequence([
              Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
            ]).start();
          }
        }, [isFocused]);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={styles.tab}>
            <Animated.View style={[
              styles.iconWrap,
              isFocused && { backgroundColor: C.activeSoft },
              { transform: [{ scale }] },
            ]}>
              <Ionicons
                name={isFocused ? iconSet.focused : iconSet.outline}
                size={22}
                color={isFocused ? C.active : C.muted}
              />
              {badgeCount != null && badgeCount > 0 && (
                <View style={[styles.badge, { borderColor: C.badgeBorder }]}>
                  <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                </View>
              )}
            </Animated.View>
            <Text style={[styles.label, { color: C.muted }, isFocused && { color: C.active, fontFamily: fonts.bodySemiBold }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: space[2],
    paddingHorizontal: space[2],
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  tab:      { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 40, height: 32, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  label:    { fontFamily: fonts.body, fontSize: 10 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#fff' },
});
