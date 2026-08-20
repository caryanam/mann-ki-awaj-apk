import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, TextInput, SafeAreaView } from 'react-native';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { ShieldIcon, FlagIcon } from '../../components/common/Icons';

export function AdminBlockedContentScreen() {
  const [footprints, setFootprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Warning Modal State
  const [selectedItemForWarn, setSelectedItemForWarn] = useState<any>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningLevel, setWarningLevel] = useState('FIRST');
  const [issuingWarn, setIssuingWarn] = useState(false);

  const fetchBlockedFootprints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.adminFetchBlockedContent(selectedType, page, 10);
      const rawData = res?.data || res;
      const list = rawData?.content || (Array.isArray(rawData) ? rawData : (Array.isArray(res) ? res : []));
      setFootprints(list);
      setTotalPages(rawData?.totalPages || 1);
    } catch (err) {
      console.warn('Failed to load blocked footprints:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, page]);

  useEffect(() => {
    fetchBlockedFootprints();
  }, [fetchBlockedFootprints]);

  const handleIssueWarning = async () => {
    if (!selectedItemForWarn || !warningMessage.trim()) return;

    setIssuingWarn(true);
    try {
      await apiService.adminSendWarningForBlockedContent(
        selectedItemForWarn.id,
        warningLevel,
        warningMessage.trim()
      );
      Alert.alert('Success', 'Warning issued successfully and content status updated.');
      setSelectedItemForWarn(null);
      setWarningMessage('');
      setWarningLevel('FIRST');
      fetchBlockedFootprints();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to issue warning.');
    } finally {
      setIssuingWarn(false);
    }
  };

  return (
    <View style={[styles.feedContainer, { backgroundColor: '#FCFAF9' }]}>
      {/* Segmented Filter Bar - Blends seamlessly into page background */}
      <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[
            { type: 'ALL', label: 'All Content' },
            { type: 'POST', label: 'Posts' },
            { type: 'POST_IMAGE', label: 'Images' },
            { type: 'COMMENT', label: 'Comments' },
            { type: 'REPLY', label: 'Replies' },
            { type: 'MESSAGE', label: 'Direct Messages' },
          ].map((item) => {
            const isActive = selectedType === item.type;
            return (
              <TouchableOpacity
                key={item.type}
                onPress={() => {
                  setSelectedType(item.type);
                  setPage(0);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isActive ? '#6F405F' : '#FFF',
                  borderWidth: isActive ? 0 : 1,
                  borderColor: '#EFEAE9',
                  elevation: isActive ? 3 : 1,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 }
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: isActive ? '#FFFFFF' : '#6F405F' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={footprints}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshing={loading}
        onRefresh={fetchBlockedFootprints}
        ListHeaderComponent={
          <View style={{ paddingVertical: 16, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#2D1D15', letterSpacing: -0.3 }}>Blocked Footprints</Text>
              <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 3, fontWeight: '600' }}>AI Moderation Intelligence Log</Text>
            </View>
            <TouchableOpacity
              onPress={fetchBlockedFootprints}
              disabled={loading}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#6F405F" />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#6F405F' }}>↻</Text>
              )}
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, marginHorizontal: 4, borderWidth: 1, borderColor: '#F0ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
              <ShieldIcon color="#10b981" size={24} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', marginBottom: 6 }}>All Clear</Text>
            <Text style={{ color: '#8C8385', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>No blocked footprints found for this content type.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isWarningIssued = item.status === 'WARNING_ISSUED';
          
          return (
            <View style={{ padding: 18, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F5ECEB', marginBottom: 16, marginHorizontal: 4, elevation: 3, shadowColor: '#2D1D15', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }}>
              {/* Card Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Small LED dot status */}
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#C46F76' }} />
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#C46F76', letterSpacing: 0.8 }}>{(item.contentType || 'POST').toUpperCase()} BLOCKED</Text>
                </View>
                
                {/* Author Avatar + Name Capsule */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAF7F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFFFFF' }}>{String(item.authorUsername || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#2D1D15' }}>@{item.authorUsername || 'member'}</Text>
                </View>
              </View>

              {/* Original Content Shaded Block with quotation watermarks */}
              <View style={{ padding: 16, backgroundColor: '#FAF7F6', borderRadius: 16, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#C46F76' }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#A0908C', marginBottom: 6, letterSpacing: 0.5 }}>VIOLATION CONTENT</Text>
                <Text style={{ fontSize: 13.5, color: '#2D1D15', lineHeight: 22, fontWeight: '700' }}>
                  "{item.originalContent}"
                </Text>
              </View>

              {/* Flagged Category Info / Action bar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F5ECEB' }}>
                <View style={{ flex: 1, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FlagIcon color="#C46F76" size={14} />
                  <Text style={{ fontSize: 12, color: '#C46F76', fontWeight: '800', flexShrink: 1 }} numberOfLines={2}>
                    Reason: {item.flaggedReason || 'Safety Trigger'}
                  </Text>
                </View>

                {isWarningIssued ? (
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#10b981' }}>✓ Warned</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedItemForWarn(item);
                      setWarningMessage(`Please refrain from using abusive words or foul content. This violates community feed guidelines.`);
                    }}
                    style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#C46F76', elevation: 2, shadowColor: '#C46F76', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' }}>Issue Warning</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F0ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, marginHorizontal: 4 }}>
              <TouchableOpacity
                disabled={page === 0}
                onPress={() => setPage(p => Math.max(0, p - 1))}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: page === 0 ? '#FCFAF9' : '#FAF5F4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5DFDE', opacity: page === 0 ? 0.4 : 1 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#2D1D15' }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#8C8385' }}>
                Page {page + 1} of {totalPages}
              </Text>
              <TouchableOpacity
                disabled={page >= totalPages - 1}
                onPress={() => setPage(p => p + 1)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: page >= totalPages - 1 ? '#FCFAF9' : '#FAF5F4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5DFDE', opacity: page >= totalPages - 1 ? 0.4 : 1 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#2D1D15' }}>›</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Warning Issue Modal */}
      {selectedItemForWarn && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedItemForWarn}
          onRequestClose={() => setSelectedItemForWarn(null)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.4)' }]}>
            <View style={[styles.reportModalCard, { borderRadius: 28, padding: 24, width: '90%', elevation: 12, borderTopWidth: 5, borderTopColor: '#C46F76' }]}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D1D15', marginBottom: 4 }}>Issue Moderation Warn</Text>
              <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 16 }}>Send formal compliance alert to @{selectedItemForWarn.authorUsername}</Text>

              {/* Blocked content preview in Modal */}
              <View style={{ padding: 14, backgroundColor: 'rgba(196, 111, 118, 0.05)', borderRadius: 14, borderLeftWidth: 3, borderLeftColor: '#C46F76', marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#C46F76', marginBottom: 4, letterSpacing: 0.5 }}>VIOLATION CONTENT</Text>
                <Text style={{ fontSize: 13, color: '#2D1D15', fontStyle: 'italic', lineHeight: 18 }}>"{selectedItemForWarn.originalContent}"</Text>
              </View>

              {/* Selectable Stage Options - Beautiful radio-group stack to prevent cutoff text wrapping */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#2D1D15', marginBottom: 8, letterSpacing: 0.2 }}>WARNING STAGE LEVEL:</Text>
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

              <Text style={{ fontSize: 11, fontWeight: '900', color: '#2D1D15', marginBottom: 8, letterSpacing: 0.2 }}>COMPLIANCE INSTRUCTIONS MESSAGE:</Text>
              <TextInput
                placeholder="Write custom instructions warning message here..."
                placeholderTextColor={COLORS.zorba}
                value={warningMessage}
                onChangeText={setWarningMessage}
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 90, textAlignVertical: 'top', borderRadius: 14, backgroundColor: '#FAF6F5', borderWidth: 1, borderColor: '#E5DFDE', padding: 12, fontSize: 13, color: '#2D1D15', fontWeight: '600' }]}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => setSelectedItemForWarn(null)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5DFDE', backgroundColor: '#FAF7F6', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#2D1D15' }}>Discard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={issuingWarn || !warningMessage.trim()}
                  onPress={handleIssueWarning}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', elevation: 3, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 3 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>
                    {issuingWarn ? 'Sending...' : 'Send Warning'}
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
