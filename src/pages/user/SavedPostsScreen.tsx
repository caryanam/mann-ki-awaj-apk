import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { styles } from '../../styles/appStyles';

export function SavedPostsScreen({ onNavigateToChat: _onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, toggleSavePost } = usePosts() as any;
  const savedPosts = posts.filter((p: any) => p.isSaved);
  const { t, currentLanguage, translateText } = useLanguage() as any;

  return (
    <View style={styles.feedContainer}>
      <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E1DCDB' }}>
        <Text style={styles.screenTitle}>{t('savedPosts', 'Saved Posts')} ({savedPosts.length})</Text>
      </View>
      {savedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('noSavedPosts', 'No saved posts yet.')}</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feedScroll}
          renderItem={({ item }) => {
            return (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={40} />
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.postUsername}>{item.username}</Text>
                    <Text style={styles.postMeta}>{item.postType}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleSavePost(item.id)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 18 }}>⭐</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postTitle}>{translateText(item.originalTitle || item.title, currentLanguage)}</Text>
                <Text style={styles.postContent}>{translateText(item.originalContent || item.content, currentLanguage)}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
