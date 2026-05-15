import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const USER_TYPES = [
  { value: 'Consumer',              label: 'Tüketici',                emoji: '🛍️', desc: 'Hizmet ve ürün satın al' },
  { value: 'LocalArtisan',          label: 'Yerel Esnaf / Usta',      emoji: '🔧', desc: 'Yerelde hizmet ver' },
  { value: 'OnlineServiceProvider', label: 'Online Hizmet Sağlayıcı', emoji: '💻', desc: 'Koçluk, eğitim, danışmanlık' },
  { value: 'Seller',                label: 'Satıcı',                  emoji: '🏪', desc: 'Ürün satışı yap' },
];

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType]               = useState('Consumer');
  const [loading, setLoading]                 = useState(false);

  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const result = await register(fullName, email, password, confirmPassword, userType);
      if (result?.isPending) {
        Alert.alert(
          '⏳ Başvurunuz Alındı',
          'Mağaza başvurunuz incelemeye alındı. Onaylandığında giriş yapabileceksiniz.',
          [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
        );
      } else if (result?.success) {
        Alert.alert('Başarılı', 'Kayıt başarılı! Lütfen giriş yapın.', [
          { text: 'Tamam', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      Alert.alert('Kayıt Başarısız', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Aramıza katılmak için formu doldurun</Text>
        </View>

        <View style={styles.card}>
          {/* Ad Soyad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput style={styles.input} placeholder="Ad Soyad" value={fullName}
              onChangeText={setFullName} autoCapitalize="words" placeholderTextColor={colors.textMuted} />
          </View>

          {/* E-Posta */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-Posta Adresi</Text>
            <TextInput style={styles.input} placeholder="isim@ornek.com" value={email}
              onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
              placeholderTextColor={colors.textMuted} />
          </View>

          {/* Şifre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={password}
              onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textMuted} />
          </View>

          {/* Şifre Onay */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre Onay</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={confirmPassword}
              onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor={colors.textMuted} />
          </View>

          {/* Hesap Türü */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hesap Türü</Text>
            <View style={styles.typeGrid}>
              {USER_TYPES.map(t => {
                const active = userType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                    onPress={() => setUserType(t.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
                    <Text style={styles.typeDesc}>{t.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Kayıt Butonu */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.text} />
              : <Text style={styles.buttonText}>KAYDOL</Text>
            }
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.canvas },
  inner:        { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:       { marginBottom: 32, alignItems: 'center' },
  title:        { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle:     { fontSize: 14, color: colors.textSecondary },
  card:         { backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderSubtle },
  inputGroup:   { marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input:        { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: colors.surfaceSunken, color: colors.text },
  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeCard:     { width: '47%', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: 'center' },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  typeEmoji:    { fontSize: 22, marginBottom: 4 },
  typeLabel:    { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  typeLabelActive: { color: colors.accent },
  typeDesc:     { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  button:       { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: colors.textMuted },
  buttonText:   { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  footer:       { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText:   { fontSize: 14, color: colors.textMuted },
  footerLink:   { fontSize: 14, color: colors.accent, fontWeight: '700' },
});

export default RegisterScreen;
