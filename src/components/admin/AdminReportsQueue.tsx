import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../../styles/theme';

interface AdminReportsQueueProps {
  reports: any[];
  onModerateReport: (report: any) => void;
}

export function AdminReportsQueue({ reports, onModerateReport }: AdminReportsQueueProps) {
  const [filterType, setFilterType] = useState('All');

  const reportsList = reports.filter((report: any) => {
    if (filterType === 'All') return true;
    if (filterType === 'Posts') return (report.contentType || '').toUpperCase() === 'POST';
    if (filterType === 'Comments') return (report.contentType || '').toUpperCase() === 'COMMENT';
    if (filterType === 'Replies') return (report.contentType || '').toUpperCase() === 'REPLY';
    if (filterType === 'Images') return (report.contentType || '').toUpperCase() === 'IMAGE';
    if (filterType === 'Profiles') return (report.contentType || '').toUpperCase() === 'PROFILE';
    if (filterType === 'High Risk') return (report.riskLevel || '').toUpperCase() === 'HIGH' || (report.riskLevel || '').toUpperCase() === 'CRITICAL';
    return true;
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Web-aligned filter tags */}
      <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F5F4' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['All', 'Posts', 'Comments', 'Replies', 'Images', 'Profiles', 'High Risk'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilterType(f)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: filterType === f ? '#2D1D15' : '#FCFAF9',
                borderWidth: 1,
                borderColor: filterType === f ? '#2D1D15' : '#E1DCDB',
              }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: filterType === f ? '#FFFFFF' : '#2D1D15' }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={reportsList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#8C8385', fontSize: 13, fontWeight: '600' }}>No reports found for the selected filter.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isResolved = item.status === 'RESOLVED';
          const riskColor = (item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL') ? '#ef4444' : '#eab308';
          const riskBg = (item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)';
          
          return (
            <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F8F5F4', marginBottom: 12, opacity: isResolved ? 0.7 : 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
              {/* Card Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15' }}>{item.reportId || `#${item.id}`}</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F8F5F4' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#6F405F' }}>{(item.contentType || 'POST').toUpperCase()}</Text>
                  </View>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: riskBg }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: riskColor }}>{item.riskLevel || 'MEDIUM'}</Text>
                </View>
              </View>

              {/* Quote Block */}
              <View style={{ padding: 12, backgroundColor: '#F8F5F3', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#6F405F', marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385', marginBottom: 4 }}>Reported Content:</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#2D1D15' }} numberOfLines={3}>
                  "{item.reportedContent || item.description || `Item #${item.contentId}`}"
                </Text>
              </View>

              {/* Details Grid */}
              <View style={{ gap: 6, marginBottom: 12, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385' }}>Author:</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#2D1D15' }}>@{item.authorUsername || 'Member'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385' }}>Reporter:</Text>
                  <Text style={{ fontSize: 11.5, color: '#8C8385' }}>@{item.reporterUsername || 'Member'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385' }}>Reason:</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#C46F76' }}>{item.reason}</Text>
                </View>
              </View>

              {/* Actions / Decision */}
              {isResolved ? (
                <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10b981' }}>
                    Resolved Action: {item.actionTaken}
                  </Text>
                  {!!item.adminNotes && (
                    <Text style={{ fontSize: 10.5, color: '#8C8385', marginTop: 2 }}>
                      Admin Notes: {item.adminNotes}
                    </Text>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => onModerateReport(item)}
                  style={{ paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.error || '#C46F76', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' }}>Moderate Content</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
