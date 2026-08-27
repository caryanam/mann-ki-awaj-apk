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
  PlusIcon,
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
  InboxIcon,
  MusicIcon,
  CloseIcon,
  ChevronRightIcon,
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
  const { startNewConversation, registerMoodCallback, broadcastMoodUpdate } = useChat();
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

  useEffect(() => {
    if (typeof registerMoodCallback === 'function') {
      const unsubscribe = registerMoodCallback(() => {
        console.log('[App] Refreshing mood stats from socket event');
        fetchMoodStats();
      });
      return unsubscribe;
    }
  }, [registerMoodCallback]);

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
      if (typeof broadcastMoodUpdate === 'function') {
        broadcastMoodUpdate();
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
      {/* Native Mobile Left Slide-in Navigation Drawer */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sidebarVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15, 8, 14, 0.65)' }}>
          {/* Sidebar Drawer Panel on LEFT */}
          <View
            style={{
              width: '82%',
              maxWidth: 330,
              backgroundColor: '#FFFFFF',
              borderTopRightRadius: 28,
              borderBottomRightRadius: 28,
              shadowColor: '#000000',
              shadowOffset: { width: 10, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 25,
              elevation: 30,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            {/* ── SEAMLESS TOP HERO HEADER BANNER ── */}
            <View
              style={{
                backgroundColor: '#1E101D',
                paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 0) + 18,
                paddingHorizontal: 20,
                paddingBottom: 22,
                borderBottomRightRadius: 28,
              }}
            >
              {/* Header Top Controls: App Branding & Close Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image source={require('./src/assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)' }} />
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
                      Awaaj Man Ki
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeTab === 'Admin' ? '#F87171' : '#34D399' }} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: activeTab === 'Admin' ? '#FCA5A5' : '#6EE7B7', letterSpacing: 0.5 }}>
                        {activeTab === 'Admin' ? 'ADMIN CONSOLE' : 'ANONYMOUS SPACE'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setSidebarVisible(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.18)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <CloseIcon color="#FFFFFF" size={14} />
                </TouchableOpacity>
              </View>

              {/* User Profile Card Capsule */}
              <TouchableOpacity
                activeOpacity={activeTab === 'Admin' ? 1.0 : 0.8}
                disabled={activeTab === 'Admin'}
                onPress={() => {
                  setActiveTab('Profile');
                  setSidebarVisible(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                {/* Avatar with Ring */}
                <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: '#6F405F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C46F76', position: 'relative' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>
                    {currentUser?.username ? currentUser.username.replace('@', '').substring(0, 2).toUpperCase() : 'AN'}
                  </Text>
                  <View style={{
                    width: 11,
                    height: 11,
                    borderRadius: 5.5,
                    backgroundColor: '#10B981',
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    borderWidth: 2,
                    borderColor: '#1E101D',
                  }} />
                </View>

                {/* User Details */}
                <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF' }} numberOfLines={1}>
                    {currentUser?.username || '@anonymous'}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginTop: 1 }}>
                    {activeTab === 'Admin' ? 'System Administrator' : 'Verified Identity Hidden'}
                  </Text>
                </View>

                {/* Chevron */}
                {activeTab !== 'Admin' && (
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255, 255, 255, 0.12)', justifyContent: 'center', alignItems: 'center' }}>
                    <ChevronRightIcon color="#FFFFFF" size={12} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ── MIDDLE SCROLLING MENU LIST ── */}
            <ScrollView
              style={{ flex: 1, paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === 'Admin' ? (
                // ── ADMIN CONSOLE SIDEBAR VIEW ──
                <>
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.8, marginTop: 4, marginBottom: 8, paddingHorizontal: 20, textTransform: 'uppercase' }}>
                    Administration & Ops
                  </Text>

                  {/* Dashboard */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'Dashboard' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('Dashboard'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'Dashboard' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'Dashboard' ? '#6F405F' : '#FAF4F7', justifyContent: 'center', alignItems: 'center' }}>
                        <DocIcon color={activeAdminTab === 'Dashboard' ? '#FFFFFF' : '#6F405F'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'Dashboard' ? '900' : '600', color: activeAdminTab === 'Dashboard' ? '#6F405F' : '#2D1D15' }}>
                        Dashboard
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'Dashboard' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Reports Queue */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'Reports' ? 'rgba(196, 111, 118, 0.12)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('Reports'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'Reports' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: COLORS.error, borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'Reports' ? COLORS.error : '#FFF0F2', justifyContent: 'center', alignItems: 'center' }}>
                        <FlagIcon color={activeAdminTab === 'Reports' ? '#FFFFFF' : '#C46F76'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'Reports' ? '900' : '600', color: activeAdminTab === 'Reports' ? COLORS.error : '#2D1D15' }}>
                        Reports Queue
                      </Text>
                    </View>
                    {adminBadgeCount > 0 ? (
                      <View style={{ backgroundColor: COLORS.error || '#EF4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}>{adminBadgeCount}</Text>
                      </View>
                    ) : (
                      <ChevronRightIcon color={activeAdminTab === 'Reports' ? COLORS.error : '#D1C7CD'} size={13} />
                    )}
                  </TouchableOpacity>

                  {/* Content Review */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'ContentReview' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('ContentReview'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'ContentReview' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'ContentReview' ? '#6F405F' : '#F6F0FA', justifyContent: 'center', alignItems: 'center' }}>
                        <EyeIcon color={activeAdminTab === 'ContentReview' ? '#FFFFFF' : '#7C3AED'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'ContentReview' ? '900' : '600', color: activeAdminTab === 'ContentReview' ? '#6F405F' : '#2D1D15' }}>
                        Content Review
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'ContentReview' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Blocked Footprints */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'BlockedFootprints' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('BlockedFootprints'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'BlockedFootprints' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'BlockedFootprints' ? '#6F405F' : '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
                        <BanIcon color={activeAdminTab === 'BlockedFootprints' ? '#FFFFFF' : '#DC2626'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'BlockedFootprints' ? '900' : '600', color: activeAdminTab === 'BlockedFootprints' ? '#6F405F' : '#2D1D15' }}>
                        Blocked Footprints
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'BlockedFootprints' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* User Enquiries */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'Enquiries' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 10,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('Enquiries'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'Enquiries' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'Enquiries' ? '#6F405F' : '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                        <InboxIcon color={activeAdminTab === 'Enquiries' ? '#FFFFFF' : '#2563EB'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'Enquiries' ? '900' : '600', color: activeAdminTab === 'Enquiries' ? '#6F405F' : '#2D1D15' }}>
                        User Enquiries
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'Enquiries' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Section Divider */}
                  <View style={{ height: 1, backgroundColor: '#F3EFF2', marginHorizontal: 20, marginVertical: 8 }} />

                  {/* Section 2: PLATFORM */}
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.8, marginTop: 4, marginBottom: 8, paddingHorizontal: 20, textTransform: 'uppercase' }}>
                    Platform & Media
                  </Text>

                  {/* Users */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'Users' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('Users'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'Users' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'Users' ? '#6F405F' : '#FAF4F7', justifyContent: 'center', alignItems: 'center' }}>
                        <ProfileIcon color={activeAdminTab === 'Users' ? '#FFFFFF' : '#6F405F'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'Users' ? '900' : '600', color: activeAdminTab === 'Users' ? '#6F405F' : '#2D1D15' }}>
                        Users Management
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'Users' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Music Management */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'Music' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('Music'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'Music' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'Music' ? '#6F405F' : '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
                        <MusicIcon color={activeAdminTab === 'Music' ? '#FFFFFF' : '#059669'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'Music' ? '900' : '600', color: activeAdminTab === 'Music' ? '#6F405F' : '#2D1D15' }}>
                        Music Library
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'Music' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Analytics */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeAdminTab === 'Analytics' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 10,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveAdminTab('Analytics'); setSidebarVisible(false); }}
                  >
                    {activeAdminTab === 'Analytics' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeAdminTab === 'Analytics' ? '#6F405F' : '#FFFBEB', justifyContent: 'center', alignItems: 'center' }}>
                        <BarChartIcon color={activeAdminTab === 'Analytics' ? '#FFFFFF' : '#D97706'} size={17} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeAdminTab === 'Analytics' ? '900' : '600', color: activeAdminTab === 'Analytics' ? '#6F405F' : '#2D1D15' }}>
                        Platform Analytics
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeAdminTab === 'Analytics' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>
                </>
              ) : (
                // ── USER SPACE SIDEBAR VIEW ──
                <>
                  {/* Section 1: DISCOVER & FEED */}
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.8, marginTop: 4, marginBottom: 8, paddingHorizontal: 20, textTransform: 'uppercase' }}>
                    {t('personalSpace', 'Discover & Connect')}
                  </Text>

                  {/* Home Feed Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Feed' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Feed'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Feed' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Feed' ? '#6F405F' : '#FAF4F7', justifyContent: 'center', alignItems: 'center' }}>
                        <HomeIcon color={activeTab === 'Feed' ? '#FFFFFF' : '#6F405F'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Feed' ? '900' : '600', color: activeTab === 'Feed' ? '#6F405F' : '#2D1D15' }}>
                        {t('home', 'Home Feed')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Feed' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Explore Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Explore' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Explore'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Explore' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Explore' ? '#6F405F' : '#FFF6ED', justifyContent: 'center', alignItems: 'center' }}>
                        <ExploreIcon color={activeTab === 'Explore' ? '#FFFFFF' : '#EA580C'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Explore' ? '900' : '600', color: activeTab === 'Explore' ? '#6F405F' : '#2D1D15' }}>
                        {t('explore', 'Explore Topics')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Explore' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Notifications Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Notifications' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Notifications'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Notifications' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Notifications' ? '#6F405F' : '#F5F2FA', justifyContent: 'center', alignItems: 'center' }}>
                        <BellIcon color={activeTab === 'Notifications' ? '#FFFFFF' : '#7C3AED'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Notifications' ? '900' : '600', color: activeTab === 'Notifications' ? '#6F405F' : '#2D1D15' }}>
                        {t('notif', 'Notifications')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Notifications' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Saved Posts Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Saved' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 6,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Saved'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Saved' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Saved' ? '#6F405F' : '#FFFBEB', justifyContent: 'center', alignItems: 'center' }}>
                        <StarIcon color={activeTab === 'Saved' ? '#FFFFFF' : '#D97706'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Saved' ? '900' : '600', color: activeTab === 'Saved' ? '#6F405F' : '#2D1D15' }}>
                        {t('savedPosts', 'Saved Thoughts')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Saved' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Section Divider */}
                  <View style={{ height: 1, backgroundColor: '#F3EFF2', marginHorizontal: 20, marginVertical: 8 }} />

                  {/* Section 2: ACCOUNT & SUPPORT */}
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.8, marginTop: 4, marginBottom: 8, paddingHorizontal: 20, textTransform: 'uppercase' }}>
                    Account & Support
                  </Text>

                  {/* Profile Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Profile' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Profile'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Profile' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Profile' ? '#6F405F' : '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
                        <ProfileIcon color={activeTab === 'Profile' ? '#FFFFFF' : '#16A34A'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Profile' ? '900' : '600', color: activeTab === 'Profile' ? '#6F405F' : '#2D1D15' }}>
                        {t('me', 'My Profile')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Profile' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* My Topics Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'MyTopics' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('MyTopics'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'MyTopics' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'MyTopics' ? '#6F405F' : '#FAF4F7', justifyContent: 'center', alignItems: 'center' }}>
                        <TagIcon color={activeTab === 'MyTopics' ? '#FFFFFF' : '#6F405F'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'MyTopics' ? '900' : '600', color: activeTab === 'MyTopics' ? '#6F405F' : '#2D1D15' }}>
                        {t('myTopics', 'My Topics')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'MyTopics' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* My Reports Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'MyReports' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('MyReports'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'MyReports' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'MyReports' ? '#6F405F' : '#FFF0F2', justifyContent: 'center', alignItems: 'center' }}>
                        <ShieldIcon color={activeTab === 'MyReports' ? '#FFFFFF' : '#C46F76'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'MyReports' ? '900' : '600', color: activeTab === 'MyReports' ? '#6F405F' : '#2D1D15' }}>
                        {t('myContentReports', 'Safety Reports')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'MyReports' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Settings Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Settings' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Settings'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Settings' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Settings' ? '#6F405F' : '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                        <SettingsIcon color={activeTab === 'Settings' ? '#FFFFFF' : '#64748B'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Settings' ? '900' : '600', color: activeTab === 'Settings' ? '#6F405F' : '#2D1D15' }}>
                        {t('settingsAndPreferences', 'Settings')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Settings' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>

                  {/* Help & Support Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 48,
                      paddingHorizontal: 16,
                      marginHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: activeTab === 'Help' ? 'rgba(111, 64, 95, 0.1)' : 'transparent',
                      marginBottom: 6,
                      position: 'relative',
                    }}
                    onPress={() => { setActiveTab('Help'); setSidebarVisible(false); }}
                  >
                    {activeTab === 'Help' && (
                      <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3.5, backgroundColor: '#6F405F', borderRadius: 2 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: activeTab === 'Help' ? '#6F405F' : '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                        <HelpIcon color={activeTab === 'Help' ? '#FFFFFF' : '#3B82F6'} size={18} />
                      </View>
                      <Text style={{ fontSize: 14.5, fontWeight: activeTab === 'Help' ? '900' : '600', color: activeTab === 'Help' ? '#6F405F' : '#2D1D15' }}>
                        {t('helpCenter', 'Help & Support')}
                      </Text>
                    </View>
                    <ChevronRightIcon color={activeTab === 'Help' ? '#6F405F' : '#D1C7CD'} size={13} />
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* ── BOTTOM FIXED DOCK ── */}
            <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1, borderTopColor: '#F3EFF2', backgroundColor: '#FFFFFF' }}>
              {/* Privacy & Safety Pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 11.5, color: '#9E8E98', fontWeight: '700' }}>
                  256-Bit Identity Shield • 100% Safe
                </Text>
              </View>

              {/* Logout Button */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#FFF2F4',
                  borderWidth: 1.5,
                  borderColor: '#FFE2E6',
                }}
                onPress={() => { logout(); setSidebarVisible(false); }}
                activeOpacity={0.8}
              >
                <LogoutIcon size={18} color="#C46F76" />
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#C46F76' }}>
                  {t('logout', 'Log Out')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Backdrop Touch Target on RIGHT */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />
        </View>
      </Modal>

      {/* Brand Header */}
      <SafeAreaView style={{ backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
        <View style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F0EAEE',
          shadowColor: '#6F405F',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <View style={{
            height: 54,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
          }}>
            {activeTab === 'Admin' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('./src/assets/logo.png')} style={{ width: 26, height: 26, borderRadius: 7, marginRight: 8 }} />
                  <Text style={styles.headerText}>AwaajManki</Text>
                  <Text style={[styles.headerDot, { color: COLORS.error }]}>•</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Notification Bell */}
                  <TouchableOpacity
                    onPress={() => setAdminAlertsModalVisible(true)}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF5F7', justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 1, borderColor: '#EFE5EB' }}
                  >
                    <BellIcon color="#6F405F" size={19} />
                    {adminBadgeCount > 0 && (
                      <View style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: '#EF4444',
                        borderRadius: 9,
                        minWidth: 18,
                        height: 18,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 4,
                        borderWidth: 1.5,
                        borderColor: '#FFFFFF',
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
                          {adminBadgeCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Avatar Bubble */}
                  <View style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#6F405F',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                      {String(currentUser?.username || 'AD').replace('@', '').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  {/* Menu Hamburger */}
                  <TouchableOpacity
                    onPress={() => setSidebarVisible(true)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#FAF5F7',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#EFE5EB',
                    }}
                  >
                    <HamburgerIcon color="#6F405F" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Left Side: Sidebar Hamburger Menu Button */}
                <TouchableOpacity
                  onPress={() => setSidebarVisible(true)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
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
                      borderRadius: 7,
                      borderWidth: 1,
                      borderColor: '#6F405F',
                      marginRight: 8,
                    }}
                  />
                  <Text style={{
                    fontSize: 17,
                    fontWeight: '900',
                    color: '#6F405F',
                    letterSpacing: -0.3,
                  }}>
                    Awaaj Man Ki
                  </Text>
                  <Text style={{ fontSize: 18, color: '#D96C3D', marginLeft: 3, fontWeight: '900', transform: [{ translateY: -1 }] }}>•</Text>
                </View>

                {/* Right Side: Mood Trigger button */}
                <TouchableOpacity
                  onPress={handleToggleMoodModal}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
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

      {/* Custom Mobile Bottom Tab Navigator */}
      {!(activeTab === 'Chat' && chatTarget !== null) && (
        activeTab === 'Admin' ? (
          // ── ADMIN WORKSPACE BOTTOM TABS (DARK THEME) ──
          <View style={{
            height: Platform.OS === 'ios' ? 82 : 62,
            flexDirection: 'row',
            backgroundColor: '#1E101D',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1.5,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            paddingBottom: Platform.OS === 'ios' ? 20 : 6,
            paddingTop: 6,
            elevation: 30,
            shadowColor: '#000000',
            shadowOpacity: 0.4,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: -6 },
          }}>
            {/* Dashboard */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setActiveAdminTab('Dashboard')}
              activeOpacity={0.7}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <DocIcon color={activeAdminTab === 'Dashboard' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeAdminTab === 'Dashboard' ? '800' : '600',
                color: activeAdminTab === 'Dashboard' ? '#FFAAB0' : '#8E7E8B',
              }}>
                Metrics
              </Text>
            </TouchableOpacity>

            {/* Reports Queue */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setActiveAdminTab('Reports')}
              activeOpacity={0.7}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3, position: 'relative' }}>
                <FlagIcon color={activeAdminTab === 'Reports' ? '#F87171' : '#8E7E8B'} size={20} />
                {adminBadgeCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -10,
                    backgroundColor: '#EF4444',
                    borderRadius: 7,
                    minWidth: 14,
                    height: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}>
                    <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#FFFFFF' }}>{adminBadgeCount}</Text>
                  </View>
                )}
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeAdminTab === 'Reports' ? '800' : '600',
                color: activeAdminTab === 'Reports' ? '#F87171' : '#8E7E8B',
              }}>
                Reports
              </Text>
            </TouchableOpacity>

            {/* Content Review */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setActiveAdminTab('ContentReview')}
              activeOpacity={0.7}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <EyeIcon color={activeAdminTab === 'ContentReview' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeAdminTab === 'ContentReview' ? '800' : '600',
                color: activeAdminTab === 'ContentReview' ? '#FFAAB0' : '#8E7E8B',
              }}>
                Review
              </Text>
            </TouchableOpacity>

            {/* Users */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setActiveAdminTab('Users')}
              activeOpacity={0.7}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <ProfileIcon color={activeAdminTab === 'Users' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeAdminTab === 'Users' ? '800' : '600',
                color: activeAdminTab === 'Users' ? '#FFAAB0' : '#8E7E8B',
              }}>
                Users
              </Text>
            </TouchableOpacity>

            {/* More / Menu */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setSidebarVisible(true)}
              activeOpacity={0.7}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <HamburgerIcon color="#8E7E8B" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#8E7E8B' }}>
                Menu
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── USER SPACE BOTTOM TABS (DARK LUXURY THEME) ──
          <View style={{
            height: Platform.OS === 'ios' ? 82 : 62,
            flexDirection: 'row',
            backgroundColor: '#1E101D',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1.5,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            paddingBottom: Platform.OS === 'ios' ? 20 : 6,
            paddingTop: 6,
            elevation: 30,
            shadowColor: '#000000',
            shadowOpacity: 0.4,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: -6 },
          }}>
            {/* Feed Tab */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setActiveTab('Feed'); setChatTarget(null); }}
              activeOpacity={0.75}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <HomeIcon color={activeTab === 'Feed' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeTab === 'Feed' ? '800' : '600',
                color: activeTab === 'Feed' ? '#FFAAB0' : '#8E7E8B',
              }}>
                {t('home', 'Feed')}
              </Text>
            </TouchableOpacity>

            {/* Explore Tab */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setActiveTab('Explore'); setChatTarget(null); }}
              activeOpacity={0.75}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <ExploreIcon color={activeTab === 'Explore' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeTab === 'Explore' ? '800' : '600',
                color: activeTab === 'Explore' ? '#FFAAB0' : '#8E7E8B',
              }}>
                {t('explore', 'Explore')}
              </Text>
            </TouchableOpacity>

            {/* Music Tab */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setActiveTab('Music'); setChatTarget(null); }}
              activeOpacity={0.75}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <MusicIcon color={activeTab === 'Music' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeTab === 'Music' ? '800' : '600',
                color: activeTab === 'Music' ? '#FFAAB0' : '#8E7E8B',
              }}>
                {t('music', 'Music')}
              </Text>
            </TouchableOpacity>

            {/* Saved Posts Tab */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setActiveTab('Saved'); setChatTarget(null); }}
              activeOpacity={0.75}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <StarIcon color={activeTab === 'Saved' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeTab === 'Saved' ? '800' : '600',
                color: activeTab === 'Saved' ? '#FFAAB0' : '#8E7E8B',
              }}>
                {t('savedPosts', 'Saved')}
              </Text>
            </TouchableOpacity>

            {/* Profile Tab */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setActiveTab('Profile'); setChatTarget(null); }}
              activeOpacity={0.75}
            >
              <View style={{ height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }}>
                <ProfileIcon color={activeTab === 'Profile' ? '#FFAAB0' : '#8E7E8B'} size={20} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: activeTab === 'Profile' ? '800' : '600',
                color: activeTab === 'Profile' ? '#FFAAB0' : '#8E7E8B',
              }}>
                {t('me', 'Me')}
              </Text>
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
    <View style={{ flex: 1, backgroundColor: '#F8F5F4' }}>
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
    </View>
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
