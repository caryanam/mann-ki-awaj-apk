import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/apiService';
import { styles } from '../../styles/appStyles';
import { ShieldIcon, DocIcon, FlagIcon, ProfileIcon } from '../../components/common/Icons';

export function AdminAnalyticsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiService.adminFetchDashboard();
      setStats(res?.data || res);
    } catch (err) {
      console.warn('Failed to load analytics stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute Resolution Ratios safely
  const pending = stats?.totalPendingReports || 0;
  const resolved = stats?.totalResolvedReports || 0;
  const rejected = stats?.totalRejectedReports || 0;
  const total = Math.max(1, pending + resolved + rejected);

  const resolvedPercent = Math.min(100, Math.round((resolved / total) * 100));
  const rejectedPercent = Math.min(100, Math.round((rejected / total) * 100));
  const pendingPercent = Math.min(100, Math.round((pending / total) * 100));

  return (
    <ScrollView style={[styles.feedContainer, { backgroundColor: '#FCFAF9' }]} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Scroll Header */}
      <View style={{ paddingVertical: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#2D1D15', letterSpacing: -0.3 }}>Platform Analytics</Text>
          <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 3, fontWeight: '600' }}>AI moderation and platform metrics overview</Text>
        </View>
        <TouchableOpacity
          onPress={fetchStats}
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

      {loading ? (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6F405F" />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          {/* KPI GRID CARDS */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Total Users */}
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F5ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(111, 64, 95, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <ProfileIcon color="#6F405F" size={16} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#8C8385' }}>TOTAL USERS</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginVertical: 4 }}>{stats?.totalUsers || 0}</Text>
              <Text style={{ fontSize: 10, color: '#8C8385', fontWeight: '600' }}>{stats?.activeUsers || 0} active • {stats?.totalBlockedUsers || 0} blocked</Text>
            </View>

            {/* Total Posts */}
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F5ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(37, 99, 235, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <DocIcon color="#2563eb" size={16} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#8C8385' }}>PUBLISHED POSTS</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginVertical: 4 }}>{stats?.totalPosts || 0}</Text>
              <Text style={{ fontSize: 10, color: '#8C8385', fontWeight: '600' }}>{stats?.todayPostsCount || 0} created today</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Pending Reports */}
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F5ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(234, 179, 8, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <FlagIcon color="#eab308" size={16} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#8C8385' }}>REPORTS QUEUE</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginVertical: 4 }}>{stats?.totalPendingReports || 0}</Text>
              <Text style={{ fontSize: 10, color: '#8C8385', fontWeight: '600' }}>Awaiting review</Text>
            </View>

            {/* AI Moderation Gate */}
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F5ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <ShieldIcon color="#ef4444" size={16} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#8C8385' }}>AI BLOCKED</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginVertical: 4 }}>{stats?.totalPendingReviewQueue || 0}</Text>
              <Text style={{ fontSize: 10, color: '#8C8385', fontWeight: '600' }}>Auto-blocked violations</Text>
            </View>
          </View>

          {/* RESOLUTION RATE BREAKDOWN */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F5ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15', marginBottom: 16 }}>Moderation Queue Resolution Rate</Text>
            
            <View style={{ gap: 16 }}>
              {/* Resolved Reports */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>Resolved Reports</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#10b981' }}>{stats?.totalResolvedReports || 0} items ({resolvedPercent}%)</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#F8F5F3', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${resolvedPercent}%`, height: '100%', backgroundColor: '#10b981', borderRadius: 4 }} />
                </View>
              </View>

              {/* Dismissed/Rejected */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>Dismissed / Rejected</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#6F405F' }}>{stats?.totalRejectedReports || 0} items ({rejectedPercent}%)</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#F8F5F3', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${rejectedPercent}%`, height: '100%', backgroundColor: '#6F405F', borderRadius: 4 }} />
                </View>
              </View>

              {/* Pending Human Review */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>Pending Human Review</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#eab308' }}>{stats?.totalPendingReports || 0} items ({pendingPercent}%)</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#F8F5F3', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${pendingPercent}%`, height: '100%', backgroundColor: '#eab308', borderRadius: 4 }} />
                </View>
              </View>
            </View>
          </View>

          {/* SAFETY INTELLIGENCE CARD */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F5ECEB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15' }}>AI Pre-Publish Pre-Gate Safety</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
            </View>
            <Text style={{ fontSize: 12, color: '#8C8385', lineHeight: 18, marginBottom: 16 }}>
              All user post submissions (Text, Images, Multimodal) are passed through OpenAI Model Moderation before database entry.
            </Text>

            <View style={{ padding: 14, backgroundColor: '#FAF7F6', borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#EFEAE9' }}>
              <View>
                <Text style={{ fontSize: 11, color: '#8C8385', fontWeight: '600' }}>Fail-Closed Pipeline</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#10b981', marginTop: 2 }}>100% Enforced</Text>
              </View>
              <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E5DFDE' }}>
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#6F405F' }}>omni-moderation-latest</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
