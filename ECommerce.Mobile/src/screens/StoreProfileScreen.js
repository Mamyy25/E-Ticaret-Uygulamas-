import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Animated, Pressable, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';
import SkeletonBox from '../components/SkeletonBox';

// ─── Sabitler ─────────────────────────────────────────────────
const APPT_STATUS = {
  Pending:   { label: 'Bekliyor',   color: colors.warning, bg: colors.warningSoft },
  Approved:  { label: 'Onaylandı',  color: colors.success, bg: colors.successSoft },
  Completed: { label: 'Tamamlandı', color: colors.primary, bg: colors.primarySoft },
  Cancelled: { label: 'İptal',      color: colors.danger,  bg: colors.dangerSoft },
};

const LICENSE_TYPES = [
  { value: 0, label: 'Kişisel',      desc: 'Kişisel projeler' },
  { value: 1, label: 'Ticari',       desc: 'Ticari kullanım' },
  { value: 2, label: 'Genişletilmiş',desc: 'Tüm haklar' },
];

// ─── Chip Input ───────────────────────────────────────────────
function ChipInput({ chips, onAdd, onRemove, placeholder = 'Ekle ve Enter...' }) {
  const [text, setText] = useState('');
  const add = () => {
    const val = text.trim().replace(/,/g, '').replace(/\s+/g, ' ');
    if (val && !chips.includes(val)) { onAdd(val); }
    setText('');
  };
  return (
    <View>
      {chips.length > 0 && (
        <View style={cs.chips}>
          {chips.map(c => (
            <TouchableOpacity key={c} style={cs.chip} onPress={() => onRemove(c)} activeOpacity={0.7}>
              <Text style={cs.chipTxt}>{c}</Text>
              <Ionicons name="close" size={10} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={cs.inputRow}>
        <TextInput
          style={cs.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={add}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity style={cs.addBtn} onPress={add} activeOpacity={0.8}>
          <Text style={cs.addBtnTxt}>+ Ekle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Bottom Sheet wrapper (sticky footer destekli) ───────────
function Sheet({ visible, onClose, children, title, footer }) {
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
      <Animated.View style={[ss.sheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={ss.handle} />
        <View style={ss.sheetHeader}>
          <Text style={ss.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
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

// ─── Ürün Ekleme Sheet ────────────────────────────────────────
function ProductSheet({ visible, onClose, categories, onSuccess }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '', fileUrl: '', previewUrl: '' });
  const [keywords,    setKeywords]    = useState([]);
  const [categoryId,  setCategoryId]  = useState(null);
  const [license,     setLicense]     = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState({});

  useEffect(() => {
    if (!visible) {
      setForm({ name: '', description: '', price: '', imageUrl: '', fileUrl: '', previewUrl: '' });
      setKeywords([]); setCategoryId(null); setLicense(0); setErrors({});
    }
  }, [visible]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name = 'Ürün adı zorunlu';
    if (!form.description.trim()) e.description = 'Açıklama zorunlu';
    if (!form.price || isNaN(parseFloat(form.price))) e.price = 'Geçerli bir fiyat girin';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post('/api/ProductsApi', {
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       parseFloat(form.price),
        keywords:    keywords.join(', '),
        categoryId:  categoryId,
        licenseType: license,
        imageUrl:    form.imageUrl.trim() || null,
        fileUrl:     form.fileUrl.trim()  || null,
        previewUrl:  form.previewUrl.trim()|| null,
        isActive:    true,
      });
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Ürün eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChangeText: v => setForm(p => ({ ...p, [key]: v })) });

  const footer = (
    <View style={ss.footer}>
      <TouchableOpacity style={[ss.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={ss.saveBtnTxt}>Ürünü Kaydet</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Dijital Ürün Ekle" footer={footer}>
      <Field label="Ürün Adı *" error={errors.name}>
        <TextInput style={[ss.input, errors.name && ss.inputErr]} placeholder="Örn: UI Kit Paketi" placeholderTextColor={colors.textMuted} {...f('name')} />
      </Field>

      <Field label="Açıklama *" error={errors.description}>
        <TextInput style={[ss.input, ss.textarea, errors.description && ss.inputErr]} placeholder="Ürün hakkında detaylı bilgi..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} textAlignVertical="top" {...f('description')} />
        <Text style={ss.charCount}>{form.description.length} / 2000 karakter</Text>
      </Field>

      <Field label="Fiyat (₺) *" error={errors.price}>
        <TextInput style={[ss.input, errors.price && ss.inputErr]} placeholder="299" placeholderTextColor={colors.textMuted} keyboardType="numeric" {...f('price')} />
      </Field>

      <Field label="Anahtar Kelimeler" hint="Alıcılar bu kelimelerle ürününüzü bulur">
        <ChipInput chips={keywords} onAdd={w => setKeywords(p => [...p, w])} onRemove={w => setKeywords(p => p.filter(x => x !== w))} placeholder="Kelime yazıp Ekle'ye bas..." />
      </Field>

      <Field label="Kategori">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2], paddingVertical: 2 }}>
          <TouchableOpacity style={[ss.catChip, categoryId === null && ss.catChipActive]} onPress={() => setCategoryId(null)}>
            <Text style={[ss.catChipTxt, categoryId === null && ss.catChipTxtActive]}>Kategorisiz</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[ss.catChip, categoryId === cat.id && ss.catChipActive]} onPress={() => setCategoryId(cat.id)}>
              <Text style={[ss.catChipTxt, categoryId === cat.id && ss.catChipTxtActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Field>

      <Field label="Lisans Türü">
        <View style={ss.licenseRow}>
          {LICENSE_TYPES.map(lt => (
            <TouchableOpacity key={lt.value} style={[ss.licenseBtn, license === lt.value && ss.licenseBtnActive]} onPress={() => setLicense(lt.value)}>
              <Text style={[ss.licenseBtnTxt, license === lt.value && ss.licenseBtnTxtActive]}>{lt.label}</Text>
              <Text style={[ss.licenseBtnDesc, license === lt.value && { color: colors.primary }]}>{lt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Field label="Görsel URL" hint="Kapak (opsiyonel)" style={{ flex: 1 }}>
          <TextInput style={ss.input} placeholder="https://..." placeholderTextColor={colors.textMuted} keyboardType="url" {...f('imageUrl')} />
        </Field>
        <Field label="Dosya URL" hint="İndirme linki (opsiyonel)" style={{ flex: 1 }}>
          <TextInput style={ss.input} placeholder="https://..." placeholderTextColor={colors.textMuted} keyboardType="url" {...f('fileUrl')} />
        </Field>
      </View>
    </Sheet>
  );
}

// ─── Hizmet Ekleme Sheet ──────────────────────────────────────
function ServiceSheet({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', durationMinutes: '' });
  const [tags,    setTags]    = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (!visible) {
      setForm({ name: '', description: '', price: '', durationMinutes: '' });
      setTags([]); setErrors({});
    }
  }, [visible]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Hizmet adı zorunlu';
    if (!form.price || isNaN(parseFloat(form.price))) e.price = 'Geçerli bir fiyat girin';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post('/api/ServicePackagesApi', {
        name:            form.name.trim(),
        description:     form.description.trim() || null,
        price:           parseFloat(form.price),
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
        tags:            tags.join(', ') || null,
        isActive:        true,
      });
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Hizmet eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChangeText: v => setForm(p => ({ ...p, [key]: v })) });

  const footer = (
    <View style={ss.footer}>
      <TouchableOpacity style={[ss.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={ss.saveBtnTxt}>Hizmeti Kaydet</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Hizmet Paketi Ekle" footer={footer}>
      <Field label="Hizmet Adı *" error={errors.name}>
        <TextInput style={[ss.input, errors.name && ss.inputErr]} placeholder="Örn: Logo Tasarımı" placeholderTextColor={colors.textMuted} {...f('name')} />
      </Field>

      <Field label="Açıklama">
        <TextInput style={[ss.input, ss.textarea]} placeholder="Hizmet kapsamı ve içeriği..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} textAlignVertical="top" {...f('description')} />
      </Field>

      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Field label="Fiyat (₺) *" error={errors.price} style={{ flex: 1 }}>
          <TextInput style={[ss.input, errors.price && ss.inputErr]} placeholder="500" placeholderTextColor={colors.textMuted} keyboardType="numeric" {...f('price')} />
        </Field>
        <Field label="Süre (dk)" style={{ flex: 1 }}>
          <TextInput style={ss.input} placeholder="60" placeholderTextColor={colors.textMuted} keyboardType="numeric" {...f('durationMinutes')} />
        </Field>
      </View>

      <Field label="Etiketler" hint="Arama sonuçlarında öne çıkmanızı sağlar">
        <ChipInput chips={tags} onAdd={t => setTags(p => [...p, t])} onRemove={t => setTags(p => p.filter(x => x !== t))} placeholder="tasarım, logo, marka..." />
      </Field>
    </Sheet>
  );
}

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, hint, error, style, children }) {
  return (
    <View style={[{ marginBottom: space[4] }, style]}>
      <Text style={ss.fieldLabel}>{label}</Text>
      {hint ? <Text style={ss.fieldHint}>{hint}</Text> : null}
      {children}
      {error ? <Text style={ss.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── Teklif Gönderme Sheet ────────────────────────────────────
function OfferSheet({ visible, onClose, onSuccess, request, navigation }) {
  const [price,   setPrice]   = useState('');
  const [message, setMessage] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (!visible) { setPrice(''); setMessage(''); setErrors({}); }
  }, [visible]);

  const validate = () => {
    const e = {};
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) e.price = 'Geçerli bir fiyat girin';
    if (!message.trim() || message.trim().length < 10) e.message = 'En az 10 karakter yazın';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post(`/api/CustomerRequestsApi/${request.id}/offers`, {
        price:   parseFloat(price),
        message: message.trim(),
      });
      onSuccess();
      Alert.alert(
        'Teklif Gönderildi!',
        `"${request.title}" talebine teklifiniz iletildi.`,
        [
          { text: 'Tamam', style: 'default' },
          request.customerId
            ? { text: 'Mesaj Gönder', onPress: () =>
                navigation.navigate('Mesajlar', {
                  screen: 'Chat',
                  params: { targetUserId: request.customerId, targetUserName: request.customerName },
                })
              }
            : null,
        ].filter(Boolean),
      );
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data || 'Teklif gönderilemedi.';
      Alert.alert('Hata', typeof msg === 'string' ? msg : 'Teklif gönderilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <View style={ss.footer}>
      <TouchableOpacity style={[ss.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSend} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="paper-plane-outline" size={16} color="#fff" />
          <Text style={ss.saveBtnTxt}>Teklifi Gönder</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Teklif Ver" footer={footer}>
      {/* Talep özeti */}
      {request && (
        <View style={os.requestSummary}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={os.summaryTitle} numberOfLines={2}>{request.title}</Text>
            {request.customerName
              ? <Text style={os.summaryMeta}>Talep eden: {request.customerName}</Text>
              : null}
          </View>
        </View>
      )}

      <Field label="Teklifiniz (₺) *" error={errors.price}>
        <TextInput
          style={[ss.input, errors.price && ss.inputErr]}
          placeholder="Örn: 1500"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={price}
          onChangeText={v => { setPrice(v); setErrors(p => ({ ...p, price: undefined })); }}
        />
      </Field>

      <Field label="Mesajınız *" hint="Kendinizi ve teklifinizi tanıtın" error={errors.message}>
        <TextInput
          style={[ss.input, ss.textarea, { height: 110 }, errors.message && ss.inputErr]}
          placeholder="Merhaba, bu proje için ihtiyacınızı karşılayabilirim. Deneyimim şu alanda..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={message}
          onChangeText={v => { setMessage(v); setErrors(p => ({ ...p, message: undefined })); }}
          maxLength={1000}
        />
        <Text style={ss.charCount}>{message.length} / 1000</Text>
      </Field>
    </Sheet>
  );
}

// ─── Hizmet Bölgesi Ekleme Sheet ─────────────────────────────
function WorkAreaSheet({ visible, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ city: '', district: '', radiusKm: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) { setForm({ city: '', district: '', radiusKm: '' }); setErrors({}); }
  }, [visible]);

  const validate = () => {
    const e = {};
    if (!form.city.trim()) e.city = 'Şehir zorunlu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post('/api/WorkAreasApi', {
        city:     form.city.trim(),
        district: form.district.trim() || null,
        radiusKm: form.radiusKm ? parseInt(form.radiusKm) : null,
      });
      onSuccess();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Bölge eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChangeText: v => setForm(p => ({ ...p, [key]: v })) });

  const footer = (
    <View style={ss.footer}>
      <TouchableOpacity style={[ss.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={ss.saveBtnTxt}>Bölgeyi Ekle</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Hizmet Bölgesi Ekle" footer={footer}>
      <Field label="Şehir *" error={errors.city}>
        <TextInput style={[ss.input, errors.city && ss.inputErr]} placeholder="İstanbul" placeholderTextColor={colors.textMuted} {...f('city')} />
      </Field>
      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Field label="İlçe" style={{ flex: 1 }}>
          <TextInput style={ss.input} placeholder="Kadıköy" placeholderTextColor={colors.textMuted} {...f('district')} />
        </Field>
        <Field label="Yarıçap (km)" style={{ flex: 1 }}>
          <TextInput style={ss.input} placeholder="25" placeholderTextColor={colors.textMuted} keyboardType="numeric" {...f('radiusKm')} />
        </Field>
      </View>
    </Sheet>
  );
}

// ─── Mağaza Kategorisi Ekleme Sheet ──────────────────────────
function StoreCatSheet({ visible, onClose, onSuccess }) {
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (!visible) { setName(''); setError(''); }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Kategori adı zorunlu'); return; }
    setSaving(true);
    try {
      await axios.post('/api/StoreCategoriesApi/MyCategories', { name: name.trim() });
      onSuccess();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Kategori eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <View style={ss.footer}>
      <TouchableOpacity style={[ss.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={ss.saveBtnTxt}>Kategoriyi Ekle</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Kategori Ekle" footer={footer}>
      <Field label="Kategori Adı *" error={error}>
        <TextInput
          style={[ss.input, error && ss.inputErr]}
          placeholder="Örn: Grafik Tasarım, Web Geliştirme..."
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={v => { setName(v); setError(''); }}
          autoFocus
        />
      </Field>
    </Sheet>
  );
}

// ─── Mağaza Profil Düzenleme Sheet ───────────────────────────
function StoreEditSheet({ visible, onClose, store, onSuccess }) {
  const [form,   setForm]   = useState({ name: '', description: '', profileImageUrl: '', bannerImageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && store) {
      setForm({
        name:            store.name            || '',
        description:     store.description     || '',
        profileImageUrl: store.profileImageUrl || '',
        bannerImageUrl:  store.bannerImageUrl  || '',
      });
      setErrors({});
    }
  }, [visible, store]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Mağaza adı zorunlu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.put('/api/StoresApi/MyStore', {
        name:            form.name.trim(),
        description:     form.description.trim() || null,
        profileImageUrl: form.profileImageUrl.trim() || null,
        bannerImageUrl:  form.bannerImageUrl.trim()  || null,
      });
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert('Hata', e.response?.data?.message || 'Mağaza güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChangeText: v => setForm(p => ({ ...p, [key]: v })) });

  const footer = (
    <View style={ss.footer}>
      <TouchableOpacity style={[ss.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={ss.saveBtnTxt}>Değişiklikleri Kaydet</Text>
        </>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Mağaza Profilini Düzenle" footer={footer}>
      <Field label="Mağaza Adı *" error={errors.name}>
        <TextInput
          style={[ss.input, errors.name && ss.inputErr]}
          placeholder="Mağazanızın adı"
          placeholderTextColor={colors.textMuted}
          {...f('name')}
        />
      </Field>

      <Field label="Açıklama" hint="Müşterilere kendinizi tanıtın">
        <TextInput
          style={[ss.input, ss.textarea]}
          placeholder="Sunduğunuz hizmetler, uzmanlık alanlarınız..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          {...f('description')}
        />
        <Text style={ss.charCount}>{form.description.length} / 1000 karakter</Text>
      </Field>

      <Field label="Profil Görseli URL" hint="Mağaza logosu veya profil fotoğrafı">
        <TextInput
          style={ss.input}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          keyboardType="url"
          autoCapitalize="none"
          {...f('profileImageUrl')}
        />
      </Field>

      <Field label="Banner Görseli URL" hint="Profil sayfası üst banner'ı">
        <TextInput
          style={ss.input}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          keyboardType="url"
          autoCapitalize="none"
          {...f('bannerImageUrl')}
        />
      </Field>
    </Sheet>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────
const StoreProfileScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);

  const [store,          setStore]          = useState(null);
  const [appointments,   setAppts]          = useState([]);
  const [requests,       setRequests]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [workAreas,      setWorkAreas]      = useState([]);
  const [storeCategories,setStoreCats]      = useState([]);
  const [orderCount,     setOrderCount]     = useState(0);
  const [msgCount,       setMsgCount]       = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [activeTab,      setActiveTab]      = useState(route?.params?.tab ?? 'appts');
  const [actioning,      setActioning]      = useState(null);
  const [showPrdSheet,   setShowPrdSheet]   = useState(false);
  const [showSvcSheet,   setShowSvcSheet]   = useState(false);
  const [showEditSheet,  setShowEditSheet]  = useState(false);
  const [showAreaSheet,  setShowAreaSheet]  = useState(false);
  const [showCatSheet,   setShowCatSheet]   = useState(false);
  const [deletingArea,   setDeletingArea]   = useState(null);
  const [deletingCat,    setDeletingCat]    = useState(null);
  const [offerTarget,    setOfferTarget]    = useState(null); // { id, title, customerName }

  // Dışarıdan (SellerHomeScreen quick actions) sheet açma talebi
  useEffect(() => {
    const sheet = route?.params?.openSheet;
    if (sheet === 'product') { setShowPrdSheet(true); navigation.setParams({ openSheet: null }); }
    if (sheet === 'service') { setShowSvcSheet(true); navigation.setParams({ openSheet: null }); }
  }, [route?.params?.openSheet]);

  const fetchAll = useCallback(async () => {
    try {
      const [storeRes, apptRes, reqRes, orderRes, msgRes, catRes, areaRes, storeCatRes] = await Promise.all([
        axios.get('/api/StoresApi/MyStore').catch(() => ({ data: null })),
        axios.get('/api/AppointmentsApi/for-my-store').catch(() => ({ data: [] })),
        axios.get('/api/CustomerRequestsApi').catch(() => ({ data: [] })),
        axios.get('/api/OrderApi/seller-orders').catch(() => ({ data: [] })),
        axios.get('/api/MessagesApi/list').catch(() => ({ data: [] })),
        axios.get('/api/CategoriesApi').catch(() => ({ data: [] })),
        axios.get('/api/WorkAreasApi/mine').catch(() => ({ data: [] })),
        axios.get('/api/StoreCategoriesApi/MyCategories').catch(() => ({ data: [] })),
      ]);
      setStore(storeRes.data);
      setAppts(apptRes.data || []);
      setRequests(reqRes.data || []);
      setOrderCount(Array.isArray(orderRes.data) ? orderRes.data.length : 0);
      setMsgCount(Array.isArray(msgRes.data) ? msgRes.data.filter(m => m.unreadCount > 0).length : 0);
      setCategories(catRes.data || []);
      setWorkAreas(areaRes.data || []);
      setStoreCats(storeCatRes.data || []);
    } catch (e) {
      console.error('StoreProfile fetch hatası:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const deleteWorkArea = (id) => {
    Alert.alert('Bölgeyi Sil', 'Bu hizmet bölgesini kaldırmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        setDeletingArea(id);
        try {
          await axios.delete(`/api/WorkAreasApi/${id}`);
          setWorkAreas(prev => prev.filter(w => w.id !== id));
        } catch { Alert.alert('Hata', 'Bölge silinemedi.'); }
        finally { setDeletingArea(null); }
      }},
    ]);
  };

  const deleteStoreCat = (id) => {
    Alert.alert('Kategoriyi Sil', 'Bu kategoriyi kaldırmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        setDeletingCat(id);
        try {
          await axios.delete(`/api/StoreCategoriesApi/MyCategories/${id}`);
          setStoreCats(prev => prev.filter(c => c.id !== id));
        } catch { Alert.alert('Hata', 'Kategori silinemedi.'); }
        finally { setDeletingCat(null); }
      }},
    ]);
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const updateApptStatus = async (apptId, status) => {
    setActioning(apptId);
    try {
      await axios.put(`/api/AppointmentsApi/${apptId}/status`, { status });
      setAppts(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
    } catch {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
    } finally {
      setActioning(null);
    }
  };

  const confirmAction = (apptId, status, label) => {
    Alert.alert(label, `Randevuyu "${label.toLowerCase()}" olarak işaretlemek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: label, style: status === 'Cancelled' ? 'destructive' : 'default', onPress: () => updateApptStatus(apptId, status) },
    ]);
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const pendingAppts  = appointments.filter(a => a.status === 'Pending');
  const approvedAppts = appointments.filter(a => a.status === 'Approved');
  const sortedAppts   = [...pendingAppts, ...approvedAppts, ...appointments.filter(a => a.status !== 'Pending' && a.status !== 'Approved')];

  const TABS = [
    { key: 'appts',      label: 'Randevular', count: appointments.length },
    { key: 'requests',   label: 'Talepler',   count: requests.length },
    { key: 'workareas',  label: 'Bölgeler',   count: workAreas.length },
    { key: 'storecats',  label: 'Kategoriler',count: storeCategories.length },
  ];

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={s.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} />}
        >
          {/* ─── Header ─── */}
          <View style={s.header}>
            <View style={s.headerTop}>
              {store?.profileImageUrl ? (
                <Image source={{ uri: store.profileImageUrl }} style={s.avatarImg} />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{store?.name?.charAt(0)?.toUpperCase() || '🏪'}</Text>
                </View>
              )}
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={s.storeName} numberOfLines={1}>{store?.name || 'Mağazam'}</Text>
                <Text style={s.storeType}>
                  {store?.storeType === 'Service'  ? '🔧 Hizmet Sağlayıcı' :
                   store?.storeType === 'Online'   ? '💻 Online Uzman'      :
                   store?.storeType === 'Physical' ? '🏪 Fiziksel Mağaza'   : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={s.editIconBtn}
                onPress={() => setShowEditSheet(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={s.statsRow}>
              <TouchableOpacity style={s.statBox} onPress={() => navigation.navigate('Siparisler')}>
                <Text style={s.statVal}>{orderCount}</Text>
                <Text style={s.statLbl}>Sipariş</Text>
              </TouchableOpacity>
              <View style={s.statDiv} />
              <View style={s.statBox}>
                <Text style={s.statVal}>{pendingAppts.length}</Text>
                <Text style={s.statLbl}>Bekleyen</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statBox}>
                <Text style={s.statVal}>{requests.length}</Text>
                <Text style={s.statLbl}>Talep</Text>
              </View>
              <View style={s.statDiv} />
              <TouchableOpacity style={s.statBox} onPress={() => navigation.navigate('Mesajlar')}>
                <Text style={s.statVal}>{msgCount}</Text>
                <Text style={s.statLbl}>Mesaj</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Tab Bar ─── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabList}>
            {TABS.map(t => (
              <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)} activeOpacity={0.7}>
                <Text style={[s.tabTxt, activeTab === t.key && s.tabTxtActive]}>{t.label}</Text>
                {t.count > 0 && (
                  <View style={[s.tabBadge, activeTab === t.key && s.tabBadgeActive]}>
                    <Text style={s.tabBadgeTxt}>{t.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ─── Randevular ─── */}
          {activeTab === 'appts' && (
            <View style={s.section}>
              {sortedAppts.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
                  <Text style={s.emptyTxt}>Henüz randevu yok</Text>
                </View>
              ) : sortedAppts.map(appt => {
                const meta = APPT_STATUS[appt.status] ?? APPT_STATUS.Pending;
                const isAct = actioning === appt.id;
                return (
                  <View key={appt.id} style={s.card}>
                    <View style={s.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle} numberOfLines={1}>{appt.packageName || appt.productName || 'Randevu'}</Text>
                        <Text style={s.cardSub}>{appt.customerName} · {new Date(appt.appointmentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[s.statusTxt, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>
                    {appt.status === 'Pending' && (
                      <View style={s.actionRow}>
                        <TouchableOpacity style={[s.actionBtn, s.approveBtn]} disabled={isAct} onPress={() => updateApptStatus(appt.id, 'Approved')}>
                          <Text style={s.approveTxt}>{isAct ? '...' : 'Onayla'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.actionBtn, s.cancelBtn]} disabled={isAct} onPress={() => confirmAction(appt.id, 'Cancelled', 'İptal Et')}>
                          <Text style={s.cancelTxt}>{isAct ? '...' : 'İptal'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {appt.status === 'Approved' && (
                      <TouchableOpacity style={[s.actionBtn, s.approveBtn, { marginTop: space[2] }]} disabled={isAct} onPress={() => updateApptStatus(appt.id, 'Completed')}>
                        <Text style={s.approveTxt}>{isAct ? '...' : 'Tamamlandı İşaretle'}</Text>
                      </TouchableOpacity>
                    )}
                    {appt.customerId && (
                      <View style={s.reqActions}>
                        <TouchableOpacity style={s.msgBtn} onPress={() => navigation.navigate('Mesajlar', { screen: 'Chat', params: { targetUserId: appt.customerId, targetUserName: appt.customerName } })}>
                          <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                          <Text style={s.msgBtnTxt}>Müşteriye Mesaj</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── Talepler ─── */}
          {activeTab === 'requests' && (
            <View style={s.section}>
              {requests.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                  <Text style={s.emptyTxt}>Uygun müşteri talebi yok</Text>
                  <Text style={s.emptyHint}>Hizmetinizle uyuşan talepler burada görünür</Text>
                </View>
              ) : requests.map(req => (
                <View key={req.id} style={s.card}>
                  {/* Başlık + teklif sayısı */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[2] }}>
                    <Text style={[s.cardTitle, { flex: 1 }]} numberOfLines={2}>{req.title || req.description}</Text>
                    {req.offerCount > 0 && (
                      <View style={[s.statusBadge, { backgroundColor: colors.warningSoft }]}>
                        <Text style={[s.statusTxt, { color: colors.warning }]}>{req.offerCount} teklif</Text>
                      </View>
                    )}
                  </View>

                  {/* Meta chips */}
                  <View style={s.reqMeta}>
                    {req.city ? (
                      <View style={s.metaChip}>
                        <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                        <Text style={s.metaChipTxt}>{req.city}</Text>
                      </View>
                    ) : null}
                    {req.budget != null ? (
                      <View style={[s.metaChip, { backgroundColor: colors.primarySoft, borderColor: colors.glassBorder }]}>
                        <Ionicons name="cash-outline" size={11} color={colors.primary} />
                        <Text style={[s.metaChipTxt, { color: colors.primary }]}>₺{req.budget.toLocaleString('tr-TR')}</Text>
                      </View>
                    ) : null}
                    {req.categoryHint ? (
                      <View style={s.metaChip}>
                        <Ionicons name="bookmark-outline" size={11} color={colors.textMuted} />
                        <Text style={s.metaChipTxt}>{req.categoryHint}</Text>
                      </View>
                    ) : null}
                    <View style={s.metaChip}>
                      <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                      <Text style={s.metaChipTxt}>{new Date(req.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>

                  {req.description && req.title
                    ? <Text style={s.cardDesc} numberOfLines={2}>{req.description}</Text>
                    : null}

                  {/* Aksiyonlar */}
                  <View style={s.reqActions}>
                    <TouchableOpacity
                      style={s.offerBtn}
                      onPress={() => setOfferTarget(req)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pricetag-outline" size={14} color="#fff" />
                      <Text style={s.offerBtnTxt}>Teklif Ver</Text>
                    </TouchableOpacity>
                    {req.customerId && (
                      <TouchableOpacity
                        style={s.msgBtn}
                        onPress={() => navigation.navigate('Mesajlar', { screen: 'Chat', params: { targetUserId: req.customerId, targetUserName: req.customerName } })}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                        <Text style={s.msgBtnTxt}>Mesaj</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ─── Hizmet Bölgeleri ─── */}
          {activeTab === 'workareas' && (
            <View style={s.section}>
              <TouchableOpacity style={s.addRow} onPress={() => setShowAreaSheet(true)} activeOpacity={0.8}>
                <View style={s.addRowIcon}><Ionicons name="add" size={18} color={colors.primary} /></View>
                <Text style={s.addRowTxt}>Hizmet Bölgesi Ekle</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>

              {workAreas.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="map-outline" size={36} color={colors.textMuted} />
                  <Text style={s.emptyTxt}>Henüz hizmet bölgesi yok</Text>
                  <Text style={s.emptyHint}>Hizmet verdiğiniz şehir ve ilçeleri ekleyin</Text>
                </View>
              ) : workAreas.map(area => (
                <View key={area.id} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={[s.svcAccent, { backgroundColor: colors.primary, marginRight: space[3] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{area.city}{area.district ? ` / ${area.district}` : ''}</Text>
                    {area.radiusKm ? <Text style={s.cardSub}>📍 {area.radiusKm} km yarıçap</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => deleteWorkArea(area.id)}
                    disabled={deletingArea === area.id}
                    activeOpacity={0.7}
                  >
                    {deletingArea === area.id
                      ? <ActivityIndicator size="small" color={colors.danger} />
                      : <Ionicons name="trash-outline" size={18} color={colors.danger} />}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ─── Mağaza Kategorileri ─── */}
          {activeTab === 'storecats' && (
            <View style={s.section}>
              <TouchableOpacity style={s.addRow} onPress={() => setShowCatSheet(true)} activeOpacity={0.8}>
                <View style={s.addRowIcon}><Ionicons name="add" size={18} color={colors.primary} /></View>
                <Text style={s.addRowTxt}>Kategori Ekle</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>

              {storeCategories.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="pricetag-outline" size={36} color={colors.textMuted} />
                  <Text style={s.emptyTxt}>Henüz kategori yok</Text>
                  <Text style={s.emptyHint}>Mağazanızı kategorilendirerek daha kolay bulunun</Text>
                </View>
              ) : (
                <View style={s.catGrid}>
                  {storeCategories.map(cat => (
                    <View key={cat.id} style={s.catPill}>
                      <Text style={s.catPillTxt}>{cat.name}</Text>
                      <TouchableOpacity
                        onPress={() => deleteStoreCat(cat.id)}
                        disabled={deletingCat === cat.id}
                        activeOpacity={0.7}
                        style={{ marginLeft: 4 }}
                      >
                        {deletingCat === cat.id
                          ? <ActivityIndicator size="small" color={colors.danger} style={{ width: 14, height: 14 }} />
                          : <Ionicons name="close-circle" size={16} color={colors.textMuted} />}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={{ height: space[10] }} />
        </ScrollView>
      </SafeAreaView>

      {/* ─── Bottom Sheets ─── */}
      <ProductSheet visible={showPrdSheet} onClose={() => setShowPrdSheet(false)} categories={categories} onSuccess={fetchAll} />
      <ServiceSheet visible={showSvcSheet} onClose={() => setShowSvcSheet(false)} onSuccess={fetchAll} />
      <StoreEditSheet visible={showEditSheet} onClose={() => setShowEditSheet(false)} store={store} onSuccess={fetchAll} />
      <WorkAreaSheet visible={showAreaSheet} onClose={() => setShowAreaSheet(false)} onSuccess={() => { fetchAll(); setShowAreaSheet(false); }} />
      <StoreCatSheet visible={showCatSheet} onClose={() => setShowCatSheet(false)} onSuccess={() => { fetchAll(); setShowCatSheet(false); }} />
      <OfferSheet
        request={offerTarget}
        visible={!!offerTarget}
        onClose={() => setOfferTarget(null)}
        onSuccess={() => { setOfferTarget(null); fetchAll(); }}
        navigation={navigation}
      />
    </View>
  );
};

export default StoreProfileScreen;

// ─── Stiller ─────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },

  header: {
    backgroundColor: colors.surface,
    padding: space[5], paddingBottom: space[4],
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: space[4] },
  avatar: {
    width: 54, height: 54, borderRadius: radius.xl,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: {
    width: 54, height: 54, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  avatarTxt: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.primary },
  storeName: { fontFamily: fonts.displayBold, fontSize: fontSize.md, color: colors.text },
  storeType: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  editIconBtn: {
    width: 36, height: 36, borderRadius: radius.lg,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox:  { flex: 1, alignItems: 'center', paddingVertical: space[1] },
  statDiv:  { width: 1, height: 30, backgroundColor: colors.borderSubtle },
  statVal:  { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  statLbl:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  // Tab bar
  tabList: { paddingHorizontal: space[4], paddingVertical: space[3], gap: space[2] },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    paddingVertical: space[2] + 2, paddingHorizontal: space[4],
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive:      { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  tabTxt:         { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary },
  tabTxtActive:   { fontFamily: fonts.bodySemiBold, color: colors.primary },
  tabBadge:       { backgroundColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: colors.primary },
  tabBadgeTxt:    { fontFamily: fonts.bodyBold, fontSize: 10, color: '#fff' },

  section: { padding: space[4], gap: space[3] },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderSubtle, padding: space[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardTop:  { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  cardMeta: { flexDirection: 'row' },
  cardTitle:{ fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: 3 },
  cardSub:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textSecondary },
  cardDesc: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.5, marginTop: space[1] },

  statusBadge: { paddingHorizontal: space[2], paddingVertical: 3, borderRadius: radius.pill },
  statusTxt:   { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs },

  actionRow:  { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  actionBtn:  { flex: 1, paddingVertical: space[2] + 2, borderRadius: radius.lg, alignItems: 'center' },
  approveBtn: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.successBorder },
  cancelBtn:  { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(186,26,26,0.25)' },
  approveTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.success },
  cancelTxt:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.danger },
  msgBtn:    { flexDirection: 'row', alignItems: 'center', gap: space[2], flex: 1, justifyContent: 'center', paddingVertical: space[2] + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.primarySoft },
  msgBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },

  reqMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[1] },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: 3, paddingHorizontal: space[2],
  },
  metaChipTxt: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textMuted },

  reqActions: { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  offerBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[1],
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: space[2] + 2,
  },
  offerBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: '#fff' },

  deleteBtn: { padding: space[2] },

  svcAccent: { width: 3, borderRadius: 2, alignSelf: 'stretch' },

  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.glassBorder,
    padding: space[4],
  },
  addRowIcon: { width: 32, height: 32, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  addRowTxt:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary, flex: 1 },

  emptyBox:  { alignItems: 'center', paddingVertical: space[8], gap: space[2] },
  emptyTxt:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: colors.textMuted },
  emptyHint: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], paddingTop: space[1] },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primarySoft, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: space[2], paddingHorizontal: space[3], gap: 4,
  },
  catPillTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.primary },

  kwRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: space[1], marginTop: space[2] },
  kwChip:   { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: space[2], borderWidth: 1, borderColor: colors.glassBorder },
  kwChipTxt:{ fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.primary },
});

// Chip input stiller
const cs = StyleSheet.create({
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.glassBorder,
    paddingVertical: 4, paddingHorizontal: space[2],
  },
  chipTxt:  { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  input: {
    flex: 1, backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[2] + 2, paddingHorizontal: space[3],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  addBtn:    { backgroundColor: colors.primarySoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder, paddingVertical: space[2] + 2, paddingHorizontal: space[3] },
  addBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.primary },
});

// Sheet stiller
const ss = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2,
    paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[5],
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderSubtle,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  footer: {
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[4] },
  sheetTitle:  { fontFamily: fonts.displayBold, fontSize: fontSize.lg, color: colors.text },
  fieldLabel:  { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, marginBottom: space[1] },
  fieldHint:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginBottom: space[2] },
  fieldError:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.danger, marginTop: space[1] },
  charCount:   { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle,
    paddingVertical: space[3], paddingHorizontal: space[4],
    fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  catChip:       { paddingVertical: 7, paddingHorizontal: space[3], borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  catChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  catChipTxt:    { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
  catChipTxtActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  licenseRow: { flexDirection: 'row', gap: space[2] },
  licenseBtn: {
    flex: 1, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: space[3], alignItems: 'center', gap: 2, backgroundColor: colors.surface,
  },
  licenseBtnActive:  { backgroundColor: colors.primarySoft, borderColor: colors.primaryRing },
  licenseBtnTxt:     { fontFamily: fonts.bodySemiBold, fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  licenseBtnTxtActive: { color: colors.primary },
  licenseBtnDesc:    { fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2],
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: space[4], marginTop: space[2],
  },
  saveBtnTxt: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.base, color: '#fff' },
});

// OfferSheet özel stilleri
const os = StyleSheet.create({
  requestSummary: {
    flexDirection: 'row', alignItems: 'flex-start', gap: space[3],
    backgroundColor: colors.primarySoft, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.glassBorder,
    padding: space[3], marginBottom: space[5],
  },
  summaryTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.4 },
  summaryMeta:  { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
