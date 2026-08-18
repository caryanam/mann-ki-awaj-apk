import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { usePosts } from '../../context/PostContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { AdminReportsQueue } from '../../components/admin/AdminReportsQueue';

export function AdminReportsScreen() {
  const { reports, resolveReport, hidePost, blockUser } = usePosts() as any;

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const handleResolveAction = (actionType: any) => {
    if (!selectedReport) { return; }

    // Execute context actions
    if (actionType === 'HIDE_POST') {
      hidePost(selectedReport.postId);
    } else if (actionType === 'BLOCK_USER') {
      blockUser(selectedReport.authorUsername);
    }

    resolveReport(selectedReport.id, actionType, adminNotes.trim());

    setAdminNotes('');
    setActionModalVisible(false);
    setSelectedReport(null);
    Alert.alert('Moderate Success', 'Moderation action resolved successfully.');
  };

  return (
    <View style={styles.feedContainer}>
      {/* Sub Header Title Bar */}
      <View style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F8F5F4' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.zorba }}>Admin Console / Reports Queue</Text>
      </View>

      <AdminReportsQueue
        reports={reports}
        onModerateReport={(item) => {
          setSelectedReport(item);
          setActionModalVisible(true);
        }}
      />

      {/* Moderate Action Modal */}
      {selectedReport && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={actionModalVisible}
          onRequestClose={() => setActionModalVisible(false)}
        >
          <SafeAreaView style={styles.centerModalOverlay}>
            <View style={styles.reportModalCard}>
              <Text style={styles.reportModalTitle}>Moderation Console</Text>
              <Text style={styles.reportModalSubtitle}>Resolve pending report for @{selectedReport.authorUsername}</Text>

              <TextInput
                placeholder="Internal moderation notes..."
                placeholderTextColor={COLORS.zorba}
                value={adminNotes}
                onChangeText={setAdminNotes}
                style={[styles.input, { height: 50, marginTop: 10 }]}
              />

              <View style={{ gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.moderationActionBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => handleResolveAction('APPROVE_POST')}
                >
                  <Text style={styles.moderationActionBtnText}>✅ Approve & Keep Online</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moderationActionBtn, { backgroundColor: '#E07A5F' }]}
                  onPress={() => handleResolveAction('HIDE_POST')}
                >
                  <Text style={styles.moderationActionBtnText}>🚫 Hide Post from Feed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moderationActionBtn, { backgroundColor: COLORS.error }]}
                  onPress={() => handleResolveAction('BLOCK_USER')}
                >
                  <Text style={styles.moderationActionBtnText}>💀 Block Author ({selectedReport.authorUsername})</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setActionModalVisible(false)} style={styles.moderationCancelBtn}>
                <Text style={styles.moderationCancelBtnText}>Cancel Decision</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}
