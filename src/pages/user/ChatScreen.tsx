import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Modal, SafeAreaView, Platform, PermissionsAndroid, Alert } from 'react-native';
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

const requestAudioPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const sdkVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
      if (sdkVersion < 29) {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        return (
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
          grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export function ChatScreen({ activeConversation, onConversationSelect, onBackToConversations }: { activeConversation: any; onConversationSelect?: any; onBackToConversations: any }) {
  const { conversations, sendMessage, markAsRead, fetchMessagesForRoom, setActiveRoomId, acceptChatRequest, declineChatRequest, getUserPresence } = useChat() as any;
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translateText } = useLanguage() as any;
  const [selectedConvoId, setSelectedConvoId] = useState(activeConversation || null);
  const [msgText, setMsgText] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const startVoiceRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone permission is required to record voice messages.');
      return;
    }

    try {
      setIsRecording(true);
      await audioRecorderPlayer.startRecorder();
    } catch (err) {
      console.warn('Start recorder failed:', err);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      const resultUri = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);

      if (resultUri) {
        Alert.alert('Processing', 'Transcribing your voice...');
        const transcribed = await apiService.voiceToText(resultUri, 'EN');
        if (transcribed) {
          setMsgText(prev => prev ? `${prev} ${transcribed}` : transcribed);
          Alert.alert('Speech-to-Text Success', `Transcribed: "${transcribed}"`);
        } else {
          Alert.alert('Speech-to-Text Error', 'Could not transcribe speech. Please try again.');
        }
      }
    } catch (err) {
      console.warn('Stop recorder failed:', err);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => {});
    };
  }, []);

  const activeConvo = conversations.find((c: any) => c.id === selectedConvoId);

  useEffect(() => {
    if (setActiveRoomId) {
      setActiveRoomId(selectedConvoId);
    }
    if (selectedConvoId && fetchMessagesForRoom) {
      fetchMessagesForRoom(selectedConvoId);
    }
    return () => {
      if (setActiveRoomId) {
        setActiveRoomId(null);
      }
    };
  }, [selectedConvoId, fetchMessagesForRoom, setActiveRoomId]);

  const handleSend = () => {
    if (!msgText.trim() || !selectedConvoId) { return; }
    sendMessage(selectedConvoId, msgText.trim(), currentUser);
    setMsgText('');
  };

  const handleSelectConvo = (convoId: any) => {
    setSelectedConvoId(convoId);
    markAsRead(convoId);
    if (onConversationSelect) {
      onConversationSelect(convoId);
    }
  };

  const formatMsgTime = (dateStr: string) => {
    try {
      const date = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (selectedConvoId && activeConvo) {
    const filteredMessages = activeConvo.messages.filter((m: any) =>
      !searchQuery || m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={[styles.chatDetailContainer, { backgroundColor: '#ECEAE8' }]}>
        {/* Mockup styled Header */}
        <View style={{
          height: 64,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E1DCDB',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          justifyContent: 'space-between',
        }}>
          {isSearching ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TextInput
                placeholder={t('searchPlaceholder', 'Search messages...')}
                placeholderTextColor={COLORS.zorba}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  height: 38,
                  borderWidth: 1,
                  borderColor: '#CEC7C5',
                  borderRadius: 19,
                  paddingHorizontal: 16,
                  fontSize: 13,
                  color: '#2D1D15',
                  backgroundColor: '#FAF8F8',
                }}
                autoFocus={true}
              />
              <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={{ marginLeft: 8, padding: 6 }}>
                <View style={{ width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: '#8C8385', transform: [{ rotate: '45deg' }], borderRadius: 1 }} />
                  <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: '#8C8385', transform: [{ rotate: '-45deg' }], borderRadius: 1 }} />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedConvoId(null);
                    if (onBackToConversations) { onBackToConversations(); }
                  }}
                  style={{ marginRight: 12, justifyContent: 'center', alignItems: 'center' }}
                >
                  <View style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#F5F2F1',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderLeftWidth: 2,
                      borderBottomWidth: 2,
                      borderColor: '#6F405F',
                      transform: [{ rotate: '45deg' }],
                      marginLeft: 2,
                    }} />
                  </View>
                </TouchableOpacity>

                {(() => {
                  const presence = getUserPresence ? getUserPresence(activeConvo.username) : { isOnline: false, statusText: 'Offline' };
                  return (
                    <>
                      <View style={{
                        width: 42,
                        height: 42,
                        position: 'relative',
                        marginRight: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <InitialAvatar initials={activeConvo.avatarInitials} color={activeConvo.avatarColor} size={40} />
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: presence.isOnline ? '#3F7772' : '#8C8385',
                          borderWidth: 2,
                          borderColor: '#FFFFFF',
                        }} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15.5, fontWeight: 'bold', color: '#2D1D15' }}>{activeConvo.username}</Text>
                        <Text style={{
                          fontSize: 11,
                          color: presence.isOnline ? '#3F7772' : '#8C8385',
                          marginTop: 1,
                          fontWeight: '600'
                        }}>
                          {presence.statusText}
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => setIsSearching(true)}>
                  <View style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#F5F2F1',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: '#8C8385',
                      }} />
                      <View style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 5,
                        height: 2,
                        backgroundColor: '#8C8385',
                        transform: [{ rotate: '45deg' }],
                      }} />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#F5F2F1',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{ width: 16, height: 16, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#8C8385' }} />
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#8C8385' }} />
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#8C8385' }} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <FlatList
          data={filteredMessages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item: m }) => {
            const cleanSender = String(m.sender).toLowerCase().replace('@', '');
            const cleanSelf = currentUser?.username ? String(currentUser.username).toLowerCase().replace('@', '') : '';
            const isMe = m.sender === 'me' || cleanSender === cleanSelf;
            const isRead = m.isRead || m.status === 'READ' || activeConvo.requestStatus === 'ACCEPTED';
            return (
               <View style={[
                 styles.messageBubbleContainer,
                 isMe ? styles.msgMeContainer : styles.msgPartnerContainer,
                 { marginBottom: 10 }
               ]}>
                 {/* Partner avatar */}
                 {!isMe && (
                   <View style={{ marginRight: 8, marginTop: 2 }}>
                     <InitialAvatar initials={activeConvo.avatarInitials} color={activeConvo.avatarColor} size={28} />
                   </View>
                 )}

                 <View style={{ maxWidth: '78%' }}>
                   {/* Message bubble */}
                   <View style={[
                     styles.messageBubble,
                     isMe ? styles.msgMeBubble : styles.msgPartnerBubble,
                     {
                       maxWidth: '100%',
                       paddingVertical: 10,
                       paddingHorizontal: 14,
                       borderRadius: 16,
                       borderBottomRightRadius: isMe ? 4 : 16,
                       borderBottomLeftRadius: !isMe ? 4 : 16,
                       shadowColor: '#000',
                       shadowOffset: { width: 0, height: 1.5 },
                       shadowOpacity: 0.1,
                       shadowRadius: 1.5,
                       elevation: 1.5,
                     }
                   ]}>
                     <Text style={[
                       styles.messageText, 
                       isMe ? styles.msgMeText : styles.msgPartnerText,
                       { fontSize: 14, lineHeight: 19 }
                     ]}>
                       {isMe ? m.text : translateText(m.text, currentLanguage)}
                     </Text>
                   </View>

                   {/* Message timestamp and checkmarks */}
                   {isMe ? (
                     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, marginRight: 4 }}>
                       <Text style={{ fontSize: 9.5, color: '#908684', marginRight: 4 }}>{formatMsgTime(m.time || m.createdAt)}</Text>
                       <Text style={{ fontSize: 11, color: isRead ? '#34B7F1' : '#908684', fontWeight: 'bold' }}>✓✓</Text>
                     </View>
                   ) : (
                     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 3, marginLeft: 4 }}>
                       <Text style={{ fontSize: 9.5, color: '#908684' }}>{formatMsgTime(m.time || m.createdAt)}</Text>
                     </View>
                   )}
                 </View>
               </View>
             );
           }}
        />

        {/* Emoji Selector Panel */}
        {showEmojiPicker && (
          <View style={{
            height: 50,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E1DCDB',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, alignItems: 'center' }}>
              {['😀', '😂', '😍', '👍', '🙏', '🎉', '🔥', '✨', '💡', '💯', '❤️', '😔', '🤝', '🌸'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => { setMsgText(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mockup styled Footer Composer / Banners */}
        {activeConvo.requestStatus === 'PENDING' ? (
          (activeConvo.requestSender ? activeConvo.requestSender.trim().toLowerCase() : '') !== (currentUser?.username ? currentUser.username.trim().toLowerCase() : '') ? (
            <View style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: '#E1DCDB',
              backgroundColor: '#FAF8F8',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: '#2D1D15' }}>
                  {activeConvo.username} wants to chat with you
                </Text>
                <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 2 }}>
                  Accept to start chatting and messaging.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => acceptChatRequest(activeConvo.id)}
                  style={{
                    backgroundColor: '#6F405F',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    declineChatRequest(activeConvo.id);
                    setSelectedConvoId(null);
                    if (onBackToConversations) { onBackToConversations(); }
                  }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#CEC7C5',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#8C8385', fontWeight: '600', fontSize: 13 }}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: '#E1DCDB',
              backgroundColor: '#FAF8F8',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: '#6F405F', fontWeight: 'bold', fontSize: 13.5, textAlign: 'center' }}>
                ⏳ Chat Request Sent. Waiting for {activeConvo.username} to accept.
              </Text>
            </View>
          )
        ) : (
          <View style={{
            height: 64,
            flexDirection: 'row',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: '#E1DCDB',
            paddingHorizontal: 12,
            backgroundColor: '#FFFFFF',
            marginBottom: Platform.OS === 'ios' ? 16 : 0,
          }}>
            <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: 6, marginRight: 4 }}>
              <Text style={{ fontSize: 20, color: '#8C8385' }}>😊</Text>
            </TouchableOpacity>
            <TextInput
              placeholder={t('typeAMessage', 'Type a message...')}
              placeholderTextColor={COLORS.zorba}
              value={msgText}
              onChangeText={setMsgText}
              style={{
                flex: 1,
                height: 40,
                borderWidth: 1,
                borderColor: '#CEC7C5',
                borderRadius: 20,
                paddingHorizontal: 16,
                fontSize: 13,
                color: '#2D1D15',
                backgroundColor: '#FAF8F8',
              }}
            />
            <TouchableOpacity onPress={startVoiceRecording} style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F3EFEF',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}>
              <Text style={{ fontSize: 16 }}>🎙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend} style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#6F405F',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}>
              <View style={{ width: 12, height: 12, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#FFFFFF', transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 2 }] }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Pulsing Voice Recording Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isRecording}
        >
          <SafeAreaView style={styles.centerModalOverlay}>
            <View style={[styles.reportModalCard, { alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={[styles.reportModalTitle, { color: COLORS.error }]}>🎙️ {t('listening', 'Listening...')}</Text>
              <Text style={[styles.reportModalSubtitle, { textAlign: 'center', marginTop: 8, paddingHorizontal: 12 }]}>
                {t('speakNow', 'Speak now. Converting your voice to anonymous text in real-time.')}
              </Text>

              {/* Pulsing Ring Simulation */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(196, 111, 118, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 24,
              }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: COLORS.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24, color: '#FFF' }}>🎙️</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={stopVoiceRecording}
                style={{
                  marginTop: 20,
                  backgroundColor: COLORS.error,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  width: '80%',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFF' }}>
                  Stop & Transcribe
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  audioRecorderPlayer.stopRecorder().catch(() => {});
                  setIsRecording(false);
                }}
                style={{
                  marginTop: 10,
                  backgroundColor: '#F2EDED',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  width: '80%',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.deepPlum }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  }

  const cleanSelf = currentUser?.username ? currentUser.username.trim().toLowerCase() : '';

  // Incoming requests (sent by someone else to me)
  const incomingRequests = conversations.filter((c: any) => {
    const sender = c.requestSender ? c.requestSender.trim().toLowerCase() : '';
    return c.requestStatus === 'PENDING' && sender !== cleanSelf;
  });

  // Primary chats (accepted, or pending outgoing sent by me)
  const primaryChats = conversations.filter((c: any) => {
    if (!c.requestStatus || c.requestStatus === 'ACCEPTED') return true;
    const sender = c.requestSender ? c.requestSender.trim().toLowerCase() : '';
    return c.requestStatus === 'PENDING' && sender === cleanSelf;
  });

  const totalUnreadMessages = primaryChats.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);

  return (
    <View style={styles.chatContainer}>
      <Text style={styles.screenTitle}>Direct Messages</Text>

      {/* Messages vs Requests Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E1DCDB', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('chats')}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: activeTab === 'chats' ? 2.5 : 0,
            borderBottomColor: '#6F405F',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13.5, fontWeight: activeTab === 'chats' ? 'bold' : '600', color: activeTab === 'chats' ? '#6F405F' : '#8C8385' }}>
              Messages
            </Text>
            {totalUnreadMessages > 0 && (
              <View style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1.5 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: 'bold' }}>{totalUnreadMessages}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: activeTab === 'requests' ? 2.5 : 0,
            borderBottomColor: '#6F405F',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13.5, fontWeight: activeTab === 'requests' ? 'bold' : '600', color: activeTab === 'requests' ? '#6F405F' : '#8C8385' }}>
              Requests
            </Text>
            {incomingRequests.length > 0 && (
              <View style={{ backgroundColor: '#6F405F', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1.5 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: 'bold' }}>{incomingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'chats' ? (
        primaryChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Send a DM from posts feed.</Text>
          </View>
        ) : (
          <FlatList
            data={primaryChats}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const isSentPending = item.requestStatus === 'PENDING' && (item.requestSender ? item.requestSender.trim().toLowerCase() : '') === cleanSelf;
              return (
                <TouchableOpacity onPress={() => handleSelectConvo(item.id)} style={styles.convoRow}>
                  <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={44} />
                  <View style={styles.convoInfo}>
                    <View style={styles.convoTitleRow}>
                      <Text style={styles.convoName}>{item.username}</Text>
                      {item.unreadCount > 0 && !isSentPending && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    {isSentPending ? (
                      <Text style={[styles.convoLastMsg, { color: '#6F405F', fontWeight: 'bold' }]} numberOfLines={1}>
                        ⏳ Request Sent
                      </Text>
                    ) : (
                      <Text style={styles.convoLastMsg} numberOfLines={1}>{item.lastMessage}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )
      ) : (
        incomingRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending chat requests.</Text>
          </View>
        ) : (
          <FlatList
            data={incomingRequests}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectConvo(item.id)} style={styles.convoRow}>
                <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={44} />
                <View style={styles.convoInfo}>
                  <View style={styles.convoTitleRow}>
                    <Text style={styles.convoName}>{item.username}</Text>
                  </View>
                  <Text style={[styles.convoLastMsg, { color: '#8C8385', fontStyle: 'italic' }]} numberOfLines={1}>
                    "{item.username} wants to chat with you"
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}
    </View>
  );
}

// â”€â”€ PROFILE SCREEN â”€â”€
