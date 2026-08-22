import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { styles as appStyles } from '../../styles/appStyles';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function MyReportsScreen() {
  const { reports } = usePosts() as any;
  const { currentUser } = useAuth() as any;
  const { t } = useLanguage() as any;
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Filter reports filed by the current user
  const handle = String(currentUser?.username || '').replace(/^@/, '').toLowerCase().trim();
  const myReports = (reports || []).filter((r: any) => {
    const reporter = String(r.reporterUsername || '').replace(/^@/, '').toLowerCase().trim();
    return handle && reporter === handle;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Block */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('myContentReports', 'My Safety Reports')} ({myReports.length})
          </Text>
          <Text style={styles.subtitle}>
            {t('trackReportsDesc', 'Track status and responses for content you reported.')}
          </Text>
        </View>

        {myReports.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <Text style={{ fontSize: 28, color: '#6F405F' }}>🛡️</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('noActiveReports', 'No Active Reports')}</Text>
            <Text style={styles.emptyDesc}>
              {t('noActiveReportsDesc', 'You have not submitted any content reports.')}
            </Text>
          </View>
        ) : (
          myReports.map((report: any) => {
            const isPending = report.status === 'PENDING';
            return (
              <TouchableOpacity
                key={report.id}
                onPress={() => setSelectedReport(report)}
                style={styles.reportCard}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetBadgeText}>Target: {report.contentType}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: isPending ? 'rgba(217, 108, 61, 0.15)' : 'rgba(46, 125, 50, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: isPending ? '#D96C3D' : '#2E7D32' }
                    ]}>
                      {report.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.captionText}>Reason:</Text>
                  <Text style={styles.bodyBold}>{report.reason}</Text>
                  
                  <Text style={[styles.captionText, { marginTop: 8 }]}>Content:</Text>
                  <Text style={styles.bodyItalic} numberOfLines={2}>
                    "{report.reportedContent}"
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
      >
        <SafeAreaView style={appStyles.modalOverlay}>
          <View style={appStyles.modalContent}>
            <View style={appStyles.modalHeader}>
              <Text style={appStyles.modalTitle} numberOfLines={1}>
                Report: {selectedReport?.id ? selectedReport.id.substring(0, 15) : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)} style={appStyles.modalCloseButton}>
                <Text style={appStyles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.modalRow}>
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetBadgeText}>Target: {selectedReport.contentType}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedReport.status === 'PENDING' ? 'rgba(217, 108, 61, 0.15)' : 'rgba(46, 125, 50, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: selectedReport.status === 'PENDING' ? '#D96C3D' : '#2E7D32' }
                    ]}>
                      {selectedReport.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelCaption}>Report Reason:</Text>
                  <Text style={styles.panelContentBold}>{selectedReport.reason}</Text>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelCaption}>Content Preview:</Text>
                  <Text style={styles.panelContentItalic}>"{selectedReport.reportedContent}"</Text>
                </View>

                {selectedReport.reporterNotes ? (
                  <View style={styles.panel}>
                    <Text style={styles.panelCaption}>Your Submitted Explanation:</Text>
                    <Text style={styles.panelContent}>{selectedReport.reporterNotes}</Text>
                  </View>
                ) : null}

                {selectedReport.adminNotes ? (
                  <View style={[styles.panel, { backgroundColor: 'rgba(111, 64, 95, 0.06)' }]}>
                    <Text style={[styles.panelCaption, { color: '#6F405F' }]}>Moderation Response:</Text>
                    <Text style={styles.panelContent}>{selectedReport.adminNotes}</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
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
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D1D15',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#8C8385',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFEAE8',
    padding: 40,
    marginHorizontal: 12,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAF6F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#8C8385',
    textAlign: 'center',
    lineHeight: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFEAE8',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECEE',
    paddingBottom: 8,
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FAF6F8',
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5C5254',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 2,
  },
  captionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8C8385',
    textTransform: 'uppercase',
  },
  bodyBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  bodyItalic: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#5C5254',
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  panel: {
    backgroundColor: '#FAF6F8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1ECEF',
    gap: 4,
  },
  panelCaption: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#8C8385',
    textTransform: 'uppercase',
  },
  panelContentBold: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  panelContentItalic: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#5C5254',
  },
  panelContent: {
    fontSize: 13,
    color: '#2D1D15',
    lineHeight: 18,
  },
});
