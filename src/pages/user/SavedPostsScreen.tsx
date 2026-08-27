import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ImageBackground,
  Image,
} from 'react-native';
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { styles } from '../../styles/appStyles';
import { StarIcon, TrashIcon } from '../../components/common/Icons';

export function SavedPostsScreen({ onNavigateToChat: _onNavigateToChat }: { onNavigateToChat?: any } = {}) {
  const { posts, toggleSavePost, refreshPosts } = usePosts() as any;
  const { t, currentLanguage, translateText } = useLanguage() as any;

  // Refresh State
  const [refreshing, setRefreshing] = useState(false);

  // Extract saved posts
  const savedPosts = useMemo(() => {
    return posts.filter((p: any) => p.isSaved);
  }, [posts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshPosts) {
        await refreshPosts();
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const handleConfirmDelete = (post: any) => {
    Alert.alert(
      'Remove from Saved',
      'Are you sure you want to remove this saved thought?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleSavePost(post.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.feedContainer, { backgroundColor: '#F8F5F4' }]}>
      {/* ── SAVED POSTS LIST WITH PULL-TO-REFRESH ── */}
      <FlatList
        data={savedPosts}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6F405F', '#C46F76']}
            tintColor="#6F405F"
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
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
                source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80' }}
                defaultSource={require('../../assets/music-cover.jpg')}
                style={{ width: '100%', minHeight: 150 }}
                resizeMode="cover"
              >
                {/* Twilight plum soft overlay */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(30, 16, 29, 0.42)',
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
                    <StarIcon color="#FDE047" size={14} />
                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FEF08A', letterSpacing: 0.4 }}>
                      PERSONAL BOOKMARKS
                    </Text>
                  </View>

                  {/* Title */}
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 4 }}>
                    {t('savedPosts', 'Saved Thoughts')}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 18 }}>
                    {savedPosts.length} {savedPosts.length === 1 ? 'saved thought' : 'saved thoughts'} in your collection
                  </Text>
                </View>
              </ImageBackground>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingVertical: 60,
          }}>
            {/* Empty Illustration Aura */}
            <View style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#FAF4F7',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#F0EAEE',
              marginBottom: 18,
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}>
              <StarIcon color="#D97706" size={40} />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D1D15', textAlign: 'center', marginBottom: 8 }}>
              No Saved Thoughts Yet
            </Text>

            <Text style={{ fontSize: 13, color: '#8C8385', textAlign: 'center', lineHeight: 20, maxWidth: 290 }}>
              Browse the feed and tap the ⭐ star icon on any thought to save it here for easy reading.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const displayTitle = translateText(item.originalTitle || item.title, currentLanguage);
          const displayContent = translateText(item.originalContent || item.content, currentLanguage);

          return (
            <View style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 16,
              marginBottom: 14,
              borderRadius: 22,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F0EAEE',
              shadowColor: '#1A0C16',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3,
            }}>
              {/* ── CARD HEADER: AUTHOR & DELETE ACTION ── */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <InitialAvatar
                    initials={item.avatarInitials}
                    color={item.avatarColor || '#6F405F'}
                    size={42}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                      {item.username}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                      {item.topic && (
                        <View style={{
                          backgroundColor: 'rgba(111, 64, 95, 0.08)',
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#6F405F' }}>
                            #{item.topic}
                          </Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 11, color: '#8C8385' }}>
                        {item.postType || 'Thought'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── DELETE / REMOVE BUTTON ── */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleConfirmDelete(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: '#FFF1F2',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#FFE4E6',
                  }}
                >
                  <TrashIcon color="#E11D48" size={13} />
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#E11D48' }}>Delete</Text>
                </TouchableOpacity>
              </View>

              {/* ── CARD BODY: TITLE & CONTENT ── */}
              {displayTitle ? (
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', letterSpacing: -0.2, marginBottom: 6, lineHeight: 22 }}>
                  {displayTitle}
                </Text>
              ) : null}

              {displayContent ? (
                <Text style={{ fontSize: 14, color: '#3D2A35', lineHeight: 21 }}>
                  {displayContent}
                </Text>
              ) : null}

              {/* Attached Image Preview */}
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{
                    width: '100%',
                    height: 160,
                    borderRadius: 14,
                    marginTop: 10,
                    backgroundColor: '#FAF4F7',
                  }}
                  resizeMode="cover"
                />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
