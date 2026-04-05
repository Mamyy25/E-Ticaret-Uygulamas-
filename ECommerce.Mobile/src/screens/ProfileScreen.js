import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || user?.sub || 'Kullanıcı'}</Text>
        <Text style={styles.userRole}>{user?.isAdmin ? '🛡️ Yönetici (Admin)' : 'Müşteri'}</Text>
      </View>

      <View style={styles.content}>
        {user?.isAdmin && (
          <View style={styles.adminBox}>
            <Text style={styles.adminTitle}>Yönetim Paneli İşlemleri</Text>
            <TouchableOpacity style={styles.adminBtn}>
              <Text style={styles.adminBtnText}>📦 Ürünleri Yönet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminBtn}>
              <Text style={styles.adminBtnText}>🛒 Tüm Siparişleri Görüntüle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminBtn}>
              <Text style={styles.adminBtnText}>👥 Kullanıcı İşlemleri</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Hesaptan Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.surface,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  adminBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
  },
  adminBtn: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  adminBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 'auto'
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
