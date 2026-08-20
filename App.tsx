import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';

import { AuthProvider, useAuth as _useAuth } from './src/context/AuthContext';
import { PostProvider } from './src/context/PostContext';
import { ChatProvider, useChat as _useChat } from './src/context/ChatContext';
import { NotificationProvider, useNotifications as _useNotifications } from './src/context/NotificationContext';
import { LanguageProvider, useLanguage as _useLanguage } from './src/context/LanguageContext';

const useAuth = _useAuth as any;
const useChat = _useChat as any;
const useNotifications = _useNotifications as any;
const useLanguage = _useLanguage as any;

import { COLORS } from './src/styles/theme';
import { styles } from './src/styles/appStyles';

import {
  HamburgerIcon,
  HomeIcon,
  PlusIcon,
  ChatIcon,
  BellIcon,
  StarIcon,
  ProfileIcon,
  DocIcon,
  LogoutIcon,
  ShieldIcon,
  EyeIcon,
  BanIcon,
  BarChartIcon,
  FlagIcon,
} from './src/components/common/Icons';

import { AuthScreen } from './src/pages/auth/AuthScreen';
import { ProfileSetupScreen } from './src/pages/auth/ProfileSetupScreen';
import { HomeFeedScreen } from './src/pages/user/HomeFeedScreen';
import { ExploreScreen } from './src/pages/user/ExploreScreen';
import { CreatePostScreen } from './src/pages/user/CreatePostScreen';
import { ChatScreen } from './src/pages/user/ChatScreen';
import { NotificationsScreen } from './src/pages/user/NotificationsScreen';
import { SavedPostsScreen } from './src/pages/user/SavedPostsScreen';
import { ProfileScreen } from './src/pages/user/ProfileScreen';
import { AdminDashboardScreen } from './src/pages/admin/AdminDashboardScreen';
import { AdminReportsScreen } from './src/pages/admin/AdminReportsScreen';
import { AdminContentReviewScreen } from './src/pages/admin/AdminContentReviewScreen';
import { AdminBlockedContentScreen } from './src/pages/admin/AdminBlockedContentScreen';
import { AdminUsersScreen } from './src/pages/admin/AdminUsersScreen';
import { AdminAnalyticsScreen } from './src/pages/admin/AdminAnalyticsScreen';

// ── MAIN CORE ENTRY ──
function MainDashboard() {
  const { startNewConversation } = useChat();
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();

  const isAdmin = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'Admin' : 'Feed');
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('Dashboard');

  const [adminBadgeCount, setAdminBadgeCount] = useState(4);
  const [adminAlertsModalVisible, setAdminAlertsModalVisible] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([
    { id: '1', type: 'AI Blocked POST', description: 'User @user_11: Abusive keyword or threat detected: fuck', time: '11:16 AM' },
    { id: '2', type: 'AI Blocked MESSAGE', description: 'User @kindreflect: AI Content Moderation flagged: harassment', time: '07:26 AM' },
    { id: '3', type: 'AI Blocked MESSAGE', description: 'User @kindreflect: AI Content Moderation flagged: harassment', time: '07:24 AM' },
    { id: '4', type: 'AI Blocked POST', description: 'User @anonymous: Abusive keyword or threat detected: asshole', time: '06:12 AM' },
  ]);

  useEffect(() => {
    setActiveTab(isAdmin ? 'Admin' : 'Feed');
  }, [currentUser, isAdmin]);

  const handleStartConvo = async (username: any, authorId: any, initials: any, color: any) => {
    const convoId = await startNewConversation(username, authorId, initials, color);
    setChatTarget(convoId);
    setActiveTab('Chat');
  };

  return (
    <View style={styles.container}>
      {/* Slide-in Right Sidebar Drawer */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sidebarVisible}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Backdrop Touch Target on Left */}
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />

          <View
            style={{
              width: 275,
              backgroundColor: '#FFFFFF',
              paddingTop: Platform.OS === 'ios' ? 60 : 35,
              paddingHorizontal: 16,
              shadowColor: '#2D1D15',
              shadowOffset: { width: -8, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 24,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top Fixed Header */}
            <View style={{ marginBottom: 18, paddingHorizontal: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={require('./src/assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 10, marginRight: 10 }} />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#6F405F', letterSpacing: -0.3 }}>
                      AwaajManki
                    </Text>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeTab === 'Admin' ? COLORS.error : '#6F405F', marginLeft: 6 }} />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#8C8385', marginTop: 2 }}>
                    {activeTab === 'Admin' ? 'Console Administration' : 'Secure Member Space'}
                  </Text>
                </View>
              </View>

              {/* User Profile Context Capsule */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#FAF6F8', borderRadius: 12, borderWidth: 1, borderColor: '#F1ECEF' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#6F405F', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>
                    {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'AD'}
                  </Text>
                </View>
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6F405F' }} numberOfLines={1}>
                    {currentUser?.username || 'Admin User'}
                  </Text>
                  <Text style={{ fontSize: 8.5, color: '#8C8385', fontWeight: '600' }}>
                    {currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ADMIN' ? 'System Administrator' : 'Verified Member'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Subtle Separator Line */}
            <View style={{ height: 1, backgroundColor: '#F1ECEF', marginBottom: 16, marginHorizontal: 6 }} />

            {/* Middle Scrolling Content */}
            <ScrollView style={{ flex: 1, marginBottom: 8 }} showsVerticalScrollIndicator={false}>
              {activeTab === 'Admin' ? (
                // ── ADMIN CONSOLE SIDEBAR VIEW ──
                <>
                  {/* Section Card: ADMINISTRATION & OPERATIONS */}
                  <View style={{
                    backgroundColor: '#FAF6F8',
                    borderRadius: 16,
                    padding: 8,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: '#F1ECEF'
                  }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#8C8385', letterSpacing: 0.8, marginTop: 4, marginBottom: 10, paddingLeft: 8, textTransform: 'uppercase' }}>
                      Administration & Ops
                    </Text>
                    
                    {/* Dashboard */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'Dashboard' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('Dashboard'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'Dashboard' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <DocIcon color={activeAdminTab === 'Dashboard' ? COLORS.error : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'Dashboard' ? 'bold' : '600', color: activeAdminTab === 'Dashboard' ? COLORS.error : '#5C5254' }}>
                        Dashboard
                      </Text>
                    </TouchableOpacity>

                    {/* Reports Queue */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'Reports' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('Reports'); setSidebarVisible(false); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {activeAdminTab === 'Reports' && (
                          <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                        )}
                        <FlagIcon color={activeAdminTab === 'Reports' ? COLORS.error : '#5C5254'} size={18} />
                        <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'Reports' ? 'bold' : '600', color: activeAdminTab === 'Reports' ? COLORS.error : '#5C5254' }}>
                          Reports Queue
                        </Text>
                      </View>
                      {adminBadgeCount > 0 && (
                        <View style={{ backgroundColor: COLORS.error || '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1.5, minWidth: 18, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#FFFFFF' }}>{adminBadgeCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Content Review */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'ContentReview' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('ContentReview'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'ContentReview' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <EyeIcon color={activeAdminTab === 'ContentReview' ? COLORS.error : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'ContentReview' ? 'bold' : '600', color: activeAdminTab === 'ContentReview' ? COLORS.error : '#5C5254' }}>
                        Content Review
                      </Text>
                    </TouchableOpacity>

                    {/* Blocked Footprints */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'BlockedFootprints' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('BlockedFootprints'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'BlockedFootprints' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <BanIcon color={activeAdminTab === 'BlockedFootprints' ? COLORS.error : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'BlockedFootprints' ? 'bold' : '600', color: activeAdminTab === 'BlockedFootprints' ? COLORS.error : '#5C5254' }}>
                        Blocked Footprints
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Section Card: PLATFORM */}
                  <View style={{
                    backgroundColor: '#FAF6F8',
                    borderRadius: 16,
                    padding: 8,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: '#F1ECEF'
                  }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#8C8385', letterSpacing: 0.8, marginTop: 4, marginBottom: 8, paddingLeft: 8, textTransform: 'uppercase' }}>
                      Platform
                    </Text>

                    {/* Users */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'Users' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('Users'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'Users' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <ProfileIcon color={activeAdminTab === 'Users' ? COLORS.error : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'Users' ? 'bold' : '600', color: activeAdminTab === 'Users' ? COLORS.error : '#5C5254' }}>
                        Users
                      </Text>
                    </TouchableOpacity>

                    {/* Analytics */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'Analytics' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('Analytics'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'Analytics' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <BarChartIcon color={activeAdminTab === 'Analytics' ? COLORS.error : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'Analytics' ? 'bold' : '600', color: activeAdminTab === 'Analytics' ? COLORS.error : '#5C5254' }}>
                        Analytics
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // ── USER SPACE SIDEBAR VIEW ──
                <>
                  {/* Section Card: PERSONAL SPACE */}
                  <View style={{
                    backgroundColor: '#FAF6F8',
                    borderRadius: 16,
                    padding: 8,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: '#F1ECEF'
                  }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#8C8385', letterSpacing: 0.8, marginTop: 4, marginBottom: 12, paddingLeft: 8, textTransform: 'uppercase' }}>
                      {t('personalSpace', 'Personal Space')}
                    </Text>

                    {/* Feed Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Feed' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveTab('Feed'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Feed' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <HomeIcon color={activeTab === 'Feed' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Feed' ? 'bold' : '600', color: activeTab === 'Feed' ? '#6F405F' : '#5C5254' }}>
                        {t('home', 'Feed')}
                      </Text>
                    </TouchableOpacity>

                    {/* Explore Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Explore' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveTab('Explore'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Explore' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <Text style={{ fontSize: 18, width: 18, textAlign: 'center', color: activeTab === 'Explore' ? '#6F405F' : '#5C5254' }}>🧭</Text>
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Explore' ? 'bold' : '600', color: activeTab === 'Explore' ? '#6F405F' : '#5C5254' }}>
                        {t('explore', 'Explore')}
                      </Text>
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Create' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveTab('Create'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Create' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: activeTab === 'Create' ? '#6F405F' : '#8C8385', justifyContent: 'center', alignItems: 'center' }}>
                        <PlusIcon color="#FFFFFF" size={10} />
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Create' ? 'bold' : '600', color: activeTab === 'Create' ? '#6F405F' : '#5C5254' }}>
                        {t('share', 'Share')}
                      </Text>
                    </TouchableOpacity>

                    {/* Chat / DMs Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Chat' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveTab('Chat'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Chat' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <ChatIcon color={activeTab === 'Chat' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Chat' ? 'bold' : '600', color: activeTab === 'Chat' ? '#6F405F' : '#5C5254' }}>
                        {t('dms', 'DMs')}
                      </Text>
                    </TouchableOpacity>

                    {/* Notifications Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Notifications' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveTab('Notifications'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Notifications' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <BellIcon color={activeTab === 'Notifications' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Notifications' ? 'bold' : '600', color: activeTab === 'Notifications' ? '#6F405F' : '#5C5254' }}>
                        {t('notif', 'Notifications')}
                      </Text>
                    </TouchableOpacity>

                    {/* Saved Posts Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Saved' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveTab('Saved'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Saved' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <StarIcon color={activeTab === 'Saved' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Saved' ? 'bold' : '600', color: activeTab === 'Saved' ? '#6F405F' : '#5C5254' }}>
                        {t('savedPosts', 'Saved Thoughts')}
                      </Text>
                    </TouchableOpacity>

                    {/* Profile Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Profile' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveTab('Profile'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Profile' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <ProfileIcon color={activeTab === 'Profile' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Profile' ? 'bold' : '600', color: activeTab === 'Profile' ? '#6F405F' : '#5C5254' }}>
                        {t('me', 'Me')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Bottom Fixed Logout Row */}
            <View style={{ borderTopWidth: 1, borderTopColor: '#F1ECEF', paddingVertical: 16 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(196, 111, 118, 0.05)' }}
                onPress={() => { logout(); setSidebarVisible(false); }}
              >
                <LogoutIcon size={18} color="#C46F76" />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#C46F76' }}>
                  {t('logout', 'Log Out')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Brand Header */}
      <SafeAreaView style={{ backgroundColor: '#FFFFFF' }}>
        <View style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E1DCDB',
          backgroundColor: '#FFFFFF',
        }}>
          <View style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}>
            {activeTab === 'Admin' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('./src/assets/logo.png')} style={{ width: 26, height: 26, borderRadius: 6, marginRight: 8 }} />
                  <Text style={styles.headerText}>AwaajManki</Text>
                  <Text style={[styles.headerDot, { color: COLORS.error }]}>•</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Notification Bell */}
                  <TouchableOpacity
                    onPress={() => setAdminAlertsModalVisible(true)}
                    style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center', position: 'relative' }}
                  >
                    <BellIcon color="#2D1D15" size={20} />
                    {adminBadgeCount > 0 && (
                      <View style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
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

                  {/* Avatar Bubble */}
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#2D1D15',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                      {String(currentUser?.username || 'S').replace('@', '').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>

                  {/* Menu Hamburger */}
                  <TouchableOpacity onPress={() => setSidebarVisible(true)} style={{ paddingVertical: 10 }}>
                    <HamburgerIcon />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Left Side: Sidebar Hamburger Menu Button */}
                <TouchableOpacity
                  onPress={() => setSidebarVisible(true)}
                  style={{
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                  }}
                >
                  <HamburgerIcon />
                </TouchableOpacity>

                {/* Center Title and Logo */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Image source={require('./src/assets/logo.png')} style={{ width: 26, height: 26, borderRadius: 6, marginRight: 8 }} />
                  <Text style={styles.headerText}>AwaajManki</Text>
                  <Text style={styles.headerDot}>•</Text>
                </View>

                {/* Right Side: Avatar Bubble linking to Profile */}
                <View style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                }}>
                  {currentUser ? (
                    <TouchableOpacity
                      onPress={() => setActiveTab('Profile')}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: COLORS.deepPlum,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                        {String(currentUser?.username || 'U').replace('@', '').slice(0, 1).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 32 }} />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Admin Alerts Dropdown Modal */}
      {adminAlertsModalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={adminAlertsModalVisible}
          onRequestClose={() => setAdminAlertsModalVisible(false)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.4)' }]}>
            <View style={{ width: '90%', backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, elevation: 12 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15' }}>
                  Moderation Alerts ({adminBadgeCount})
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setAdminBadgeCount(0);
                    setAdminNotifications([]);
                  }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FAF7F6' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#6F405F' }}>Clear Badges</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable notifications list */}
              <ScrollView style={{ maxHeight: 300, marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
                {adminNotifications.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#8C8385', fontWeight: '600' }}>No pending alerts.</Text>
                  </View>
                ) : (
                  adminNotifications.map((notif) => (
                    <TouchableOpacity
                      key={notif.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setAdminAlertsModalVisible(false);
                        setActiveAdminTab('BlockedFootprints');
                      }}
                      style={{
                        padding: 14,
                        backgroundColor: '#FEF2F2',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: '#FCA5A5',
                        flexDirection: 'row',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                        <FlagIcon color="#EF4444" size={13} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#EF4444', marginBottom: 3 }}>
                          {notif.type}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#4A3E3D', lineHeight: 17, fontWeight: '600' }}>
                          {notif.description}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#8C8385', marginTop: 6, fontWeight: '800' }}>
                          {notif.time}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* Close Action */}
              <TouchableOpacity
                onPress={() => setAdminAlertsModalVisible(false)}
                style={{ width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#FAF7F6', borderWidth: 1, borderColor: '#E1DCDB', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2D1D15' }}>Close Panel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Content router */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Feed' && <HomeFeedScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Explore' && <ExploreScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Create' && <CreatePostScreen onPostCreated={() => setActiveTab('Feed')} />}
        {activeTab === 'Chat' && (
          <ChatScreen
            activeConversation={chatTarget}
            onConversationSelect={(id: any) => setChatTarget(id)}
            onBackToConversations={() => setChatTarget(null)}
          />
        )}
        {activeTab === 'Notifications' && <NotificationsScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Saved' && <SavedPostsScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Profile' && <ProfileScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Admin' && (
          activeAdminTab === 'Reports' ? (
            <AdminReportsScreen />
          ) : activeAdminTab === 'ContentReview' ? (
            <AdminContentReviewScreen />
          ) : activeAdminTab === 'BlockedFootprints' ? (
            <AdminBlockedContentScreen />
          ) : activeAdminTab === 'Users' ? (
            <AdminUsersScreen />
          ) : activeAdminTab === 'Analytics' ? (
            <AdminAnalyticsScreen />
          ) : (
            <AdminDashboardScreen
              activeAdminTab={activeAdminTab}
              setActiveAdminTab={setActiveAdminTab}
              adminBadgeCount={adminBadgeCount}
              setAdminAlertsModalVisible={setAdminAlertsModalVisible}
              currentUser={currentUser}
            />
          )
        )}
      </View>

      {/* Custom Tab Navigator */}
      {!(activeTab === 'Chat' && chatTarget !== null) && (
        activeTab === 'Admin' ? (
          // ── ADMIN WORKSPACE BOTTOM TABS ──
          <View style={{
            height: 66,
            flexDirection: 'row',
            backgroundColor: '#6F405F',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Platform.OS === 'ios' ? 14 : 6,
            paddingTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            elevation: 24,
            shadowColor: '#000000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -4 },
          }}>
            {/* Dashboard */}
            <TouchableOpacity style={styles.tabButton} onPress={() => setActiveAdminTab('Dashboard')}>
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <DocIcon color={activeAdminTab === 'Dashboard' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { marginTop: 4, color: activeAdminTab === 'Dashboard' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeAdminTab === 'Dashboard' ? 'bold' : '600' }]}>Metrics</Text>
              {activeAdminTab === 'Dashboard' && (
                <View style={{ position: 'absolute', bottom: -2, width: 10, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* Reports Queue */}
            <TouchableOpacity style={styles.tabButton} onPress={() => setActiveAdminTab('Reports')}>
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <FlagIcon color={activeAdminTab === 'Reports' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { marginTop: 4, color: activeAdminTab === 'Reports' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeAdminTab === 'Reports' ? 'bold' : '600' }]}>Reports</Text>
              {activeAdminTab === 'Reports' && (
                <View style={{ position: 'absolute', bottom: -2, width: 10, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* Content Review */}
            <TouchableOpacity style={styles.tabButton} onPress={() => setActiveAdminTab('ContentReview')}>
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <EyeIcon color={activeAdminTab === 'ContentReview' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { marginTop: 4, color: activeAdminTab === 'ContentReview' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeAdminTab === 'ContentReview' ? 'bold' : '600' }]}>Review</Text>
              {activeAdminTab === 'ContentReview' && (
                <View style={{ position: 'absolute', bottom: -2, width: 10, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* Users */}
            <TouchableOpacity style={styles.tabButton} onPress={() => setActiveAdminTab('Users')}>
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <ProfileIcon color={activeAdminTab === 'Users' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { marginTop: 4, color: activeAdminTab === 'Users' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeAdminTab === 'Users' ? 'bold' : '600' }]}>Users</Text>
              {activeAdminTab === 'Users' && (
                <View style={{ position: 'absolute', bottom: -2, width: 10, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* More / Menu */}
            <TouchableOpacity style={styles.tabButton} onPress={() => setSidebarVisible(true)}>
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <HamburgerIcon color="rgba(255, 255, 255, 0.65)" />
              </View>
              <Text style={[styles.tabButtonText, { marginTop: 4, color: 'rgba(255, 255, 255, 0.65)', fontWeight: '600' }]}>Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── USER SPACE BOTTOM TABS ──
          <View style={{
            height: 66,
            flexDirection: 'row',
            backgroundColor: '#6F405F',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Platform.OS === 'ios' ? 14 : 6,
            paddingTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            elevation: 24,
            shadowColor: '#000000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -4 },
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Feed'); setChatTarget(null); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <HomeIcon color={activeTab === 'Feed' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Feed' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Feed' ? 'bold' : '600' }]}>{t('home', 'Feed')}</Text>
              {activeTab === 'Feed' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Create'); setChatTarget(null); }}
            >
              <View style={{
                position: 'absolute',
                top: -12,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 5,
                elevation: 5,
                zIndex: 10,
              }}>
                <PlusIcon color="#6F405F" size={18} />
              </View>
              <View style={{ height: 22, marginBottom: 2 }} />
              <Text style={[styles.tabButtonText, { color: activeTab === 'Create' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Create' ? 'bold' : '600' }]}>{t('share', 'Share')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Chat'); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <ChatIcon color={activeTab === 'Chat' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Chat' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Chat' ? 'bold' : '600' }]}>{t('dms', 'DMs')}</Text>
              {activeTab === 'Chat' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Notifications'); setChatTarget(null); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <View style={{ position: 'relative' }}>
                  <BellIcon color={activeTab === 'Notifications' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: COLORS.error || '#C46F76',
                    }} />
                  )}
                </View>
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Notifications' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Notifications' ? 'bold' : '600' }]}>
                {t('notif', 'Notif')}
              </Text>
              {activeTab === 'Notifications' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => setMoreMenuVisible(true)}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <View style={{ width: 18, height: 11, justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ width: 18, height: 2, backgroundColor: (activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', borderRadius: 1 }} />
                  <View style={{ width: 13, height: 2, backgroundColor: (activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', borderRadius: 1 }} />
                  <View style={{ width: 18, height: 2, backgroundColor: (activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', borderRadius: 1 }} />
                </View>
              </View>
              <Text style={[styles.tabButtonText, { color: (activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: (activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') ? 'bold' : '600' }]}>
                {t('more', 'More')}
              </Text>
              {(activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Premium Hamburger bottom sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={moreMenuVisible}
        onRequestClose={() => setMoreMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(45, 29, 21, 0.4)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setMoreMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: '#FCFAF9',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: 34,
              paddingHorizontal: 20,
              shadowColor: '#2D1D15',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            {/* Top Indicator Pill */}
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#E1DCDB',
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            {/* Menu Rows */}
            {/* Explore Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F2EDED',
              }}
              onPress={() => {
                setActiveTab('Explore');
                setChatTarget(null);
                setMoreMenuVisible(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 18, color: '#6F405F' }}>🧭</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.deepPlum }}>
                  {t('explore', 'Explore')}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#C8BDBA' }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F2EDED',
              }}
              onPress={() => {
                setActiveTab('Saved');
                setChatTarget(null);
                setMoreMenuVisible(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <StarIcon color="#6F405F" size={18} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.deepPlum }}>
                  {t('savedPosts', 'Saved Posts')}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#C8BDBA' }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F2EDED',
              }}
              onPress={() => {
                setActiveTab('Profile');
                setChatTarget(null);
                setMoreMenuVisible(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ProfileIcon color="#6F405F" size={18} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.deepPlum }}>
                  {t('me', 'Me')}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#C8BDBA' }}>›</Text>
            </TouchableOpacity>

            {(currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ADMIN') && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F2EDED',
                }}
                onPress={() => {
                  setActiveTab('Admin');
                  setChatTarget(null);
                  setMoreMenuVisible(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ShieldIcon color={COLORS.error} size={18} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.error }}>
                    Admin Panel
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: '#C8BDBA' }}>›</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#F2EDED',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
              onPress={() => setMoreMenuVisible(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: COLORS.deepPlum }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── ROOT EXPORT WRAPPER ──
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <PostProvider>
            <ChatProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#F8F5F4" />
              <AuthWrapper />
            </ChatProvider>
          </PostProvider>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

function AuthWrapper() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F5F4', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.deepPlum} />
      </SafeAreaView>
    );
  }

  if (currentUser) {
    if (currentUser.hasProfile === false) {
      return <ProfileSetupScreen />;
    }
    return <MainDashboard />;
  }

  return <AuthScreen />;
}
