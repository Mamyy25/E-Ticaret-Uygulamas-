import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import { API_BASE } from '../config';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Divider from '../components/Divider';
import Button from '../components/Button';

const TYPE_LABEL = {
  Consumer:              { label: 'Kairos Üyesi',  variant: 'primary',  icon: 'person-circle-outline' },
  LocalArtisan:          { label: 'Yerel Esnaf',   variant: 'success',  icon: 'construct-outline' },
  OnlineServiceProvider: { label: 'Online Uzman',  variant: 'info',     icon: 'laptop-outline' },
  Seller:                { label: 'Satıcı',         variant: 'warning',  icon: 'storefront-outline' },
  Admin:                 { label: 'Yönetici',       variant: 'danger',   icon: 'shield-checkmark-outline' },
};

function MenuRow({ icon, label, sub, onPress, rightEl, danger = false, iconBg, iconColor }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 4 }).start()}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[s.menuRow, { transform: [{ scale }] }]}>
        <View style={[s.menuIcon, {
          backgroundColor: iconBg ?? (danger ? colors.dangerSoft : colors.primarySoft),
        }]}>
          <Ionicons name={icon} size={18} color={iconColor ?? (danger ? colors.danger : colors.primary)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
          {sub && <Text style={s.menuSub}>{sub}</Text>}
        </View>
        {rightEl !== undefined ? rightEl : <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Edit form input ──────────────────────────────────────────
function EditInput({ label, icon, value, onChangeText, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const borderColor = borderAnim.interpolate({ inputRange: [0,1], outputRange: [colors.border, colors.primary] });

  return (
    <View style={s.editInputWrap}>
      <Text style={s.editInputLabel}>{label}</Text>
      <Animated.View style={[s.editInputBox, { borderColor }]}>
        <Ionicons name={icon} size={16} color={focused ? colors.primary : colors.textMuted} />
        <TextInput
          style={s.editInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          placeholderTextColor={colors.textMuted}
          onFocus={() => { setFocused(true); Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); }}
          onBlur={() => { setFocused(false); Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); }}
        />
      </Animated.View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, isAdmin, hasStore, refreshAccountStatus, refreshProfile } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [isEditing,  setIsEditing]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [fullName,   setFullName]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [city,       setCity]       = useState('');
  const [address,    setAddress]    = useState('');

  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerY     = useRef(new Animated.Value(-20)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const editHeight  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerY,    { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(contentFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const startEdit = () => {
    setFullName(user?.fullName || user?.name || '');
    setPhone(user?.phone || '');
    setCity(user?.city || '');
    setAddress(user?.address || '');
    setIsEditing(true);
    Animated.spring(editHeight, { toValue: 1, friction: 7, useNativeDriver: false }).start();
  };

  const cancelEdit = () => {
    setIsEditing(false);
    Animated.timing(editHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const saveEdit = async () => {
    if (!fullName.trim()) { Alert.alert('Hata', 'Ad soyad boş olamaz.'); return; }
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/AccountApi/profile`, { fullName, phone, city, address });
      await refreshProfile?.();
      setIsEditing(false);
      Animated.timing(editHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Kaydedilemedi.');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const typeInfo = TYPE_LABEL[user?.userType] ?? TYPE_LABEL.Consumer;

  const consumerLinks = [
    { icon: 'receipt-outline',    label: 'Siparişlerim',   sub: 'Geçmiş alışverişler',  onPress: () => navigation.navigate('Orders') },
    { icon: 'heart-outline',      label: 'Favorilerim',    sub: 'Kayıtlı mağaza & ürün', onPress: () => navigation.navigate('Favoriler'),
      iconBg: 'rgba(186,26,26,0.08)', iconColor: colors.danger },
    { icon: 'chatbubbles-outline', label: 'Mesajlarım',    sub: 'Tüm sohbetler',         onPress: () => navigation.navigate('Mesajlar') },
    { icon: 'shield-outline',      label: 'İtirazlarım',   sub: 'Askı kararları',         onPress: () => navigation.navigate('MyAppeals'),
      iconBg: 'rgba(251,113,133,0.1)', iconColor: colors.danger },
  ];

  const sellerLinks = [
    { icon: 'storefront-outline',  label: 'Mağazam',          sub: 'Paneline git',       onPress: () => navigation.navigate('Magazam') },
    { icon: 'heart-outline',       label: 'Favorilerim',      sub: 'Kayıtlı öğeler',     onPress: () => navigation.navigate('Favoriler'),
      iconBg: 'rgba(186,26,26,0.08)', iconColor: colors.danger },
    { icon: 'chatbubbles-outline', label: 'Mesajlarım',       sub: 'Müşteri mesajları',  onPress: () => navigation.navigate('Mesajlar') },
    { icon: 'shield-outline',      label: 'İtirazlarım',      sub: 'Askı kararları',     onPress: () => navigation.navigate('MyAppeals'),
      iconBg: 'rgba(251,113,133,0.1)', iconColor: colors.danger },
  ];

  const adminLinks = [
    { icon: 'shield-checkmark-outline', label: 'Denetim Masası', sub: 'Admin paneli', onPress: () => {} },
  ];

  const links = isAdmin ? adminLinks : hasStore ? sellerLinks : consumerLinks;

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header (gradient) ── */}
        <LinearGradient
          colors={['rgba(70,72,212,0.13)', 'rgba(70,72,212,0.05)', colors.canvas]}
          style={[s.headerGradient, { paddingTop: insets.top + space[4] }]}
        >
          <Animated.View style={[s.header, { opacity: headerFade, transform: [{ translateY: headerY }] }]}>
            <View style={s.avatarWrap}>
              <Avatar name={user?.fullName || user?.name || 'K'} size={72} />
            </View>
            <View style={s.headerInfo}>
              <Text style={s.name}>{user?.fullName || user?.name || 'Kullanıcı'}</Text>
              <Text style={s.email}>{user?.email}</Text>
              <View style={{ marginTop: space[2] }}>
                <Badge label={typeInfo.label} variant={typeInfo.variant} dot />
              </View>
            </View>
            {/* Düzenle butonu */}
            <TouchableOpacity
              style={s.editBtn}
              onPress={isEditing ? cancelEdit : startEdit}
              activeOpacity={0.7}
            >
              <Ionicons name={isEditing ? 'close' : 'pencil-outline'} size={17} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        <Animated.View style={{ opacity: contentFade }}>

          {/* ── Bilgi kartı / Edit formu ── */}
          {isEditing ? (
            <View style={[s.infoCard, { padding: space[4] }]}>
              <Text style={s.editFormTitle}>Profili Düzenle</Text>
              <EditInput label="Ad Soyad"  icon="person-outline"   value={fullName}  onChangeText={setFullName} autoCapitalize="words" />
              <EditInput label="Telefon"   icon="call-outline"     value={phone}     onChangeText={setPhone}    keyboardType="phone-pad" autoCapitalize="none" />
              <EditInput label="Şehir"     icon="location-outline" value={city}      onChangeText={setCity} />
              <EditInput label="Adres"     icon="home-outline"     value={address}   onChangeText={setAddress} />
              <View style={{ flexDirection: 'row', gap: space[3], marginTop: space[4] }}>
                <Button label="İptal"   onPress={cancelEdit}  variant="secondary" size="md" style={{ flex: 1 }} />
                <Button label="Kaydet"  onPress={saveEdit}    variant="primary"   size="md" style={{ flex: 1 }} loading={saving} />
              </View>
            </View>
          ) : (
            <View style={s.infoCard}>
              {[
                { icon: 'mail-outline',     label: 'E-Posta', val: user?.email   || '—' },
                { icon: 'call-outline',     label: 'Telefon', val: user?.phone   || '—' },
                { icon: 'location-outline', label: 'Şehir',   val: user?.city    || '—' },
              ].map((row, i) => (
                <React.Fragment key={row.label}>
                  <View style={s.infoRow}>
                    <Ionicons name={row.icon} size={15} color={colors.textMuted} />
                    <Text style={s.infoLabel}>{row.label}</Text>
                    <Text style={s.infoVal} numberOfLines={1}>{row.val}</Text>
                  </View>
                  {i < 2 && <Divider />}
                </React.Fragment>
              ))}
            </View>
          )}

          {/* ── Menü ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Hesabım</Text>
            <View style={s.menuCard}>
              {links.map((lnk, i) => (
                <React.Fragment key={lnk.label}>
                  <MenuRow {...lnk} />
                  {i < links.length - 1 && <Divider style={{ marginHorizontal: space[4] }} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── Çıkış ── */}
          <View style={[s.section, { marginBottom: insets.bottom + space[6] }]}>
            <View style={s.menuCard}>
              <MenuRow icon="log-out-outline" label="Çıkış Yap" onPress={handleLogout} danger rightEl={null} />
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  headerGradient: {
    paddingHorizontal: space[5],
    paddingBottom: space[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  avatarWrap: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  headerInfo: { flex: 1, gap: space[1] },
  name:   { fontFamily: fonts.display,   fontSize: fontSize.xl,  color: colors.text },
  email:  { fontFamily: fonts.body,      fontSize: fontSize.sm,  color: colors.textMuted },
  editBtn: {
    width: 38, height: 38, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  infoCard: {
    margin: space[5],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
  },
  infoLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted, width: 60 },
  infoVal:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, flex: 1, textAlign: 'right' },

  // Edit form
  editFormTitle: {
    fontFamily: fonts.displayBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: space[4],
  },
  editInputWrap: { gap: space[1], marginBottom: space[3] },
  editInputLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary },
  editInputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5, borderRadius: radius.lg,
    paddingHorizontal: space[3], paddingVertical: space[3],
    gap: space[3],
  },
  editInput: {
    flex: 1, fontFamily: fonts.body, fontSize: fontSize.base, color: colors.text, padding: 0,
  },

  section: { paddingHorizontal: space[5], marginBottom: space[3] },
  sectionTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: space[3],
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: space[4], padding: space[4],
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSize.base, color: colors.text },
  menuSub:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
});
