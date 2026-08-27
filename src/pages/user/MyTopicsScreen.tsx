import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  ImageBackground,
  Modal,
} from 'react-native';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCustomTopics, saveCustomTopic } from '../../utils/topicUtils';
import { CloseIcon, ExploreIcon } from '../../components/common/Icons';

const PARENT_ORDER = ['FEELINGS', 'EXPRESSION', 'LIFE_WORK', 'SOCIETY_POLITICS', 'ENTERTAINMENT', 'SPORTS', 'GENERAL'];

const EMOJI_PRESETS = [
  '💡', '🧘', '🚀', '🎭', '🧠', '🎨', '🎵', '📚', '🏆', '💻',
  '🔮', '🍿', '☕', '🎮', '🌿', '✈️', '💬', '✨', '🔥', '💖',
  '🤫', '🌟', '🎯', '⚡', '👑', '🌈', '🍀', '🍕', '🎉', '🥊'
];

interface MyTopicsScreenProps {
  onSelectTopic: (topicName: string) => void;
}

export function MyTopicsScreen({ onSelectTopic }: MyTopicsScreenProps) {
  const { currentUser } = useAuth() as any;
  const { t, currentLanguage, translateText } = useLanguage() as any;
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💡');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTopics = useCallback(() => {
    setLoading(true);
    apiService.getTopics()
      .then((items: any[]) => {
        const handle = String(currentUser?.username || '').replace(/^@/, '').toLowerCase().trim();
        if (!handle) {
          setTopics([]);
          return;
        }
        setTopics(
          items.filter((topic: any) => {
            const creator = String(topic.createdByUsername || '').replace(/^@/, '').toLowerCase().trim();
            return creator === handle;
          })
        );
      })
      .catch((err) => {
        console.warn('Error loading custom topics:', err);
        const local = getCustomTopics();
        setTopics(local);
      })
      .finally(() => setLoading(false));
  }, [currentUser?.username]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreateTopic = () => {
    if (!newTopicInput.trim()) {
      Alert.alert('Error', 'Please enter a valid topic name.');
      return;
    }
    const cleanName = newTopicInput.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!cleanName) {
      Alert.alert('Error', 'Invalid topic name. Use letters, numbers, and underscores.');
      return;
    }

    saveCustomTopic(cleanName, selectedEmoji, currentUser?.username || '@anonymous');
    setNewTopicInput('');
    setCreateModalOpen(false);
    Alert.alert('Success', `Topic ${selectedEmoji} #${cleanName} created!`);

    setTimeout(() => {
      fetchTopics();
    }, 500);
  };

  // Filter topics with search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase().trim();
    return topics.filter((tItem) => {
      const name = String(tItem.name || tItem.label || '').toLowerCase();
      const parent = String(tItem.parentTopic || '').toLowerCase();
      return name.includes(q) || parent.includes(q);
    });
  }, [topics, searchQuery]);

  // Group topics by parent category
  const groups = useMemo(() => {
    return PARENT_ORDER.map((parent) => {
      const parentTopics = filteredTopics.filter((tItem) => {
        const pTopic = (tItem.parentTopic || 'GENERAL').toUpperCase();
        return pTopic === parent;
      });
      return { parent, topics: parentTopics };
    }).filter((group) => group.topics.length > 0);
  }, [filteredTopics]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── TOP HERO COVER BANNER ── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          overflow: 'hidden',
          shadowColor: '#1A0C16',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 4,
        }}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&auto=format&fit=crop&q=80' }}
            defaultSource={require('../../assets/music-cover.jpg')}
            style={{ width: '100%', minHeight: 165 }}
            resizeMode="cover"
          >
            {/* Twilight plum soft overlay */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(30, 16, 29, 0.45)',
            }} />

            {/* Banner Content */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 22 }}>
              {/* Top Pill Emblem */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                marginBottom: 10,
              }}>
                <ExploreIcon color="#93C5FD" size={14} />
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#BFDBFE', letterSpacing: 0.4 }}>
                  MY CUSTOM CHANNELS
                </Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 4 }}>
                {t('myTopics', 'My Topics')}
              </Text>
              <Text style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 18, maxWidth: 320 }}>
                {topics.length} {topics.length === 1 ? 'topic channel created by you' : 'topic channels created by you'}
              </Text>

              {/* Create Topic Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCreateModalOpen(true)}
                style={{
                  marginTop: 14,
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E67E22',
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 16,
                  shadowColor: '#E67E22',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                  + Create New Topic
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* ── FLOATING SEARCH BAR ── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 16,
          marginTop: -16,
          borderRadius: 18,
          paddingHorizontal: 14,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#F0EAEE',
          shadowColor: '#1A0C16',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
          marginBottom: 14,
        }}>
          <Text style={{ fontSize: 14, marginRight: 8, color: '#9E8E98' }}>🔍</Text>
          <TextInput
            placeholder="Filter created topics by name..."
            placeholderTextColor="#9E8E98"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: 13,
              color: '#2D1D15',
              paddingVertical: 0,
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <CloseIcon color="#8C8385" size={13} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── CONTENT BODY ── */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#6F405F" size="large" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>💡</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', textAlign: 'center', marginBottom: 6 }}>
              {searchQuery ? 'No matching topics' : t('noCreatedTopics', 'You have not created any topics yet.')}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try clearing your search query or create a new topic handle.' : 'Create custom topic handles to kickstart new anonymous discussions.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCreateModalOpen(true)}
              style={[styles.createBtn, { alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 10 }]}
            >
              <Text style={styles.createBtnText}>Create Your First Topic</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.parent} style={styles.groupCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.groupHeader}>
                  {group.parent === 'GENERAL' ? t('others', 'General & Others') : translateText(group.parent.replace(/_/g, ' '), currentLanguage)}
                </Text>
                <View style={{
                  backgroundColor: 'rgba(111, 64, 95, 0.08)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#6F405F' }}>
                    {group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}
                  </Text>
                </View>
              </View>

              <View style={styles.chipsContainer}>
                {group.topics.map((topic) => (
                  <TouchableOpacity
                    key={topic.id || topic.name}
                    activeOpacity={0.75}
                    onPress={() => onSelectTopic(topic.name || topic.id)}
                    style={styles.topicChip}
                  >
                    <Text style={styles.topicIcon}>{topic.icon || '💡'}</Text>
                    <Text style={styles.topicName}>#{topic.label || topic.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── CREATE CUSTOM TOPIC MODAL ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={createModalOpen}
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <SafeAreaView style={appStyles.centerModalOverlay}>
          <View style={{
            width: '90%',
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: '#EFEAE8',
            shadowColor: '#2D1D15',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Header with Title and Close button */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#6F405F' }}>➕ Create Custom Topic</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)} style={{ padding: 4 }}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12.5, color: '#8C8385', lineHeight: 17, marginBottom: 16 }}>
              Create a new topic handle for anonymous discussions.
            </Text>

            {/* Emoji selector preset grid */}
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#6F405F', marginBottom: 8 }}>
              Choose Topic Emoji Logo * ({selectedEmoji})
            </Text>
            <View style={{
              height: 120,
              backgroundColor: '#FAF6F8',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#EFEAE8',
              padding: 10,
            }}>
              <ScrollView
                contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingVertical: 4 }}
                showsVerticalScrollIndicator={true}
              >
                {EMOJI_PRESETS.map((emoji) => {
                  const isSelected = selectedEmoji === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setSelectedEmoji(emoji)}
                      style={[
                        {
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'transparent',
                        },
                        isSelected && {
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: '#6F405F',
                          shadowColor: '#6F405F',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          elevation: 3,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Topic Channel Name Input */}
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#6F405F', marginTop: 16, marginBottom: 8 }}>
              Topic Channel Name *
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: '#CEC7C5',
              borderRadius: 14,
              backgroundColor: '#FAF8F8',
              overflow: 'hidden',
              height: 50,
            }}>
              <View style={{
                paddingHorizontal: 12,
                height: '100%',
                justifyContent: 'center',
                backgroundColor: '#FAF6F8',
                borderRightWidth: 1.5,
                borderRightColor: '#CEC7C5',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
                <Text style={{ fontSize: 18 }}>{selectedEmoji}</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#6F405F' }}>#</Text>
              </View>
              <TextInput
                placeholder="e.g. WELLNESS"
                placeholderTextColor={COLORS.zorba}
                value={newTopicInput}
                onChangeText={(val) => setNewTopicInput(val.toUpperCase().replace(/\s+/g, '_'))}
                style={{
                  flex: 1,
                  height: '100%',
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: '#2D1D15',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                }}
                maxLength={20}
                autoCapitalize="characters"
                multiline={false}
              />
            </View>
            <Text style={{ fontSize: 10.5, color: '#9C9395', marginTop: 8, lineHeight: 14 }}>
              User created topics start in the general catalog until they receive posts & activity!
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: 22, gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCreateModalOpen(false)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: '#CEC7C5',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#8C8385' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTopic}
                style={{
                  flex: 2,
                  height: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#6F405F',
                  shadowColor: '#6F405F',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Create Topic</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F4',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    padding: 60,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EAEE',
    padding: 30,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#1A0C16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8C8385',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EAEE',
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 7,
    shadowColor: '#1A0C16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  groupHeader: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#2D1D15',
    letterSpacing: -0.2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEAE8',
    backgroundColor: '#FAF9FA',
    gap: 6,
  },
  topicIcon: {
    fontSize: 14,
  },
  topicName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3D2A35',
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#E67E22',
    shadowColor: '#E67E22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
