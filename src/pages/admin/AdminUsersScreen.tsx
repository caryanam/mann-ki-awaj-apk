import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, SafeAreaView, ScrollView } from 'react-native';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { ShieldIcon, BanIcon, FlagIcon, EyeIcon } from '../../components/common/Icons';

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Detail States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTab, setUserTab] = useState<'posts' | 'blocked'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userBlockedItems, setUserBlockedItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewPost, setPreviewPost] = useState<any>(null);

  const handleDeletePost = async (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post from the platform?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.adminDeletePost(postId);
              Alert.alert('Success', 'Post deleted successfully by admin.');
              setUserPosts((prev) => prev.filter((p) => p.id !== postId));
              setPreviewPost(null);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          }
        }
      ]
    );
  };

  // Warning Modal States
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningLevel, setWarningLevel] = useState('FIRST');
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const res = await apiService.adminFetchUsers(query);
      const rawData = res?.data || res;
      const list = rawData?.content || (Array.isArray(rawData) ? rawData : []);
      setUsers(list);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [searchQuery]);

  const handleOpenUserDetail = async (user: any) => {
    setSelectedUser(user);
    setUserTab('posts');
    setLoadingDetails(true);
    try {
      const [postsRes, blockedRes] = await Promise.allSettled([
        apiService.adminFetchUserPosts(user.id),
        apiService.adminFetchBlockedContent('ALL', 0, 50),
      ]);

      if (postsRes.status === 'fulfilled') {
        const resVal = postsRes.value;
        const rawPosts = resVal?.data?.content || resVal?.content || (Array.isArray(resVal) ? resVal : []);
        setUserPosts(rawPosts);
      } else {
        setUserPosts([]);
      }

      if (blockedRes.status === 'fulfilled') {
        const resVal = blockedRes.value;
        const rawBlocked = resVal?.data?.content || resVal?.content || (Array.isArray(resVal) ? resVal : []);
        const cleanUserHandle = (user.username || '').toLowerCase().replace(/^@/, '');
        const filteredBlocked = rawBlocked.filter((b: any) => {
          if (b.userId && String(b.userId) === String(user.id)) return true;
          const bUname = (b.authorUsername || b.authorEmail || '').toLowerCase().replace(/^@/, '');
          return cleanUserHandle && bUname && (bUname === cleanUserHandle || bUname.includes(cleanUserHandle));
        });
        setUserBlockedItems(filteredBlocked);
      } else {
        setUserBlockedItems([]);
      }
    } catch (err) {
      setUserPosts([]);
      setUserBlockedItems([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleBlock = async (user: any) => {
    try {
      if (user.active) {
        await apiService.adminBlockUser(user.id);
        Alert.alert('Status Updated', `Blocked account for @${user.username}`);
      } else {
        await apiService.adminUnblockUser(user.id);
        Alert.alert('Status Updated', `Unblocked account for @${user.username}`);
      }
      fetchUsers(searchQuery);
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, active: !user.active });
      }
    } catch (err) {
      Alert.alert('Error', 'Action failed');
    }
  };

  const handleSendWarning = async () => {
    if (!warningMessage.trim() || !selectedUser) return;
    setSendingWarning(true);
    try {
      await apiService.adminSendWarning(selectedUser.id, warningLevel, warningMessage.trim());
      Alert.alert('Success', `Warning notice sent to @${selectedUser.username}`);
      setWarningModalOpen(false);
      setWarningMessage('');
      fetchUsers(searchQuery);
    } catch (err) {
      Alert.alert('Error', 'Failed to send warning');
    } finally {
      setSendingWarning(false);
    }
  };

  return (
    <View style={[styles.feedContainer, { backgroundColor: '#FCFAF9' }]}>
      {/* Search Header and Bar */}
      <View style={{ paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0ECEB', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput
          placeholder="Search by handle or email..."
          placeholderTextColor="#9F9794"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#FAF7F6',
            borderWidth: 1,
            borderColor: '#EFEAE9',
            paddingHorizontal: 16,
            fontSize: 13,
            color: '#2D1D15',
            fontWeight: '600',
          }}
        />
        <TouchableOpacity
          onPress={() => fetchUsers(searchQuery)}
          disabled={loading}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5DFDE' }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#6F405F" />
          ) : (
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#6F405F' }}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshing={loading}
        onRefresh={() => fetchUsers(searchQuery)}
        ListHeaderComponent={
          <View style={{ paddingVertical: 16, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#2D1D15', letterSpacing: -0.3 }}>Users Directory</Text>
            <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 3, fontWeight: '600' }}>Manage registered platform accounts.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, marginHorizontal: 4, borderWidth: 1, borderColor: '#F0ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', marginBottom: 6 }}>No Users Found</Text>
            <Text style={{ color: '#8C8385', fontSize: 12, textAlign: 'center' }}>Could not find any accounts matching your search.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isBanned = item.status === 'BANNED' || !item.active;
          const cleanHandle = item.username ? (item.username.startsWith('@') ? item.username : `@${item.username}`) : `@user_${item.id}`;
          
          return (
            <TouchableOpacity
              onPress={() => handleOpenUserDetail(item)}
              style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F5ECEB', marginBottom: 12, marginHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                {/* Custom Initial Avatar bubble */}
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isBanned ? '#E1DCDB' : '#6F405F', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>
                    {cleanHandle.replace('@', '').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#2D1D15' }}>{cleanHandle}</Text>
                  <Text style={{ fontSize: 11, color: '#8C8385', marginTop: 3 }}>
                    ID: #{item.id} {item.role === 'ADMIN' ? '• Admin' : ''}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: '#A0908C', marginTop: 2, fontWeight: '600' }}>
                    {item.postCount != null ? item.postCount : 0} posts • {item.warningCount != null ? item.warningCount : 0} warns • {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: isBanned ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', borderWidth: 1, borderColor: isBanned ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: isBanned ? '#EF4444' : '#10B981' }}>
                    {isBanned ? 'BANNED' : 'ACTIVE'}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#8C8385' }}>Inspect →</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedUser}
          onRequestClose={() => setSelectedUser(null)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.5)' }]}>
            <View style={{ flex: 1, width: '100%', backgroundColor: '#FCFAF9', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 40, elevation: 12 }}>
              {/* Modal Header */}
              <View style={{ padding: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomWidth: 1, borderBottomColor: '#F0ECEB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }}>{selectedUser.username.replace('@', '').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15' }}>@{selectedUser.username.replace('@', '')}</Text>
                    <Text style={{ fontSize: 11, color: '#8C8385' }}>Email: {selectedUser.email || 'N/A'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedUser(null)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#8C8385' }}>×</Text>
                </TouchableOpacity>
              </View>

              {/* User Identity Info & Stats Summary */}
              <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0ECEB', gap: 14 }}>
                {/* Joined Date Metadata */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#8C8385', fontWeight: '600' }}>
                    Registered: {formatDate(selectedUser.createdAt)}
                  </Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: selectedUser.active ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: selectedUser.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: selectedUser.active ? '#10B981' : '#EF4444' }}>
                      {selectedUser.active ? 'ACTIVE ACCOUNT' : 'BLOCKED ACCOUNT'}
                    </Text>
                  </View>
                </View>

                {/* Grid stats */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Posts count */}
                  <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#EFEAE9', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#6F405F' }}>
                      {selectedUser.postCount != null ? selectedUser.postCount : 0}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#8C8385', marginTop: 4, fontWeight: '700' }}>Posts</Text>
                  </View>

                  {/* Blocked logs count */}
                  <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#EFEAE9', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#C46F76' }}>
                      {userBlockedItems.length}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#8C8385', marginTop: 4, fontWeight: '700' }}>Blocked</Text>
                  </View>

                  {/* Warnings count */}
                  <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#EFEAE9', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#eab308' }}>
                      {selectedUser.warningCount != null ? selectedUser.warningCount : 0}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#8C8385', marginTop: 4, fontWeight: '700' }}>Warnings</Text>
                  </View>
                </View>
              </View>

              {/* Segmented Tabs inside Modal */}
              <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0ECEB' }}>
                <TouchableOpacity
                  onPress={() => setUserTab('posts')}
                  style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: userTab === 'posts' ? '#6F405F' : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: userTab === 'posts' ? '900' : '600', color: userTab === 'posts' ? '#6F405F' : '#8C8385' }}>Published ({userPosts.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setUserTab('blocked')}
                  style={{ flex: 1, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderBottomWidth: 2.5, borderBottomColor: userTab === 'blocked' ? '#EF4444' : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: userTab === 'blocked' ? '900' : '600', color: userTab === 'blocked' ? '#EF4444' : '#8C8385' }}>🛡️ Blocked ({userBlockedItems.length})</Text>
                </TouchableOpacity>
              </View>

              {/* Details Content List */}
              {loadingDetails ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#6F405F" />
                </View>
              ) : userTab === 'posts' ? (
                <FlatList
                  data={userPosts}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ padding: 16 }}
                  ListEmptyComponent={
                    <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#FAF7F6', borderRadius: 12 }}>
                      <Text style={{ fontSize: 13, color: '#8C8385', fontWeight: '600' }}>This user has not published any posts yet.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setPreviewPost(item)}
                      style={{ padding: 14, backgroundColor: '#FAF7F6', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E1DCDB' }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#2D1D15' }}>
                          {item.title || 'Untitled Post'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setPreviewPost(item)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <EyeIcon color="#6F405F" size={13} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#6F405F' }}>View Post</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 13, color: '#4A3E3D', lineHeight: 19, fontWeight: '600' }} numberOfLines={2}>
                        {item.originalContent || item.content || item.description || ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#8C8385', marginTop: 8, fontWeight: '600' }}>
                        Topic: {String(item.topic || 'General').toUpperCase()} • Published {formatDate(item.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <FlatList
                  data={userBlockedItems}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ padding: 16 }}
                  ListEmptyComponent={
                    <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#FAF7F6', borderRadius: 12 }}>
                      <Text style={{ fontSize: 13, color: '#8C8385', fontWeight: '600' }}>No auto-blocked messages recorded for this user.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={{ padding: 14, backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FCA5A5', borderLeftWidth: 3, borderLeftColor: '#EF4444' }}>
                      <Text style={{ fontSize: 13, color: '#2D1D15', lineHeight: 18, fontWeight: '600' }}>"{item.originalContent || item.content || ''}"</Text>
                      <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '800', marginTop: 6 }}>Reason: {item.flaggedReason}</Text>
                    </View>
                  )}
                />
              )}

              {/* Action Buttons Footer */}
              <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0ECEB' }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setWarningModalOpen(true)}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1, borderColor: '#EAB308', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#854D0E' }}>⚠️ Warn User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleBlock(selectedUser)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: selectedUser.active ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                      borderWidth: 1,
                      borderColor: selectedUser.active ? '#EF4444' : '#10B981',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: selectedUser.active ? '#EF4444' : '#10B981' }}>
                      {selectedUser.active ? '🚫 Block User' : '✅ Unblock User'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Post Preview Modal */}
      {previewPost && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!previewPost}
          onRequestClose={() => setPreviewPost(null)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.4)' }]}>
            <View style={{ width: '90%', backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, elevation: 12 }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15', flex: 1, marginRight: 8 }}>
                  Post #{previewPost.id} Preview (Translated to English)
                </Text>
                <TouchableOpacity onPress={() => setPreviewPost(null)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#8C8385' }}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Author & Topic Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }}>
                      {String(selectedUser?.username || 'U').replace('@', '').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#2D1D15' }}>@{String(selectedUser?.username || 'user').replace('@', '')}</Text>
                    <Text style={{ fontSize: 11, color: '#8C8385' }}>Published {formatDate(previewPost.createdAt)}</Text>
                  </View>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(111, 64, 95, 0.08)', borderWidth: 1, borderColor: 'rgba(111, 64, 95, 0.15)' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#6F405F' }}>Topic: {String(previewPost.topic || 'General').toUpperCase()}</Text>
                </View>
              </View>

              {/* Translation Banner */}
              <View style={{ padding: 12, backgroundColor: 'rgba(111, 64, 95, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(111, 64, 95, 0.1)', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#6F405F', flex: 1 }}>🌐 Automatically Translated to English for Admin Review</Text>
              </View>

              {/* Post Title */}
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15', marginBottom: 8 }}>
                {previewPost.title || 'Untitled Post'}
              </Text>

              {/* Post Body Box */}
              <ScrollView style={{ maxHeight: 180, padding: 14, backgroundColor: '#FAF7F6', borderRadius: 16, borderWidth: 1, borderColor: '#E1DCDB', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, color: '#4A3E3D', lineHeight: 19, fontWeight: '600' }}>
                  {previewPost.originalContent || previewPost.content || previewPost.description || ''}
                </Text>
              </ScrollView>

              {/* Footer Actions */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleDeletePost(previewPost.id)}
                  style={{ flex: 1.2, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: '#EF4444', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#EF4444' }}>🗑️ Delete Post</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPreviewPost(null)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FAF7F6', borderWidth: 1, borderColor: '#E1DCDB', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#2D1D15' }}>Close Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Warning Stage Modal */}
      {warningModalOpen && selectedUser && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={warningModalOpen}
          onRequestClose={() => setWarningModalOpen(false)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.4)' }]}>
            <View style={[styles.reportModalCard, { borderRadius: 28, padding: 24, width: '90%', elevation: 12, borderTopWidth: 5, borderTopColor: '#C46F76' }]}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D1D15', marginBottom: 4 }}>Send Compliance Warning</Text>
              <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 16 }}>Specify violation warning for @{selectedUser.username}</Text>

              {/* Radio Selector Stage list */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#2D1D15', marginBottom: 8 }}>WARNING STAGE LEVEL:</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {[
                  { level: 'FIRST', label: '1st Stage Warning' },
                  { level: 'SECOND', label: '2nd Stage Warning' },
                  { level: 'FINAL', label: 'Final suspension stage' },
                ].map((item) => {
                  const isSelected = warningLevel === item.level;
                  return (
                    <TouchableOpacity
                      key={item.level}
                      onPress={() => setWarningLevel(item.level)}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: isSelected ? 'rgba(111, 64, 95, 0.08)' : '#FCFAF9',
                        borderWidth: 1,
                        borderColor: isSelected ? '#6F405F' : '#EFEAE9',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <View style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: isSelected ? '#6F405F' : '#A0908C',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {isSelected && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#6F405F',
                          }} />
                        )}
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? '900' : '600', color: isSelected ? '#6F405F' : '#2D1D15' }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 11, fontWeight: '900', color: '#2D1D15', marginBottom: 8 }}>COMPLIANCE INSTRUCTIONS MESSAGE:</Text>
              <TextInput
                placeholder="State the violation reason clearly to the user..."
                placeholderTextColor={COLORS.zorba}
                value={warningMessage}
                onChangeText={setWarningMessage}
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 90, textAlignVertical: 'top', borderRadius: 14, backgroundColor: '#FAF6F5', borderWidth: 1, borderColor: '#E5DFDE', padding: 12, fontSize: 13, color: '#2D1D15', fontWeight: '600' }]}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => setWarningModalOpen(false)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E1DCDB', backgroundColor: '#FAF7F6', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#2D1D15' }}>Discard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={sendingWarning || !warningMessage.trim()}
                  onPress={handleSendWarning}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', elevation: 3, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 3 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>
                    {sendingWarning ? 'Sending...' : 'Send Warning'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}
