import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { usePosts } from '../../context/PostContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { AdminReportsQueue } from '../../components/admin/AdminReportsQueue';

// Inline RefreshIcon drawn purely using React Native views
const RefreshIcon = ({ color = '#2D1D15', size = 11 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', marginRight: 5 }}>
    <View style={{
      width: size * 0.9,
      height: size * 0.9,
      borderRadius: (size * 0.9) / 2,
      borderWidth: 1.5,
      borderColor: color,
      borderRightColor: 'transparent',
      transform: [{ rotate: '45deg' }]
    }} />
    <View style={{
      position: 'absolute',
      right: -size * 0.05,
      top: 0,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 3,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: color,
      transform: [{ rotate: '120deg' }]
    }} />
  </View>
);

const formatReportId = (item: any) => {
  if (!item) return '';
  if (item.reportId) return String(item.reportId).toUpperCase();
  const idStr = String(item.id);
  if (idStr.startsWith('RPT-') || idStr.startsWith('REPORT_')) return idStr.toUpperCase();
  if (!isNaN(Number(idStr))) {
    const padded = idStr.length < 2 ? `0${idStr}` : idStr;
    return `REPORT_${padded}`;
  }
  return `REPORT_${idStr.toUpperCase()}`;
};

const getRelativeTime = (dateStr: string) => {
  if (!dateStr) return '9h ago';
  try {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} d ago`;
  } catch (e) {
    return 'Recently';
  }
};

export function AdminReportsScreen() {
  const { reports, resolveReport, hidePost, blockUser, refreshReports } = usePosts() as any;

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [viewReport, setViewReport] = useState<any>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshReports();
    } catch (e) {
      console.warn('Failed to refresh reports:', e);
    } finally {
      setRefreshing(false);
    }
  };

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
    <View style={[styles.feedContainer, { backgroundColor: '#F9FAFB' }]}>
      {/* Clean Compact Header Overview Bar */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E1DCDB',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15' }}>
              Reports Queue
            </Text>
          </View>

          {/* Refresh button */}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: '#FCFAF9',
              borderWidth: 1,
              borderColor: '#E1DCDB',
            }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#2D1D15" style={{ marginRight: 5 }} />
            ) : (
              <RefreshIcon color="#2D1D15" />
            )}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D1D15' }}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: '#8C8385', fontWeight: '500', marginTop: 4 }}>
          Review and take moderation action on user-submitted content reports.
        </Text>
      </View>

      <AdminReportsQueue
        reports={reports}
        onViewReport={(item) => {
          setViewReport(item);
          setViewModalVisible(true);
        }}
        onActionReport={(item) => {
          setSelectedReport(item);
          setActionModalVisible(true);
        }}
      />

      {/* View Detail Modal */}
      {viewReport && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={viewModalVisible}
          onRequestClose={() => setViewModalVisible(false)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.4)' }]}>
            <View style={{
              width: '92%',
              maxHeight: '85%',
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: '#E1DCDB',
              elevation: 24,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
            }}>
              {/* Header Title Block (Stacked vertically to prevent text truncation) */}
              <View style={{ marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setViewModalVisible(false)}
                  style={{
                    alignSelf: 'flex-start',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: '#F3F4F6',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#4B5563' }}>
                    ← Back to Reports
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#2D1D15' }}>
                  Report Details: {formatReportId(viewReport)}
                </Text>
              </View>

              {/* Thin Separator Line */}
              <View style={{ height: 1, backgroundColor: '#E1DCDB', marginBottom: 14 }} />

              {/* Main content scroll container */}
              <ScrollView showsVerticalScrollIndicator={true} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12 }}>
                {/* Top Badges and Time Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10, marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FAF5F8' }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#6F405F', textTransform: 'uppercase' }}>
                        {viewReport.contentType || 'POST'}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F3F4F6' }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#4B5563', textTransform: 'uppercase' }}>
                        {viewReport.status || 'PENDING'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10.5, color: '#8C8385', fontWeight: '700' }}>
                    Submitted: {getRelativeTime(viewReport.createdAt)}
                  </Text>
                </View>

                {/* Stacked Metadata Cards */}
                <View style={{ gap: 10 }}>
                  {/* Reported Author */}
                  <View style={{ backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#F1ECEF', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8C8385', textTransform: 'uppercase' }}>
                      Reported Author:
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#2D1D15', marginTop: 4 }}>
                      {viewReport.authorUsername ? (viewReport.authorUsername.startsWith('@') ? viewReport.authorUsername : `@${viewReport.authorUsername}`) : '@newline'}
                    </Text>
                  </View>

                  {/* Reporter */}
                  <View style={{ backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#F1ECEF', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8C8385', textTransform: 'uppercase' }}>
                      Reporter (Visible Only to Admin):
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#6F405F', marginTop: 4 }}>
                      {viewReport.reporterUsername ? (viewReport.reporterUsername.startsWith('@') ? viewReport.reporterUsername : `@${viewReport.reporterUsername}`) : '@newline28'}
                    </Text>
                  </View>

                  {/* Reason & Risk */}
                  <View style={{ backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#F1ECEF', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8C8385', textTransform: 'uppercase' }}>
                      Report Reason & Risk:
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#2D1D15', marginTop: 4 }}>
                      {(viewReport.reason || 'HATE_SPEECH').replace('_', ' ')} (Risk: {viewReport.riskLevel || 'MEDIUM'})
                    </Text>
                  </View>

                  {/* Reported Content Card */}
                  <View style={{ backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#F1ECEF', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8C8385', textTransform: 'uppercase', marginBottom: 6 }}>
                      Reported Content:
                    </Text>
                    <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 8, padding: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#2D1D15', lineHeight: 18 }}>
                        {viewReport.reportedContent || `Item #${viewReport.contentId}`}
                      </Text>
                    </View>
                  </View>

                  {/* Explanation Notes */}
                  {viewReport.reporterNotes ? (
                    <View style={{ backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#F1ECEF', borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8C8385', textTransform: 'uppercase' }}>
                        Reporter Explanation:
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#4A3E3D', marginTop: 4, lineHeight: 16 }}>
                        {viewReport.reporterNotes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Resolution Section if Resolved */}
                  {viewReport.status === 'RESOLVED' && (
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#10B981', textTransform: 'uppercase' }}>
                        Resolution Status:
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981', marginTop: 4 }}>
                        Action Taken: {viewReport.actionTaken}
                      </Text>
                      {viewReport.adminNotes ? (
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#4B5563', marginTop: 4 }}>
                          Admin Notes: {viewReport.adminNotes}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Actions Section */}
                {viewReport.status === 'PENDING' && (
                  <TouchableOpacity
                    onPress={() => {
                      setViewModalVisible(false);
                      setSelectedReport(viewReport);
                      setActionModalVisible(true);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#C46F76',
                      borderRadius: 10,
                      paddingVertical: 12,
                      marginTop: 6,
                      borderWidth: 1,
                      borderColor: '#B25A61',
                    }}
                  >
                    <View style={{ width: 12, height: 12, borderWidth: 1.5, borderColor: '#FFFFFF', borderBottomLeftRadius: 5, borderBottomRightRadius: 5, borderTopLeftRadius: 2, borderTopRightRadius: 2, justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FFFFFF', marginTop: -2.5 }}>!</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                      Take Moderation Action
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      )}

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
