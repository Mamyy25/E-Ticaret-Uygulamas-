import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { colors } from '../theme/colors';

const ChatScreen = ({ route, navigation }) => {
  const { targetUserId, targetUserName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    navigation.setOptions({ title: targetUserName || 'Sohbet' });
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Gerçek zamanlı hissi için 5 saniyede bir çek
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/api/MessagesApi/chat/${targetUserId}`);
      setMessages(data);
    } catch { }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const currentText = text;
    setText('');
    
    // Optimizasyon için geçici mesaj eklemesi
    const tempMsg = { id: Date.now(), content: currentText, isMine: true, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post('/api/MessagesApi/send', { receiverId: targetUserId, content: currentText });
      fetchMessages();
    } catch (e) {
      console.warn("Gönderilemedi", e);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.isMine;
    return (
      <View style={[styles.bubbleWrap, isMine ? styles.myBubbleWrap : styles.theirBubbleWrap]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.msgText, isMine ? styles.myMsgText : styles.theirMsgText]}>{item.content}</Text>
          <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.theirTimeText]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yazın..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!text.trim()}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  bubbleWrap: { marginBottom: 12, flexDirection: 'row' },
  myBubbleWrap: { justifyContent: 'flex-end', marginLeft: 40 },
  theirBubbleWrap: { justifyContent: 'flex-start', marginRight: 40 },
  bubble: { padding: 12, paddingHorizontal: 16, borderRadius: 20, maxWidth: '100%' },
  myBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: 15, lineHeight: 20 },
  myMsgText: { color: '#fff' },
  theirMsgText: { color: colors.text },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  theirTimeText: { color: colors.textMuted },
  inputArea: {
    flexDirection: 'row', padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, alignItems: 'flex-end'
  },
  input: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, maxHeight: 100, color: colors.text
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentDark, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2
  },
  sendIcon: { color: '#fff', fontSize: 18, marginLeft: 2 }
});
