import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';

export function AdminContentReviewScreen() {
  const [heldQueue, setHeldQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiService.adminFetchModerationQueue();
      setHeldQueue(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Failed to load moderation queue:', err);
      setHeldQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (contentType: string, contentId: any) => {
    try {
      await apiService.adminApproveModerationItem(contentId);
      Alert.alert('Approved', `${contentType} approved and published successfully.`);
    } catch (err) {
      console.warn('Approve failed:', err);
    }
    fetchQueue();
  };

  const handleReject = async (contentType: string, contentId: any) => {
    try {
      await apiService.adminRejectModerationItem(contentId);
      Alert.alert('Rejected', `${contentType} rejected and removed successfully.`);
    } catch (err) {
      console.warn('Reject failed:', err);
    }
    fetchQueue();
  };

  return (
    <View style={styles.feedContainer}>
      {/* Sub Header Title Bar */}
      <View style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F8F5F4', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.zorba }}>Admin Console / Content Review</Text>
        {loading && <ActivityIndicator size="small" color="#6F405F" />}
      </View>

      <FlatList
        data={heldQueue}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={fetchQueue}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2D1D15', marginBottom: 6 }}>Content Queue Clear</Text>
            <Text style={{ color: '#8C8385', fontSize: 12.5, textAlign: 'center' }}>There are currently no posts, comments, or replies held for moderator review.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F8F5F4', marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#f97316', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
            {/* Card Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#f97316' }}>{(item.contentType || 'POST').toUpperCase()} HELD FOR REVIEW</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2D1D15' }}>Author: @{item.username || 'Member'}</Text>
            </View>

            {/* Content Display */}
            <View style={{ padding: 12, backgroundColor: '#F8F5F3', borderRadius: 12, marginBottom: 12 }}>
              {!!item.title && (
                <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: '#2D1D15', marginBottom: 4 }}>{item.title}</Text>
              )}
              <Text style={{ fontSize: 12.5, color: '#2D1D15', lineHeight: 18 }}>{item.content}</Text>
            </View>

            {/* Flagged Category Info */}
            {!!item.moderationCategory && (
              <Text style={{ fontSize: 11, color: '#f97316', fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 }}>
                Flagged Category: {item.moderationCategory} (Risk: {item.moderationRisk || 'MEDIUM'})
              </Text>
            )}

            {/* Action Buttons Row */}
            <View style={{ flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8F5F4' }}>
              <TouchableOpacity
                onPress={() => handleReject(item.contentType || 'Content', item.id)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#C46F76', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#C46F76' }}>Reject & Remove</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleApprove(item.contentType || 'Content', item.id)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#6F405F', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' }}>Approve & Publish</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
