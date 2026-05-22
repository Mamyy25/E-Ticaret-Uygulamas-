import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Animated, Alert, Share, Dimensions,
  Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SkeletonBox from '../components/SkeletonBox';
import { API_BASE } from '../config';

const API = API_BASE;
const { width: W } = Dimensions.get('window');
const COVER_H = 220;

const TYPE_CONFIG = {
  Service:  { label: 'Hizmet Sağlayıcı', variant: 'success', gradient: ['#14532D', '#15803D', '#22C55E'] },
  Online:   { label: 'Online Uzman',      variant: 'primary', gradient: ['#1e1c9e', '#4648D4', '#818CF8'] },
  Physical: { label: 'Ürün Mağazası',     variant: 'info',    gradient: ['#075985', '#0369A1', '#38BDF8'] },
};
const DEFAULT_CFG = { label: 'Sağlayıcı', variant: 'neutral', gradient: ['#1e1c9e', '#4648D4', '#818CF8'] };

const TABS = ['Hizmetler', 'Ürünler', 'Hakkında'];

// ─── Hizmet Seçim Sheet ───────────────────────────────────────
function ServiceSheet({ visible, service, onClose, onBook }) {
  const sheetY    = useRef(new Animated.Value(400)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0,   friction: 8, tension: 65, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 400, duration: 220, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !service) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[ss.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={ss.sheetHandle} />

        {/* Hizmet özeti */}
        <View style={ss.sheetHeader}>
          <View style={[ss.sheetIconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.sheetSvcName}>{service.name}</Text>
            <View style={ss.sheetMeta}>
              {service.durationMinutes ? (
                <View style={ss.sheetMetaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={ss.sheetMetaTxt}>{service.durationMinutes} dk</Text>
                </View>
              ) : null}
              <Text style={ss.sheetPrice}>₺{service.price}</Text>
            </View>
          </View>
        </View>

        {service.description ? (
          <Text style={ss.sheetDesc}>{service.description}</Text>
        ) : null}

        <View style={ss.sheetInfo}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={ss.sheetInfoTxt}>
            Rezervasyon onayı mağaza tarafından verilecektir. Tarih ve saat bir sonraki adımda seçilir.
          </Text>
        </View>

        <TouchableOpacity style={ss.sheetBtn} onPress={onBook} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={17} color="#fff" />
          <Text style={ss.sheetBtnTxt}>Rezervasyona Geç</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ss.sheetCancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={ss.sheetCancelTxt}>İptal</Text>
        </TouchableOpacity>
        <View style={{ height: space[4] }} />
      </Animated.View>
    </View>
  );
}

// ─── Sepet Sheet ──────────────────────────────────────────────
function CartSheet({ visible, product, storeGradient, onClose }) {
  const sheetY    = useRef(new Animated.Value(400)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const [adding,  setAdding]  = useState(false);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    if (visible) {
      setDone(false);
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0,   friction: 8, tension: 65, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 400, duration: 220, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await axios.post('/api/CartApi', { productId: product.id, quantity: 1 });
      setDone(true);
      setTimeout(onClose, 1400);
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Sepete eklenemedi.');
    } finally {
      setAdding(false);
    }
  };

  if (!visible || !product) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[ss.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={ss.sheetHandle} />

        {/* Ürün önizleme */}
        <View style={ss.sheetHeader}>
          <View style={ss.prdThumb}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient colors={storeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="cube-outline" size={20} color="rgba(255,255,255,0.4)" />
                </View>
              </LinearGradient>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.sheetSvcName} numberOfLines={2}>{product.name}</Text>
            <Text style={ss.sheetPrice}>₺{product.price}</Text>
          </View>
        </View>

        {product.description ? (
          <Text style={ss.sheetDesc} numberOfLines={3}>{product.description}</Text>
        ) : null}

        {done ? (
          <View style={ss.doneRow}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={ss.doneTxt}>Sepete eklendi!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[ss.sheetBtn, adding && { opacity: 0.7 }]}
            onPress={handleAdd}
            disabled={adding}
            activeOpacity={0.85}
          >
            {adding
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="bag-add-outline" size={17} color="#fff" />
                  <Text style={ss.sheetBtnTxt}>Sepete Ekle</Text>
                </>
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity style={ss.sheetCancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={ss.sheetCancelTxt}>Vazgeç</Text>
        </TouchableOpacity>
        <View style={{ height: space[4] }} />
      </Animated.View>
    </View>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────
// ─── Owner: Hizmet Form Sheet (Add + Edit) ───────────────────
function ServiceFormSheet({ visible, service, onClose, onSuccess }) {
  const isEdit = !!service?.id;
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [price, setPrice]           = useState('');
  const [duration, setDuration]     = useState('');
  const [tags, setTags]             = useState([]);
  const [tagInput, setTagInput]     = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        setName(service.name || '');
        setDesc(service.description || '');
        setPrice(service.price?.toString() || '');
        setDuration(service.durationMinutes?.toString() || '');
        setTags(service.tags ? service.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      } else {
        setName(''); setDesc(''); setPrice(''); setDuration(''); setTags([]); setTagInput('');
      }
    }
  }, [visible, service?.id]);

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) setTags(p => [...p, val]);
    setTagInput('');
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: desc.trim() || null,
        price: parseFloat(price),
        durationMinutes: duration ? parseInt(duration) : null,
        tags: tags.join(', ') || null,
        isActive: true,
      };
      if (isEdit) await axios.put(`${API}/api/ServicePackagesApi/${service.id}`, body);
      else        await axios.post(`${API}/api/ServicePackagesApi`, body);
      onSuccess(); onClose();
    } catch { Alert.alert('Hata', 'Kaydedilemedi.'); }
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('Hizmeti Sil', 'Bu hizmeti silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API}/api/ServicePackagesApi/${service.id}`);
          onSuccess(); onClose();
        } catch { Alert.alert('Hata', 'Silinemedi.'); }
      }},
    ]);
  };

  const footer = (
    <View style={oes.footer}>
      <TouchableOpacity style={[oes.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={oes.saveBtnTxt}>{isEdit ? 'Kaydet' : 'Hizmeti Ekle'}</Text></>}
      </TouchableOpacity>
      {isEdit && (
        <TouchableOpacity style={oes.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
          <Text style={oes.deleteBtnTxt}>Hizmeti Sil</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <OwnerSheet visible={visible} onClose={onClose} title={isEdit ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'} footer={footer}>
      <OwnerField label="Hizmet Adı *">
        <TextInput style={oes.input} value={name} onChangeText={setName} placeholder="Hizmet adı" placeholderTextColor={colors.textMuted} />
      </OwnerField>
      <OwnerField label="Açıklama">
        <TextInput style={[oes.input, { height: 72, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc} multiline placeholder="Hizmet açıklaması..." placeholderTextColor={colors.textMuted} />
      </OwnerField>
      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <OwnerField label="Fiyat (₺) *" style={{ flex: 1 }}>
          <TextInput style={oes.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="500" placeholderTextColor={colors.textMuted} />
        </OwnerField>
        <OwnerField label="Süre (dk)" style={{ flex: 1 }}>
          <TextInput style={oes.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="60" placeholderTextColor={colors.textMuted} />
        </OwnerField>
      </View>
      <OwnerField label="Etiketler">
        {tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.map(t => (
              <TouchableOpacity key={t} style={oes.chip} onPress={() => setTags(p => p.filter(x => x !== t))}>
                <Text style={oes.chipTxt}>{t}</Text>
                <Ionicons name="close" size={10} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={oes.chipRow}>
          <TextInput style={oes.chipInput} value={tagInput} onChangeText={setTagInput} placeholder="Etiket ekle..." placeholderTextColor={colors.textMuted} onSubmitEditing={addTag} returnKeyType="done" blurOnSubmit={false} />
          <TouchableOpacity style={oes.chipBtn} onPress={addTag}><Text style={oes.chipBtnTxt}>+ Ekle</Text></TouchableOpacity>
        </View>
      </OwnerField>
    </OwnerSheet>
  );
}

// ─── Owner: Ürün Form Sheet (Add + Edit) ─────────────────────
function ProductFormSheet({ visible, product, categories, onClose, onSuccess }) {
  const isEdit = !!product?.id;
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [price, setPrice]       = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fileUrl, setFileUrl]   = useState('');
  const [categoryId, setCatId]  = useState(null);
  const [license, setLicense]   = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput]   = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        setName(product.name || '');
        setDesc(product.description || '');
        setPrice(product.price?.toString() || '');
        setImageUrl(product.imageUrl || '');
        setFileUrl(product.fileUrl || '');
        setCatId(product.categoryId ?? null);
        setLicense(product.licenseType ?? 0);
        setKeywords(product.keywords ? product.keywords.split(',').map(k => k.trim()).filter(Boolean) : []);
      } else {
        setName(''); setDesc(''); setPrice(''); setImageUrl(''); setFileUrl('');
        setCatId(null); setLicense(0); setKeywords([]); setKwInput('');
      }
    }
  }, [visible, product?.id]);

  const addKw = () => {
    const val = kwInput.trim();
    if (val && !keywords.includes(val)) setKeywords(p => [...p, val]);
    setKwInput('');
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: desc.trim(),
        price: parseFloat(price),
        keywords: keywords.join(', ') || null,
        categoryId,
        licenseType: license,
        imageUrl: imageUrl.trim() || null,
        fileUrl: fileUrl.trim() || null,
        isActive: true,
      };
      if (isEdit) await axios.put(`${API}/api/ProductsApi/${product.id}`, body);
      else        await axios.post(`${API}/api/ProductsApi`, body);
      onSuccess(); onClose();
    } catch { Alert.alert('Hata', 'Kaydedilemedi.'); }
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('Ürünü Sil', 'Bu ürünü silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API}/api/ProductsApi/${product.id}`);
          onSuccess(); onClose();
        } catch { Alert.alert('Hata', 'Silinemedi.'); }
      }},
    ]);
  };

  const LICENSE_TYPES = [
    { value: 0, label: 'Kişisel' },
    { value: 1, label: 'Ticari' },
    { value: 2, label: 'Genişletilmiş' },
  ];

  const footer = (
    <View style={oes.footer}>
      <TouchableOpacity style={[oes.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={oes.saveBtnTxt}>{isEdit ? 'Kaydet' : 'Ürünü Ekle'}</Text></>}
      </TouchableOpacity>
      {isEdit && (
        <TouchableOpacity style={oes.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
          <Text style={oes.deleteBtnTxt}>Ürünü Sil</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <OwnerSheet visible={visible} onClose={onClose} title={isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'} footer={footer}>
      <OwnerField label="Ürün Adı *">
        <TextInput style={oes.input} value={name} onChangeText={setName} placeholder="Ürün adı" placeholderTextColor={colors.textMuted} />
      </OwnerField>
      <OwnerField label="Açıklama">
        <TextInput style={[oes.input, { height: 72, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc} multiline placeholder="Ürün açıklaması..." placeholderTextColor={colors.textMuted} />
      </OwnerField>
      <OwnerField label="Fiyat (₺) *">
        <TextInput style={oes.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="299" placeholderTextColor={colors.textMuted} />
      </OwnerField>
      <OwnerField label="Anahtar Kelimeler">
        {keywords.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {keywords.map(k => (
              <TouchableOpacity key={k} style={oes.chip} onPress={() => setKeywords(p => p.filter(x => x !== k))}>
                <Text style={oes.chipTxt}>{k}</Text>
                <Ionicons name="close" size={10} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={oes.chipRow}>
          <TextInput style={oes.chipInput} value={kwInput} onChangeText={setKwInput} placeholder="Kelime ekle..." placeholderTextColor={colors.textMuted} onSubmitEditing={addKw} returnKeyType="done" blurOnSubmit={false} />
          <TouchableOpacity style={oes.chipBtn} onPress={addKw}><Text style={oes.chipBtnTxt}>+ Ekle</Text></TouchableOpacity>
        </View>
      </OwnerField>
      <OwnerField label="Kategori">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <TouchableOpacity style={[oes.catChip, categoryId === null && oes.catChipActive]} onPress={() => setCatId(null)}>
            <Text style={[oes.catChipTxt, categoryId === null && oes.catChipTxtActive]}>Kategorisiz</Text>
          </TouchableOpacity>
          {(categories || []).map(cat => (
            <TouchableOpacity key={cat.id} style={[oes.catChip, categoryId === cat.id && oes.catChipActive]} onPress={() => setCatId(cat.id)}>
              <Text style={[oes.catChipTxt, categoryId === cat.id && oes.catChipTxtActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </OwnerField>
      <OwnerField label="Lisans Türü">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {LICENSE_TYPES.map(lt => (
            <TouchableOpacity key={lt.value} style={[oes.licBtn, license === lt.value && oes.licBtnActive]} onPress={() => setLicense(lt.value)}>
              <Text style={[oes.licBtnTxt, license === lt.value && { color: colors.primary }]}>{lt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </OwnerField>
      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <OwnerField label="Görsel URL" style={{ flex: 1 }}>
          <TextInput style={oes.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor={colors.textMuted} keyboardType="url" />
        </OwnerField>
        <OwnerField label="Dosya URL" style={{ flex: 1 }}>
          <TextInput style={oes.input} value={fileUrl} onChangeText={setFileUrl} placeholder="https://..." placeholderTextColor={colors.textMuted} keyboardType="url" />
        </OwnerField>
      </View>
    </OwnerSheet>
  );
}

// ─── Owner Sheet wrapper (sticky footer destekli) ─────────────
function OwnerSheet({ visible, onClose, title, children, footer }) {
  const sheetY    = useRef(new Animated.Value(700)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY,    { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY,    { toValue: 700, duration: 230, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[oes.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={oes.handle} />
        <View style={oes.header}>
          <Text style={oes.headerTxt}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: space[4] }}
            style={{ flex: 1 }}
          >
            {children}
          </ScrollView>
          {footer}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

function OwnerField({ label, children, style }) {
  return (
    <View style={[{ marginBottom: space[4] }, style]}>
      <Text style={oes.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// owner edit sheet styles
const oes = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[5],
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 14,
  },
  footer: {
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: space[2],
    backgroundColor: colors.surface,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[4] },
  headerTxt: { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[2] },
  input: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[3], paddingHorizontal: space[4],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  chipInput: {
    flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[2] + 2, paddingHorizontal: space[3],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  chipBtn: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder, paddingVertical: space[2] + 2, paddingHorizontal: space[3] },
  chipBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder, paddingVertical: 4, paddingHorizontal: space[2] },
  chipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  catChip: { paddingVertical: 7, paddingHorizontal: space[3], borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  catChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  catChipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  catChipTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  licBtn: { flex: 1, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: space[3], alignItems: 'center', backgroundColor: colors.surface },
  licBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  licBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: space[4], marginTop: space[2] },
  saveBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], borderWidth: 1, borderColor: 'rgba(186,26,26,0.25)', borderRadius: radius.pill, paddingVertical: space[3], marginTop: space[3], backgroundColor: colors.dangerSoft },
  deleteBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.danger },
});

// ─── Ana ekran ────────────────────────────────────────────────
export default function ProviderProfileScreen({ route, navigation }) {
  const { store, isOwner } = route.params ?? {};
  const { isAuthenticated } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [detail,        setDetail]      = useState(null);
  const [products,      setProducts]    = useState([]);
  const [categories,    setCategories]  = useState([]);
  const [loading,       setLoading]     = useState(true);
  const [activeTab,     setActiveTab]   = useState(0);
  const [svcSheet,      setSvcSheet]    = useState(null);
  const [cartSheet,     setCartSheet]   = useState(null);
  // Owner form state — null = kapalı, {} = ekleme modu, {id, ...} = düzenleme modu
  const [svcFormOpen,   setSvcFormOpen] = useState(null);
  const [prdFormOpen,   setPrdFormOpen] = useState(null);
  const tabOffset  = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(1)).current;

  const storeId = store?.id ?? store?.Id;

  const reload = () => {
    if (!storeId) return;
    Promise.all([
      axios.get(`${API}/api/StoresApi/${storeId}/profile`).catch(() => ({ data: null })),
      axios.get(`${API}/api/ProductsApi?storeId=${storeId}`).catch(() => ({ data: [] })),
    ]).then(([pr, prd]) => {
      setDetail(pr.data);
      setProducts(prd.data ?? []);
    });
  };

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    Promise.all([
      axios.get(`${API}/api/StoresApi/${storeId}/profile`).catch(() => ({ data: null })),
      axios.get(`${API}/api/ProductsApi?storeId=${storeId}`).catch(() => ({ data: [] })),
      isOwner ? axios.get(`${API}/api/CategoriesApi`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([pr, prd, cat]) => {
      setDetail(pr.data);
      setProducts(prd.data ?? []);
      setCategories(cat.data ?? []);
    }).finally(() => setLoading(false));
  }, [storeId]);

  // SellerHomeScreen quick action'dan openSheet ile geldiyse uygun sheet'i aç
  useEffect(() => {
    const sheet = route?.params?.openSheet;
    if (!sheet || !isOwner) return;
    if (sheet === 'service') { setActiveTab(0); setSvcFormOpen({}); }
    if (sheet === 'product') { setActiveTab(1); setPrdFormOpen({}); }
    navigation.setParams({ openSheet: null });
  }, [route?.params?.openSheet, isOwner]);

  const handleTabPress = (idx) => {
    if (idx === activeTab) return;
    const dir = idx > activeTab ? 1 : -1;

    // Indicator kayar
    Animated.spring(tabOffset, { toValue: idx * (W / TABS.length), useNativeDriver: true, friction: 8 }).start();

    // İçerik: fade+slide out → tab değiş → fade+slide in
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,       duration: 130, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -32*dir, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setActiveTab(idx);
      slideAnim.setValue(32 * dir);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  };

  const requireAuth = (action) => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', `${action} için giriş yapmanız gerekiyor.`);
      return false;
    }
    return true;
  };

  const handleMessage = () => {
    if (!requireAuth('Mesaj göndermek')) return;
    navigation.navigate('Mesajlar');
  };

  const handleBookingForService = (svc) => {
    if (!requireAuth('Rezervasyon yapmak')) return;
    setSvcSheet(svc);
  };

  const proceedBooking = () => {
    setSvcSheet(null);
    navigation.navigate('Booking', { storeId, storeName: detail?.name });
  };

  const handleCartSheet = (prd) => {
    if (!requireAuth('Satın almak')) return;
    setCartSheet(prd);
  };

  const handleShare = async () => {
    try { await Share.share({ message: `${detail?.name ?? 'Mağaza'} — Kairos'ta keşfet!` }); } catch {}
  };

  if (!storeId) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <EmptyState icon="storefront-outline" title="Mağaza bulunamadı" />
      </View>
    );
  }

  const cfg      = TYPE_CONFIG[detail?.storeType] ?? DEFAULT_CFG;
  const cover    = detail?.bannerImageUrl || detail?.profileImageUrl;
  const initials = (detail?.name ?? store?.name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
  const services = detail?.servicePackages ?? [];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>

        {/* ── Cover ── */}
        <View style={{ height: COVER_H }}>
          {cover ? (
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={s.coverInitials}>{initials}</Text>
              </View>
              <Ionicons name="storefront-outline" size={26} color="rgba(255,255,255,0.2)"
                style={{ position: 'absolute', bottom: 16, right: 20 }} />
            </LinearGradient>
          )}
          <View style={s.coverOverlay} />
          {/* Geri */}
          <TouchableOpacity style={[s.coverBtn, { top: insets.top + space[2], left: space[4] }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          {/* Paylaş — sadece burada, aşağıda tekrar yok */}
          <TouchableOpacity style={[s.coverBtn, { top: insets.top + space[2], right: space[4] }]} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Profil Header ── */}
        <View style={s.profileHeader}>
          <Avatar name={detail?.name ?? store?.name} uri={detail?.profileImageUrl} size={68} style={s.avatar} />

          <View style={s.profileMeta}>
            <Badge label={cfg.label} variant={cfg.variant} dot size="sm" />
            <Text style={s.storeName}>{detail?.name ?? store?.name ?? '—'}</Text>

            {/* Kompakt meta satırı */}
            <View style={s.metaRow}>
              {detail?.providerCity ? (
                <View style={s.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={s.metaTxt}>{detail.providerCity}</Text>
                </View>
              ) : null}
              {detail?.yearsOfExperience ? (
                <View style={s.metaItem}>
                  <Ionicons name="ribbon-outline" size={12} color={colors.textMuted} />
                  <Text style={s.metaTxt}>{detail.yearsOfExperience} yıl</Text>
                </View>
              ) : null}
            </View>

            {/* Kompakt stats — tek satır */}
            <View style={s.statsInline}>
              {detail?.averageRating != null ? (
                <Text style={s.statVal}>⭐ {detail.averageRating.toFixed(1)}</Text>
              ) : null}
              {detail?.averageRating != null ? <Text style={s.statDot}>·</Text> : null}
              <Text style={s.statVal}>{services.length} hizmet</Text>
              <Text style={s.statDot}>·</Text>
              <Text style={s.statVal}>{detail?.reviewCount ?? 0} yorum</Text>
            </View>
          </View>

          {/* Aksiyon butonları */}
          {isOwner ? (
            /* Mağaza sahibi görünümü — yönetim butonu */
            <TouchableOpacity
              style={[s.actionPrimary, { alignSelf: 'flex-start', paddingHorizontal: space[5] }]}
              onPress={() => navigation.navigate('AnaSayfa', { screen: 'StoreManage' })}
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={16} color="#fff" />
              <Text style={s.actionPrimaryTxt}>Yönetim Paneli</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.actionBtns}>
              <TouchableOpacity style={s.actionSecondary} onPress={handleMessage} activeOpacity={0.8}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={s.actionSecondaryTxt}>Mesaj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionPrimary, { flex: 1 }]}
                onPress={() => {
                  if (!requireAuth('Rezervasyon yapmak')) return;
                  navigation.navigate('Booking', { storeId, storeName: detail?.name });
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <Text style={s.actionPrimaryTxt}>Rezervasyon Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Tab Bar (sticky) ── */}
        <View style={s.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity key={tab} style={s.tabBtn} onPress={() => handleTabPress(i)} activeOpacity={0.7}>
              <Text style={[s.tabTxt, activeTab === i && s.tabTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[s.tabIndicator, { width: W / TABS.length, transform: [{ translateX: tabOffset }] }]} />
        </View>

        {/* ── Tab İçeriği ── */}
        <Animated.View style={[s.tabContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          {loading ? (
            <View style={{ gap: space[3] }}>
              {[1, 2, 3].map(i => <SkeletonBox key={i} width="100%" height={88} />)}
            </View>
          ) : activeTab === 0 ? (
            // Hizmetler
            <>
              {isOwner && (
                <TouchableOpacity style={s.addRow} onPress={() => setSvcFormOpen({})} activeOpacity={0.8}>
                  <View style={s.addRowIcon}><Ionicons name="add" size={18} color={colors.primary} /></View>
                  <Text style={s.addRowTxt}>Yeni Hizmet Paketi Ekle</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {services.length === 0 ? (
                <EmptyState icon="briefcase-outline" title="Henüz hizmet eklenmemiş" />
              ) : services.map(svc => (
                <TouchableOpacity
                  key={svc.id}
                  style={s.svcCard}
                  onPress={() => isOwner ? setSvcFormOpen(svc) : handleBookingForService(svc)}
                  activeOpacity={0.85}
                >
                  <View style={[s.svcAccent, { backgroundColor: colors.primary }]} />
                  <View style={s.svcBody}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.svcName}>{svc.name}</Text>
                      <View style={{ flexDirection: 'row', gap: space[3] }}>
                        {svc.durationMinutes ? (
                          <View style={s.metaItem}>
                            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                            <Text style={s.metaTxt}>{svc.durationMinutes} dk</Text>
                          </View>
                        ) : null}
                        {svc.isFeatured ? (
                          <View style={s.metaItem}>
                            <Ionicons name="star-outline" size={11} color={colors.warning} />
                            <Text style={[s.metaTxt, { color: colors.warning }]}>Öne Çıkan</Text>
                          </View>
                        ) : null}
                      </View>
                      {svc.description ? (
                        <Text style={s.svcDesc} numberOfLines={2}>{svc.description}</Text>
                      ) : null}
                    </View>
                    <View style={s.svcRight}>
                      <Text style={s.svcPrice}>₺{svc.price}</Text>
                      <View style={s.svcArrow}>
                        <Ionicons name={isOwner ? 'pencil-outline' : 'chevron-forward'} size={14} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : activeTab === 1 ? (
            // Ürünler
            <>
              {isOwner && (
                <TouchableOpacity style={s.addRow} onPress={() => setPrdFormOpen({})} activeOpacity={0.8}>
                  <View style={s.addRowIcon}><Ionicons name="add" size={18} color={colors.primary} /></View>
                  <Text style={s.addRowTxt}>Yeni Dijital Ürün Ekle</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {products.length === 0 ? (
                <EmptyState icon="cube-outline" title="Henüz dijital ürün yok" />
              ) : products.map(prd => (
                <TouchableOpacity
                  key={prd.id}
                  style={s.prdCard}
                  onPress={() => isOwner ? setPrdFormOpen(prd) : handleCartSheet(prd)}
                  activeOpacity={0.85}
                >
                  <View style={s.prdThumb}>
                    {prd.imageUrl ? (
                      <Image source={{ uri: prd.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="cube-outline" size={20} color="rgba(255,255,255,0.4)" />
                        </View>
                      </LinearGradient>
                    )}
                    {prd.fileType ? (
                      <View style={s.prdTypeBadge}>
                        <Text style={s.prdTypeTxt}>{prd.fileType.toUpperCase()}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={s.prdBody}>
                    <Text style={s.prdName} numberOfLines={2}>{prd.name}</Text>
                    {prd.description ? (
                      <Text style={s.svcDesc} numberOfLines={1}>{prd.description}</Text>
                    ) : null}
                    <Text style={s.svcPrice}>₺{prd.price}</Text>
                  </View>
                  <View style={s.addCartIcon}>
                    <Ionicons name={isOwner ? 'pencil-outline' : 'bag-add-outline'} size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            // Hakkında
            <View style={s.aboutSection}>
              {detail?.description ? (
                <>
                  <Text style={s.aboutText}>{detail.description}</Text>
                  {detail.providerName ? (
                    <View style={[s.metaItem, { marginTop: space[4] }]}>
                      <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                      <Text style={s.metaTxt}>Sağlayıcı: {detail.providerName}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <EmptyState icon="information-circle-outline" title="Açıklama eklenmemiş" />
              )}
            </View>
          )}
          <View style={{ height: space[12] }} />
        </Animated.View>
      </ScrollView>

      {/* ── Hizmet seçim sheet (tüketici) ── */}
      <ServiceSheet
        visible={!!svcSheet}
        service={svcSheet}
        onClose={() => setSvcSheet(null)}
        onBook={proceedBooking}
      />

      {/* ── Sepet sheet (tüketici) ── */}
      <CartSheet
        visible={!!cartSheet}
        product={cartSheet}
        storeGradient={cfg?.gradient ?? DEFAULT_CFG.gradient}
        onClose={() => setCartSheet(null)}
      />

      {/* ── Hizmet form sheet (owner — add+edit) ── */}
      <ServiceFormSheet
        visible={!!svcFormOpen}
        service={svcFormOpen?.id ? svcFormOpen : null}
        onClose={() => setSvcFormOpen(null)}
        onSuccess={reload}
      />

      {/* ── Ürün form sheet (owner — add+edit) ── */}
      <ProductFormSheet
        visible={!!prdFormOpen}
        product={prdFormOpen?.id ? prdFormOpen : null}
        categories={categories}
        onClose={() => setPrdFormOpen(null)}
        onSuccess={reload}
      />
    </View>
  );
}

// ─── Ana stiller ─────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  coverInitials:{ fontFamily: fonts.display, fontSize: 72, color: 'rgba(255,255,255,0.18)', letterSpacing: -3 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  coverBtn: {
    position: 'absolute', width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1, borderColor: colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },

  profileHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: space[5], paddingTop: space[4], paddingBottom: space[5],
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    gap: space[3],
  },
  avatar:      { marginTop: -34 },
  profileMeta: { gap: space[2] },
  storeName:   { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.text, lineHeight: fontSize.xl * 1.2 },
  metaRow:     { flexDirection: 'row', gap: space[4], flexWrap: 'wrap' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:     { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  // Kompakt stats — tek satır
  statsInline: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  statVal:     { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  statDot:     { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },

  // Aksiyon butonları
  actionBtns:       { flexDirection: 'row', gap: space[3] },
  actionSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: space[3], paddingHorizontal: space[4],
  },
  actionSecondaryTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },
  actionPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: space[3], paddingHorizontal: space[4],
  },
  actionPrimaryTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: '#fff' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    position: 'relative',
  },
  tabBtn: { flex: 1, paddingVertical: space[3] + 2, alignItems: 'center', justifyContent: 'center' },
  tabTxt:       { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },
  tabTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  tabIndicator: {
    position: 'absolute', bottom: 0, height: 2,
    backgroundColor: colors.primary, borderRadius: radius.pill,
  },

  tabContent: { paddingHorizontal: space[5], paddingTop: space[4], gap: space[3] },

  // Hizmet kartı
  svcCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  svcAccent: { width: 3 },
  svcBody:   { flex: 1, flexDirection: 'row', gap: space[3], alignItems: 'center', padding: space[4] },
  svcName:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.text },
  svcDesc:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.5 },
  svcRight:  { alignItems: 'center', gap: space[2] },
  svcPrice:  { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.primary },
  svcArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  // Ürün kartı
  prdCard: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: space[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  prdThumb: {
    width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surfaceRaised, position: 'relative',
  },
  prdTypeBadge: {
    position: 'absolute', bottom: 3, left: 3,
    backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  prdTypeTxt: { fontFamily: fonts.bodySemiBold, fontSize: 8, color: '#fff', letterSpacing: 0.5 },
  prdBody:    { flex: 1, gap: 3 },
  prdName:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.35 },
  addCartIcon: {
    width: 34, height: 34, borderRadius: radius.lg,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  aboutSection: { paddingVertical: space[2] },
  aboutText:    { fontFamily: fonts.body, fontSize: fontSize.base, color: colors.textSecondary, lineHeight: fontSize.base * 1.6 },

  // Owner "+ Ekle" satırı
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.glassBorder,
    padding: space[4], marginBottom: space[3],
  },
  addRowIcon: {
    width: 32, height: 32, borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  addRowTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary, flex: 1 },
});

// ─── Sheet stiller ────────────────────────────────────────────
const ss = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3],
    borderWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4],
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginBottom: space[3] },
  sheetIconWrap: {
    width: 48, height: 48, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetSvcName: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text },
  sheetMeta:    { flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: 4 },
  sheetMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  sheetMetaTxt: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted },
  sheetPrice:   { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.primary },
  sheetDesc: {
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.6, marginBottom: space[3],
  },
  sheetInfo: {
    flexDirection: 'row', gap: space[2], alignItems: 'flex-start',
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle,
    padding: space[3], marginBottom: space[4],
  },
  sheetInfoTxt: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.5 },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: space[4], marginBottom: space[2],
  },
  sheetBtnTxt:    { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
  sheetCancelBtn: { alignItems: 'center', paddingVertical: space[3] },
  sheetCancelTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },
  prdThumb: {
    width: 60, height: 60, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surfaceRaised, position: 'relative',
  },
  doneRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.successBorder,
    paddingVertical: space[4], marginBottom: space[2],
  },
  doneTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.success },
});
