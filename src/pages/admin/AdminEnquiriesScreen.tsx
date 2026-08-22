import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';

// Custom inline CSS-drawn trash icon
const TrashIcon = ({ color = '#EF4444', size = 14 }) => (
  <View style={{ width: size, height: size, justifyContent: 'space-between', alignItems: 'center' }}>
    {/* Lid */}
    <View style={{ width: size * 0.8, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    {/* Body */}
    <View style={{
      width: size * 0.65,
      height: size * 0.75,
      borderWidth: 1.2,
      borderColor: color,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      borderTopWidth: 0,
    }} />
  </View>
);

const getRelativeTime = (dateStr: string) => {
  if (!dateStr) return 'Recently';
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

export function AdminEnquiriesScreen() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEnquiries = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await apiService.adminFetchEnquiries();
      setEnquiries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      Alert.alert('Error', 'Failed to fetch user enquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const success = await apiService.adminUpdateEnquiryStatus(id, newStatus, adminNoteInput);
      if (success) {
        Alert.alert('Success', `Enquiry updated to ${newStatus}`);
        setEditingId(null);
        setAdminNoteInput('');
        fetchEnquiries(true);
      } else {
        Alert.alert('Error', 'Failed to update enquiry');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update enquiry status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user enquiry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(id);
            try {
              const success = await apiService.adminDeleteEnquiry(id);
              if (success) {
                Alert.alert('Success', 'Enquiry deleted successfully');
                setEnquiries(prev => prev.filter(e => e.id !== id));
              } else {
                Alert.alert('Error', 'Failed to delete enquiry');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete enquiry');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const filteredEnquiries = enquiries.filter(item => {
    const matchesSearch =
      (item.ticketId && item.ticketId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.message && item.message.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = enquiries.filter(e => e.status === 'PENDING').length;
  const resolvedCount = enquiries.filter(e => e.status === 'RESOLVED').length;

  return (
    <View style={[styles.feedContainer, { backgroundColor: '#F9FAFB' }]}>
      {/* Page Header */}
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
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#2D1D15' }}>
              User Enquiries Portal
            </Text>
          </View>

          {/* Refresh button */}
          <TouchableOpacity
            onPress={() => fetchEnquiries(true)}
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
              <ActivityIndicator size="small" color="#2D1D15" style={{ marginRight: 4 }} />
            ) : (
              <Text style={{ fontSize: 11, color: '#2D1D15', marginRight: 4 }}>↻</Text>
            )}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D1D15' }}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: '#8C8385', fontWeight: '500', marginTop: 4 }}>
          Manage contact messages & support inquiries submitted from the landing page.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* KPI Stats Cards Row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {/* Card 1 */}
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(111, 64, 95, 0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14 }}>📥</Text>
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15' }}>{enquiries.length}</Text>
              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#8C8385' }}>Total</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(234, 179, 8, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14 }}>🕒</Text>
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15' }}>{pendingCount}</Text>
              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#8C8385' }}>Pending</Text>
            </View>
          </View>

          {/* Card 3 */}
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(41, 150, 90, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14 }}>✅</Text>
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15' }}>{resolvedCount}</Text>
              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#8C8385' }}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Filter Controls Bar */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E1DCDB',
          borderRadius: 16,
          padding: 12,
          marginBottom: 14,
          gap: 10,
        }}>
          {/* Search Box */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FCFAF9',
            borderWidth: 1,
            borderColor: '#E1DCDB',
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}>
            <Text style={{ fontSize: 12, marginRight: 6 }}>🔍</Text>
            <TextInput
              placeholder="Search ticket, name, email or message..."
              placeholderTextColor="#8C8385"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, fontSize: 12.5, color: '#2D1D15', padding: 0 }}
            />
          </View>

          {/* Status filter tabs */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['ALL', 'PENDING', 'RESOLVED'].map(st => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: statusFilter === st ? '#63344F' : '#FCFAF9',
                  borderWidth: 1,
                  borderColor: statusFilter === st ? '#63344F' : '#E1DCDB',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: statusFilter === st ? '#FFFFFF' : '#8C8385' }}>
                  {st === 'ALL' ? 'All Enquiries' : st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loading / List contents */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2D1D15" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 12.5, color: '#8C8385', fontWeight: '500' }}>Loading enquiries...</Text>
          </View>
        ) : filteredEnquiries.length === 0 ? (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E1DCDB',
            borderRadius: 16,
            padding: 40,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}>
            <Text style={{ fontSize: 28 }}>📥</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D1D15' }}>No Enquiries Found</Text>
            <Text style={{ fontSize: 12, color: '#8C8385', textAlign: 'center', paddingHorizontal: 16 }}>
              {searchQuery ? 'No user enquiries match your search query.' : 'No landing page inquiries have been submitted yet.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredEnquiries.map(item => {
              const isResolved = item.status === 'RESOLVED';
              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E1DCDB',
                    borderRadius: 16,
                    padding: 16,
                    gap: 12,
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.02,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                >
                  {/* Ticket Header Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: '#6F405F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>
                          #{item.ticketId || `MKA-${item.id}`}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: '#FAF6F8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#F1ECEF' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#2D1D15' }}>
                          {item.category || 'Inquiry'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {/* Status indicator */}
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: isResolved ? 'rgba(41, 150, 90, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: isResolved ? '#29965A' : '#D97706' }}>
                          ● {item.status || 'PENDING'}
                        </Text>
                      </View>

                      {/* Delete button */}
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <TrashIcon color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Subject and Sender Details */}
                  <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10, gap: 4 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                      {item.subject}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2D1D15' }}>
                        👤 {item.name}
                      </Text>
                      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
                        <Text style={{ fontSize: 11.5, color: '#6F405F', fontWeight: '700', textDecorationLine: 'underline' }}>
                          ✉️ {item.email}
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 11.5, color: '#8C8385', fontWeight: '600' }}>
                        🕒 {getRelativeTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Message body */}
                  <View style={{ backgroundColor: '#FCFAF9', borderWidth: 1, borderColor: '#F1ECEF', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontSize: 13, color: '#2D1D15', lineHeight: 18, fontWeight: '500' }}>
                      {item.message}
                    </Text>
                  </View>

                  {/* Attachment image */}
                  {item.imageUrl && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#6F405F', textTransform: 'uppercase' }}>
                        📷 Attached Reference Screenshot
                      </Text>
                      <TouchableOpacity onPress={() => Linking.openURL(item.imageUrl)}>
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={{
                            width: '100%',
                            height: 140,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: '#E1DCDB',
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Admin Note if present */}
                  {item.adminNotes && (
                    <View style={{ backgroundColor: 'rgba(111, 64, 95, 0.05)', borderWidth: 1, borderColor: 'rgba(111, 64, 95, 0.15)', borderRadius: 10, padding: 10 }}>
                      <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: '600' }}>
                        <Text style={{ fontWeight: 'bold' }}>Admin Note: </Text>
                        {item.adminNotes}
                      </Text>
                    </View>
                  )}

                  {/* Action row footer */}
                  <View style={{ paddingTop: 2 }}>
                    {editingId === item.id ? (
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <TextInput
                          placeholder="Add admin note..."
                          placeholderTextColor="#8C8385"
                          value={adminNoteInput}
                          onChangeText={setAdminNoteInput}
                          style={{
                            flex: 1,
                            backgroundColor: '#FCFAF9',
                            borderWidth: 1,
                            borderColor: '#E1DCDB',
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            fontSize: 12,
                            color: '#2D1D15',
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(item.id, 'RESOLVED')}
                          disabled={actionLoading === item.id}
                          style={{ backgroundColor: '#29965A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setEditingId(null)}
                          style={{ backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
                        >
                          <Text style={{ color: '#4B5563', fontSize: 12, fontWeight: '700' }}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {!isResolved && (
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(item.id, 'RESOLVED')}
                            disabled={actionLoading === item.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#29965A',
                              paddingVertical: 7,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              gap: 4,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                              ✓ Mark Resolved
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => {
                            setEditingId(item.id);
                            setAdminNoteInput(item.adminNotes || '');
                          }}
                          style={{
                            paddingVertical: 7,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: '#FCFAF9',
                            borderWidth: 1,
                            borderColor: '#E1DCDB',
                          }}
                        >
                          <Text style={{ color: '#2D1D15', fontSize: 11.5, fontWeight: '700' }}>
                            {item.adminNotes ? 'Edit Note' : 'Add Note'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
