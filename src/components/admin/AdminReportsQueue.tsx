import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';

interface AdminReportsQueueProps {
  reports: any[];
  onViewReport: (report: any) => void;
  onActionReport: (report: any) => void;
}

// Eye icon outline
const EyeIcon = ({ color = '#4B5563', size = 11 }) => (
  <View style={{ width: size, height: size * 0.7, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
    <View style={{
      width: size,
      height: size * 0.6,
      borderRadius: size * 0.3,
      borderWidth: 1.2,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: size * 0.3,
        height: size * 0.3,
        borderRadius: (size * 0.3) / 2,
        backgroundColor: color,
      }} />
    </View>
  </View>
);

// Shield alert outline
const ShieldAlertIcon = ({ color = '#FFFFFF', size = 11 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
    <View style={{
      width: size * 0.85,
      height: size * 0.85,
      borderWidth: 1.2,
      borderColor: color,
      borderBottomLeftRadius: size * 0.3,
      borderBottomRightRadius: size * 0.3,
      borderTopLeftRadius: 1.5,
      borderTopRightRadius: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: size * 0.6, fontWeight: '900', color: color, marginTop: -2.5 }}>!</Text>
    </View>
  </View>
);

const formatReportId = (item: any) => {
  if (item.reportId) return String(item.reportId).toUpperCase();
  const idStr = String(item.id);
  if (idStr.startsWith('RPT-') || idStr.startsWith('REPORT_')) return idStr.toUpperCase();
  if (!isNaN(Number(idStr))) {
    const padded = idStr.length < 2 ? `0${idStr}` : idStr;
    return `REPORT_${padded}`;
  }
  return `REPORT_${idStr.toUpperCase()}`;
};

export function AdminReportsQueue({ reports, onViewReport, onActionReport }: AdminReportsQueueProps) {
  const [filterType, setFilterType] = useState('All');

  const reportsList = reports.filter((report: any) => {
    const cType = (report.contentType || '').toUpperCase();
    if (filterType === 'All') return true;
    if (filterType === 'Posts') return cType === 'POST';
    if (filterType === 'Comments') return cType === 'COMMENT';
    if (filterType === 'Replies') return cType === 'REPLY' || cType === 'COMMENT_REPLY';
    if (filterType === 'Images') return cType === 'IMAGE';
    if (filterType === 'Profiles') return cType === 'PROFILE';
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
                paddingHorizontal: 14,
                borderRadius: 20,
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

      {/* Main scrolling layout */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} style={{ flex: 1 }}>
        {/* Horizontal table container */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E1DCDB',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            shadowColor: '#2D1D15',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}>
            {/* Table Header Row */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#FCFAF9',
              borderBottomWidth: 1,
              borderBottomColor: '#E1DCDB',
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: 'center',
            }}>
              <Text style={{ width: 100, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Report ID</Text>
              <Text style={{ width: 85, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Type</Text>
              <Text style={{ width: 220, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Reported Content</Text>
              <Text style={{ width: 110, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Author</Text>
              <Text style={{ width: 130, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Reporter (Admin)</Text>
              <Text style={{ width: 140, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Reason</Text>
              <Text style={{ width: 95, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Risk</Text>
              <Text style={{ width: 100, fontSize: 12, fontWeight: '800', color: '#2D1D15' }}>Status</Text>
              <Text style={{ width: 160, fontSize: 12, fontWeight: '800', color: '#2D1D15', textAlign: 'right' }}>Actions</Text>
            </View>

            {/* Table Body */}
            {reportsList.length === 0 ? (
              <View style={{ width: 1140, paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#8C8385', fontSize: 13, fontWeight: '600' }}>
                  No reports found for the selected filter.
                </Text>
              </View>
            ) : (
              reportsList.map((item, index) => {
                const isResolved = item.status === 'RESOLVED';
                
                // Risk Badge Styles
                let riskText = (item.riskLevel || 'MEDIUM').toUpperCase();
                let riskBg = 'rgba(234, 179, 8, 0.1)';
                let riskColor = '#D96C3D';
                if (riskText === 'HIGH' || riskText === 'CRITICAL') {
                  riskBg = 'rgba(239, 68, 68, 0.1)';
                  riskColor = '#EF4444';
                } else if (riskText === 'LOW') {
                  riskBg = 'rgba(22, 163, 74, 0.1)';
                  riskColor = '#16A34A';
                }

                // Status Badge Styles
                let statusText = (item.status || 'PENDING').toUpperCase();
                let statusBg = '#F3F4F6';
                let statusColor = '#4B5563';
                if (statusText === 'RESOLVED' || statusText === 'ACTION TAKEN' || statusText === 'CLOSED') {
                  statusBg = 'rgba(16, 185, 129, 0.1)';
                  statusColor = '#10B981';
                } else if (statusText === 'UNDER REVIEW') {
                  statusBg = 'rgba(59, 130, 246, 0.1)';
                  statusColor = '#3B82F6';
                }

                const cleanAuthor = item.authorUsername ? (item.authorUsername.startsWith('@') ? item.authorUsername.substring(1) : item.authorUsername) : 'newline';
                const cleanReporter = item.reporterUsername ? (item.reporterUsername.startsWith('@') ? item.reporterUsername.substring(1) : item.reporterUsername) : 'newline28';

                return (
                  <View
                    key={item.id || index}
                    style={{
                      flexDirection: 'row',
                      borderBottomWidth: index === reportsList.length - 1 ? 0 : 1,
                      borderBottomColor: '#F3F4F6',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      backgroundColor: isResolved ? '#FAF8F7' : '#FFFFFF',
                      opacity: isResolved ? 0.75 : 1,
                    }}
                  >
                    {/* Report ID */}
                    <Text style={{ width: 100, fontSize: 12.5, fontWeight: '700', color: '#2D1D15' }}>
                      {formatReportId(item)}
                    </Text>

                    {/* Type Capsule */}
                    <View style={{ width: 85, alignItems: 'flex-start' }}>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: '#F3F4F6',
                      }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#6F405F', textTransform: 'uppercase' }}>
                          {item.contentType || 'POST'}
                        </Text>
                      </View>
                    </View>

                    {/* Reported Content */}
                    <View style={{ width: 220, paddingRight: 10 }}>
                      <Text
                        style={{ fontSize: 12.5, fontWeight: '600', color: '#2D1D15' }}
                        numberOfLines={2}
                      >
                        {item.reportedContent || item.description || `Item #${item.contentId}`}
                      </Text>
                    </View>

                    {/* Author */}
                    <Text style={{ width: 110, fontSize: 12.5, fontWeight: '600', color: '#2D1D15' }} numberOfLines={1}>
                      {cleanAuthor}
                    </Text>

                    {/* Reporter (Admin) */}
                    <Text style={{ width: 130, fontSize: 12.5, color: '#8C8385', fontWeight: '500' }} numberOfLines={1}>
                      {cleanReporter}
                    </Text>

                    {/* Reason */}
                    <Text style={{ width: 140, fontSize: 12, fontWeight: '700', color: '#C46F76', textTransform: 'uppercase' }} numberOfLines={1}>
                      {(item.reason || 'HATE_SPEECH').replace('_', ' ')}
                    </Text>

                    {/* Risk Badge */}
                    <View style={{ width: 95, alignItems: 'flex-start' }}>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: riskBg,
                      }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: riskColor }}>
                          {riskText}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View style={{ width: 100, alignItems: 'flex-start' }}>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: statusBg,
                      }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: statusColor }}>
                          {statusText}
                        </Text>
                      </View>
                    </View>

                    {/* Actions Column */}
                    <View style={{ width: 160, flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }}>
                      {/* View Button */}
                      <TouchableOpacity
                        onPress={() => onViewReport(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 5,
                          paddingHorizontal: 9,
                          borderRadius: 8,
                          backgroundColor: '#E5E7EB',
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                        }}
                      >
                        <EyeIcon color="#4B5563" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#4B5563' }}>
                          View
                        </Text>
                      </TouchableOpacity>

                      {/* Action Button */}
                      <TouchableOpacity
                        onPress={() => onActionReport(item)}
                        disabled={isResolved}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 5,
                          paddingHorizontal: 9,
                          borderRadius: 8,
                          backgroundColor: isResolved ? '#E5E7EB' : '#C46F76',
                          borderWidth: 1,
                          borderColor: isResolved ? '#D1D5DB' : '#B25A61',
                          opacity: isResolved ? 0.6 : 1,
                        }}
                      >
                        <ShieldAlertIcon color={isResolved ? '#4B5563' : '#FFFFFF'} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isResolved ? '#4B5563' : '#FFFFFF' }}>
                          Action
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
