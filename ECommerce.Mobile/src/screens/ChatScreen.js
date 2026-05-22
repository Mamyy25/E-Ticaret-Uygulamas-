import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontSize, radius, space } from '../theme/typography';

const DARK = {
  bg:      '#080613',
  surface: '#1C1828',
  border:  'rgba(167,139,250,0.18)',
  text:    '#EAE8F4',
  muted:   '#6B6385',
  input:   '#110E1E',
};

const AVATAR_COLORS = [
  ['#4648D4', '#6063EE'],
  ['#7C3AED', '#A78BFA'],
  ['#0369A1', '#38BDF8'],
  ['#15803D', '#4ADE80'],
];
const getAvatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length][0];

const formatMsgTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const isNewDay = (prev, curr) => {
  if (!prev) return true;
  const a = new Date(prev.createdAt).toDateString();
  const b = new Date(curr.createdAt).toDateString();
  return a !== b;
};

const DayDivider = ({ date, dark }) => {
  const D = dark ? DARK : null;
  return (
    <View style={styles.dayRow}>
      <View style={[styles.dayLine, D && { backgroundColor: D.border }]} />
      <Text style={[styles.dayText, D && { color: D.muted }]}>
        {new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>
      <View style={[styles.dayLine, D && { backgroundColor: D.border }]} />
    </View>
  );
};

const ChatScreen = ({ route, navigation }) => {
  const { targetUserId, targetUserName } = route.params;
  const { user, isAdmin } = useContext(AuthContext);
  const D = isAdmin ? DARK : null;

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const flatListRef               = useRef(null);
  const pollRef                   = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: targetUserName || 'Sohbet',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
      ),
    });
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchMessages = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await axios.get(`/api/MessagesApi/chat/${targetUserId}`);
      setMessages(data || []);
    } catch { /* sessiz */ } finally {
      if (showLoader) setLoading(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      content: trimmed,
      isMine: true,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await axios.post('/api/MessagesApi/send', {
        receiverId: targetUserId,
        content: trimmed,
      });
      await fetchMessages(false);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isMine = item.isMine;
    const showDay = isNewDay(messages[index - 1] || null, item);

    return (
      <>
        {showDay && <DayDivider date={item.createdAt} dark={isAdmin} />}
        <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
          {!isMine && (
            <View style={[styles.miniAvatar, { backgroundColor: getAvatarColor(targetUserName) }]}>
              <Text style={styles.miniAvatarText}>{(targetUserName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            D && !isMine && { backgroundColor: D.surface, borderColor: D.border },
            item.isTemp && { opacity: 0.6 },
          ]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine, D && !isMine && { color: D.text }]}>
              {item.content}
            </Text>
            <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine, D && !isMine && { color: D.muted }]}>
              {formatMsgTime(item.createdAt)}
              {isMine && (
                <Text> {item.isTemp ? '·' : '✓'}</Text>
              )}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, D && { backgroundColor: D.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={[styles.center, D && { backgroundColor: D.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            style={D && { backgroundColor: D.bg }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={D ? D.muted : colors.borderSubtle} />
                <Text style={[styles.emptyText, D && { color: D.muted }]}>İlk mesajı siz gönderin!</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputArea, D && { backgroundColor: D.input, borderTopColor: D.border }]}>
          <TextInput
            style={[styles.input, D && { backgroundColor: D.surface, borderColor: D.border, color: D.text }]}
            placeholder="Mesaj yazın..."
            placeholderTextColor={D ? D.muted : colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.canvas },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: space[4], paddingVertical: space[3], paddingBottom: space[2] },

  dayRow: { flexDirection: 'row', alignItems: 'center', marginVertical: space[4] },
  dayLine: { flex: 1, height: 1, backgroundColor: colors.borderSubtle },
  dayText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginHorizontal: space[3],
  },

  bubbleWrap: { flexDirection: 'row', marginBottom: space[2], alignItems: 'flex-end' },
  bubbleWrapMine:   { justifyContent: 'flex-end', marginLeft: 60 },
  bubbleWrapTheirs: { justifyContent: 'flex-start', marginRight: 60 },

  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  miniAvatarText: { fontFamily: fonts.displayBold, fontSize: 12, color: '#fff' },

  bubble: {
    paddingHorizontal: space[3] + 2,
    paddingTop: space[2] + 2,
    paddingBottom: space[2],
    borderRadius: radius.xl2,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.xs,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTime: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.textMuted },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: space[3],
    paddingVertical: space[2] + 2,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl2,
    paddingHorizontal: space[4],
    paddingTop: Platform.OS === 'ios' ? 11 : 9,
    paddingBottom: Platform.OS === 'ios' ? 11 : 9,
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.text,
    maxHeight: 110,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: colors.borderStrong },
});
