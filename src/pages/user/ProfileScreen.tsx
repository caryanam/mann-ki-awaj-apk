import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal, SafeAreaView, FlatList, Platform, StatusBar, ImageBackground, Image } from 'react-native';
import { InitialAvatar } from '../../components/common/InitialAvatar';
import { PostCardItem } from '../../components/posts/PostCardItem';
import { CommentItem } from '../../components/posts/CommentItem';
import { CommentComposer } from '../../components/posts/CommentComposer';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import {
  CloseIcon,
  ChevronRightIcon,
  ShieldIcon,
  LockIcon,
  ProfileIcon,
  SettingsIcon,
  HelpIcon,
  LogoutIcon,
  TagIcon,
  InfoIcon,
  CheckIcon,
  StarIcon,
  DocIcon,
} from '../../components/common/Icons';

export function ProfileScreen({ onNavigateToChat }: { onNavigateToChat?: any } = {}) {
  const { currentUser, logout, updateProfile } = useAuth() as any;
  const { posts, blockedUsers, blockUser, unblockUser, reports, reactToPost, loadComments, addComment } = usePosts() as any;
  const { currentLanguage, changeLanguage, supportedLanguages, t, translationCache } = useLanguage() as any;

  const [bioInput, setBioInput] = useState(currentUser?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  // My Posts & Comments Modal States
  const [myPostsVisible, setMyPostsVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  const activePostForModal = posts.find((p: any) => p.id === selectedPost?.id) || selectedPost;

  // Info modal states
  const [aboutVisible, setAboutVisible] = useState(false);
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  // Settings submodal states
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [privacySettingsVisible, setPrivacySettingsVisible] = useState(false);
  const [safetySettingsVisible, setSafetySettingsVisible] = useState(false);

  // Settings form input states
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [mobileInput, setMobileInput] = useState('');
  const [mobileOtpInput, setMobileOtpInput] = useState('');
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [isChangingMobile, setIsChangingMobile] = useState(false);

  const [allowComments, setAllowComments] = useState(true);
  const [showPublicComments, setShowPublicComments] = useState(false);
  const [dmPermission, setDmPermission] = useState('everyone');
  const [showDmPicker, setShowDmPicker] = useState(false);
  const [hideSearchEngines, setHideSearchEngines] = useState(true);
  const [hideLeaderboards, setHideLeaderboards] = useState(false);
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [hideSensitive, setHideSensitive] = useState(true);
  const [autoMuteLowRep, setAutoMuteLowRep] = useState(true);
  const [blockUsernameInput, setBlockUsernameInput] = useState('');
  const [strictAi, setStrictAi] = useState(true);
  const [filterAbusive, setFilterAbusive] = useState(true);
  const [maskProfanity, setMaskProfanity] = useState(true);
  const [displayHelpline, setDisplayHelpline] = useState(true);
  const [mutedKeywords, setMutedKeywords] = useState(['#spoiler', '#politics', '#harassment']);
  const [keywordInput, setKeywordInput] = useState('');
  const [showReportsList, setShowReportsList] = useState(false);

  // Contact support form states
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  const ownPosts = posts.filter((p: any) => p.username === currentUser?.username);
  const reactionsReceived = ownPosts.reduce((sum: any, p: any) => {
    return sum + Object.values(p.reactions).reduce((s: any, r: any) => s + r, 0);
  }, 0);

  const handleSaveProfile = () => {
    updateProfile({ bio: bioInput });
    setIsEditing(false);
  };

  const handleContactSubmit = () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubject('');
      setContactMessage('');
      setContactVisible(false);
      Alert.alert('Support Inquiry Submitted', 'Your support ticket has been submitted. Our safety team will review it shortly.');
    }, 800);
  };

  const AVATAR_COLORS = ['#6F405F', '#3F7772', '#D96C3D', '#2D1D15', '#2E7D52', '#4A3B6F', '#C46F76', '#1E3A8A'];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8F5F4' }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── TOP HERO COVER IMAGE BANNER ── */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
        shadowColor: '#1A0C16',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        marginBottom: 16,
      }}>
        {/* Cover Photo Header */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900&auto=format&fit=crop&q=80' }}
          defaultSource={require('../../assets/music-cover.jpg')}
          style={{ width: '100%', height: 145 }}
          resizeMode="cover"
        >
          {/* Subtle soft gradient overlay */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30, 16, 29, 0.35)',
          }} />
        </ImageBackground>

        {/* Profile Info Details (Light Aesthetic) */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 22, alignItems: 'center' }}>
          {/* Overlapping Avatar with Crisp White Ring */}
          <View style={{ position: 'relative', marginTop: -46, marginBottom: 10 }}>
            <View style={{
              borderRadius: 48,
              padding: 4,
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#F0EAEE',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
            }}>
              <InitialAvatar
                initials={currentUser?.avatarInitials}
                color={currentUser?.avatarColor || '#6F405F'}
                size={78}
              />
            </View>
            <View style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#10B981',
              borderWidth: 2.5,
              borderColor: '#FFFFFF',
            }} />
          </View>

          {/* Username in Crisp Dark Text */}
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#2D1D15', letterSpacing: -0.4, marginBottom: 4 }}>
            {currentUser?.username ? (currentUser.username.startsWith('@') ? currentUser.username : `@${currentUser.username}`) : '@anonymous'}
          </Text>

          {/* Verified Anonymous Shield Badge in Light Green */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#ECFDF5',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#A7F3D0',
            marginBottom: 16,
          }}>
            <ShieldIcon color="#059669" size={14} />
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#059669', letterSpacing: 0.3 }}>
              256-Bit Identity Shielded • 100% Safe
            </Text>
          </View>

          {/* Avatar Color Palette (Light Theme) */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#8C8385', marginBottom: 8, letterSpacing: 0.2 }}>
              {t('customizeAvatarColor', 'Customize Avatar Theme Color:')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {AVATAR_COLORS.map(color => {
                const isActive = (currentUser?.avatarColor || '#6F405F') === color;
                return (
                  <TouchableOpacity
                    key={color}
                    activeOpacity={0.7}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: isActive ? 2.5 : 1,
                      borderColor: isActive ? '#6F405F' : '#E8DFE5',
                      transform: [{ scale: isActive ? 1.15 : 1 }],
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isActive ? 0.35 : 0,
                      shadowRadius: 4,
                      elevation: isActive ? 3 : 0,
                    }}
                    onPress={() => updateProfile({ avatarColor: color })}
                  >
                    {isActive && (
                      <View style={{
                        width: 8,
                        height: 5,
                        borderLeftWidth: 2,
                        borderBottomWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ rotate: '-45deg' }],
                        marginTop: -1,
                      }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* ── STATS ROW CARDS ── */}
      <View style={{
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginBottom: 14,
      }}>
        {/* Thoughts Published */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMyPostsVisible(true)}
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: '#F0EAEE',
            shadowColor: '#1A0C16',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 3,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#6F405F' }}>{ownPosts.length}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8385' }}>{t('thoughts', 'My Thoughts')}</Text>
            <ChevronRightIcon color="#C46F76" size={10} />
          </View>
        </TouchableOpacity>

        {/* Reactions Received */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: '#F0EAEE',
            shadowColor: '#1A0C16',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 3,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#C46F76' }}>{reactionsReceived}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8385', marginTop: 2 }}>
            {t('reactions', 'Reactions Received')}
          </Text>
        </View>
      </View>

      {/* ── ANONYMOUS BIO CARD ── */}
      <View style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0EAEE',
        marginBottom: 14,
        shadowColor: '#1A0C16',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FAF4F7', justifyContent: 'center', alignItems: 'center' }}>
              <TagIcon color="#6F405F" size={15} />
            </View>
            <Text style={{ fontSize: 14.5, fontWeight: '900', color: '#2D1D15' }}>
              {t('anonymousBio', 'Anonymous Bio')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: isEditing ? '#FAF4F7' : 'rgba(111, 64, 95, 0.08)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#6F405F' }}>
              {isEditing ? t('cancel', 'Cancel') : t('edit', 'Edit')}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={{ gap: 10 }}>
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              multiline
              maxLength={150}
              placeholder="Write a few lines about your anonymous persona..."
              placeholderTextColor="#9E8E98"
              style={{
                borderWidth: 1.5,
                borderColor: '#6F405F',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: '#2D1D15',
                minHeight: 80,
                textAlignVertical: 'top',
                backgroundColor: '#FAF9FA',
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9E8E98' }}>{bioInput.length}/150</Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: '#6F405F',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>{t('saveProfile', 'Save Bio')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 13.5, color: currentUser?.bio ? '#3D2A35' : '#9E8E98', lineHeight: 20, fontStyle: currentUser?.bio ? 'normal' : 'italic' }}>
            {currentUser?.bio || t('noBio', 'No bio written yet. Tap "Edit" to tell others what you are experiencing...')}
          </Text>
        )}
      </View>

      {/* ── SECTION: CONTENT & LANGUAGE ── */}
      <View style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F0EAEE',
        marginBottom: 14,
        shadowColor: '#1A0C16',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
          Content & Preferences
        </Text>

        {/* My Thoughts (My Posts) */}
        <TouchableOpacity
          onPress={() => setMyPostsVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F6F0F4',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FAF4F7', justifyContent: 'center', alignItems: 'center' }}>
              <DocIcon color="#6F405F" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                {t('myThoughts', 'My Thoughts')}
              </Text>
              <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 1 }}>
                {t('myThoughtsDesc', 'Manage and review your published thoughts')}
              </Text>
            </View>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={13} />
        </TouchableOpacity>

        {/* Preferred Language */}
        <TouchableOpacity
          onPress={() => setLangPickerVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>🌐</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                {t('preferredLanguage', 'Preferred Language')}
              </Text>
              <Text style={{ fontSize: 11.5, color: '#6F405F', fontWeight: '700', marginTop: 1 }}>
                {(() => {
                  const activeLang = supportedLanguages.find((lang: any) => lang.code === currentLanguage);
                  return activeLang ? `${activeLang.native} (${activeLang.label})` : currentLanguage;
                })()}
              </Text>
            </View>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={13} />
        </TouchableOpacity>
      </View>

      {/* ── SECTION: PRIVACY & SECURITY ── */}
      <View style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F0EAEE',
        marginBottom: 14,
        shadowColor: '#1A0C16',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
          Privacy & Security Controls
        </Text>

        {/* Account Settings */}
        <TouchableOpacity
          onPress={() => setAccountSettingsVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F6F0F4',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
              <ProfileIcon color="#16A34A" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                {t('accountSettings', 'Account & Private Credentials')}
              </Text>
              <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 1 }}>
                {t('accountSettingsDesc', 'Manage phone, email, and password')}
              </Text>
            </View>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={13} />
        </TouchableOpacity>

        {/* Privacy Settings */}
        <TouchableOpacity
          onPress={() => setPrivacySettingsVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F6F0F4',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center' }}>
              <LockIcon color="#D97706" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                {t('privacySettings', 'Privacy & Comment Controls')}
              </Text>
              <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 1 }}>
                {t('privacySettingsDesc', 'Comment permissions and visibility filters')}
              </Text>
            </View>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={13} />
        </TouchableOpacity>

        {/* Safety & Moderation */}
        <TouchableOpacity
          onPress={() => setSafetySettingsVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0F2', justifyContent: 'center', alignItems: 'center' }}>
              <ShieldIcon color="#C46F76" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#2D1D15' }}>
                {t('safetyAndModeration', 'Safety & Moderation Hub')}
              </Text>
              <Text style={{ fontSize: 11.5, color: '#8C8385', marginTop: 1 }}>
                {t('safetyAndModerationDesc', 'Blocked footprints, keyword mute list, and reports')}
              </Text>
            </View>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={13} />
        </TouchableOpacity>
      </View>

      {/* ── SECTION: SUPPORT & INFORMATION ── */}
      <View style={{
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F0EAEE',
        marginBottom: 18,
        shadowColor: '#1A0C16',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#9E8E98', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
          Support & Trust
        </Text>

        {/* Community Guidelines */}
        <TouchableOpacity
          onPress={() => setGuidelinesVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F6F0F4',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
              <DocIcon color="#64748B" size={16} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#3D2A35' }}>Community Guidelines</Text>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={12} />
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          onPress={() => setPrivacyVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F6F0F4',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
              <ShieldIcon color="#64748B" size={16} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#3D2A35' }}>Privacy Policy</Text>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={12} />
        </TouchableOpacity>

        {/* Contact Support */}
        <TouchableOpacity
          onPress={() => setContactVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F6F0F4',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
              <HelpIcon color="#64748B" size={16} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#3D2A35' }}>Contact Support</Text>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={12} />
        </TouchableOpacity>

        {/* About Us */}
        <TouchableOpacity
          onPress={() => setAboutVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
              <InfoIcon color="#64748B" size={16} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#3D2A35' }}>About Awaaj Man Ki</Text>
          </View>
          <ChevronRightIcon color="#C4B7BF" size={12} />
        </TouchableOpacity>
      </View>

      {/* ── LOGOUT SESSION BUTTON ── */}
      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 50,
            borderRadius: 16,
            backgroundColor: '#FFF2F4',
            borderWidth: 1.5,
            borderColor: '#FFE2E6',
            shadowColor: '#C46F76',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <LogoutIcon size={18} color="#C46F76" />
          <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#C46F76' }}>
            {t('logoutSession', 'Log Out Session')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Selector Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={langPickerVisible}
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.centerModalOverlay}
          activeOpacity={1}
          onPress={() => setLangPickerVisible(false)}
        >
          <View style={[styles.reportModalCard, { maxHeight: '70%', paddingVertical: 20, borderRadius: 24 }]}>
            <View style={[styles.modalHeader, { paddingHorizontal: 4, marginBottom: 12 }]}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15' }}>{t('preferredLanguage', 'Preferred Language')}</Text>
              <TouchableOpacity onPress={() => setLangPickerVisible(false)} style={styles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ width: '100%' }}>
              {supportedLanguages.map((lang: any) => {
                const isActive = currentLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      changeLanguage(lang.code);
                      setLangPickerVisible(false);
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F8F5F4',
                      backgroundColor: isActive ? 'rgba(111, 64, 95, 0.08)' : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{
                      fontSize: 14.5,
                      fontWeight: isActive ? '900' : '600',
                      color: isActive ? '#6F405F' : '#2D1D15',
                    }}>
                      {lang.native} ({lang.label})
                    </Text>
                    {isActive && (
                      <CheckIcon color="#6F405F" size={16} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* About Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutVisible}
        onRequestClose={() => setAboutVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Man Ki Aavaj</Text>
              <TouchableOpacity onPress={() => setAboutVisible(false)} style={styles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.policyHeading}>Our Vision</Text>
              <Text style={styles.policyBody}>
                Man Ki Aavaj is an 18+ anonymous, text-first social platform designed to create a safe, respectful space for self-expression without public social pressure.
              </Text>

              <Text style={styles.policyHeading}>Core Philosophy</Text>
              <Text style={styles.policyBody}>
                We believe that written thoughts carry deep emotional resonance when freed from popularity algorithms, public follower counts, and real-name judgment.
              </Text>

              <Text style={styles.policyHeading}>Platform Features</Text>
              <Text style={styles.policyBullet}>• Anonymous by Design: Custom avatar initials and colors protect your identity.</Text>
              <Text style={styles.policyBullet}>• AI Moderation: Content is checked before publication to ensure respectful discourse.</Text>
              <Text style={styles.policyBullet}>• Voice-to-Text: Speak your thoughts directly in multiple languages.</Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Guidelines Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={guidelinesVisible}
        onRequestClose={() => setGuidelinesVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Community Guidelines</Text>
              <TouchableOpacity onPress={() => setGuidelinesVisible(false)} style={styles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.policyHeading}>1. Zero Tolerance for Abuse</Text>
              <Text style={styles.policyBody}>
                Hate speech, abusive language, harassment, threats, religious offense, political conflict, and personal information exposure are strictly prohibited.
              </Text>

              <Text style={styles.policyHeading}>2. Real-Time Moderation</Text>
              <Text style={styles.policyBody}>
                All posts, comments, replies, bios, and report explanations pass through our automated moderation engine before public publication.
              </Text>

              <Text style={styles.policyHeading}>3. Respectful Dialogue</Text>
              <Text style={styles.policyBody}>
                Engage with empathy. Use supportive reactions (❤️ I Relate, 👍 Well Said, 🔥 Helpful, 🤝 Stay Strong, 💯 Made Me Think) to build a constructive community environment.
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyVisible}
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setPrivacyVisible(false)} style={styles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.policyHeading}>Identity Shielding</Text>
              <Text style={styles.policyBody}>
                Man Ki Aavaj strictly segregates registration data (Full Name, Phone Number, Email) from public profiles. Your real identity is never exposed to other members under any circumstance.
              </Text>

              <Text style={styles.policyHeading}>Data Usage</Text>
              <Text style={styles.policyBody}>
                We use static client-side storage and local browser persistence for prototype demonstrations. No third-party ad tracking or selling of user data occurs.
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Contact Support Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactVisible}
        onRequestClose={() => setContactVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <TouchableOpacity onPress={() => setContactVisible(false)} style={styles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.policyBody}>
                If you have queries, need assistance with your account, or want to report safety concerns directly, fill in the support ticket below.
              </Text>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Inquiry Subject</Text>
              <TextInput
                placeholder="Account, safety, or feature query..."
                placeholderTextColor={COLORS.zorba}
                value={contactSubject}
                onChangeText={setContactSubject}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Message Details</Text>
              <TextInput
                placeholder="Describe your question or issue in detail..."
                placeholderTextColor={COLORS.zorba}
                value={contactMessage}
                onChangeText={setContactMessage}
                multiline
                numberOfLines={5}
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              />

              <TouchableOpacity
                onPress={handleContactSubmit}
                style={[styles.primaryButton, { marginTop: 10 }]}
                disabled={contactLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {contactLoading ? 'Submitting...' : 'Submit Inquiry'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={accountSettingsVisible}
        onRequestClose={() => {
          setAccountSettingsVisible(false);
          setIsChangingPassword(false);
          setIsChangingEmail(false);
          setIsChangingMobile(false);
          setIsEmailOtpSent(false);
          setIsMobileOtpSent(false);
        }}
      >
        {(() => {
          const maskMobile = (num: string) => {
            if (!num) return '+91 ••••• ••407';
            if (num.includes('•') || num.includes('*')) return num;
            if (num.length > 5) {
              return `${num.slice(0, 3)} ••••• ••${num.slice(-3)}`;
            }
            return num;
          };

          const maskEmail = (email: string) => {
            if (!email) return 'sh***@gmail.com';
            if (email.includes('*')) return email;
            const parts = email.split('@');
            if (parts.length === 2) {
              const name = parts[0];
              const domain = parts[1];
              if (name.length > 3) {
                return `${name.slice(0, 2)}***@${domain}`;
              }
              return `${name.slice(0, 1)}***@${domain}`;
            }
            return email;
          };

          const handleSendMobileOtp = () => {
            if (!mobileInput || mobileInput.length < 10) {
              Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
              return;
            }
            setSendingMobileOtp(true);
            setTimeout(() => {
              setSendingMobileOtp(false);
              setIsMobileOtpSent(true);
              Alert.alert('Info', `OTP sent to +91 ${mobileInput.slice(-4)}! Use 123456 to verify.`);
            }, 600);
          };

          const handleVerifyMobileOtp = () => {
            if (mobileOtpInput !== '123456') {
              Alert.alert('Error', 'Invalid OTP code. Please try again.');
              return;
            }
            setVerifyingMobile(true);
            setTimeout(() => {
              setVerifyingMobile(false);
              updateProfile({ mobileNumber: mobileInput });
              Alert.alert('Success', 'Mobile number verified and updated successfully!');
              setIsChangingMobile(false);
              setIsMobileOtpSent(false);
              setMobileInput('');
              setMobileOtpInput('');
            }, 600);
          };

          const handleSendEmailOtp = () => {
            if (!emailInput || !emailInput.includes('@')) {
              Alert.alert('Error', 'Please enter a valid email address.');
              return;
            }
            setSendingEmailOtp(true);
            setTimeout(() => {
              setSendingEmailOtp(false);
              setIsEmailOtpSent(true);
              Alert.alert('Info', `OTP sent to ${maskEmail(emailInput)}! Use 123456 to verify.`);
            }, 600);
          };

          const handleVerifyEmailOtp = () => {
            if (emailOtpInput !== '123456') {
              Alert.alert('Error', 'Invalid OTP code. Please try again.');
              return;
            }
            setVerifyingEmail(true);
            setTimeout(() => {
              setVerifyingEmail(false);
              updateProfile({ email: emailInput });
              Alert.alert('Success', 'Email address verified and updated successfully!');
              setIsChangingEmail(false);
              setIsEmailOtpSent(false);
              setEmailInput('');
              setEmailOtpInput('');
            }, 600);
          };

          const handlePasswordSubmit = () => {
            if (!currentPasswordInput) {
              Alert.alert('Error', 'Please enter your current password.');
              return;
            }
            if (passwordInput.length < 6) {
              Alert.alert('Error', 'New password must be at least 6 characters.');
              return;
            }
            if (passwordInput !== confirmPasswordInput) {
              Alert.alert('Error', 'New passwords do not match.');
              return;
            }
            setUpdatingPassword(true);
            setTimeout(() => {
              setUpdatingPassword(false);
              Alert.alert('Success', 'Password updated successfully!');
              setIsChangingPassword(false);
              setCurrentPasswordInput('');
              setPasswordInput('');
              setConfirmPasswordInput('');
            }, 600);
          };

          return (
            <SafeAreaView style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('accountSettingsTitle', 'Account & Private Identity')}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setAccountSettingsVisible(false);
                      setIsChangingPassword(false);
                      setIsChangingEmail(false);
                      setIsChangingMobile(false);
                      setIsEmailOtpSent(false);
                      setIsMobileOtpSent(false);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <CloseIcon color="#8C8385" size={14} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  {/* Private Shield Banner */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FAF5F8',
                    borderWidth: 1,
                    borderColor: '#F3E6EF',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 16,
                  }}>
                    <Text style={{ fontSize: 20, marginRight: 12, color: '#6F405F' }}>🔒</Text>
                    <Text style={{ fontSize: 12.5, color: '#6F405F', fontWeight: '600', flex: 1, lineHeight: 18 }}>
                      Private — Never displayed publicly to other users on Man Ki Aavaj. Real name & contacts are 100% masked.
                    </Text>
                  </View>

                  {/* Anonymous Handle Card */}
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#F0ECEB',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <View>
                      <Text style={{ fontSize: 11.5, color: '#8C8385', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Anonymous Handle:</Text>
                      <Text style={{ fontSize: 15, color: '#2D1D15', fontWeight: 'bold' }}>{currentUser?.username || '@user_11'}</Text>
                    </View>
                    <View style={{
                      backgroundColor: '#E6F4EA',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{ fontSize: 11.5, color: '#137333', fontWeight: 'bold' }}>Shielded</Text>
                    </View>
                  </View>

                  {/* Mobile Number Card */}
                  {isChangingMobile ? (
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#F0ECEB',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: 12, color: '#8C8385', fontWeight: '700', marginBottom: 6 }}>
                        {isMobileOtpSent ? 'Verify Mobile OTP Code:' : 'Update Mobile Number:'}
                      </Text>

                      {!isMobileOtpSent ? (
                        <View>
                          <TextInput
                            value={mobileInput}
                            onChangeText={setMobileInput}
                            placeholder="Enter 10-digit mobile number..."
                            placeholderTextColor={COLORS.zorba}
                            keyboardType="phone-pad"
                            style={[styles.input, { marginBottom: 12 }]}
                          />
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              onPress={handleSendMobileOtp}
                              style={[styles.primaryButton, { flex: 1, paddingVertical: 10 }]}
                              disabled={sendingMobileOtp}
                            >
                              <Text style={styles.primaryButtonText}>
                                {sendingMobileOtp ? 'Sending...' : 'Send OTP'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setIsChangingMobile(false)}
                              style={[styles.logoutButton, { flex: 1, marginTop: 0, paddingVertical: 10, borderColor: '#CEC7C5' }]}
                            >
                              <Text style={[styles.logoutButtonText, { color: '#5C5254' }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <TextInput
                            value={mobileOtpInput}
                            onChangeText={setMobileOtpInput}
                            placeholder="Enter OTP (e.g. 123456)..."
                            placeholderTextColor={COLORS.zorba}
                            keyboardType="number-pad"
                            style={[styles.input, { marginBottom: 12 }]}
                          />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <TouchableOpacity onPress={handleSendMobileOtp}>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6F405F' }}>🔄 Resend OTP</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              onPress={handleVerifyMobileOtp}
                              style={[styles.primaryButton, { flex: 1, height: 'auto', minHeight: 48, paddingVertical: 10, justifyContent: 'center' }]}
                              disabled={verifyingMobile}
                            >
                              <Text style={[styles.primaryButtonText, { textAlign: 'center', fontSize: 13.5 }]}>
                                {verifyingMobile ? 'Verifying...' : 'Verify & Update'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => { setIsMobileOtpSent(false); setMobileOtpInput(''); }}
                              style={[styles.logoutButton, { flex: 1, marginTop: 0, height: 'auto', minHeight: 48, paddingVertical: 10, borderColor: '#CEC7C5', justifyContent: 'center' }]}
                            >
                              <Text style={[styles.logoutButtonText, { color: '#5C5254', textAlign: 'center', fontSize: 13.5 }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#F0ECEB',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <View>
                        <Text style={{ fontSize: 11.5, color: '#8C8385', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Mobile Number:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 15, color: '#2D1D15', fontWeight: 'bold' }}>
                            {maskMobile(currentUser?.mobileNumber || currentUser?.phone)}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>✓ Verified</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => { setMobileInput(currentUser?.mobileNumber || currentUser?.phone || ''); setIsChangingMobile(true); setIsMobileOtpSent(false); }}
                        style={{
                          backgroundColor: '#FAF8F8',
                          borderWidth: 1,
                          borderColor: '#E6E1E0',
                          borderRadius: 18,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#2D1D15', fontWeight: '700' }}>✎ Edit Mobile</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Email Card */}
                  {isChangingEmail ? (
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#F0ECEB',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: 12, color: '#8C8385', fontWeight: '700', marginBottom: 6 }}>
                        {isEmailOtpSent ? 'Verify Email OTP Code:' : 'Update Email Address:'}
                      </Text>

                      {!isEmailOtpSent ? (
                        <View>
                          <TextInput
                            value={emailInput}
                            onChangeText={setEmailInput}
                            placeholder="Enter new email address..."
                            placeholderTextColor={COLORS.zorba}
                            keyboardType="email-address"
                            style={[styles.input, { marginBottom: 12 }]}
                          />
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              onPress={handleSendEmailOtp}
                              style={[styles.primaryButton, { flex: 1, paddingVertical: 10 }]}
                              disabled={sendingEmailOtp}
                            >
                              <Text style={styles.primaryButtonText}>
                                {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setIsChangingEmail(false)}
                              style={[styles.logoutButton, { flex: 1, marginTop: 0, paddingVertical: 10, borderColor: '#CEC7C5' }]}
                            >
                              <Text style={[styles.logoutButtonText, { color: '#5C5254' }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <TextInput
                            value={emailOtpInput}
                            onChangeText={setEmailOtpInput}
                            placeholder="Enter OTP (e.g. 123456)..."
                            placeholderTextColor={COLORS.zorba}
                            keyboardType="number-pad"
                            style={[styles.input, { marginBottom: 12 }]}
                          />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <TouchableOpacity onPress={handleSendEmailOtp}>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6F405F' }}>🔄 Resend OTP</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              onPress={handleVerifyEmailOtp}
                              style={[styles.primaryButton, { flex: 1, height: 'auto', minHeight: 48, paddingVertical: 10, justifyContent: 'center' }]}
                              disabled={verifyingEmail}
                            >
                              <Text style={[styles.primaryButtonText, { textAlign: 'center', fontSize: 13.5 }]}>
                                {verifyingEmail ? 'Verifying...' : 'Verify & Update'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => { setIsEmailOtpSent(false); setEmailOtpInput(''); }}
                              style={[styles.logoutButton, { flex: 1, marginTop: 0, height: 'auto', minHeight: 48, paddingVertical: 10, borderColor: '#CEC7C5', justifyContent: 'center' }]}
                            >
                              <Text style={[styles.logoutButtonText, { color: '#5C5254', textAlign: 'center', fontSize: 13.5 }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#F0ECEB',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <View>
                        <Text style={{ fontSize: 11.5, color: '#8C8385', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Email Address:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 15, color: '#2D1D15', fontWeight: 'bold' }}>
                            {maskEmail(currentUser?.email)}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>✓ Verified</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => { setEmailInput(currentUser?.email || ''); setIsChangingEmail(true); setIsEmailOtpSent(false); }}
                        style={{
                          backgroundColor: '#FAF8F8',
                          borderWidth: 1,
                          borderColor: '#E6E1E0',
                          borderRadius: 18,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#2D1D15', fontWeight: '700' }}>✎ Edit Email</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Change Password & Delete Account Bottom Row */}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F0ECEB', marginTop: 16, paddingTop: 16 }}>
                    {isChangingPassword ? (
                      <View style={{ gap: 10, marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15', marginBottom: 4 }}>Change Your Password</Text>

                        {/* Current Password Field */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8385' }}>Current Password</Text>
                        <View style={{ position: 'relative', width: '100%', justifyContent: 'center' }}>
                          <TextInput
                            value={currentPasswordInput}
                            onChangeText={setCurrentPasswordInput}
                            secureTextEntry={!showCurrentPassword}
                            placeholder="Enter current password..."
                            placeholderTextColor={COLORS.zorba}
                            style={[styles.input, { paddingRight: 50, marginBottom: 0 }]}
                          />
                          <TouchableOpacity
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={{ position: 'absolute', right: 12, padding: 4 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6F405F' }}>
                              {showCurrentPassword ? 'HIDE' : 'SHOW'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* New Password Field */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8385', marginTop: 6 }}>New Password</Text>
                        <View style={{ position: 'relative', width: '100%', justifyContent: 'center' }}>
                          <TextInput
                            value={passwordInput}
                            onChangeText={setPasswordInput}
                            secureTextEntry={!showNewPassword}
                            placeholder="Enter new password (min. 6 chars)..."
                            placeholderTextColor={COLORS.zorba}
                            style={[styles.input, { paddingRight: 50, marginBottom: 0 }]}
                          />
                          <TouchableOpacity
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={{ position: 'absolute', right: 12, padding: 4 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6F405F' }}>
                              {showNewPassword ? 'HIDE' : 'SHOW'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Confirm Password Field */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#8C8385', marginTop: 6 }}>Confirm New Password</Text>
                        <View style={{ position: 'relative', width: '100%', justifyContent: 'center' }}>
                          <TextInput
                            value={confirmPasswordInput}
                            onChangeText={setConfirmPasswordInput}
                            secureTextEntry={!showConfirmPassword}
                            placeholder="Confirm new password..."
                            placeholderTextColor={COLORS.zorba}
                            style={[styles.input, { paddingRight: 50, marginBottom: 12 }]}
                          />
                          <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ position: 'absolute', right: 12, padding: 4 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6F405F' }}>
                              {showConfirmPassword ? 'HIDE' : 'SHOW'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Password Buttons */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            onPress={handlePasswordSubmit}
                            style={[styles.primaryButton, { flex: 1, paddingVertical: 10 }]}
                            disabled={updatingPassword}
                          >
                            <Text style={styles.primaryButtonText}>
                              {updatingPassword ? 'Updating...' : 'Update Password'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setIsChangingPassword(false);
                              setCurrentPasswordInput('');
                              setPasswordInput('');
                              setConfirmPasswordInput('');
                            }}
                            style={[styles.logoutButton, { flex: 1, marginTop: 0, paddingVertical: 10, borderColor: '#CEC7C5' }]}
                          >
                            <Text style={[styles.logoutButtonText, { color: '#5C5254' }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => setIsChangingPassword(true)}
                          style={{
                            backgroundColor: '#F0ECEB',
                            paddingHorizontal: 16,
                            paddingVertical: 11,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            borderWidth: 1,
                            borderColor: '#E1DCDB',
                          }}
                        >
                          <Text style={{ fontSize: 13, color: '#2D1D15', fontWeight: 'bold' }}>🔑 Change Password</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Confirm Account Deactivation',
                              'Warning: Deactivating your account is soft-deleted immediately. You will be logged out and your data will not be visible on the platform. However, your data is retained for 30 days, after which it is permanently purged from the database.\n\nAre you sure you want to deactivate your account?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Confirm Deactivation',
                                  style: 'destructive',
                                  onPress: () => {
                                    setAccountSettingsVisible(false);
                                    logout();
                                  }
                                }
                              ]
                            );
                          }}
                          style={{
                            backgroundColor: '#C46F76',
                            paddingHorizontal: 16,
                            paddingVertical: 11,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' }}>🛡️ Delete Account</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </SafeAreaView>
          );
        })()}
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacySettingsVisible}
        onRequestClose={() => setPrivacySettingsVisible(false)}
      >
        {(() => {
          const renderCheckbox = (label: string, value: boolean, onToggle: () => void) => (
            <TouchableOpacity
              onPress={onToggle}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 9,
                gap: 10,
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: '#6F405F',
                backgroundColor: value ? '#6F405F' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {value && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13, color: '#5C5254', flex: 1, lineHeight: 18 }}>{label}</Text>
            </TouchableOpacity>
          );

          // Custom high-fidelity vector icons matching Lucide styling
          const CommentIcon = () => (
            <View style={{ width: 22, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#6F405F', justifyContent: 'center', alignItems: 'center', marginRight: 8, position: 'relative' }}>
              <View style={{ width: 10, height: 2, backgroundColor: '#6F405F', marginBottom: 2 }} />
              <View style={{ width: 10, height: 2, backgroundColor: '#6F405F' }} />
              <View style={{
                position: 'absolute',
                bottom: -5,
                left: 4,
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 3,
                borderRightWidth: 3,
                borderTopWidth: 5,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: '#6F405F',
              }} />
            </View>
          );

          const EyeIcon = () => (
            <View style={{ width: 22, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#6F405F', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#6F405F' }} />
            </View>
          );

          const ShieldIcon = () => (
            <View style={{ width: 18, height: 22, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderColor: '#6F405F', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <View style={{ width: 2, height: 10, backgroundColor: '#6F405F', marginBottom: 2 }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#6F405F' }} />
            </View>
          );

          const DatabaseIcon = () => (
            <View style={{ width: 20, height: 22, justifyContent: 'space-between', marginRight: 8, paddingVertical: 2 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ width: 20, height: 4, borderRadius: 2, borderWidth: 1.5, borderColor: '#6F405F', backgroundColor: '#FFFFFF' }} />
              ))}
            </View>
          );

          return (
            <SafeAreaView style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('privacySettingsTitle', 'Privacy Preferences')}</Text>
                  <TouchableOpacity onPress={() => setPrivacySettingsVisible(false)} style={styles.modalCloseButton}>
                    <CloseIcon color="#8C8385" size={14} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>

                  {/* 1. Comments & Direct Messages */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <CommentIcon />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Comments & Direct Messaging</Text>
                    </View>

                    {renderCheckbox("Allow comments on my posts by default", allowComments, () => setAllowComments(!allowComments))}
                    {renderCheckbox("Show public comments tab on my profile space", showPublicComments, () => setShowPublicComments(!showPublicComments))}

                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#5C5254', marginBottom: 6 }}>
                        Who can send me 1-on-1 Direct Message Requests?
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDmPicker(true)}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 11,
                          paddingHorizontal: 14,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#CEC7C5',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <Text style={{ fontSize: 13, color: '#2D1D15', fontWeight: '600' }}>
                          {dmPermission === 'everyone' && 'Everyone (All Anonymous Members)'}
                          {dmPermission === 'followers' && 'Only Users I Follow'}
                          {dmPermission === 'nobody' && 'Nobody (Disable Message Requests)'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#8C8385' }}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 2. Identity & Search Visibility */}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F0ECEB', paddingTop: 14, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <EyeIcon />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Identity & Search Visibility</Text>
                    </View>

                    {renderCheckbox("Hide my anonymous handle from public search engines (Google, Bing)", hideSearchEngines, () => setHideSearchEngines(!hideSearchEngines))}
                    {renderCheckbox("Hide my handle from community top contributors leaderboards", hideLeaderboards, () => setHideLeaderboards(!hideLeaderboards))}
                    {renderCheckbox("Display online active status indicator to chat connections", showActiveStatus, () => setShowActiveStatus(!showActiveStatus))}
                  </View>

                  {/* 3. Content Filtering & Shielding */}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F0ECEB', paddingTop: 14, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <ShieldIcon />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Content Filtering & Shielding</Text>
                    </View>

                    {renderCheckbox("Hide sensitive or flagged posts currently undergoing moderator review", hideSensitive, () => setHideSensitive(!hideSensitive))}
                    {renderCheckbox("Automatically mute message requests from accounts with low reputation warnings", autoMuteLowRep, () => setAutoMuteLowRep(!autoMuteLowRep))}
                  </View>

                  {/* 4. Data Privacy Actions */}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F0ECEB', paddingTop: 14, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <DatabaseIcon />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Data & Storage Management</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => Alert.alert('Request Submitted', 'Data export requested. An email link will be sent shortly.')}
                        style={[styles.primaryButton, { flex: 1, paddingVertical: 11, backgroundColor: '#FAF8F8', borderWidth: 1, borderColor: '#CEC7C5' }]}
                      >
                        <Text style={[styles.primaryButtonText, { color: '#2D1D15' }]}>Export Archive</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => Alert.alert('History Cleared', 'Search and local activity history cleared.')}
                        style={[styles.primaryButton, { flex: 1, paddingVertical: 11, backgroundColor: '#FAF8F8', borderWidth: 1, borderColor: '#CEC7C5' }]}
                      >
                        <Text style={[styles.primaryButtonText, { color: '#2D1D15' }]}>Clear History</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Success', 'Privacy preferences saved successfully.');
                      setPrivacySettingsVisible(false);
                    }}
                    style={[styles.primaryButton, { marginTop: 10 }]}
                  >
                    <Text style={styles.primaryButtonText}>Save All Preferences</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* DM Picker Choice Selector Modal */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={showDmPicker}
                onRequestClose={() => setShowDmPicker(false)}
              >
                <TouchableOpacity
                  style={styles.centerModalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDmPicker(false)}
                >
                  <View style={[styles.reportModalCard, { paddingVertical: 16, maxHeight: '80%' }]}>
                    <View style={[styles.modalHeader, { paddingHorizontal: 4, marginBottom: 12 }]}>
                      <Text style={styles.modalTitle}>Who can send DM requests?</Text>
                      <TouchableOpacity onPress={() => setShowDmPicker(false)} style={styles.modalCloseButton}>
                        <Text style={styles.modalCloseText}>✖</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ width: '100%' }}>
                      {[
                        { value: 'everyone', label: 'Everyone (All Anonymous Members)' },
                        { value: 'followers', label: 'Only Users I Follow' },
                        { value: 'nobody', label: 'Nobody (Disable Message Requests)' }
                      ].map((opt) => {
                        const isActive = dmPermission === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            onPress={() => {
                              setDmPermission(opt.value);
                              setShowDmPicker(false);
                            }}
                            style={{
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              borderBottomWidth: 1,
                              borderBottomColor: '#F8F5F4',
                              backgroundColor: isActive ? 'rgba(111, 64, 95, 0.05)' : 'transparent',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '100%',
                            }}
                          >
                            <Text style={{
                              fontSize: 13.5,
                              fontWeight: isActive ? 'bold' : 'normal',
                              color: isActive ? '#6F405F' : '#2D1D15',
                            }}>
                              {opt.label}
                            </Text>
                            {isActive && <Text style={{ color: '#6F405F', fontWeight: 'bold' }}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </SafeAreaView>
          );
        })()}
      </Modal>

      {/* Safety & Moderation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={safetySettingsVisible}
        onRequestClose={() => setSafetySettingsVisible(false)}
      >
        {(() => {
          const handleBlockSubmit = () => {
            if (!blockUsernameInput) {
              Alert.alert('Error', 'Please enter a username to block.');
              return;
            }
            let formatted = blockUsernameInput.trim();
            if (!formatted.startsWith('@')) {
              formatted = '@' + formatted;
            }
            if (formatted === currentUser?.username) {
              Alert.alert('Error', 'You cannot block your own account.');
              return;
            }
            if (blockedUsers.includes(formatted)) {
              Alert.alert('Error', `${formatted} is already blocked.`);
              return;
            }
            blockUser(formatted);
            Alert.alert('Success', `${formatted} has been blocked.`);
            setBlockUsernameInput('');
          };

          const renderCheckbox = (label: string, value: boolean, onToggle: () => void) => (
            <TouchableOpacity
              onPress={onToggle}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 9,
                gap: 10,
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: '#6F405F',
                backgroundColor: value ? '#6F405F' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {value && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13, color: '#5C5254', flex: 1, lineHeight: 18 }}>{label}</Text>
            </TouchableOpacity>
          );

          // Custom vector icons matching Lucide styling
          const ShieldCheckIcon = () => (
            <View style={{ width: 22, height: 26, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 11, borderBottomRightRadius: 11, borderWidth: 2, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold', marginTop: -2 }}>✓</Text>
            </View>
          );

          const FunnelIcon = () => (
            <View style={{ width: 22, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              <View style={{
                width: 16,
                height: 6,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                backgroundColor: '#6F405F',
              }} />
              <View style={{
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderTopWidth: 6,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: '#6F405F',
              }} />
              <View style={{
                width: 4,
                height: 6,
                backgroundColor: '#6F405F',
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
              }} />
            </View>
          );

          const BlockIcon = () => (
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6F405F', justifyContent: 'center', alignItems: 'center', marginRight: 8, position: 'relative' }}>
              <View style={{
                position: 'absolute',
                width: 16,
                height: 2,
                backgroundColor: '#6F405F',
                transform: [{ rotate: '-45deg' }]
              }} />
            </View>
          );

          const AlertIcon = () => (
            <View style={{ width: 22, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 8, position: 'relative' }}>
              <View style={{
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 10,
                borderRightWidth: 10,
                borderBottomWidth: 18,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#6F405F',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', marginTop: 4, transform: [{ scale: 0.95 }] }}>!</Text>
              </View>
            </View>
          );

          return (
            <SafeAreaView style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('safetyAndModerationTitle', 'Safety & Moderation')}</Text>
                  <TouchableOpacity onPress={() => setSafetySettingsVisible(false)} style={styles.modalCloseButton}>
                    <CloseIcon color="#8C8385" size={14} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>

                  {/* Account Standing Banner */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#E6F4EA',
                    borderWidth: 1,
                    borderColor: '#137333',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 20,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                      <ShieldCheckIcon />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontSize: 13.5, color: '#137333', fontWeight: 'bold' }}>Account Standing: Good & Compliant</Text>
                        <Text style={{ fontSize: 11, color: '#137333', marginTop: 2 }}>
                          0 Community Warnings • 0 Content Violations • Full Privileges
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowReportsList(!showReportsList)}
                      style={{
                        backgroundColor: '#FAF8F8',
                        borderWidth: 1,
                        borderColor: '#E6E1E0',
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11.5, color: '#2D1D15', fontWeight: 'bold' }}>
                        {showReportsList ? '⚙️ Safety Settings' : '🏳️ My Reports'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showReportsList ? (
                    /* Reports Tracking View */
                    <View style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <AlertIcon />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Submitted Safety Reports ({reports.filter((r: any) => r.reporterId === currentUser?.id).length})</Text>
                      </View>
                      <Text style={{ fontSize: 11.5, color: '#8C8385', lineHeight: 16, marginBottom: 10 }}>
                        Track status and updates of posts/comments you have flagged for community guideline violations.
                      </Text>

                      <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0ECEB', borderRadius: 12, padding: 12 }}>
                        {reports.filter((r: any) => r.reporterId === currentUser?.id).length === 0 ? (
                          <Text style={{ fontSize: 12.5, color: '#8C8385', textAlign: 'center', paddingVertical: 10 }}>No reports filed by you.</Text>
                        ) : (
                          reports.filter((r: any) => r.reporterId === currentUser?.id).map((r: any) => (
                            <View key={r.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5ECEB' }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15' }}>Report #{r.id}</Text>
                                <View style={{
                                  backgroundColor: r.status === 'RESOLVED' ? '#D1FAE5' : '#FEF3C7',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                }}>
                                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: r.status === 'RESOLVED' ? '#065F46' : '#92400E' }}>{r.status}</Text>
                                </View>
                              </View>
                              <Text style={{ fontSize: 12, color: '#5C5254', lineHeight: 16 }}>Target: {r.reportedPostTitle || 'Post'}</Text>
                              <Text style={{ fontSize: 11, color: '#8C8385', marginTop: 2 }}>Reason: {r.reason}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  ) : (
                    /* Main Safety Settings view */
                    <View>
                      {/* 1. Automated Content Filters */}
                      <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <FunnelIcon />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Automated Content Filters</Text>
                        </View>

                        {renderCheckbox("Strict AI moderation: Auto-hide controversial or disputed thoughts", strictAi, () => setStrictAi(!strictAi))}
                        {renderCheckbox("Filter abusive comments or toxic language from discussion threads", filterAbusive, () => setFilterAbusive(!filterAbusive))}
                        {renderCheckbox("Mask offensive profanity words in feed titles (e.g. f***)", maskProfanity, () => setMaskProfanity(!maskProfanity))}
                        {renderCheckbox("Display supportive helpline resources on distress-related posts", displayHelpline, () => setDisplayHelpline(!displayHelpline))}
                      </View>

                      {/* 2. Muted Keywords & Phrases */}
                      <View style={{ borderTopWidth: 1, borderTopColor: '#F0ECEB', paddingTop: 16, marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <AlertIcon />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Muted Keywords & Phrases</Text>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#8C8385', lineHeight: 16, marginBottom: 10 }}>
                          Posts containing any of these keywords will be hidden from your feeds automatically.
                        </Text>

                        {/* Keyword Add Form */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <TextInput
                            value={keywordInput}
                            onChangeText={setKeywordInput}
                            placeholder="Enter keyword to mute..."
                            placeholderTextColor={COLORS.zorba}
                            autoCapitalize="none"
                            style={{
                              flex: 1,
                              height: 42,
                              borderWidth: 1,
                              borderColor: '#CEC7C5',
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              color: '#2D1D15',
                              fontSize: 13,
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              if (!keywordInput.trim()) return;
                              const kw = keywordInput.trim().toLowerCase();
                              if (mutedKeywords.includes(kw)) {
                                Alert.alert('Info', 'Keyword is already muted.');
                                return;
                              }
                              setMutedKeywords([...mutedKeywords, kw]);
                              setKeywordInput('');
                            }}
                            style={{
                              backgroundColor: '#EAE6E5',
                              borderWidth: 1,
                              borderColor: '#CEC7C5',
                              borderRadius: 8,
                              paddingHorizontal: 16,
                              height: 42,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#2D1D15', fontSize: 13, fontWeight: 'bold' }}>+ Add</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Badges List */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {mutedKeywords.map((kw) => (
                            <View
                              key={kw}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#FAF8F8',
                                borderWidth: 1,
                                borderColor: '#E6E1E0',
                                borderRadius: 16,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                gap: 6,
                              }}
                            >
                              <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: 'bold' }}>{kw}</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setMutedKeywords(mutedKeywords.filter(k => k !== kw));
                                }}
                              >
                                <Text style={{ fontSize: 12, color: '#C46F76', fontWeight: 'bold' }}>✖</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* 3. Block Member Form */}
                      <View style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#F0ECEB',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D1D15', marginBottom: 6 }}>Block New Member</Text>
                        <Text style={{ fontSize: 11.5, color: '#8C8385', lineHeight: 16, marginBottom: 12 }}>
                          Enter their anonymous handle (e.g. @user_12) to mute their posts, comments, and prevent them from sending message requests.
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <TextInput
                            value={blockUsernameInput}
                            onChangeText={setBlockUsernameInput}
                            placeholder="Enter handle to block..."
                            placeholderTextColor={COLORS.zorba}
                            autoCapitalize="none"
                            style={{
                              flex: 1,
                              height: 42,
                              borderWidth: 1,
                              borderColor: '#CEC7C5',
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              color: '#2D1D15',
                              fontSize: 13,
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                          <TouchableOpacity
                            onPress={handleBlockSubmit}
                            style={{
                              backgroundColor: '#6F405F',
                              borderRadius: 8,
                              paddingHorizontal: 20,
                              height: 42,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: 'bold' }}>Block</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* 4. Blocked Users List */}
                      {(() => {
                        const uniqueBlocked = Array.from(
                          new Set(
                            (blockedUsers || []).map((u: string) => {
                              const clean = u.replace(/^@/, '').trim();
                              return clean ? `@${clean}` : '';
                            }).filter(Boolean)
                          )
                        ) as string[];
                        return (
                          <View style={{ borderTopWidth: 1, borderTopColor: '#F0ECEB', paddingTop: 16, marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <BlockIcon />
                              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D1D15' }}>Blocked Accounts ({uniqueBlocked.length})</Text>
                            </View>
                            <Text style={{ fontSize: 11.5, color: '#8C8385', lineHeight: 16, marginBottom: 10 }}>
                              These members cannot comment on your posts or send you messages. Their posts are hidden from your feed.
                            </Text>

                            <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0ECEB', borderRadius: 12, padding: 12 }}>
                              {uniqueBlocked.length === 0 ? (
                                <Text style={{ fontSize: 12.5, color: '#8C8385', textAlign: 'center', paddingVertical: 10 }}>No blocked users yet.</Text>
                              ) : (
                                uniqueBlocked.map((username: string) => (
                                  <View key={username} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5ECEB' }}>
                                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#2D1D15' }}>{username}</Text>
                                    <TouchableOpacity
                                      onPress={() => {
                                        unblockUser(username);
                                        Alert.alert('Success', `Unblocked ${username} successfully.`);
                                      }}
                                      style={{
                                        backgroundColor: '#FAF8F8',
                                        borderWidth: 1,
                                        borderColor: '#E6E1E0',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 12,
                                      }}
                                    >
                                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#6F405F' }}>Unblock</Text>
                                    </TouchableOpacity>
                                  </View>
                                ))
                              )}
                            </View>
                          </View>
                        );
                      })()}

                      {/* Save Button */}
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Success', 'Safety settings saved successfully.');
                          setSafetySettingsVisible(false);
                        }}
                        style={[styles.primaryButton, { marginTop: 10, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
                      >
                        <Text style={{ fontSize: 15, marginRight: 4 }}>💾</Text>
                        <Text style={styles.primaryButtonText}>Save Safety Settings</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </ScrollView>
              </View>
            </SafeAreaView>
          );
        })()}
      </Modal>

      {/* My Thoughts Modal (My Posts Screen equivalent) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={myPostsVisible}
        onRequestClose={() => setMyPostsVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('myThoughts', 'My Thoughts')}</Text>
              <TouchableOpacity onPress={() => setMyPostsVisible(false)} style={styles.modalCloseButton}>
                <CloseIcon color="#8C8385" size={14} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1, backgroundColor: '#F8F5F4' }}>
              {ownPosts.length === 0 ? (
                <View style={{ flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>✍️</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D1D15', textAlign: 'center' }}>
                    No Thoughts Published Yet
                  </Text>
                  <Text style={{ fontSize: 12.5, color: '#8C8385', textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                    Share your first thought by tapping the "+" button in the feed navigation footer!
                  </Text>
                </View>
              ) : (
                <View style={{ paddingVertical: 8 }}>
                  {ownPosts.map((post: any) => (
                    <PostCardItem
                      key={post.id}
                      item={post}
                      currentUser={currentUser}
                      handlePostReact={reactToPost}
                      onNavigateToChat={() => { }}
                      setActiveReportPost={() => { }}
                      setReportModalVisible={() => { }}
                      onOpenComments={async (selectedPostItem: any) => {
                        setSelectedPost(selectedPostItem);
                        setCommentModalVisible(true);
                        const comments = await loadComments(selectedPostItem.id);
                        setSelectedPost((prev: any) => prev ? { ...prev, comments } : null);
                      }}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Discussion comments Modal */}
      {activePostForModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={commentModalVisible}
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments ({activePostForModal.comments?.length || 0})</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✖</Text>
                </TouchableOpacity>
              </View>

              {/* Selected post reference */}
              <View style={styles.modalPostBrief}>
                <Text style={styles.modalPostUser}>{activePostForModal.username}</Text>
                <Text style={styles.modalPostText} numberOfLines={2}>{activePostForModal.content}</Text>
              </View>

              {/* Comment list */}
              <FlatList
                data={activePostForModal.comments}
                keyExtractor={c => c.id}
                style={{ flex: 1 }}
                extraData={{ currentLanguage, translationCache }}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item: c }) => (
                  <CommentItem
                    comment={c}
                    postId={activePostForModal.id}
                    currentUser={currentUser}
                    postAuthorUsername={activePostForModal.username}
                    onNavigateToChat={(username, authorId, initials, color) => {
                      setCommentModalVisible(false);
                      if (onNavigateToChat) {
                        onNavigateToChat(username, authorId, initials, color);
                      }
                    }}
                  />
                )}
              />

              {/* Add comment drawer bar */}
              <CommentComposer
                postId={activePostForModal.id}
                onSubmit={async (text) => {
                  await addComment(activePostForModal.id, text, currentUser);
                  const comments = await loadComments(activePostForModal.id);
                  setSelectedPost((prev: any) => prev ? { ...prev, comments } : null);
                }}
                placeholder="Share a thoughtful reply..."
                currentUser={currentUser}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </ScrollView>
  );
}
