import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Alert, Animated, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Badge from '../components/Badge';
import SkeletonBox from '../components/SkeletonBox';

// ─── Sabitler ─────────────────────────────────────────────────
const CATEGORY_HINTS = ['Tasarım', 'Yazılım', 'Fotoğraf', 'Eğitim', 'Hukuk', 'Muhasebe', 'Pazarlama', 'İnşaat', 'Tadilat', 'Diğer'];

const OFFER_STATUS = {
  Pending:  { label: 'Bekliyor',     color: colors.warning, bg: colors.warningSoft },
  Accepted: { label: 'Kabul Edildi', color: colors.success, bg: colors.successSoft },
  Rejected: { label: 'Reddedildi',   color: colors.textMuted, bg: colors.surfaceRaised },
};

// ─── Teklif kartı ─────────────────────────────────────────────
function OfferCard({ offer, requestActive, onAccept, onReject }) {
  const sc = OFFER_STATUS[offer.status] ?? OFFER_STATUS.Pending;
  return (
    <View style={s.offerCard}>
      <View style={s.offerHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.offerStore}>{offer.storeName}</Text>
          <Text style={s.offerPrice}>₺{offer.price}</Text>
        </View>
        <View style={[s.offerBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.offerBadgeTxt, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>
      {offer.message ? <Text style={s.offerMessage}>{offer.message}</Text> : null}
      {requestActive && offer.status === 'Pending' && (
        <View style={s.offerActions}>
          <TouchableOpacity style={s.acceptBtn} onPress={() => onAccept(offer.id)} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={s.acceptBtnTxt}>Kabul Et</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.rejectBtn} onPress={() => onReject(offer.id)} activeOpacity={0.8}>
            <Text style={s.rejectBtnTxt}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Talep kartı (expandable) ─────────────────────────────────
function RequestCard({ item, onClose, onAccept, onReject }) {
  const [expanded, setExpanded]   = useState(false);
  const expandAnim                = useRef(new Animated.Value(0)).current;
  const chevronAnim               = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toVal = expanded ? 0 : 1;
    Animated.parallel([
      Animated.spring(expandAnim, { toValue: toVal, friction: 8, useNativeDriver: false }),
      Animated.timing(chevronAnim, { toValue: toVal, duration: 200, useNativeDriver: true }),
    ]).start();
    setExpanded(v => !v);
  };

  const maxH = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });
  const chevRot = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const confirmClose = () => {
    Alert.alert('Talebi Kapat', 'Bu talebi kapatmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kapat', style: 'destructive', onPress: () => onClose(item.id) },
    ]);
  };

  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    : '';

  return (
    <View style={s.requestCard}>
      {/* Başlık satırı */}
      <View style={s.cardTop}>
        <Badge
          label={item.isActive ? 'Aktif' : 'Kapandı'}
          variant={item.isActive ? 'success' : 'neutral'}
          dot size="sm"
        />
        {item.isActive && (
          <TouchableOpacity onPress={confirmClose} style={s.closeBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.cardTitle}>{item.title}</Text>

      {/* Meta chips */}
      <View style={s.cardMeta}>
        {item.categoryHint ? (
          <View style={s.metaChip}>
            <Ionicons name="bookmark-outline" size={11} color={colors.primary} />
            <Text style={s.metaChipTxt}>{item.categoryHint}</Text>
          </View>
        ) : null}
        {item.city ? (
          <View style={s.metaChip}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={[s.metaChipTxt, { color: colors.textMuted }]}>{item.city}</Text>
          </View>
        ) : null}
        {item.budget != null ? (
          <View style={[s.metaChip, { backgroundColor: colors.primarySoft, borderColor: colors.glassBorder }]}>
            <Ionicons name="cash-outline" size={11} color={colors.primary} />
            <Text style={[s.metaChipTxt, { color: colors.primary }]}>₺{item.budget} bütçe</Text>
          </View>
        ) : null}
        {dateStr ? (
          <View style={s.metaChip}>
            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
            <Text style={[s.metaChipTxt, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
        ) : null}
      </View>

      <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>

      {/* Teklif aç/kapat */}
      <TouchableOpacity style={s.offersToggle} onPress={toggle} activeOpacity={0.7}>
        <View style={s.offersToggleLeft}>
          <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
          <Text style={s.offersToggleTxt}>
            {item.offers.length > 0 ? `${item.offers.length} teklif` : 'Henüz teklif yok'}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevRot }] }}>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Teklifler (collapse) */}
      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        {item.offers.length === 0 ? (
          <View style={s.noOffers}>
            <Ionicons name="hourglass-outline" size={20} color={colors.textMuted} />
            <Text style={s.noOffersTxt}>Sağlayıcıların tekliflerini bekliyorsunuz</Text>
          </View>
        ) : (
          <View style={{ gap: space[2], paddingTop: space[2] }}>
            {item.offers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                requestActive={item.isActive}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Yeni Talep Bottom Sheet ──────────────────────────────────
function CreateSheet({ visible, onClose, onSubmit, submitting }) {
  const sheetY    = useRef(new Animated.Value(600)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState('');
  const [budget,   setBudget]   = useState('');
  const [city,     setCity]     = useState('');
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 600, duration: 240, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
      // Form sıfırla
      setTitle(''); setDesc(''); setCategory(''); setBudget(''); setCity(''); setErrors({});
    }
  }, [visible]);

  const validate = () => {
    const e = {};
    if (title.trim().length < 5)  e.title = 'En az 5 karakter girin';
    if (desc.trim().length < 15)  e.desc  = 'En az 15 karakter girin';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ title: title.trim(), description: desc.trim(), categoryHint: category || null, budget: budget ? parseFloat(budget) : null, city: city.trim() || null });
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Yeni Talep Oluştur</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >

            {/* Başlık */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Başlık <Text style={s.required}>*</Text></Text>
              <TextInput
                style={[s.textInput, errors.title && s.inputError]}
                placeholder="Örn: Logo tasarımı yaptırmak istiyorum"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={v => { setTitle(v); setErrors(e => ({ ...e, title: undefined })); }}
                maxLength={200}
              />
              {errors.title ? <Text style={s.errorTxt}>{errors.title}</Text> : null}
            </View>

            {/* Açıklama */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Açıklama <Text style={s.required}>*</Text></Text>
              <TextInput
                style={[s.textInput, s.textArea, errors.desc && s.inputError]}
                placeholder="İhtiyacınızı detaylıca anlatın; bütçe, zaman çizelgesi, özel istekler..."
                placeholderTextColor={colors.textMuted}
                value={desc}
                onChangeText={v => { setDesc(v); setErrors(e => ({ ...e, desc: undefined })); }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={2000}
              />
              {errors.desc ? <Text style={s.errorTxt}>{errors.desc}</Text> : null}
            </View>

            {/* Kategori */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Kategori <Text style={s.optional}>(opsiyonel)</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catChips}>
                {CATEGORY_HINTS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.catChip, category === c && s.catChipActive]}
                    onPress={() => setCategory(prev => prev === c ? '' : c)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.catChipTxt, category === c && s.catChipTxtActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bütçe + Şehir */}
            <View style={s.rowFields}>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Bütçe (₺) <Text style={s.optional}>(opsiyonel)</Text></Text>
                <TextInput
                  style={s.textInput}
                  placeholder="500"
                  placeholderTextColor={colors.textMuted}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Şehir <Text style={s.optional}>(opsiyonel)</Text></Text>
                <TextInput
                  style={s.textInput}
                  placeholder="İstanbul"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                    <Text style={s.submitBtnTxt}>Talebi Gönder</Text>
                  </>
              }
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CustomerRequestsScreen({ navigation }) {
  const { isAuthenticated } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [requests,    setRequests]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [refreshing,  setRefreshing] = useState(false);
  const [sheetOpen,   setSheetOpen]  = useState(false);
  const [submitting,  setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get('/api/CustomerRequestsApi/mine');
      setRequests(res.data ?? []);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchRequests().finally(() => setLoading(false));
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleClose = async (id) => {
    try {
      await axios.delete(`/api/CustomerRequestsApi/${id}`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, isActive: false } : r));
    } catch {
      Alert.alert('Hata', 'Talep kapatılamadı.');
    }
  };

  const handleAccept = async (offerId) => {
    try {
      await axios.put(`/api/CustomerRequestsApi/offers/${offerId}/accept`);
      await fetchRequests();
    } catch {
      Alert.alert('Hata', 'Teklif kabul edilemedi.');
    }
  };

  const handleReject = async (offerId) => {
    try {
      await axios.put(`/api/CustomerRequestsApi/offers/${offerId}/reject`);
      await fetchRequests();
    } catch {
      Alert.alert('Hata', 'Teklif reddedilemedi.');
    }
  };

  const handleSubmit = async (dto) => {
    setSubmitting(true);
    try {
      await axios.post('/api/CustomerRequestsApi', dto);
      setSheetOpen(false);
      await fetchRequests();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Talep oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Giriş yapılmamış ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[s.root, s.centerContent]}>
        <View style={s.guestWrap}>
          <View style={s.guestIconWrap}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
          </View>
          <Text style={s.guestTitle}>Giriş Yapın</Text>
          <Text style={s.guestDesc}>Talep oluşturmak ve teklifleri görmek için hesabınıza giriş yapın.</Text>
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => navigation.navigate('GirisYap')}
            activeOpacity={0.85}
          >
            <Text style={s.loginBtnTxt}>Giriş Yap</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* ── Skeleton ── */}
      {loading ? (
        <ScrollView contentContainerStyle={{ padding: space[5], gap: space[3] }}>
          {[1, 2].map(i => (
            <View key={i} style={[s.requestCard, { gap: space[3] }]}>
              <SkeletonBox width="30%" height={20} />
              <SkeletonBox width="70%" height={18} />
              <SkeletonBox width="90%" height={13} />
              <SkeletonBox width="60%" height={13} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={requests.length === 0 ? s.centerContent : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {requests.length === 0 ? (
            /* ── Boş durum ── */
            <View style={s.emptyWrap}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="bulb-outline" size={36} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>Henüz talebin yok</Text>
              <Text style={s.emptyDesc}>
                Aradığın hizmeti listede bulamazsan talep oluştur, sağlayıcılar sana ulaşsın.
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={s.emptyBtnTxt}>İlk Talebini Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Talep listesi ── */
            <>
              <View style={s.listHeader}>
                <Text style={s.listHeaderTxt}>
                  <Text style={{ color: colors.text, fontFamily: fonts.bodySemiBold }}>{requests.length}</Text>
                  {' '}talep
                </Text>
                <TouchableOpacity
                  style={s.newBtn}
                  onPress={() => setSheetOpen(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={s.newBtnTxt}>Yeni Talep</Text>
                </TouchableOpacity>
              </View>

              {requests.map(req => (
                <RequestCard
                  key={req.id}
                  item={req}
                  onClose={handleClose}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Create Sheet ── */}
      <CreateSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.canvas },
  centerContent:{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  listContent:  { padding: space[5], gap: space[3], paddingBottom: space[12] },

  // Talep kartı
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl2,
    borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4], gap: space[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { padding: 2 },
  cardTitle: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text, lineHeight: fontSize.md * 1.3 },
  cardMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: 3, paddingHorizontal: space[2],
  },
  metaChipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  cardDesc:    { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: fontSize.sm * 1.55 },

  // Teklif toggle
  offersToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[2] + 2, paddingHorizontal: space[3],
  },
  offersToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  offersToggleTxt:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },

  // Teklif yok
  noOffers: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    paddingVertical: space[4], justifyContent: 'center',
  },
  noOffersTxt: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuted },

  // Teklif kartı
  offerCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[3], gap: space[2],
  },
  offerHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  offerStore:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text },
  offerPrice:   { fontFamily: fonts.display, fontSize: fontSize.md, color: colors.primary, marginTop: 2 },
  offerBadge:   { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: space[2] },
  offerBadgeTxt:{ fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },
  offerMessage: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: fontSize.sm * 1.5 },
  offerActions: { flexDirection: 'row', gap: space[2], marginTop: space[1] },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: colors.success, borderRadius: radius.pill,
    paddingVertical: space[2] + 2,
  },
  acceptBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: '#fff' },
  rejectBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    paddingVertical: space[2] + 2,
  },
  rejectBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.textMuted },

  // Liste başlığı
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: space[1],
  },
  listHeaderTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: 6, paddingHorizontal: space[3],
  },
  newBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },

  // Boş durum
  emptyWrap:     { alignItems: 'center', gap: space[4], paddingHorizontal: space[5] },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text, textAlign: 'center' },
  emptyDesc:  { fontFamily: fonts.body, fontSize: fontSize.base, color: colors.textSecondary, textAlign: 'center', lineHeight: fontSize.base * 1.6 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[3], paddingHorizontal: space[5],
    marginTop: space[2],
  },
  emptyBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },

  // Giriş yap
  guestWrap:     { alignItems: 'center', gap: space[4], paddingHorizontal: space[6] },
  guestIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  guestTitle: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text, textAlign: 'center' },
  guestDesc:  { fontFamily: fonts.body, fontSize: fontSize.base, color: colors.textSecondary, textAlign: 'center', lineHeight: fontSize.base * 1.6 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[3], paddingHorizontal: space[5], marginTop: space[2],
  },
  loginBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[5],
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 14,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4],
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: space[4],
  },
  sheetTitle: { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },

  // Form
  fieldWrap:  { marginBottom: space[4] },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[2] },
  required:   { color: colors.danger },
  optional:   { fontFamily: fonts.body, color: colors.textMuted },
  textInput: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[3], paddingHorizontal: space[4],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  textArea:   { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  errorTxt:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.danger, marginTop: space[1] },
  rowFields:  { flexDirection: 'row', gap: space[3] },

  catChips:      { gap: space[2], paddingBottom: space[1] },
  catChip: {
    paddingVertical: 7, paddingHorizontal: space[3],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  catChipTxt:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  catChipTxtActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[4], marginTop: space[2],
  },
  submitBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
});
