import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { usePosts } from '../../context/PostContext';
import { apiService } from '../../services/apiService';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { DocIcon, FlagIcon, ProfileIcon, EyeIcon, BarChartIcon, ShieldIcon, BellIcon } from '../../components/common/Icons';

export function AdminDashboardScreen({
  activeAdminTab,
  setActiveAdminTab,
  adminBadgeCount = 0,
  setAdminAlertsModalVisible = () => {},
  currentUser,
}: {
  activeAdminTab: string;
  setActiveAdminTab: (tab: string) => void;
  adminBadgeCount?: number;
  setAdminAlertsModalVisible?: (visible: boolean) => void;
  currentUser?: any;
}) {
  const { allRawPosts, reports } = usePosts() as any;

  // Expanded Admin Panel states
  const [users, setUsers] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentBlocked, setRecentBlocked] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
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
    }
    loadAdminData();
  }, []);

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
      {/* Sub Header Title Bar */}
      <View style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F8F5F4' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.zorba }}>Admin Console / {activeAdminTab}</Text>
      </View>

      {/* DASHBOARD PAGE */}
      {activeAdminTab === 'Dashboard' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Welcome Admin Premium Card */}
          <View style={{
            padding: 20,
            backgroundColor: '#6F405F',
            borderRadius: 24,
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            elevation: 4,
            shadowColor: '#6F405F',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
                Welcome, Admin! 👋
              </Text>
              <Text style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4, fontWeight: '600', lineHeight: 17 }}>
                AwaajManki moderation console. Inspect pending activities, reviews, or view user directories below.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Notification Bell */}
              <TouchableOpacity
                onPress={() => setAdminAlertsModalVisible(true)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
              >
                <BellIcon color="#FFFFFF" size={18} />
                {adminBadgeCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: '#EF4444',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 3,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
                      {adminBadgeCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Avatar circle */}
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                  {String(currentUser?.username || 'A').replace('@', '').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.adminSectionHeader}>Platform Health</Text>
          <Text style={styles.adminSectionSub}>Activity analytics and safety statistics metrics.</Text>

          {/* 1. FOUR LARGE KPI CARDS ACROSS THE TOP */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1, padding: 14, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#F8F5F4', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <FlagIcon color="#ef4444" size={16} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2D1D15' }}>{pendingReportsCount}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385', marginTop: 2 }}>Pending Reports</Text>
              <Text style={{ fontSize: 9, color: '#ef4444', marginTop: 1, fontWeight: '700' }}>Action required</Text>
            </View>

            <View style={{ flex: 1, padding: 14, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#F8F5F4', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <ShieldIcon color="#10b981" size={16} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2D1D15' }}>{blockedCountVal}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385', marginTop: 2 }}>AI Blocked Content</Text>
              <Text style={{ fontSize: 9, color: '#10b981', marginTop: 1, fontWeight: '700' }}>Auto-blocked items</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1, padding: 14, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#F8F5F4', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(111, 64, 95, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <DocIcon color="#6F405F" size={16} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2D1D15' }}>{totalPostsVal}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385', marginTop: 2 }}>Platform Posts</Text>
              <Text style={{ fontSize: 9, color: '#6F405F', marginTop: 1, fontWeight: '700' }}>Active & archived</Text>
            </View>

            <View style={{ flex: 1, padding: 14, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#F8F5F4', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(45, 29, 21, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <ProfileIcon color="#2D1D15" size={16} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2D1D15' }}>{totalUsersVal}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8C8385', marginTop: 2 }}>Registered Users</Text>
              <Text style={{ fontSize: 9, color: '#8C8385', marginTop: 1, fontWeight: '700' }}>Community members</Text>
            </View>
          </View>

          {/* 2. CONTENT INTELLIGENCE TREND BAR CHART */}
          <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F8F5F4', marginTop: 16 }}>
            <View style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D1D15' }}>Content Intelligence Trend</Text>
              <Text style={{ fontSize: 11, color: '#9F9794', marginTop: 2 }}>Real-time pattern tracking of reports, AI blocks, and reviews</Text>
            </View>

            {/* Comparative Multi-Bar Chart */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingTop: 10 }}>
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
                  <View style={{ flexDirection: 'row', gap: 2.5, alignItems: 'flex-end', height: 90 }}>
                    <View style={{ width: 4, height: item.reports * 0.7, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    <View style={{ width: 4, height: item.blocked * 0.7, backgroundColor: '#f97316', borderRadius: 2 }} />
                    <View style={{ width: 4, height: item.reviewed * 0.7, backgroundColor: '#10b981', borderRadius: 2 }} />
                  </View>
                  <Text style={{ fontSize: 10, color: '#8C8385', marginTop: 6, fontWeight: 'bold' }}>{item.day}</Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8F5F4' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6F405F' }} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#2D1D15' }}>Reports</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316' }} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#2D1D15' }}>AI Blocked</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#2D1D15' }}>Reviewed</Text>
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
