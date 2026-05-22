import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, Animated, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';

// ─── Sabitler ─────────────────────────────────────────────────
const STATUS = {
  Pending:  { label: 'İnceleniyor', color: colors.warning,    bg: colors.warningSoft,   icon: 'hourglass-outline' },
  Approved: { label: 'Onaylandı',   color: colors.success,    bg: colors.successSoft,   icon: 'checkmark-circle-outline' },
  Denied:   { label: 'Reddedildi',  color: colors.danger,     bg: colors.dangerSoft,    icon: 'close-circle-outline' },
};

// ─── Sheet ────────────────────────────────────────────────────
function AppealSheet({ visible, onClose, onSuccess }) {
  const sheetY    = useRef(new Animated.Value(500)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const [message, setMessage] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 500, duration: 230, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
      setMessage('');
      setError('');
    }
  }, [visible]);

  const handleSend = async () => {
    if (message.trim().length < 20) {
      setError('En az 20 karakter yazın');
      return;
    }
    setSaving(true);
    try {
      await axios.post('/api/AppealsApi', { message: message.trim() });
      onSuccess();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message;
      Alert.alert('Hata', msg || 'İtiraz gönderilemedi.');
    } finally {
      setSaving(false);
    }
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
          <Text style={s.sheetTitle}>Yeni İtiraz Gönder</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space[4] }}>
            {/* Bilgi kutusu */}
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={s.infoTxt}>İtirazınız platform yöneticisi tarafından incelenecektir. Detaylı bir açıklama yapmanız sürecin hızlanmasını sağlar.</Text>
            </View>

            <Text style={s.fieldLabel}>İtiraz Mesajınız *</Text>
            <TextInput
              style={[s.textarea, error && { borderColor: colors.danger }]}
              placeholder="Durumu neden haksız bulduğunuzu, hangi koşulların yanlış değerlendirildiğini açıklayın..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={message}
              onChangeText={v => { setMessage(v); setError(''); }}
              maxLength={2000}
            />
            {error ? <Text style={s.errorTxt}>{error}</Text> : null}
            <Text style={s.charCount}>{message.length} / 2000</Text>
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={[s.sendBtn, saving && { opacity: 0.7 }]} onPress={handleSend} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <>
                <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                <Text style={s.sendBtnTxt}>İtirazı Gönder</Text>
              </>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── İtiraz Kartı ─────────────────────────────────────────────
function AppealCard({ item }) {
  const sc = STATUS[item.status] ?? STATUS.Pending;
  const date = new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const respondedDate = item.respondedAt
    ? new Date(item.respondedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={s.card}>
      {/* Durum + tarih */}
      <View style={s.cardTop}>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon} size={12} color={sc.color} />
          <Text style={[s.statusTxt, { color: sc.color }]}>{sc.label}</Text>
        </View>
        <Text style={s.cardDate}>{date}</Text>
      </View>

      {/* Mesaj */}
      <Text style={s.cardMessage}>{item.message}</Text>

      {/* Admin yanıtı */}
      {item.adminResponse ? (
        <View style={[s.responseBox, { borderLeftColor: sc.color }]}>
          <View style={s.responseHeader}>
            <Ionicons name="shield-checkmark-outline" size={14} color={sc.color} />
            <Text style={[s.responseLabel, { color: sc.color }]}>Admin Yanıtı</Text>
            {respondedDate && <Text style={s.respondedDate}>{respondedDate}</Text>}
          </View>
          <Text style={s.responseText}>{item.adminResponse}</Text>
        </View>
      ) : item.status === 'Pending' ? (
        <View style={s.waitingRow}>
          <Ionicons name="hourglass-outline" size={14} color={colors.textMuted} />
          <Text style={s.waitingTxt}>Yanıt bekleniyor...</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────
export default function MyAppealsScreen() {
  const [appeals,    setAppeals]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen,  setSheetOpen]  = useState(false);

  const fetchAppeals = useCallback(async () => {
    try {
      const res = await axios.get('/api/AppealsApi/mine');
      setAppeals(res.data ?? []);
    } catch {
      setAppeals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAppeals(); }, [fetchAppeals]));

  const hasPending = appeals.some(a => a.status === 'Pending');

  const handleNewAppeal = () => {
    if (hasPending) {
      Alert.alert('Bekleyen İtiraz', 'Halihazırda inceleme sürecinde bir itirazınız var. Yanıt gelene kadar yeni itiraz gönderemezsiniz.');
      return;
    }
    setSheetOpen(true);
  };

  return (
    <View style={s.root}>
      {loading ? (
        <View style={{ padding: space[5], gap: space[3] }}>
          {[1, 2].map(i => (
            <View key={i} style={[s.card, { gap: space[3] }]}>
              <SkeletonBox width="40%" height={22} />
              <SkeletonBox width="90%" height={15} />
              <SkeletonBox width="75%" height={15} />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: space[4], gap: space[3], paddingBottom: space[16] }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppeals(); }} tintColor={colors.primary} />}
        >
          {/* Başlık + yeni buton */}
          <View style={s.headerRow}>
            <View>
              <Text style={s.pageTitle}>İtirazlarım</Text>
              <Text style={s.pageSubtitle}>{appeals.length} kayıt</Text>
            </View>
            <TouchableOpacity style={[s.newBtn, hasPending && { opacity: 0.5 }]} onPress={handleNewAppeal} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.newBtnTxt}>Yeni İtiraz</Text>
            </TouchableOpacity>
          </View>

          {/* Bilgi kutusu — sadece ilk ziyarette */}
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={s.infoTxt}>Hesabınız veya mağazanız hakkında verilen kararları buradan itiraz edebilirsiniz.</Text>
          </View>

          {appeals.length === 0 ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Ionicons name="shield-outline" size={32} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>İtiraz geçmişi yok</Text>
              <Text style={s.emptyDesc}>Hesabınızla ilgili haksız bir karar verildiğini düşünüyorsanız itiraz oluşturun.</Text>
            </View>
          ) : (
            appeals.map(a => <AppealCard key={a.id} item={a} />)
          )}
        </ScrollView>
      )}

      <AppealSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSuccess={() => { setSheetOpen(false); fetchAppeals(); }} />
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[2] },
  pageTitle:   { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  pageSubtitle:{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[2] + 2, paddingHorizontal: space[3],
  },
  newBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: '#fff' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: space[2],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.glassBorder,
    padding: space[3], marginBottom: space[2],
  },
  infoTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textSecondary, flex: 1, lineHeight: fontSize.xs * 1.6 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[4], gap: space[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  cardMessage: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: fontSize.sm * 1.6 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space[2],
  },
  statusTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },

  responseBox: {
    borderLeftWidth: 3, paddingLeft: space[3],
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg, padding: space[3],
    gap: space[2],
  },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  responseLabel:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, flex: 1 },
  respondedDate:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  responseText:   { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.6 },

  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  waitingTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },

  emptyWrap:  { alignItems: 'center', paddingVertical: space[8], gap: space[3] },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: fontSize.lg, color: colors.text, textAlign: 'center' },
  emptyDesc:  { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: fontSize.sm * 1.6 },

  // Sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '75%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[5],
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[4] },
  sheetTitle:  { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  fieldLabel:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[2] },
  textarea: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[3], paddingHorizontal: space[4],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
    height: 140, textAlignVertical: 'top',
  },
  errorTxt:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.danger, marginTop: space[1] },
  charCount: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right', marginTop: 4 },

  footer: {
    paddingTop: space[3],
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[4],
  },
  sendBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
});
