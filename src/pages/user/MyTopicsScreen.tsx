import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, TextInput } from 'react-native';
import { COLORS } from '../../styles/theme';
import { styles as appStyles } from '../../styles/appStyles';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCustomTopics, saveCustomTopic } from '../../utils/topicUtils';
import { Modal } from 'react-native';

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
  const { t } = useLanguage() as any;
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💡');

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
        // Fallback to local custom topics
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
    
    // Refresh list
    setTimeout(() => {
      fetchTopics();
    }, 500);
  };

  // Group topics by parent category
  const groups = PARENT_ORDER.map((parent) => {
    const parentTopics = topics.filter((tItem) => {
      const pTopic = (tItem.parentTopic || 'GENERAL').toUpperCase();
      return pTopic === parent;
    });
    return { parent, topics: parentTopics };
  }).filter((group) => group.topics.length > 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>{t('myTopics', 'My Topics')} ({topics.length})</Text>
            <TouchableOpacity onPress={() => setCreateModalOpen(true)} style={styles.createBtn}>
              <Text style={styles.createBtnText}>+ Create Topic</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{t('myTopicsDescription', 'Subtopics and discussions you created.')}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#6F405F" size="large" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('noCreatedTopics', 'You have not created any topics yet.')}</Text>
            <TouchableOpacity onPress={() => setCreateModalOpen(true)} style={[styles.createBtn, { alignSelf: 'center', marginTop: 12 }]}>
              <Text style={styles.createBtnText}>Create Your First Topic</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.parent} style={styles.groupCard}>
              <Text style={styles.groupHeader}>
                {group.parent === 'GENERAL' ? t('others', 'Others') : group.parent.replace(/_/g, ' ')}
              </Text>
              <View style={styles.chipsContainer}>
                {group.topics.map((topic) => (
                  <TouchableOpacity
                    key={topic.id || topic.name}
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

      {/* Create Custom Topic Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={createModalOpen}
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <SafeAreaView style={appStyles.centerModalOverlay}>
          <View style={[appStyles.reportModalCard, { width: '90%', maxHeight: '80%' }]}>
            <Text style={appStyles.reportModalTitle}>➕ Create Custom Topic</Text>
            <Text style={appStyles.reportModalSubtitle}>Create a new topic handle for anonymous discussions.</Text>

            {/* Emoji selector preset grid */}
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#6F405F', marginTop: 12, marginBottom: 8 }}>
              Choose Topic Emoji Logo * ({selectedEmoji})
            </Text>
            <View style={{ height: 110, backgroundColor: '#FAF6F8', borderRadius: 14, borderWidth: 1, borderColor: '#EFEAE8', padding: 8 }}>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }} showsVerticalScrollIndicator={true}>
                {EMOJI_PRESETS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => setSelectedEmoji(emoji)}
                    style={[
                      { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
                      selectedEmoji === emoji && { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#6F405F' }
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Topic Channel Name Input */}
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#6F405F', marginTop: 14, marginBottom: 6 }}>
              Topic Channel Name *
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#6F405F' }}>{selectedEmoji} #</Text>
              <TextInput
                placeholder="e.g. WELLNESS, FINANCE, TRAVEL"
                placeholderTextColor={COLORS.zorba}
                value={newTopicInput}
                onChangeText={(val) => setNewTopicInput(val.toUpperCase().replace(/\s+/g, '_'))}
                style={[appStyles.input, { flex: 1, textTransform: 'uppercase', fontWeight: 'bold', marginTop: 0 }]}
                maxLength={20}
                autoCapitalize="characters"
              />
            </View>
            <Text style={{ fontSize: 10.5, color: '#8C8385', marginTop: 6, lineHeight: 14 }}>
              User created topics start at the bottom catalog card until they receive posts & activity!
            </Text>

            <View style={[appStyles.reportActionRow, { marginTop: 18 }]}>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)} style={appStyles.reportCancelButton}>
                <Text style={appStyles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateTopic} style={[appStyles.reportSubmitButton, { backgroundColor: COLORS.deepPlum }]}>
                <Text style={appStyles.reportSubmitText}>Create Topic</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D1D15',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#8C8385',
  },
  createBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#6F405F',
  },
  createBtnText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  center: {
    padding: 60,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFEAE8',
    padding: 30,
    marginHorizontal: 12,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#8C8385',
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFEAE8',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  groupHeader: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#6F405F',
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECEE',
    paddingBottom: 8,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7C9D2',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  topicIcon: {
    fontSize: 13,
  },
  topicName: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#432E3C',
  },
});
