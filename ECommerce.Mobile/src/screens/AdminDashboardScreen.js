import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, RefreshControl,
  Animated, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { fonts, fontSize } from '../theme/typography';
import AdminSymbol from '../components/AdminSymbol';

// ── Admin Dark Palette ──────────────────────────────────────────
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
  cyan:       '#22D3EE',
  cyanSoft:   'rgba(34,211,238,0.10)',
  green:      '#34D399',
  greenSoft:  'rgba(52,211,153,0.10)',
  red:        '#FB7185',
  redSoft:    'rgba(251,113,133,0.10)',
  yellow:     '#FBBF24',
  yellowSoft: 'rgba(251,191,36,0.10)',
  pink:       '#F472B6',
  pinkSoft:   'rgba(244,114,182,0.10)',
};

const TABS = [
  { key: 'overview',     label: 'Genel',      icon: 'grid-outline',       fill: 'grid',       color: A.violet, soft: A.violetSoft },
  { key: 'applications', label: 'Başvurular',  icon: 'clipboard-outline',  fill: 'clipboard',  color: A.cyan,   soft: A.cyanSoft   },
  { key: 'stores',       label: 'Mağazalar',   icon: 'storefront-outline', fill: 'storefront', color: A.green,  soft: A.greenSoft  },
  { key: 'users',        label: 'Kullanıcı',   icon: 'people-outline',     fill: 'people',     color: A.yellow, soft: A.yellowSoft },
  { key: 'reports',      label: 'Şikayet',     icon: 'flag-outline',       fill: 'flag',       color: A.red,    soft: A.redSoft    },
  { key: 'appeals',      label: 'İtiraz',      icon: 'scale-outline',      fill: 'scale',      color: A.pink,   soft: A.pinkSoft   },
];

// ── PromptModal (Alert.prompt yerine — Android uyumlu) ──────────
const PromptModal = ({ state, onCancel, onConfirm }) => {
  const [value, setValue] = useState('');
  const { visible, title, subtitle, placeholder, multiline, confirmLabel, confirmColor, loading } = state;
  useEffect(() => { if (!visible) setValue(''); }, [visible]);
  const color = confirmColor || A.violet;
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={ss.overlay}>
          <View style={ss.promptBox}>
            <LinearGradient
              colors={['#1A1030', '#0F0C1E']}
              style={StyleSheet.absoluteFill}
              borderRadius={20}
            />
            <View style={[ss.promptAccent, { backgroundColor: color }]} />
            <Text style={ss.promptTitle}>{title}</Text>
            {subtitle ? <Text style={ss.promptSub}>{subtitle}</Text> : null}
            <TextInput
              style={[ss.promptInput, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
              placeholder={placeholder || 'Yazın...'}
              placeholderTextColor={A.muted}
              value={value}
              onChangeText={setValue}
              multiline={!!multiline}
              autoFocus
            />
            <View style={ss.promptActions}>
              <TouchableOpacity style={ss.cancelBtn} onPress={onCancel}>
                <Text style={ss.cancelTxt}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.confirmBtn, { borderColor: color + '55', backgroundColor: color + '22' }]}
                onPress={() => onConfirm(value)}
                disabled={!!loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color={color} />
                  : <Text style={[ss.confirmTxt, { color }]}>{confirmLabel || 'Onayla'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── StatCard ────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, soft }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (value > 0) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.09, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [value]);
  return (
    <View style={[ss.statCard, { borderTopColor: color }]}>
      <View style={[ss.statIconBox, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Animated.Text style={[ss.statValue, { color, transform: [{ scale: pulse }] }]}>
        {value}
      </Animated.Text>
      <Text style={ss.statLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
};

// ── GlassCard ───────────────────────────────────────────────────
const GCard = ({ children, accent, style }) => (
  <View style={[ss.gCard, accent && { borderLeftColor: accent, borderLeftWidth: 2 }, style]}>
    {children}
  </View>
);

// ── Action Button ───────────────────────────────────────────────
const Btn = ({ label, color, soft, icon, onPress, loading, flex, ghost }) => (
  <TouchableOpacity
    style={[
      ss.btn,
      ghost
        ? { borderColor: A.border, backgroundColor: 'transparent' }
        : { borderColor: color + '50', backgroundColor: soft || color + '18' },
      flex && { flex: 1 },
    ]}
    onPress={onPress}
    disabled={!!loading}
    activeOpacity={0.7}
  >
    {loading ? (
      <ActivityIndicator size="small" color={ghost ? A.muted : color} />
    ) : (
      <>
        {icon ? <Ionicons name={icon} size={12} color={ghost ? A.muted : color} style={{ marginRight: 4 }} /> : null}
        <Text style={[ss.btnTxt, { color: ghost ? A.muted : color }]}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

// ── Chip (badge) ────────────────────────────────────────────────
const Chip = ({ label, color, soft }) => (
  <View style={[ss.chip, { backgroundColor: soft, borderColor: color + '40' }]}>
    <Text style={[ss.chipTxt, { color }]}>{label}</Text>
  </View>
);

// ── Empty State ─────────────────────────────────────────────────
const Empty = ({ icon, label }) => (
  <View style={ss.emptyBox}>
    <View style={ss.emptyIconWrap}>
      <Ionicons name={icon} size={28} color={A.muted} />
    </View>
    <Text style={ss.emptyTxt}>{label}</Text>
  </View>
);


// ────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ────────────────────────────────────────────────────────────────
const AdminDashboardScreen = () => {
  const { logout } = useContext(AuthContext);

  const [section, setSection]             = useState('overview');
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [actioning, setActioning]         = useState(null);
  const [stores, setStores]               = useState([]);
  const [users, setUsers]                 = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [openReports, setOpenReports]     = useState([]);
  const [pendingAppeals, setPendingAppeals] = useState([]);
  const [userSearch, setUserSearch]       = useState('');
  const [appealReplies, setAppealReplies] = useState({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Prompt modal
  const promptConfirmRef = useRef(null);
  const [promptState, setPromptState] = useState({
    visible: false, title: '', subtitle: '', placeholder: '',
    multiline: false, confirmLabel: '', confirmColor: A.violet, loading: false,
  });
  const showPrompt = (cfg, onConfirm) => {
    promptConfirmRef.current = onConfirm;
    setPromptState(p => ({ ...p, ...cfg, loading: false, visible: true }));
  };
  const hidePrompt = () => setPromptState(p => ({ ...p, visible: false }));
  const handlePromptConfirm = async (value) => {
    setPromptState(p => ({ ...p, loading: true }));
    await promptConfirmRef.current?.(value);
    setPromptState(p => ({ ...p, visible: false, loading: false }));
  };

  // ── Fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [storeRes, userRes, pendingRes, reportsRes, appealsRes] = await Promise.all([
        axios.get('/api/StoresApi?includeAll=true').catch(() => ({ data: [] })),
        axios.get('/api/AccountApi/admin/users').catch(() => ({ data: [] })),
        axios.get('/api/StoreApplicationsApi/pending').catch(() => ({ data: [] })),
        axios.get('/api/ReportsApi/admin?status=Open').catch(() => ({ data: [] })),
        axios.get('/api/AppealsApi/admin?status=Pending').catch(() => ({ data: [] })),
      ]);
      setStores(storeRes.data || []);
      setUsers(userRes.data || []);
      setPendingStores(pendingRes.data || []);
      setOpenReports(reportsRes.data || []);
      setPendingAppeals(appealsRes.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // ── Section change ───────────────────────────────────────────
  const changeSection = (key) => {
    if (key === section) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 90, useNativeDriver: true }).start(() => {
      setSection(key);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // ── Action handlers ──────────────────────────────────────────
  const handleSuspendStore = (store) =>
    showPrompt(
      { title: 'Mağazayı Askıya Al', subtitle: `"${store.name}"`, placeholder: 'Askı sebebi...', confirmLabel: 'Askıya Al', confirmColor: A.red },
      async (reason) => {
        if (!reason?.trim()) return;
        setActioning(`suspend-s${store.id}`);
        try {
          await axios.put(`/api/SuspensionsApi/stores/${store.id}`, { reason });
          setStores(prev => prev.map(s => s.id === store.id ? { ...s, status: 'Suspended' } : s));
        } catch {}
        setActioning(null);
      }
    );

  const handleLiftStore = async (storeId) => {
    setActioning(`lift-s${storeId}`);
    try {
      await axios.put(`/api/SuspensionsApi/stores/${storeId}/lift`);
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: 'Active' } : s));
    } catch {}
    setActioning(null);
  };

  const handleSuspendUser = (u) =>
    showPrompt(
      { title: 'Kullanıcıyı Askıya Al', subtitle: u.fullName, placeholder: 'Askı sebebi...', confirmLabel: 'Askıya Al', confirmColor: A.red },
      async (reason) => {
        if (!reason?.trim()) return;
        setActioning(`suspend-u${u.id}`);
        try {
          await axios.put(`/api/SuspensionsApi/users/${u.id}`, { reason });
          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isSuspended: true, suspensionReason: reason } : x));
        } catch {}
        setActioning(null);
      }
    );

  const handleLiftUser = async (userId) => {
    setActioning(`lift-u${userId}`);
    try {
      await axios.put(`/api/SuspensionsApi/users/${userId}/lift`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: false, suspensionReason: null } : u));
    } catch {}
    setActioning(null);
  };

  const handleApproveStore = async (storeId) => {
    setActioning(`approve-${storeId}`);
    try {
      await axios.put(`/api/StoreApplicationsApi/${storeId}/approve`);
      setPendingStores(prev => prev.filter(s => s.id !== storeId));
    } catch {}
    setActioning(null);
  };

  const handleRejectStore = (store) =>
    showPrompt(
      { title: 'Başvuruyu Reddet', subtitle: store.name, placeholder: 'Ret sebebi...', confirmLabel: 'Reddet', confirmColor: A.red },
      async (reason) => {
        if (!reason?.trim()) return;
        setActioning(`reject-${store.id}`);
        try {
          await axios.put(`/api/StoreApplicationsApi/${store.id}/reject`, { reason });
          setPendingStores(prev => prev.filter(s => s.id !== store.id));
        } catch {}
        setActioning(null);
      }
    );

  const handleResolveReport = async (reportId, dismiss) => {
    setActioning(`report-${reportId}`);
    try {
      await axios.put(`/api/ReportsApi/${reportId}/${dismiss ? 'dismiss' : 'resolve'}`, { adminNote: '' });
      setOpenReports(prev => prev.filter(r => r.id !== reportId));
    } catch {}
    setActioning(null);
  };

  const handleRespondAppeal = async (appealId, status) => {
    setActioning(`appeal-${appealId}`);
    try {
      await axios.put(`/api/AppealsApi/${appealId}/respond`, {
        adminResponse: appealReplies[appealId] || '',
        status,
      });
      setPendingAppeals(prev => prev.filter(a => a.id !== appealId));
    } catch {}
    setActioning(null);
  };

  // ── Section renderers ────────────────────────────────────────

  const renderOverview = () => {
    const statItems = [
      { icon: 'people',       label: 'Kullanıcı',       value: users.length,                             color: A.violet, soft: A.violetSoft },
      { icon: 'storefront',   label: 'Mağaza',           value: stores.length,                            color: A.cyan,   soft: A.cyanSoft   },
      { icon: 'clipboard',    label: 'Bekl. Başvuru',    value: pendingStores.length,                     color: A.green,  soft: A.greenSoft  },
      { icon: 'flag',         label: 'Açık Şikayet',     value: openReports.length,                       color: A.red,    soft: A.redSoft    },
      { icon: 'scale',        label: 'Bekl. İtiraz',     value: pendingAppeals.length,                    color: A.pink,   soft: A.pinkSoft   },
      { icon: 'shield-half',  label: 'Askılı Kullanıcı', value: users.filter(u => u.isSuspended).length, color: A.yellow, soft: A.yellowSoft },
    ];

    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    const healthRows = [
      { label: 'Aktif Mağazalar',  val: stores.filter(s => s.status === 'Active').length,    total: Math.max(stores.length, 1),  color: A.green  },
      { label: 'Çözülen İtirazlar',val: pendingAppeals.length,                               total: Math.max(pendingAppeals.length + 1, 1), color: A.pink, invert: true },
      { label: 'Temiz Hesaplar',   val: users.filter(u => !u.isSuspended).length,             total: Math.max(users.length, 1),   color: A.cyan   },
    ];

    return (
      <View>
        {/* Stat Grid */}
        <View style={ss.statGrid}>
          {statItems.map((s, i) => <StatCard key={i} {...s} />)}
        </View>

        {/* Hızlı Erişim */}
        <Text style={ss.sectionHead}>Hızlı Erişim</Text>
        <View style={ss.quickGrid}>
          {TABS.filter(t => t.key !== 'overview').map(t => {
            const count = badges[t.key];
            return (
              <TouchableOpacity
                key={t.key}
                style={[ss.quickCard, { borderTopColor: t.color }]}
                onPress={() => changeSection(t.key)}
                activeOpacity={0.72}
              >
                <View style={[ss.quickIcon, { backgroundColor: t.soft }]}>
                  <Ionicons name={t.fill} size={20} color={t.color} />
                </View>
                {count > 0 && (
                  <View style={[ss.quickBadge, { backgroundColor: t.color }]}>
                    <Text style={ss.quickBadgeTxt}>{count}</Text>
                  </View>
                )}
                <Text style={[ss.quickLabel, { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Platform Sağlığı */}
        <GCard style={{ marginBottom: 12 }}>
          <View style={ss.rowCenter}>
            <Ionicons name="pulse" size={15} color={A.violet} />
            <Text style={[ss.cardTitle, { marginLeft: 7, flex: 0 }]}>Platform Sağlığı</Text>
          </View>
          <View style={{ marginTop: 12, gap: 12 }}>
            {healthRows.map((r, i) => {
              const pct = Math.min(r.val / r.total, 1);
              return (
                <View key={i}>
                  <View style={ss.statRow}>
                    <Text style={ss.cardSub}>{r.label}</Text>
                    <Text style={[ss.statRowVal, { color: r.color }]}>{r.val}</Text>
                  </View>
                  <View style={ss.progressTrack}>
                    <Animated.View style={[ss.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: r.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </GCard>

        {/* Son Kayıtlar */}
        {recentUsers.length > 0 && (
          <GCard style={{ marginBottom: 12 }}>
            <View style={ss.rowCenter}>
              <Ionicons name="person-add-outline" size={15} color={A.cyan} />
              <Text style={[ss.cardTitle, { marginLeft: 7, flex: 0 }]}>Son Kayıtlar</Text>
            </View>
            <View style={{ marginTop: 10, gap: 10 }}>
              {recentUsers.map(u => (
                <View key={u.id} style={ss.rowBetween}>
                  <View style={ss.rowCenter}>
                    <View style={[ss.avatarDot, { backgroundColor: A.violetSoft }]}>
                      <Text style={ss.avatarLetter}>{(u.fullName?.[0] || '?').toUpperCase()}</Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[ss.cardTitle, { fontSize: fontSize.sm, flex: 0 }]} numberOfLines={1}>{u.fullName}</Text>
                      <Text style={ss.cardMeta}>{u.userType}</Text>
                    </View>
                  </View>
                  <Text style={ss.cardMeta}>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</Text>
                </View>
              ))}
            </View>
          </GCard>
        )}

        {/* Logout */}
        <TouchableOpacity style={ss.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={15} color={A.red} />
          <Text style={ss.logoutTxt}>Oturumu Kapat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderApplications = () => (
    <View>
      {pendingStores.length === 0
        ? <Empty icon="clipboard-outline" label="Bekleyen başvuru yok" />
        : pendingStores.map(s => (
          <GCard key={s.id} accent={A.cyan} style={{ marginBottom: 10 }}>
            <View style={ss.rowBetween}>
              <Text style={ss.cardTitle} numberOfLines={1}>{s.name}</Text>
              <Chip label={s.storeType || 'Mağaza'} color={A.cyan} soft={A.cyanSoft} />
            </View>
            <Text style={ss.cardSub}>{s.seller?.fullName}</Text>
            <Text style={ss.cardMeta}>{s.seller?.email}</Text>
            <Text style={ss.cardMeta}>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</Text>
            <View style={ss.actionRow}>
              <Btn
                label="Onayla" icon="checkmark-circle-outline"
                color={A.green} soft={A.greenSoft} flex
                loading={actioning === `approve-${s.id}`}
                onPress={() => handleApproveStore(s.id)}
              />
              <Btn
                label="Reddet" icon="close-circle-outline"
                color={A.red} soft={A.redSoft} flex
                onPress={() => handleRejectStore(s)}
              />
            </View>
          </GCard>
        ))
      }
    </View>
  );

  const renderStores = () => (
    <View>
      {stores.map(s => {
        const suspended = s.status === 'Suspended';
        return (
          <GCard key={s.id} accent={suspended ? A.red : A.green} style={{ marginBottom: 10 }}>
            <View style={ss.rowBetween}>
              <Text style={ss.cardTitle} numberOfLines={1}>{s.name}</Text>
              <Chip
                label={suspended ? 'ASKIDA' : 'AKTİF'}
                color={suspended ? A.red : A.green}
                soft={suspended ? A.redSoft : A.greenSoft}
              />
            </View>
            <Text style={ss.cardMeta}>{s.storeType} · {s.productCount || 0} ürün</Text>
            <View style={ss.actionRow}>
              {suspended ? (
                <Btn
                  label="Askı Kaldır" icon="shield-checkmark-outline"
                  color={A.green} soft={A.greenSoft} flex
                  loading={actioning === `lift-s${s.id}`}
                  onPress={() => handleLiftStore(s.id)}
                />
              ) : (
                <Btn
                  label="Askıya Al" icon="ban-outline"
                  color={A.red} soft={A.redSoft} flex
                  loading={actioning === `suspend-s${s.id}`}
                  onPress={() => handleSuspendStore(s)}
                />
              )}
            </View>
          </GCard>
        );
      })}
    </View>
  );

  const renderUsers = () => {
    const filtered = users.filter(u =>
      !userSearch ||
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
    return (
      <View>
        <View style={ss.searchWrap}>
          <Ionicons name="search-outline" size={15} color={A.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={ss.searchInput}
            placeholder="İsim veya e-posta..."
            placeholderTextColor={A.muted}
            value={userSearch}
            onChangeText={setUserSearch}
          />
          {userSearch ? (
            <TouchableOpacity onPress={() => setUserSearch('')}>
              <Ionicons name="close-circle" size={16} color={A.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
        {filtered.map(u => (
          <GCard key={u.id} accent={u.isSuspended ? A.red : null} style={{ marginBottom: 10 }}>
            <View style={ss.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={ss.cardTitle} numberOfLines={1}>{u.fullName}</Text>
                <Text style={ss.cardMeta}>{u.email}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Chip label={u.userType} color={A.violet} soft={A.violetSoft} />
                {u.isSuspended && <Chip label="ASKIDA" color={A.red} soft={A.redSoft} />}
              </View>
            </View>
            {u.isSuspended && u.suspensionReason ? (
              <View style={ss.reasonBox}>
                <Ionicons name="information-circle-outline" size={12} color={A.red} />
                <Text style={ss.reasonTxt}> Sebep: {u.suspensionReason}</Text>
              </View>
            ) : null}
            {u.userType !== 'Admin' && (
              <View style={ss.actionRow}>
                {u.isSuspended ? (
                  <Btn
                    label="Askı Kaldır" icon="shield-checkmark-outline"
                    color={A.green} soft={A.greenSoft} flex
                    loading={actioning === `lift-u${u.id}`}
                    onPress={() => handleLiftUser(u.id)}
                  />
                ) : (
                  <Btn
                    label="Askıya Al" icon="ban-outline"
                    color={A.red} soft={A.redSoft} flex
                    loading={actioning === `suspend-u${u.id}`}
                    onPress={() => handleSuspendUser(u)}
                  />
                )}
              </View>
            )}
          </GCard>
        ))}
      </View>
    );
  };

  const renderReports = () => (
    <View>
      {openReports.length === 0
        ? <Empty icon="flag-outline" label="Açık şikayet yok" />
        : openReports.map(r => (
          <GCard key={r.id} accent={A.red} style={{ marginBottom: 10 }}>
            <View style={ss.rowBetween}>
              <Chip label={r.targetType} color={A.red} soft={A.redSoft} />
              <Text style={ss.cardMeta}>#{r.targetId}</Text>
            </View>
            <Text style={[ss.cardTitle, { marginTop: 6 }]} numberOfLines={1}>{r.reason}</Text>
            {r.description ? <Text style={ss.cardSub} numberOfLines={2}>{r.description}</Text> : null}
            <Text style={ss.cardMeta}>{r.reporter?.fullName} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</Text>
            <View style={ss.actionRow}>
              <Btn
                label="Çözüldü" icon="checkmark-done-outline"
                color={A.green} soft={A.greenSoft} flex
                loading={actioning === `report-${r.id}`}
                onPress={() => handleResolveReport(r.id, false)}
              />
              <Btn
                label="Reddet" icon="close-outline"
                color={A.muted} ghost flex
                loading={actioning === `report-${r.id}`}
                onPress={() => handleResolveReport(r.id, true)}
              />
            </View>
          </GCard>
        ))
      }
    </View>
  );

  const renderAppeals = () => (
    <View>
      {pendingAppeals.length === 0
        ? <Empty icon="scale-outline" label="Bekleyen itiraz yok" />
        : pendingAppeals.map(a => (
          <GCard key={a.id} accent={A.pink} style={{ marginBottom: 12 }}>
            <Text style={ss.cardTitle}>{a.user?.fullName}</Text>
            <Text style={ss.cardMeta}>{a.user?.email}</Text>
            {a.user?.suspensionReason ? (
              <View style={ss.reasonBox}>
                <Ionicons name="ban-outline" size={12} color={A.red} />
                <Text style={ss.reasonTxt}> Askı sebebi: {a.user.suspensionReason}</Text>
              </View>
            ) : null}
            {a.store ? <Text style={ss.cardMeta}>Mağaza: {a.store.name}</Text> : null}
            <View style={ss.messageBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={A.pink} style={{ marginBottom: 4 }} />
              <Text style={ss.messageTxt}>"{a.message}"</Text>
            </View>
            <TextInput
              style={ss.replyInput}
              placeholder="Yanıt yazın (isteğe bağlı)..."
              placeholderTextColor={A.muted}
              value={appealReplies[a.id] || ''}
              onChangeText={v => setAppealReplies(prev => ({ ...prev, [a.id]: v }))}
              multiline
            />
            <View style={ss.actionRow}>
              <Btn
                label="Onayla" icon="checkmark-circle-outline"
                color={A.green} soft={A.greenSoft} flex
                loading={actioning === `appeal-${a.id}`}
                onPress={() => handleRespondAppeal(a.id, 'Approved')}
              />
              <Btn
                label="Reddet" icon="close-circle-outline"
                color={A.red} soft={A.redSoft} flex
                loading={actioning === `appeal-${a.id}`}
                onPress={() => handleRespondAppeal(a.id, 'Denied')}
              />
            </View>
          </GCard>
        ))
      }
    </View>
  );

  const SECTIONS = { overview: renderOverview, applications: renderApplications, stores: renderStores, users: renderUsers, reports: renderReports, appeals: renderAppeals };

  const badges = {
    applications: pendingStores.length,
    reports:      openReports.length,
    appeals:      pendingAppeals.length,
  };

  // ── Loading screen ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: A.bg, justifyContent: 'center', alignItems: 'center' }}>
        <LinearGradient colors={['#2D1B69', '#A78BFA']} style={ss.loadingLogo}>
          <Text style={ss.loadingK}>K</Text>
        </LinearGradient>
        <ActivityIndicator color={A.violet} style={{ marginTop: 20 }} />
        <Text style={[ss.cardMeta, { marginTop: 10 }]}>Yükleniyor...</Text>
      </View>
    );
  }

  // ── Main render ──────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: A.bg }}>
      <AdminSymbol />
      {/* ─── Header ─── */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient colors={['#1A0838', '#0F0A1E', A.bg]} style={ss.header}>
          <SafeAreaView edges={['top']}>
            <View style={ss.headerInner}>
              <View style={ss.headerLeft}>
                <LinearGradient colors={['#7C3AED', '#A78BFA']} style={ss.kBadge}>
                  <Text style={ss.kLetter}>K</Text>
                </LinearGradient>
                <View>
                  <Text style={ss.headerTitle}>Denetim Masası</Text>
                  <Text style={ss.headerSub}>Kairos Super Admin</Text>
                </View>
              </View>
              <TouchableOpacity style={ss.refreshBtn} onPress={() => { setRefreshing(true); fetchAll(); }}>
                <Ionicons name="refresh-outline" size={18} color={A.violet} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* ─── Tab bar ─── */}
      <View style={ss.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
          {TABS.map(t => {
            const active = section === t.key;
            const count = badges[t.key];
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => changeSection(t.key)}
                activeOpacity={0.7}
                style={[
                  ss.tab,
                  active && { backgroundColor: t.soft, borderColor: t.color + '40' },
                ]}
              >
                <Ionicons name={active ? t.fill : t.icon} size={14} color={active ? t.color : A.muted} />
                <Text style={[ss.tabLabel, active && { color: t.color }]}>{t.label}</Text>
                {count > 0 ? (
                  <View style={[ss.tabBadge, { backgroundColor: t.color }]}>
                    <Text style={ss.tabBadgeTxt}>{count}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={ss.tabDivider} />
      </View>

      {/* ─── Content ─── */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={ss.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAll(); }}
              tintColor={A.violet}
              colors={[A.violet]}
            />
          }
        >
          {SECTIONS[section]?.()}
        </ScrollView>
      </Animated.View>

      {/* ─── Prompt modal ─── */}
      <PromptModal
        state={promptState}
        onCancel={hidePrompt}
        onConfirm={handlePromptConfirm}
      />
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────
const ss = StyleSheet.create({
  // Header
  header:      { paddingBottom: 8 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kBadge:      { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  kLetter:     { fontFamily: fonts.display, fontSize: 20, color: '#fff', letterSpacing: -0.5 },
  headerTitle: { fontFamily: fonts.display, fontSize: fontSize.md, color: A.text, letterSpacing: -0.3 },
  headerSub:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: A.muted, marginTop: 1 },
  refreshBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: A.violetSoft, borderWidth: 1, borderColor: A.border, justifyContent: 'center', alignItems: 'center' },

  // Tab bar
  tabBar:     { backgroundColor: A.surface },
  tabDivider: { height: 1, backgroundColor: A.border, marginHorizontal: 0 },
  tab:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  tabLabel:   { fontFamily: fonts.bodySemiBold, fontSize: 11, color: A.muted },
  tabBadge:   { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 },
  tabBadgeTxt:{ color: '#fff', fontSize: 9, fontFamily: fonts.bodyBold },

  // Content
  content: { padding: 14, paddingBottom: 48 },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  statCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: A.surface,
    borderRadius: 14, borderTopWidth: 2,
    borderWidth: 1, borderColor: A.border,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statIconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  statValue:   { fontFamily: fonts.display, fontSize: fontSize.lg, fontVariant: ['tabular-nums'] },
  statLabel:   { fontFamily: fonts.bodyMedium, fontSize: 9, color: A.muted, textAlign: 'center' },
  statRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statRowVal:  { fontFamily: fonts.bodyBold, fontSize: fontSize.sm },

  // Glass card
  gCard: {
    backgroundColor: A.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: A.border,
    padding: 14,
    marginBottom: 2,
  },

  // Row helpers
  rowCenter:  { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },

  // Card text
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: A.text, flex: 1 },
  cardSub:   { fontFamily: fonts.body, fontSize: fontSize.sm, color: A.sub, lineHeight: 18, marginTop: 2 },
  cardMeta:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: A.muted, marginTop: 2 },

  // Chip
  chip:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  chipTxt: { fontFamily: fonts.bodyBold, fontSize: 9 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, justifyContent: 'center' },
  btnTxt:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm },

  // Reason box
  reasonBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: A.redSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginTop: 6 },
  reasonTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: A.red },

  // Appeal message
  messageBox: { backgroundColor: A.elevated, borderRadius: 10, padding: 10, marginTop: 8, borderLeftWidth: 2, borderLeftColor: A.pink },
  messageTxt: { fontFamily: fonts.body, fontSize: fontSize.sm, color: A.sub, lineHeight: 19, fontStyle: 'italic' },

  // Reply input
  replyInput: {
    backgroundColor: A.elevated, borderWidth: 1, borderColor: A.border,
    borderRadius: 10, padding: 10, color: A.text,
    fontFamily: fonts.body, fontSize: fontSize.sm,
    marginTop: 8, minHeight: 56,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: A.surface, borderWidth: 1, borderColor: A.border,
    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, color: A.text, fontFamily: fonts.body, fontSize: fontSize.sm },

  // Empty
  emptyBox:     { alignItems: 'center', paddingVertical: 48 },
  emptyIconWrap:{ width: 56, height: 56, borderRadius: 16, backgroundColor: A.elevated, borderWidth: 1, borderColor: A.border, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTxt:     { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: A.muted },

  // Quick access grid
  sectionHead: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: A.muted, marginBottom: 10, marginTop: 2, letterSpacing: 0.4, textTransform: 'uppercase' },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  quickCard:   {
    width: '30%', flexGrow: 1,
    backgroundColor: A.surface,
    borderRadius: 14, borderTopWidth: 2,
    borderWidth: 1, borderColor: A.border,
    padding: 12, alignItems: 'center', gap: 6,
    position: 'relative',
  },
  quickIcon:   { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  quickBadge:  { position: 'absolute', top: 8, right: 8, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  quickBadgeTxt:{ color: '#fff', fontSize: 9, fontFamily: fonts.bodyBold },
  quickLabel:  { fontFamily: fonts.bodySemiBold, fontSize: 10 },

  // Progress bars
  progressTrack: { height: 4, backgroundColor: A.elevated, borderRadius: 2, overflow: 'hidden', marginTop: 5 },
  progressFill:  { height: 4, borderRadius: 2 },

  // Recent users
  avatarDot:    { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontFamily: fonts.bodyBold, fontSize: fontSize.sm, color: A.violet },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: A.red + '35', backgroundColor: A.redSoft },
  logoutTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: A.red },

  // Prompt modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  promptBox: {
    width: '100%', borderRadius: 20,
    borderWidth: 1, borderColor: A.borderHi,
    overflow: 'hidden', padding: 20,
  },
  promptAccent: { position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 1 },
  promptTitle:  { fontFamily: fonts.display, fontSize: fontSize.md, color: A.text, marginTop: 8, marginBottom: 4 },
  promptSub:    { fontFamily: fonts.body, fontSize: fontSize.sm, color: A.sub, marginBottom: 12 },
  promptInput:  {
    backgroundColor: A.elevated, borderWidth: 1, borderColor: A.border,
    borderRadius: 11, padding: 11, color: A.text,
    fontFamily: fonts.body, fontSize: fontSize.sm, marginBottom: 14,
  },
  promptActions:{ flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: A.border, alignItems: 'center' },
  cancelTxt:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: A.sub },
  confirmBtn:   { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  confirmTxt:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm },

  // Loading
  loadingLogo: { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  loadingK:    { fontFamily: fonts.display, fontSize: 32, color: '#fff' },
});

export default AdminDashboardScreen;
