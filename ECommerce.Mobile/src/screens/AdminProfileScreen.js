import { useContext, useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { fonts, fontSize } from '../theme/typography';
import AdminSymbol from '../components/AdminSymbol';

// ── Admin Dark Palette (aynı) ────────────────────────────────────
const A = {
  bg:         '#080613',
  surface:    '#110E1E',
  elevated:   '#1C1828',
  border:     'rgba(167,139,250,0.13)',
  borderHi:   'rgba(167,139,250,0.32)',
  text:       '#EAE8F4',
  sub:        '#A89FC4',
  muted:      '#6B6385',
  violet:     '#A78BFA',
  violetSoft: 'rgba(167,139,250,0.13)',
  green:      '#34D399',
  greenSoft:  'rgba(52,211,153,0.10)',
  red:        '#FB7185',
  redSoft:    'rgba(251,113,133,0.10)',
  cyan:       '#22D3EE',
  yellow:     '#FBBF24',
  yellowSoft: 'rgba(251,191,36,0.10)',
};

// ── InfoRow bileşeni ─────────────────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor, last }) => (
  <View style={[ss.infoRow, !last && ss.infoRowBorder]}>
    <View style={ss.infoIconWrap}>
      <Ionicons name={icon} size={15} color={A.violet} />
    </View>
    <Text style={ss.infoLabel}>{label}</Text>
    <Text style={[ss.infoValue, valueColor && { color: valueColor }]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

// ── StatPill bileşeni ────────────────────────────────────────────
const StatPill = ({ icon, label, value, color, soft }) => (
  <View style={[ss.statPill, { borderTopColor: color }]}>
    <View style={[ss.statPillIcon, { backgroundColor: soft }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <Text style={[ss.statPillVal, { color }]}>{value}</Text>
    <Text style={ss.statPillLabel}>{label}</Text>
  </View>
);

// ── GCard bileşeni ───────────────────────────────────────────────
const GCard = ({ children, accent, style }) => (
  <View style={[ss.gCard, accent && { borderLeftColor: accent, borderLeftWidth: 2 }, style]}>
    {children}
  </View>
);

// ────────────────────────────────────────────────────────────────
//  ADMIN PROFILE SCREEN
// ────────────────────────────────────────────────────────────────
const AdminProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);

  const [profile, setProfile]   = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, usersRes, storesRes] = await Promise.all([
          axios.get('/api/AccountApi/me').catch(() => ({ data: {} })),
          axios.get('/api/AccountApi/admin/users').catch(() => ({ data: [] })),
          axios.get('/api/StoresApi?includeAll=true').catch(() => ({ data: [] })),
        ]);
        setProfile(meRes.data);
        const users  = usersRes.data  || [];
        const stores = storesRes.data || [];
        setStats({
          totalUsers:     users.length,
          activeStores:   stores.filter(s => s.status === 'Active').length,
          suspendedUsers: users.filter(u => u.isSuspended).length,
          totalStores:    stores.length,
        });
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim,    { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(avatarScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();
      }
    };
    load();
  }, []);

  // JWT'den çıkar — ASP.NET Core çeşitli claim formatları kullanabilir
  const claimVal = (keys) => {
    if (!user) return null;
    for (const k of keys) {
      const found = Object.keys(user).find(x => x.toLowerCase().includes(k));
      if (found && user[found]) return user[found];
    }
    return null;
  };

  const displayName  = profile?.fullName
    || claimVal(['unique_name', 'name', 'givenname'])
    || 'Super Admin';
  const displayEmail = profile?.email
    || claimVal(['email', 'emailaddress'])
    || 'superadmin@kairos.com';
  const userId = claimVal(['nameidentifier', 'sub', 'nameid']) || '9999';
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = () =>
    Alert.alert(
      'Oturumu Kapat',
      'Denetim masasından çıkmak istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
      ]
    );

  return (
    <View style={ss.root}>
      <AdminSymbol />

      {/* ─── Header ─── */}
      <LinearGradient colors={['#1A0838', '#0F0A1E', A.bg]} style={ss.header}>
        <SafeAreaView edges={['top']}>
          <View style={ss.headerInner}>
            <LinearGradient colors={['#7C3AED', '#A78BFA']} style={ss.kBadge}>
              <Text style={ss.kLetter}>K</Text>
            </LinearGradient>
            <View>
              <Text style={ss.headerTitle}>Profil</Text>
              <Text style={ss.headerSub}>Hesap & Sistem Bilgileri</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={ss.loadingWrap}>
          <ActivityIndicator color={A.violet} size="large" />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={ss.content}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Avatar + kimlik ─── */}
            <View style={ss.avatarSection}>
              <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
                <LinearGradient
                  colors={['#5B21B6', '#A78BFA', '#7C3AED']}
                  style={ss.avatarCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={ss.avatarInitials}>{initials}</Text>
                </LinearGradient>
                {/* Online dot */}
                <View style={ss.onlineDot} />
              </Animated.View>

              <Text style={ss.profileName}>{displayName}</Text>
              <Text style={ss.profileEmail}>{displayEmail}</Text>

              {/* Super Admin badge */}
              <View style={ss.adminBadge}>
                <LinearGradient
                  colors={['rgba(167,139,250,0.25)', 'rgba(124,58,237,0.15)']}
                  style={ss.adminBadgeGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="shield-checkmark" size={13} color={A.violet} />
                  <Text style={ss.adminBadgeTxt}>SUPER ADMIN</Text>
                </LinearGradient>
              </View>
            </View>

            {/* ─── Platform istatistikleri ─── */}
            {stats && (
              <>
                <View style={ss.sectionHead}>
                  <Ionicons name="stats-chart" size={13} color={A.violet} />
                  <Text style={ss.sectionHeadTxt}>Platform Özeti</Text>
                </View>
                <View style={ss.statRow}>
                  <StatPill icon="people"     label="Kullanıcı"  value={stats.totalUsers}     color={A.violet} soft={A.violetSoft} />
                  <StatPill icon="storefront" label="Mağaza"     value={stats.totalStores}    color={A.cyan}   soft="rgba(34,211,238,0.10)" />
                  <StatPill icon="checkmark-circle" label="Aktif Mağ." value={stats.activeStores} color={A.green} soft={A.greenSoft} />
                  <StatPill icon="ban"        label="Askılı Kull." value={stats.suspendedUsers} color={A.red}  soft={A.redSoft} />
                </View>
              </>
            )}

            {/* ─── Hesap bilgileri ─── */}
            <View style={ss.sectionHead}>
              <Ionicons name="person-circle-outline" size={13} color={A.violet} />
              <Text style={ss.sectionHeadTxt}>Hesap Bilgileri</Text>
            </View>
            <GCard accent={A.violet}>
              <InfoRow icon="id-card-outline"          label="Kullanıcı ID"   value={`#${userId}`} />
              <InfoRow icon="shield-half-outline"      label="Rol"            value="Super Administrator" valueColor={A.violet} />
              <InfoRow icon="person-outline"           label="Ad Soyad"       value={displayName} />
              <InfoRow icon="mail-outline"             label="E-posta"        value={displayEmail} />
              <InfoRow icon="checkmark-circle-outline" label="Hesap Durumu"   value="Aktif" valueColor={A.green} last />
            </GCard>

            {/* ─── Sistem bilgileri ─── */}
            <View style={ss.sectionHead}>
              <Ionicons name="server-outline" size={13} color={A.cyan} />
              <Text style={ss.sectionHeadTxt}>Sistem Bilgileri</Text>
            </View>
            <GCard accent={A.cyan}>
              <InfoRow icon="layers-outline"       label="Platform"    value="Kairos" />
              <InfoRow icon="code-slash-outline"   label="Versiyon"    value="v1.0 — Beta" />
              <InfoRow icon="cloud-outline"        label="Backend"     value="ASP.NET Core 8" />
              <InfoRow icon="globe-outline"        label="API"         value={axios.defaults.baseURL || 'localhost:5133'} />
              <InfoRow icon="git-branch-outline"   label="Ortam"       value="Development" valueColor={A.yellow} last />
            </GCard>

            {/* ─── Yetki özeti ─── */}
            <View style={ss.sectionHead}>
              <Ionicons name="key-outline" size={13} color={A.yellow} />
              <Text style={ss.sectionHeadTxt}>Yetki Kapsamı</Text>
            </View>
            <GCard accent={A.yellow}>
              {[
                { icon: 'people-outline',     text: 'Kullanıcı yönetimi (görüntüle, askıya al, kaldır)' },
                { icon: 'storefront-outline', text: 'Mağaza yönetimi (onayla, reddet, askı)' },
                { icon: 'flag-outline',       text: 'Şikayet inceleme ve çözümleme' },
                { icon: 'scale-outline',      text: 'İtiraz değerlendirme ve yanıtlama' },
                { icon: 'clipboard-outline',  text: 'Başvuru onaylama ve reddetme' },
              ].map((p, i, arr) => (
                <View key={i} style={[ss.permRow, i < arr.length - 1 && ss.infoRowBorder]}>
                  <View style={[ss.permIconWrap, { backgroundColor: A.yellowSoft }]}>
                    <Ionicons name={p.icon} size={13} color={A.yellow} />
                  </View>
                  <Text style={ss.permTxt}>{p.text}</Text>
                </View>
              ))}
            </GCard>

            {/* ─── Çıkış ─── */}
            <TouchableOpacity style={ss.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={16} color={A.red} />
              <Text style={ss.logoutTxt}>Oturumu Kapat</Text>
            </TouchableOpacity>

            {/* ─── Footer ─── */}
            <View style={ss.footer}>
              <Text style={ss.footerTxt}>Kairos Admin Panel · v1.0</Text>
              <Text style={ss.footerTxt}>© 2026 Kairos Platform · Tüm hakları saklıdır</Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bg },

  // Header
  header:      { paddingBottom: 8 },
  headerInner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  kBadge:      { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  kLetter:     { fontFamily: fonts.display, fontSize: 19, color: '#fff', letterSpacing: -0.5 },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSize.md, color: A.text, letterSpacing: -0.3 },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: A.muted, marginTop: 1 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: { padding: 16, paddingBottom: 48 },

  // Avatar section
  avatarSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 4 },
  avatarCircle:  {
    width: 90, height: 90, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: A.violet, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 16,
    elevation: 12,
  },
  avatarInitials: { fontFamily: fonts.display, fontSize: 34, color: '#fff', letterSpacing: -1 },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: A.green,
    borderWidth: 2, borderColor: A.bg,
  },
  profileName:  { fontFamily: fonts.display, fontSize: fontSize.xl, color: A.text, marginTop: 14, letterSpacing: -0.5 },
  profileEmail: { fontFamily: fonts.body, fontSize: fontSize.sm, color: A.muted, marginTop: 4 },
  adminBadge:   { marginTop: 12, borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: A.borderHi },
  adminBadgeGrad:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6 },
  adminBadgeTxt: { fontFamily: fonts.bodyBold, fontSize: fontSize.xs, color: A.violet, letterSpacing: 1.2 },

  // Section headings
  sectionHead:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 10 },
  sectionHeadTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: A.muted, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Platform stat pills
  statRow:      { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statPill:     {
    flex: 1, backgroundColor: A.surface, borderRadius: 13,
    borderWidth: 1, borderColor: A.border, borderTopWidth: 2,
    padding: 10, alignItems: 'center', gap: 4,
  },
  statPillIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statPillVal:  { fontFamily: fonts.display, fontSize: fontSize.md },
  statPillLabel:{ fontFamily: fonts.bodyMedium, fontSize: 8, color: A.muted, textAlign: 'center' },

  // Glass card
  gCard: {
    backgroundColor: A.surface,
    borderRadius: 16, borderWidth: 1, borderColor: A.border,
    overflow: 'hidden', marginBottom: 4,
  },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: A.border },
  infoIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: A.violetSoft, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: A.sub, flex: 1 },
  infoValue: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: A.text, maxWidth: '50%', textAlign: 'right' },

  // Permission rows
  permRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  permIconWrap:{ width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  permTxt:     { fontFamily: fonts.body, fontSize: fontSize.sm, color: A.sub, flex: 1, lineHeight: 18 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: A.red + '35', backgroundColor: A.redSoft,
  },
  logoutTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: A.red },

  // Footer
  footer:    { alignItems: 'center', gap: 4, marginTop: 20 },
  footerTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: A.muted },
});

export default AdminProfileScreen;
