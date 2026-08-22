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
  Alert,
} from 'react-native';

import { AuthProvider, useAuth as _useAuth } from './src/context/AuthContext';
import { PostProvider } from './src/context/PostContext';
import { ChatProvider, useChat as _useChat } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LanguageProvider, useLanguage as _useLanguage } from './src/context/LanguageContext';

const useAuth = _useAuth as any;
const useChat = _useChat as any;
const useLanguage = _useLanguage as any;

import { COLORS } from './src/styles/theme';
import { styles } from './src/styles/appStyles';
import { apiService } from './src/services/apiService';
import { localStorage } from './src/services/localStorage';

const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Happy', color: '#EAB308' },
  { emoji: '😌', label: 'Peaceful', color: '#10B981' },
  { emoji: '😔', label: 'Sad', color: '#3B82F6' },
  { emoji: '🔥', label: 'Energetic', color: '#EF4444' },
  { emoji: '💙', label: 'Calm', color: '#06B6D4' },
  { emoji: '🧘', label: 'Meditative', color: '#8B5CF6' },
  { emoji: '😤', label: 'Frustrated', color: '#F97316' },
  { emoji: '🤔', label: 'Thoughtful', color: '#64748B' },
];

import {
  HamburgerIcon,
  HomeIcon,
  BellIcon,
  StarIcon,
  ProfileIcon,
  DocIcon,
  LogoutIcon,
  EyeIcon,
  BanIcon,
  BarChartIcon,
  FlagIcon,
  ExploreIcon,
  HelpIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
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
import { HelpScreen } from './src/pages/user/HelpScreen';
import { MoodMusicProvider } from './src/context/MoodMusicContext';
import { MoodMusicWidget } from './src/components/music/MoodMusicWidget';
import { MyTopicsScreen } from './src/pages/user/MyTopicsScreen';
import { MyReportsScreen } from './src/pages/user/MyReportsScreen';
import { SettingsScreen } from './src/pages/user/SettingsScreen';
import { AdminDashboardScreen } from './src/pages/admin/AdminDashboardScreen';
import { AdminReportsScreen } from './src/pages/admin/AdminReportsScreen';
import { AdminContentReviewScreen } from './src/pages/admin/AdminContentReviewScreen';
import { AdminBlockedContentScreen } from './src/pages/admin/AdminBlockedContentScreen';
import { AdminUsersScreen } from './src/pages/admin/AdminUsersScreen';
import { AdminAnalyticsScreen } from './src/pages/admin/AdminAnalyticsScreen';
import { AdminEnquiriesScreen } from './src/pages/admin/AdminEnquiriesScreen';
import { MusicScreen } from './src/pages/user/MusicScreen';
import { AdminMusicScreen } from './src/pages/admin/AdminMusicScreen';

// ── MAIN CORE ENTRY ──
function MainDashboard() {
  const { startNewConversation } = useChat();
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();

  const isAdmin = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'Admin' : 'Feed');
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [preselectedTopic, setPreselectedTopic] = useState<string | null>(null);
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

  // ── MOOD STATES ──
  const [activeMood, setActiveMood] = useState<any>(null); // { label, emoji }
  const [viewMode, setViewMode] = useState<'SELECT' | 'STATS'>('SELECT');
  const [moodVotes, setMoodVotes] = useState<any>({});
  const [totalMoodVotes, setTotalMoodVotes] = useState(0);
  const [moodModalVisible, setMoodModalVisible] = useState(false);

  const checkActiveMood = () => {
    try {
      const storedTime = localStorage.getItem('mka_user_mood_time');
      const storedMood = localStorage.getItem('mka_user_mood');
      const storedEmoji = localStorage.getItem('mka_user_mood_emoji');

      if (!storedTime || !storedMood || !storedEmoji) {
        setActiveMood(null);
        return null;
      }

      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - parseInt(storedTime, 10);
      if (elapsed < TWENTY_FOUR_HOURS_MS) {
        const moodObj = { label: storedMood, emoji: storedEmoji };
        setActiveMood(moodObj);
        return moodObj;
      } else {
        localStorage.removeItem('mka_user_mood');
        localStorage.removeItem('mka_user_mood_emoji');
        localStorage.removeItem('mka_user_mood_time');
        setActiveMood(null);
        return null;
      }
    } catch {
      setActiveMood(null);
      return null;
    }
  };

  const fetchMoodStats = async () => {
    try {
      const res = await apiService.getMoodOfIndia();
      if (res?.data) {
        setMoodVotes(res.data.moodCounts || {});
        setTotalMoodVotes(res.data.totalVotes || 0);

        const localActive = checkActiveMood();
        if (!localActive && res.data.userMood) {
          const matched = MOOD_OPTIONS.find(
            (m) => m.label.toUpperCase() === res.data.userMood.toUpperCase()
          );
          if (matched) {
            const moodObj = { label: matched.label, emoji: matched.emoji };
            setActiveMood(moodObj);
            localStorage.setItem('mka_user_mood', matched.label);
            localStorage.setItem('mka_user_mood_emoji', matched.emoji);
            localStorage.setItem('mka_user_mood_time', Date.now().toString());
          }
        }
      }
    } catch (e) {
      console.warn('[App] Failed to fetch mood stats:', e);
    }
  };

  useEffect(() => {
    checkActiveMood();
    fetchMoodStats();
  }, []);

  const handleToggleMoodModal = () => {
    const currentActive = checkActiveMood();
    if (!moodModalVisible) {
      if (currentActive) {
        setViewMode('STATS');
      } else {
        setViewMode('SELECT');
      }
      fetchMoodStats();
    }
    setMoodModalVisible(prev => !prev);
  };

  const handleSelectMood = async (option: any) => {
    try {
      const newMoodObj = { label: option.label, emoji: option.emoji };
      setActiveMood(newMoodObj);
      localStorage.setItem('mka_user_mood', option.label);
      localStorage.setItem('mka_user_mood_emoji', option.emoji);
      localStorage.setItem('mka_user_mood_time', Date.now().toString());

      setViewMode('STATS');

      const res = await apiService.voteMood(option.label);
      if (res?.data?.moodCounts) {
        setMoodVotes(res.data.moodCounts);
        setTotalMoodVotes(res.data.totalVotes || 0);
      }
    } catch (err) {
      console.warn('[App] Failed to update mood:', err);
    }
  };

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

              {/* User Profile Context Capsule with Three-Dot Edit Trigger */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Alert.alert(
                    t('profileOptions', 'Profile Options'),
                    `${t('loggedInAs', 'Logged in as')} ${currentUser?.username || '@anonymous'}`,
                    [
                      {
                        text: t('viewProfile', 'View Profile'),
                        onPress: () => {
                          setActiveTab('Profile');
                          setSidebarVisible(false);
                        }
                      },
                      {
                        text: t('logout', 'Log Out'),
                        style: 'destructive',
                        onPress: () => {
                          logout();
                          setSidebarVisible(false);
                        }
                      },
                      {
                        text: t('cancel', 'Cancel'),
                        style: 'cancel'
                      }
                    ],
                    { cancelable: true }
                  );
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 16,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  backgroundColor: '#FAF6F8',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#F1ECEF',
                }}
              >
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
                {/* Three Dot Icon */}
                <Text style={{ fontSize: 16, color: '#8C8385', fontWeight: 'bold', paddingHorizontal: 4, transform: [{ translateY: -1 }] }}>⋮</Text>
              </TouchableOpacity>
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

                    {/* User Enquiries */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'Enquiries' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('Enquiries'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'Enquiries' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <Text style={{ fontSize: 18, width: 18, textAlign: 'center', color: activeAdminTab === 'Enquiries' ? COLORS.error : '#5C5254' }}>📥</Text>
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'Enquiries' ? 'bold' : '600', color: activeAdminTab === 'Enquiries' ? COLORS.error : '#5C5254' }}>
                        User Enquiries
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

                    {/* Music Management */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeAdminTab === 'Music' ? 'rgba(196, 111, 118, 0.08)' : 'transparent', marginBottom: 6, position: 'relative' }}
                      onPress={() => { setActiveAdminTab('Music'); setSidebarVisible(false); }}
                    >
                      {activeAdminTab === 'Music' && (
                        <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: COLORS.error, borderRadius: 1.5 }} />
                      )}
                      <Text style={{ fontSize: 18, width: 18, textAlign: 'center', color: activeAdminTab === 'Music' ? COLORS.error : '#5C5254' }}>🎵</Text>
                      <Text style={{ fontSize: 13, fontWeight: activeAdminTab === 'Music' ? 'bold' : '600', color: activeAdminTab === 'Music' ? COLORS.error : '#5C5254' }}>
                        Music Management
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
                      <ExploreIcon color={activeTab === 'Explore' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Explore' ? 'bold' : '600', color: activeTab === 'Explore' ? '#6F405F' : '#5C5254' }}>
                        {t('explore', 'Explore')}
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

                    {/* My Topics Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'MyTopics' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveTab('MyTopics'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'MyTopics' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <TagIcon color={activeTab === 'MyTopics' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'MyTopics' ? 'bold' : '600', color: activeTab === 'MyTopics' ? '#6F405F' : '#5C5254' }}>
                        {t('myTopics', 'My Topics')}
                      </Text>
                    </TouchableOpacity>

                    {/* My Reports Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'MyReports' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveTab('MyReports'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'MyReports' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <ShieldIcon color={activeTab === 'MyReports' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'MyReports' ? 'bold' : '600', color: activeTab === 'MyReports' ? '#6F405F' : '#5C5254' }}>
                        {t('myContentReports', 'My Safety Reports')}
                      </Text>
                    </TouchableOpacity>

                    {/* Settings Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Settings' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveTab('Settings'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Settings' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <SettingsIcon color={activeTab === 'Settings' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Settings' ? 'bold' : '600', color: activeTab === 'Settings' ? '#6F405F' : '#5C5254' }}>
                        {t('settingsAndPreferences', 'Settings')}
                      </Text>
                    </TouchableOpacity>

                    {/* Help & Support Button */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: activeTab === 'Help' ? 'rgba(111, 64, 95, 0.08)' : 'transparent', marginBottom: 4, position: 'relative' }}
                      onPress={() => { setActiveTab('Help'); setSidebarVisible(false); }}
                    >
                      {activeTab === 'Help' && (
                        <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: '#6F405F', borderRadius: 1.5 }} />
                      )}
                      <HelpIcon color={activeTab === 'Help' ? '#6F405F' : '#5C5254'} size={18} />
                      <Text style={{ fontSize: 14, fontWeight: activeTab === 'Help' ? 'bold' : '600', color: activeTab === 'Help' ? '#6F405F' : '#5C5254' }}>
                        {t('helpCenter', 'Help & Support')}
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
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1.5,
          borderBottomColor: '#F2EBEE',
          shadowColor: '#6F405F',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
          }}>
            {activeTab === 'Admin' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('./src/assets/logo.png')} style={{ width: 24, height: 24, borderRadius: 6, marginRight: 8 }} />
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
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#FAF5F7',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#EFE5EB',
                  }}
                >
                  <HamburgerIcon color="#6F405F" />
                </TouchableOpacity>

                {/* Center Title and Logo */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}>
                  <Image
                    source={require('./src/assets/logo.png')}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      borderWidth: 1.5,
                      borderColor: '#6F405F',
                      marginRight: 8,
                    }}
                  />
                  <Text style={{
                    fontSize: 17,
                    fontWeight: '900',
                    color: '#6F405F',
                    letterSpacing: -0.4,
                  }}>
                    Awaaj Man Ki
                  </Text>
                  <Text style={{ fontSize: 18, color: '#D96C3D', marginLeft: 2, fontWeight: '900', transform: [{ translateY: -1 }] }}>•</Text>
                </View>

                {/* Right Side: Mood Trigger button */}
                <TouchableOpacity
                  onPress={handleToggleMoodModal}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: activeMood ? 'rgba(111, 64, 95, 0.12)' : '#FAF5F7',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: activeMood ? 'rgba(111, 64, 95, 0.25)' : '#EFE5EB',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>
                    {activeMood ? activeMood.emoji : '🧘'}
                  </Text>
                </TouchableOpacity>
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

      {/* Community Mood Stats Modal */}
      {moodModalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={moodModalVisible}
          onRequestClose={() => setMoodModalVisible(false)}
        >
          <SafeAreaView style={[styles.centerModalOverlay, { backgroundColor: 'rgba(45, 29, 21, 0.4)' }]}>
            <View style={{
              width: '90%',
              maxHeight: '75%',
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#EDE8E6',
              padding: 18,
              elevation: 24,
              shadowColor: '#2D1D15',
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: '#F3EFEF',
                paddingBottom: 10,
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{viewMode === 'SELECT' ? '✨' : '📊'}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#2D1D15' }}>
                    {viewMode === 'SELECT' ? 'How is your Mood today?' : 'Community Mood Stats'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMoodModalVisible(false)}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#8C8385' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* MODE 1: EMOJI SELECTION */}
              {viewMode === 'SELECT' ? (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 12, color: '#8C8385', lineHeight: 16 }}>
                    Tap an emoji below to express how you are feeling right now:
                  </Text>

                  {/* Emoji Grid */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}>
                    {MOOD_OPTIONS.map((m) => {
                      const isSelected = activeMood?.label?.toUpperCase() === m.label.toUpperCase();
                      return (
                        <TouchableOpacity
                          key={m.label}
                          onPress={() => handleSelectMood(m)}
                          style={{
                            width: '48%',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 14,
                            backgroundColor: isSelected ? '#6F405F' : '#FAF8F7',
                            borderWidth: 1,
                            borderColor: isSelected ? '#6F405F' : '#EDE8E6',
                          }}
                        >
                          <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                          <Text style={{
                            fontSize: 12.5,
                            fontWeight: '700',
                            color: isSelected ? '#FFFFFF' : '#2D1D15',
                            flex: 1,
                          }}>
                            {m.label}
                          </Text>
                          {isSelected && (
                            <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' }}>✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {activeMood && (
                    <TouchableOpacity
                      onPress={() => setViewMode('STATS')}
                      style={{
                        alignSelf: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 8,
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6F405F' }}>
                        📊 View Community Mood Stats →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                /* MODE 2: MOOD STATS GRAPH */
                <View style={{ gap: 12 }}>
                  {activeMood && (
                    <TouchableOpacity
                      onPress={() => setViewMode('SELECT')}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 14,
                        backgroundColor: '#FAF5F7',
                        borderWidth: 1.5,
                        borderColor: 'rgba(111, 64, 95, 0.2)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: '800' }}>
                        Your Mood today:
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 18 }}>{activeMood.emoji}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#2D1D15' }}>
                          {activeMood.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: '800' }}>✏️</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#8C8385', fontWeight: '700' }}>
                      Nationwide Sentiment
                    </Text>
                    <Text style={{ fontSize: 11, color: '#8C8385', fontWeight: '700' }}>
                      {totalMoodVotes} Total Votes
                    </Text>
                  </View>

                  {/* Mood Graph Bar Chart Breakdown */}
                  <ScrollView
                    style={{ maxHeight: 250 }}
                    contentContainerStyle={{ gap: 8 }}
                    showsVerticalScrollIndicator={true}
                  >
                    {(() => {
                      const moodStatsList = MOOD_OPTIONS.map((m) => {
                        const cnt = moodVotes[m.label.toUpperCase()] || moodVotes[m.label] || 0;
                        const pct = totalMoodVotes > 0 ? Math.round((cnt / totalMoodVotes) * 100) : 0;
                        return { ...m, count: cnt, percentage: pct };
                      }).sort((a, b) => b.count - a.count);

                      return moodStatsList.map((m) => {
                        const isUserActive = activeMood?.label?.toUpperCase() === m.label.toUpperCase();
                        return (
                          <TouchableOpacity
                            key={m.label}
                            onPress={() => handleSelectMood(m)}
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              gap: 4,
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
                                <Text style={{ fontSize: 12.5, fontWeight: isUserActive ? '900' : '700', color: '#2D1D15' }}>
                                  {m.label}
                                </Text>
                                {isUserActive && (
                                  <Text style={{ fontSize: 10.5, color: '#6F405F', fontWeight: '900' }}>✓</Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 11.5, fontWeight: '700', color: isUserActive ? '#6F405F' : '#8C8385' }}>
                                {m.percentage}% ({m.count})
                              </Text>
                            </View>

                            {/* Bar fill track */}
                            <View style={{
                              height: 7,
                              width: '100%',
                              borderRadius: 4,
                              backgroundColor: '#F3EFEF',
                              overflow: 'hidden',
                            }}>
                              <View style={{
                                height: '100%',
                                width: `${m.percentage}%`,
                                backgroundColor: isUserActive ? '#6F405F' : m.color,
                                borderRadius: 4,
                              }} />
                            </View>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </ScrollView>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Content router */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Feed' && (
          <HomeFeedScreen
            onNavigateToChat={handleStartConvo}
            initialTopic={preselectedTopic || undefined}
            onClearInitialTopic={() => setPreselectedTopic(null)}
          />
        )}
        {activeTab === 'Explore' && <ExploreScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Create' && <CreatePostScreen onPostCreated={() => setActiveTab('Feed')} />}
        {activeTab === 'Chat' && (
          <ChatScreen
            activeConversation={chatTarget}
            onConversationSelect={(id: any) => setChatTarget(id)}
            onBackToConversations={() => setChatTarget(null)}
          />
        )}
        {activeTab === 'Notifications' && <NotificationsScreen onNavigateToChat={undefined} />}
        {activeTab === 'Saved' && <SavedPostsScreen onNavigateToChat={undefined} />}
        {activeTab === 'Music' && <MusicScreen />}
        {activeTab === 'Profile' && <ProfileScreen onNavigateToChat={undefined} />}
        {activeTab === 'Help' && <HelpScreen />}
        {activeTab === 'MyTopics' && (
          <MyTopicsScreen
            onSelectTopic={(topicName) => {
              setPreselectedTopic(topicName);
              setActiveTab('Feed');
            }}
          />
        )}
        {activeTab === 'MyReports' && <MyReportsScreen />}
        {activeTab === 'Settings' && (
          <SettingsScreen
            onNavigateToReports={() => {
              setActiveTab('MyReports');
            }}
          />
        )}
        {activeTab === 'Admin' && (
          activeAdminTab === 'Reports' ? (
            <AdminReportsScreen />
          ) : activeAdminTab === 'ContentReview' ? (
            <AdminContentReviewScreen />
          ) : activeAdminTab === 'BlockedFootprints' ? (
            <AdminBlockedContentScreen />
          ) : activeAdminTab === 'Enquiries' ? (
            <AdminEnquiriesScreen />
          ) : activeAdminTab === 'Users' ? (
            <AdminUsersScreen />
          ) : activeAdminTab === 'Analytics' ? (
            <AdminAnalyticsScreen />
          ) : activeAdminTab === 'Music' ? (
            <AdminMusicScreen />
          ) : (
            <AdminDashboardScreen
              activeAdminTab={activeAdminTab}
              setActiveAdminTab={setActiveAdminTab}
              adminBadgeCount={adminBadgeCount}
              setAdminAlertsModalVisible={setAdminAlertsModalVisible}
              currentUser={currentUser}
              onExitAdmin={() => setActiveTab('Feed')}
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
            {/* Feed Tab */}
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

            {/* Explore Tab */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Explore'); setChatTarget(null); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <ExploreIcon color={activeTab === 'Explore' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Explore' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Explore' ? 'bold' : '600' }]}>{t('explore', 'Explore')}</Text>
              {activeTab === 'Explore' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* Music Tab */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Music'); setChatTarget(null); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 18, color: activeTab === 'Music' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)' }}>🎵</Text>
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Music' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Music' ? 'bold' : '600' }]}>{t('music', 'Music')}</Text>
              {activeTab === 'Music' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* Saved Tab */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Saved'); setChatTarget(null); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <StarIcon color={activeTab === 'Saved' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Saved' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Saved' ? 'bold' : '600' }]}>{t('savedPosts', 'Saved')}</Text>
              {activeTab === 'Saved' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>

            {/* Profile Tab */}
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 4 : 2,
                position: 'relative',
              }}
              onPress={() => { setActiveTab('Profile'); setChatTarget(null); }}
            >
              <View style={{ height: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <ProfileIcon color={activeTab === 'Profile' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'} size={19} />
              </View>
              <Text style={[styles.tabButtonText, { color: activeTab === 'Profile' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)', fontWeight: activeTab === 'Profile' ? 'bold' : '600' }]}>{t('me', 'Me')}</Text>
              {activeTab === 'Profile' && (
                <View style={{ position: 'absolute', bottom: -6, width: 12, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
              )}
            </TouchableOpacity>
          </View>
        )
      )}
      {activeTab !== 'Admin' && <MoodMusicWidget />}
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
              <MoodMusicProvider>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F5F4" />
                <AuthWrapper />
              </MoodMusicProvider>
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
    const isAdmin = currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ADMIN';
    if (currentUser.hasProfile === false && !isAdmin) {
      return <ProfileSetupScreen />;
    }
    return <MainDashboard />;
  }

  return <AuthScreen />;
}
