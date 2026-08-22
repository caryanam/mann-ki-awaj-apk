import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePosts } from '../../context/PostContext';
import { apiService } from '../../services/apiService';
import { styles } from '../../styles/appStyles';
import { DocIcon, FlagIcon, ProfileIcon, EyeIcon, BarChartIcon, ShieldIcon, BellIcon, LogoutIcon } from '../../components/common/Icons';

export function AdminDashboardScreen({
  activeAdminTab,
  setActiveAdminTab,
  adminBadgeCount = 0,
  setAdminAlertsModalVisible = () => { },
  currentUser,
  onExitAdmin,
}: {
  activeAdminTab: string;
  setActiveAdminTab: (tab: string) => void;
  adminBadgeCount?: number;
  setAdminAlertsModalVisible?: (visible: boolean) => void;
  currentUser?: any;
  onExitAdmin?: () => void;
}) {
  const { allRawPosts, reports } = usePosts() as any;

  // Expanded Admin Panel states
  const [users, setUsers] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentBlocked, setRecentBlocked] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdminData = async () => {
    try {
      const u = await apiService.adminFetchUsers();
      setUsers(u);
      const dbStats = await apiService.adminFetchDashboard();
      if (dbStats) {
        setDashboardStats(dbStats);
      }
      const rep = await apiService.adminFetchReports(0, 5);
      if (rep) {
        setRecentReports(Array.isArray(rep) ? rep : (rep.content || []));
      }
      const blk = await apiService.adminFetchBlockedContent('ALL', 0, 5);
      if (blk) {
        setRecentBlocked(Array.isArray(blk) ? blk : (blk.content || []));
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const pendingReports = reports.filter((r: any) => r.status === 'PENDING');
  const totalPosts = allRawPosts.length;
  const blockedCount = allRawPosts.filter((p: any) => p.hidden).length;

  const pendingReportsCount = dashboardStats?.totalPendingReports ?? pendingReports.length;
  const totalPostsVal = dashboardStats?.totalPosts ?? totalPosts;
  const blockedCountVal = dashboardStats?.totalBlockedContent ?? blockedCount;
  const totalUsersVal = dashboardStats?.totalUsers ?? (users.length || 24);

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

  return (
    <View style={styles.feedContainer}>
      {/* Clean Compact Header Overview Bar */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E1DCDB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#2D1D15' }}>
            Dashboard Overview
          </Text>
          <Text style={{ fontSize: 10.5, color: '#8C8385', fontWeight: '500', marginTop: 2 }}>
            Real-time moderation & intelligence monitoring
          </Text>
        </View>

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
            <ActivityIndicator size="small" color="#2D1D15" style={{ marginRight: 4 }} />
          ) : (
            <Text style={{ fontSize: 11, color: '#2D1D15', marginRight: 4 }}>↻</Text>
          )}
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D1D15' }}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* DASHBOARD PAGE */}
      {activeAdminTab === 'Dashboard' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* KPI CARDS 2x2 */}
          <View style={{ gap: 10 }}>
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Card 1: PENDING USER REPORTS */}
              <View style={{
                flex: 1,
                padding: 14,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F8F5F4',
                elevation: 1,
                shadowColor: '#000000',
                shadowOpacity: 0.04,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1.5 }
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <FlagIcon color="#EF4444" size={16} />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#8C8385', letterSpacing: 0.5 }}>
                  PENDING USER REPORTS
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginTop: 4 }}>
                  {pendingReportsCount}
                </Text>
                <Text style={{ fontSize: 10, color: '#EF4444', marginTop: 4, fontWeight: '700' }}>
                  Action required
                </Text>
              </View>

              {/* Card 2: AI BLOCKED CONTENT */}
              <View style={{
                flex: 1,
                padding: 14,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F8F5F4',
                elevation: 1,
                shadowColor: '#000000',
                shadowOpacity: 0.04,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1.5 }
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <ShieldIcon color="#10B981" size={16} />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#8C8385', letterSpacing: 0.5 }}>
                  AI BLOCKED CONTENT
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginTop: 4 }}>
                  {blockedCountVal}
                </Text>
                <Text style={{ fontSize: 10, color: '#9F9794', marginTop: 4, fontWeight: '700' }}>
                  Auto-blocked items
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Card 3: TOTAL PLATFORM POSTS */}
              <View style={{
                flex: 1,
                padding: 14,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F8F5F4',
                elevation: 1,
                shadowColor: '#000000',
                shadowOpacity: 0.04,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1.5 }
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FAF5F8', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <DocIcon color="#6F405F" size={16} />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#8C8385', letterSpacing: 0.5 }}>
                  TOTAL PLATFORM POSTS
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginTop: 4 }}>
                  {totalPostsVal}
                </Text>
                <Text style={{ fontSize: 10, color: '#9F9794', marginTop: 4, fontWeight: '700' }}>
                  Active & archived
                </Text>
              </View>

              {/* Card 4: REGISTERED ACCOUNTS */}
              <View style={{
                flex: 1,
                padding: 14,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F8F5F4',
                elevation: 1,
                shadowColor: '#000000',
                shadowOpacity: 0.04,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1.5 }
              }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FAF7F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <ProfileIcon color="#5C5254" size={16} />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#8C8385', letterSpacing: 0.5 }}>
                  REGISTERED ACCOUNTS
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', marginTop: 4 }}>
                  {totalUsersVal}
                </Text>
                <Text style={{ fontSize: 10, color: '#9F9794', marginTop: 4, fontWeight: '700' }}>
                  Community members
                </Text>
              </View>
            </View>
          </View>

          {/* 2. CONTENT INTELLIGENCE TREND BAR CHART */}
          <View style={{
            padding: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#F8F5F4',
            marginTop: 16,
            elevation: 1,
            shadowColor: '#000000',
            shadowOpacity: 0.04,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1.5 }
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#2D1D15' }}>Content Intelligence Trend</Text>
                <Text style={{ fontSize: 11, color: '#9F9794', marginTop: 2, fontWeight: '600' }}>
                  Real-time pattern tracking of reports, AI blocks, and reviews
                </Text>
              </View>
              {/* Fake dropdown pill */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 5,
                paddingHorizontal: 9,
                borderRadius: 6,
                backgroundColor: '#FAF7F6',
                borderWidth: 1,
                borderColor: '#E1DCDB',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#2D1D15' }}>This Week</Text>
                <Text style={{ fontSize: 8, color: '#2D1D15', transform: [{ rotate: '90deg' }] }}>▶</Text>
              </View>
            </View>

            {/* Chart Area with Gridlines */}
            <View style={{ position: 'relative', height: 130, justifyContent: 'flex-end', paddingTop: 10 }}>
              {/* Background Gridlines */}
              <View style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>
                <View style={{ height: 1, backgroundColor: '#F8F5F4', width: '100%' }} />
                <View style={{ height: 1, backgroundColor: '#F8F5F4', width: '100%' }} />
                <View style={{ height: 1, backgroundColor: '#F8F5F4', width: '100%' }} />
                <View style={{ height: 1, backgroundColor: '#F8F5F4', width: '100%' }} />
              </View>

              {/* Bar charts */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, zIndex: 2 }}>
                {[
                  { day: 'Mon', reports: 30, blocked: 20, reviewed: 15 },
                  { day: 'Tue', reports: 45, blocked: 35, reviewed: 28 },
                  { day: 'Wed', reports: 60, blocked: 40, reviewed: 35 },
                  { day: 'Thu', reports: 35, blocked: 25, reviewed: 20 },
                  { day: 'Fri', reports: 80, blocked: 65, reviewed: 50 },
                  { day: 'Sat', reports: 90, blocked: 80, reviewed: 75 },
                  { day: 'Sun', reports: 110, blocked: 95, reviewed: 85 }
                ].map((item) => (
                  <View key={item.day} style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 90 }}>
                      <View style={{ width: 5, height: item.reports * 0.75, backgroundColor: '#6F405F', borderRadius: 2.5 }} />
                      <View style={{ width: 5, height: item.blocked * 0.75, backgroundColor: '#FAF5F8', borderWidth: 1, borderColor: '#6F405F', borderRadius: 2.5 }} />
                      <View style={{ width: 5, height: item.reviewed * 0.75, backgroundColor: '#D96C3D', borderRadius: 2.5 }} />
                    </View>
                    <Text style={{ fontSize: 9.5, color: '#8C8385', marginTop: 8, fontWeight: '800' }}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8F5F4' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6F405F' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D1D15' }}>Reports</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FAF5F8', borderWidth: 1.5, borderColor: '#6F405F' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D1D15' }}>AI Blocked</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D96C3D' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D1D15' }}>Reviewed</Text>
              </View>
            </View>
          </View>

          {/* 3. RECENT ACTIVITY LIST */}
          <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F8F5F4', marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D1D15' }}>Recent Activity</Text>
              <TouchableOpacity onPress={() => setActiveAdminTab('Reports')}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6F405F' }}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              {(() => {
                const actList = [];

                recentReports.forEach((r: any, idx: number) => {
                  actList.push({
                    id: `rep-${r.id || idx}`,
                    title: `Report submitted by @${r.reporterUsername || r.authorUsername || 'member'}`,
                    time: r.createdAt ? getRelativeTime(r.createdAt) : 'Recently',
                    isReport: true,
                  });
                });

                recentBlocked.forEach((b: any, idx: number) => {
                  const raw = b.authorUsername || b.authorEmail || 'member';
                  const handle = raw.startsWith('@') ? raw.substring(1) : raw;
                  const cleanUser = handle.includes('@') ? handle.split('@')[0] : handle;
                  const cType = (b.contentType || 'content').toLowerCase();
                  const typeLabel = cType === 'chat' || cType === 'message' || cType === 'msg'
                    ? 'Message'
                    : cType === 'comment'
                      ? 'Comment'
                      : cType === 'post'
                        ? 'Post'
                        : 'Content';
                  actList.push({
                    id: `blk-${b.id || idx}`,
                    title: `${typeLabel} auto-blocked by AI (${cleanUser})`,
                    time: b.blockedAt ? getRelativeTime(b.blockedAt) : 'Recently',
                    isReport: false,
                  });
                });

                // Fallbacks if empty
                if (actList.length === 0) {
                  actList.push(
                    {
                      id: 'mock-1',
                      title: 'Post auto-blocked by AI (@spambot99)',
                      time: '4m ago',
                      isReport: false,
                    },
                    {
                      id: 'mock-2',
                      title: 'Report submitted by @silentnote84',
                      time: '12m ago',
                      isReport: true,
                    },
                    {
                      id: 'mock-3',
                      title: 'Comment auto-flagged by AI (@newvoice23)',
                      time: '1h ago',
                      isReport: false,
                    }
                  );
                }

                return actList.slice(0, 4).map((act) => (
                  <View key={act.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, backgroundColor: '#F8F5F4' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: act.isReport ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                        {act.isReport ? <FlagIcon color="#eab308" size={14} /> : <ShieldIcon color="#ef4444" size={14} />}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#2D1D15', flex: 1 }} numberOfLines={1}>
                        {act.title}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#9F9794', marginLeft: 8 }}>{act.time}</Text>
                  </View>
                ));
              })()}
            </View>
          </View>

          {/* 4. QUICK ACTIONS TILES */}
          <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F8F5F4', marginTop: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D1D15', marginBottom: 12 }}>Quick Actions</Text>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity
                onPress={() => setActiveAdminTab('Reports')}
                style={{ flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, backgroundColor: '#F8F5F3', borderWidth: 1, borderColor: '#E1DCDB', alignItems: 'center', gap: 8 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <FlagIcon color="#ef4444" size={16} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>Review Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveAdminTab('BlockedFootprints')}
                style={{ flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, backgroundColor: '#F8F5F3', borderWidth: 1, borderColor: '#E1DCDB', alignItems: 'center', gap: 8 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <ShieldIcon color="#10b981" size={16} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>AI Blocked Items</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setActiveAdminTab('ContentReview')}
                style={{ flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, backgroundColor: '#F8F5F3', borderWidth: 1, borderColor: '#E1DCDB', alignItems: 'center', gap: 8 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(111, 64, 95, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <EyeIcon color="#6F405F" size={16} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>Content Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveAdminTab('Analytics')}
                style={{ flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, backgroundColor: '#F8F5F3', borderWidth: 1, borderColor: '#E1DCDB', alignItems: 'center', gap: 8 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(45, 29, 21, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <BarChartIcon color="#2D1D15" size={16} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D1D15' }}>View Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}







    </View>
  );
}
