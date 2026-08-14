import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { AuthProvider, useAuth as _useAuth } from './src/context/AuthContext';
import { PostProvider, usePosts as _usePosts } from './src/context/PostContext';
import { ChatProvider, useChat as _useChat } from './src/context/ChatContext';
import { NotificationProvider, useNotifications as _useNotifications } from './src/context/NotificationContext';
import { LanguageProvider, useLanguage as _useLanguage } from './src/context/LanguageContext';
import { apiService } from './src/services/apiService';

const useAuth = _useAuth as any;
const usePosts = _usePosts as any;
const useChat = _useChat as any;
const useNotifications = _useNotifications as any;
const useLanguage = _useLanguage as any;

import { COLORS, RADIUS, SHADOWS } from './src/styles/theme';

// ── CUSTOM COMPONENT: PREMIUM AVATAR ──
function InitialAvatar({ initials, color, size = 44 }: { initials: any; color: any; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2.2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ── AUTHENTICATION SCREEN & LANDING OVERHAUL ──
function AuthScreen() {
  const { login, register, verifyEmailOtp, resendEmailOtp } = useAuth();

  // Views: 'landing' | 'login' | 'register'
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // Input states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Checkbox agreement states (matching web)
  const [confirm18, setConfirm18] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptGuidelines, setAcceptGuidelines] = useState(false);

  // Email Verification OTP Modal States
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Policy Modals in Landing/Auth screen
  const [aboutVisible, setAboutVisible] = useState(false);
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  // Contact support form states
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const canRegister = fullName.trim() && mobileNumber.trim() && email.trim() && password.trim() && confirm18 && acceptTerms && acceptGuidelines && !loading;

  const handleLoginSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!canRegister) {
      setErrorMsg('Please fill in all fields and agree to the policies.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      // Validate mobile number: 10 digits
      if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
        throw new Error('Mobile number must be 10 digits starting with 6-9');
      }
      // Validate password: 8-30 chars
      if (password.length < 8 || password.length > 30) {
        throw new Error('Password must be between 8 and 30 characters');
      }

      // Pre-registration API request
      await register({ fullName: fullName.trim(), email: email.trim(), mobileNumber: mobileNumber.trim(), password });

      // Trigger Verification OTP step (same as web)
      setOtpCode('');
      setOtpError('');
      setResendTimer(30);
      setOtpModalVisible(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) { return; }
    try {
      await resendEmailOtp(email.trim());
      setResendTimer(30); // 30-second cooldown
      Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend verification OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      await verifyEmailOtp(email.trim(), otpCode);

      setOtpModalVisible(false);

      // Clean up signup details except email (which helps autofill)
      setFullName('');
      setMobileNumber('');
      setPassword('');
      setConfirm18(false);
      setAcceptTerms(false);
      setAcceptGuidelines(false);

      // Redirect user to the Login screen
      goToView('login');

      // Show a clear success message
      Alert.alert(
        'Registration Success',
        'Your account has been registered and verified successfully! Please log in now using your credentials.'
      );
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
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

  // Switch view helpers
  const goToView = (view: 'landing' | 'login' | 'register') => {
    setErrorMsg('');
    setAuthView(view);
  };

  // Custom Checkbox Row Component
  const AgreementCheckRow = ({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) => (
    <TouchableOpacity onPress={onPress} style={styles.checkRowContainer}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <Text style={styles.checkRowText}>{text}</Text>
    </TouchableOpacity>
  );

  if (authView === 'login') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.authContainer}
      >
        <View style={styles.authCard}>
          <TouchableOpacity onPress={() => goToView('landing')} style={styles.authBackBtn}>
            <Text style={styles.authBackBtnText}>← Back to Home</Text>
          </TouchableOpacity>
          <View style={styles.authLogoCircle}>
            <Text style={styles.authLogoText}>🎙️</Text>
          </View>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSubtitle}>Sign in to your account using your email and password.</Text>

          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TextInput
            placeholder="Email Address"
            placeholderTextColor={COLORS.zorba}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <View style={styles.passwordInputContainer}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={COLORS.zorba}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0 }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordEyeBtn}>
              <Text style={styles.passwordEyeText}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Password Reset Assistance',
                'To protect privacy on our anonymous platform, passwords cannot be reset automatically. If you lost your password, please contact safety support at support@awaazmanki.com with your registered email and mobile number.'
              );
            }}
            style={{ alignSelf: 'flex-end', marginTop: 6, marginBottom: 16 }}
          >
            <Text style={{ fontSize: 12, color: COLORS.zorba, textDecorationLine: 'underline' }}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleLoginSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => goToView('register')} style={styles.switchAuthButton}>
            <Text style={styles.switchAuthText}>
              Don't have an account? Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (authView === 'register') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.authContainer}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}>
          <View style={styles.authCard}>
            <TouchableOpacity onPress={() => goToView('landing')} style={styles.authBackBtn}>
              <Text style={styles.authBackBtnText}>← Back to Home</Text>
            </TouchableOpacity>
            <View style={styles.authLogoCircle}>
              <Text style={styles.authLogoText}>🎙️</Text>
            </View>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>Your identity stays private. Your voice matters.</Text>

            <View style={styles.privacyBadgesRow}>
              <View style={styles.privacyBadge}>
                <Text style={styles.privacyBadgeText}>🔒 Real name kept private</Text>
              </View>
              <View style={styles.privacyBadge}>
                <Text style={styles.privacyBadgeText}>🎭 Anonymous handle only</Text>
              </View>
            </View>

            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TextInput
              placeholder="Full Name (private)"
              placeholderTextColor={COLORS.zorba}
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />

            <TextInput
              placeholder="Mobile Number (private)"
              placeholderTextColor={COLORS.zorba}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />

            <TextInput
              placeholder="Email Address"
              placeholderTextColor={COLORS.zorba}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder="Password (min 8 chars)"
                placeholderTextColor={COLORS.zorba}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordEyeBtn}>
                <Text style={styles.passwordEyeText}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.checkboxesContainer}>
              <AgreementCheckRow
                checked={confirm18}
                onPress={() => setConfirm18(!confirm18)}
                text="I confirm I am 18 years or older"
              />
              <AgreementCheckRow
                checked={acceptTerms}
                onPress={() => setAcceptTerms(!acceptTerms)}
                text="I accept the Terms & Conditions of use"
              />
              <AgreementCheckRow
                checked={acceptGuidelines}
                onPress={() => setAcceptGuidelines(!acceptGuidelines)}
                text="I agree to Community Guidelines and hate policy"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!canRegister || loading) && { opacity: 0.5, backgroundColor: COLORS.zorba }]}
              onPress={handleRegisterSubmit}
              disabled={!canRegister || loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => goToView('login')} style={styles.switchAuthButton}>
              <Text style={styles.switchAuthText}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Email OTP Verification Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={otpModalVisible}
          onRequestClose={() => setOtpModalVisible(false)}
        >
          <SafeAreaView style={styles.centerModalOverlay}>
            <View style={styles.reportModalCard}>
              <Text style={styles.reportModalTitle}>Verify Your Email Address</Text>
              <Text style={styles.reportModalSubtitle}>An OTP code has been sent to {email}. Enter it below to complete verification.</Text>

              <View style={styles.otpNoticeRow}>
                <Text style={styles.otpNoticeText}>ℹ️ Check your email spam/junk folder if code is not received.</Text>
              </View>

              {!!otpError && (
                <View style={[styles.errorBanner, { marginTop: 10 }]}>
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              )}

              <TextInput
                placeholder="••••••"
                placeholderTextColor={COLORS.zorba}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, { letterSpacing: 10, textAlign: 'center', fontSize: 20, fontWeight: 'bold', height: 52, marginTop: 10 }]}
              />

              <View style={styles.otpActionRow}>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  style={[styles.otpResendBtn, resendTimer > 0 && { opacity: 0.5 }]}
                  disabled={resendTimer > 0}
                >
                  <Text style={styles.otpResendText}>
                    {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  style={[styles.otpVerifyBtn, (otpCode.length !== 6 || verifyingOtp) && { opacity: 0.5 }]}
                  disabled={otpCode.length !== 6 || verifyingOtp}
                >
                  <Text style={styles.otpVerifyText}>{verifyingOtp ? 'Verifying...' : 'Verify & Continue'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // DEFAULT VIEW: Landing Page ('landing')
  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Mann Ki Aawaj</Text>
        <Text style={styles.headerDot}>•</Text>
        <TouchableOpacity onPress={() => goToView('login')} style={styles.headerLoginShortcut}>
          <Text style={styles.headerLoginShortcutText}>Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1 }}>
        {/* 1. HERO SECTION */}
        <View style={styles.landingHeroBlock}>
          <View style={styles.badgeBanner}>
            <Text style={styles.badgeBannerText}>🛡️ India's Anonymous Discussion Platform</Text>
          </View>
          <Text style={styles.landingHeroHeadline}>
            Where Thoughts{'\n'}Matter More{'\n'}
            <Text style={{ color: COLORS.warning }}>Than Identity.</Text>
          </Text>
          <Text style={styles.landingHeroSubText}>
            Share your thoughts, experiences and opinions without revealing your identity. AI moderation keeps discussions respectful.
          </Text>

          <View style={styles.landingHeroCtaRow}>
            <TouchableOpacity onPress={() => goToView('register')} style={styles.landingHeroCtaBtnPrimary}>
              <Text style={styles.landingHeroCtaTextPrimary}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goToView('login')} style={styles.landingHeroCtaBtnSecondary}>
              <Text style={styles.landingHeroCtaTextSecondary}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Trust badges */}
          <View style={styles.trustBadgesGrid}>
            <View style={styles.trustBadgeItem}>
              <Text style={styles.trustBadgeIcon}>🔒</Text>
              <Text style={styles.trustBadgeLabel}>Anonymous</Text>
            </View>
            <View style={styles.trustBadgeItem}>
              <Text style={styles.trustBadgeIcon}>🛡️</Text>
              <Text style={styles.trustBadgeLabel}>AI Moderated</Text>
            </View>
            <View style={styles.trustBadgeItem}>
              <Text style={styles.trustBadgeIcon}>🎙️</Text>
              <Text style={styles.trustBadgeLabel}>Voice-to-Text</Text>
            </View>
            <View style={styles.trustBadgeItem}>
              <Text style={styles.trustBadgeIcon}>🌐</Text>
              <Text style={styles.trustBadgeLabel}>Indian Languages</Text>
            </View>
          </View>
        </View>

        {/* 2. FEATURES SECTION */}
        <View style={styles.landingSection}>
          <Text style={styles.landingSectionTitle}>What Makes Us Different</Text>
          <View style={styles.landingTitleDivider} />

          <View style={styles.featureCardItem}>
            <View style={styles.featureCardIconCircle}>
              <Text style={{ fontSize: 24 }}>🔒</Text>
            </View>
            <Text style={styles.featureCardHeader}>Anonymous by Design</Text>
            <Text style={styles.featureCardBody}>No real names. No public profiles. Custom anonymous avatars generated for you.</Text>
          </View>

          <View style={styles.featureCardItem}>
            <View style={styles.featureCardIconCircle}>
              <Text style={{ fontSize: 24 }}>🛡️</Text>
            </View>
            <Text style={styles.featureCardHeader}>AI-Powered Safety</Text>
            <Text style={styles.featureCardBody}>Detects hate speech. Filters harassment. Keeps community conversations safe.</Text>
          </View>

          <View style={styles.featureCardItem}>
            <View style={styles.featureCardIconCircle}>
              <Text style={{ fontSize: 24 }}>🎙️</Text>
            </View>
            <Text style={styles.featureCardHeader}>Voice-to-Text</Text>
            <Text style={styles.featureCardBody}>Speak naturally. Supports local Indian languages. Voice files are deleted after translation.</Text>
          </View>
        </View>

        {/* 3. HOW IT WORKS */}
        <View style={[styles.landingSection, { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E1DCDB' }]}>
          <Text style={styles.landingSectionTitle}>How It Works</Text>
          <View style={styles.landingTitleDivider} />

          <View style={styles.howItWorksRow}>
            <View style={styles.howItWorksNumberBox}><Text style={styles.howItWorksNumber}>1</Text></View>
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>Register Privately</Text>
              <Text style={styles.howItWorksBody}>Your phone number and name are kept strictly private.</Text>
            </View>
          </View>

          <View style={styles.howItWorksRow}>
            <View style={styles.howItWorksNumberBox}><Text style={styles.howItWorksNumber}>2</Text></View>
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>Write Anonymously</Text>
              <Text style={styles.howItWorksBody}>Publish thoughts with initials-based colored avatars.</Text>
            </View>
          </View>

          <View style={styles.howItWorksRow}>
            <View style={styles.howItWorksNumberBox}><Text style={styles.howItWorksNumber}>3</Text></View>
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>Interact with Empathy</Text>
              <Text style={styles.howItWorksBody}>React with helpful support emojis or send safe anonymous DMs.</Text>
            </View>
          </View>

          <View style={styles.howItWorksRow}>
            <View style={styles.howItWorksNumberBox}><Text style={styles.howItWorksNumber}>4</Text></View>
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>Safe Spaces</Text>
              <Text style={styles.howItWorksBody}>Real-time automated content filtration keeps discussions respectful.</Text>
            </View>
          </View>
        </View>

        {/* 4. SAFETY RULES */}
        <View style={styles.landingSection}>
          <Text style={styles.landingSectionTitle}>Safety First Policy</Text>
          <View style={styles.landingTitleDivider} />

          <View style={styles.safetyBulletBlock}>
            <Text style={styles.safetyBulletIcon}>🚩</Text>
            <Text style={styles.safetyBulletText}>
              Zero tolerance policy for hate speech, harassment, spam, and personal info exposure.
            </Text>
          </View>
          <View style={styles.safetyBulletBlock}>
            <Text style={styles.safetyBulletIcon}>🤖</Text>
            <Text style={styles.safetyBulletText}>
              Automated moderation classification runs before any post or comment goes public.
            </Text>
          </View>
          <View style={styles.safetyBulletBlock}>
            <Text style={styles.safetyBulletIcon}>🛡️</Text>
            <Text style={styles.safetyBulletText}>
              Flagged content is reviewed by human admins, allowing direct post hide or author ban actions.
            </Text>
          </View>
        </View>

        {/* 5. FOOTER POLICY NAV */}
        <View style={styles.landingFooterNav}>
          <Text style={styles.footerBrandTitle}>Man Ki Aavaj</Text>
          <Text style={styles.footerBrandDesc}>An 18+ anonymous, text-first social space for authentic thoughts.</Text>

          <View style={styles.footerLinksGrid}>
            <TouchableOpacity onPress={() => setAboutVisible(true)} style={styles.footerNavLink}>
              <Text style={styles.footerNavLinkText}>About Platform</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGuidelinesVisible(true)} style={styles.footerNavLink}>
              <Text style={styles.footerNavLinkText}>Guidelines</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPrivacyVisible(true)} style={styles.footerNavLink}>
              <Text style={styles.footerNavLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setContactVisible(true)} style={styles.footerNavLink}>
              <Text style={styles.footerNavLinkText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerCopyright}>© 2026 Man Ki Aavaj. Privacy Guaranteed.</Text>
        </View>
      </ScrollView>

      {/* MODALS REUSED FROM APP */}
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
    </View>
  );
}

// ── CUSTOM COMPONENT: COMMENT ITEM WITH NESTED REPLIES ──
function CommentItem({ comment: c, postId, currentUser }: { comment: any; postId: any; currentUser: any }) {
  const { replyToComment, updateComment, deleteComment, reactToComment, translateComment } = usePosts();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(c.content);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSendReply = () => {
    if (!replyText.trim()) { return; }
    replyToComment(c.id, postId, replyText.trim(), currentUser);
    setReplyText('');
    setShowReplyInput(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) { return; }
    updateComment(c.id, postId, editText.trim());
    setIsEditing(false);
  };

  const { currentLanguage, translateText } = useLanguage();

  const hasPreTranslation = c.originalContent && c.content && c.originalContent !== c.content;
  const displayContent = showOriginal
    ? (c.originalContent || c.content)
    : (hasPreTranslation ? c.content : translateText(c.originalContent || c.content, currentLanguage));

  const originalLanguage = c.displayLanguage === 'HI' ? 'HI' : (c.displayLanguage === 'MR' ? 'MR' : 'EN');
  const showButton = hasPreTranslation || (originalLanguage !== currentLanguage);

  const isOwner = c.username === currentUser?.username;
  const reactionCount: any = Object.values(c.reactions || {}).reduce((a: any, b: any) => a + b, 0);

  return (
    <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8F5F4', paddingBottom: 12 }}>
      {/* Comment Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <InitialAvatar initials={c.avatarInitials} color={c.avatarColor || '#3F7772'} size={28} />
          <Text style={[styles.commentUser, { marginLeft: 8 }]}>{c.username}</Text>
        </View>

        {/* Actions Menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => setShowEmojis(!showEmojis)}>
            <Text style={{ fontSize: 13 }}>😀</Text>
          </TouchableOpacity>
          {showButton && (
            <TouchableOpacity onPress={() => setShowOriginal(!showOriginal)}>
              <Text style={{ fontSize: 11, color: COLORS.deepPlum, fontWeight: 'bold' }}>
                {showOriginal ? (currentLanguage === 'HI' ? 'अनुवाद देखें' : 'Show Translation') : 'Original'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowReplyInput(!showReplyInput)}>
            <Text style={{ fontSize: 11, color: '#8C8385', fontWeight: 'bold' }}>Reply</Text>
          </TouchableOpacity>
          {isOwner && (
            <>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Text style={{ fontSize: 11, color: COLORS.warning, fontWeight: 'bold' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteComment(c.id, postId)}>
                <Text style={{ fontSize: 11, color: COLORS.error, fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Emoji Picker Bar */}
      {showEmojis && (
        <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 6, paddingLeft: 36 }}>
          {['❤️', '👍', '🔥', '🤝', '💯'].map(emoji => {
            const reactionMap: Record<string, string> = { '❤️': 'relate', '👍': 'wellSaid', '🔥': 'helpful', '🤝': 'stayStrong', '💯': 'madeMeThink' };
            const reactionKey = reactionMap[emoji];
            return (
              <TouchableOpacity key={emoji} onPress={() => { reactToComment(c.id, postId, reactionKey); setShowEmojis(false); }}>
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Comment Body */}
      <View style={{ paddingLeft: 36, marginTop: 4 }}>
        {isEditing ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={[styles.input, { flex: 1, marginBottom: 0, height: 36, paddingVertical: 4 }]}
            />
            <TouchableOpacity onPress={handleSaveEdit} style={[styles.commentSendButton, { height: 36 }]}>
              <Text style={styles.commentSendText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.commentContent, { fontSize: 13.5, color: '#2D1D15' }]}>{displayContent}</Text>
        )}
      </View>

      {/* Render Reaction Display Count */}
      {reactionCount > 0 && (
        <View style={{ flexDirection: 'row', gap: 4, paddingLeft: 36, marginTop: 4 }}>
          {Object.entries(c.reactions || {}).map(([emojiKey, val]: any) => {
            const emojis: Record<string, string> = { relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯' };
            if (!val) { return null; }
            return (
              <View key={emojiKey} style={{ backgroundColor: '#FAF8F8', borderWidth: 1, borderColor: '#E1DCDB', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, color: COLORS.zorba }}>{emojis[emojiKey]} {val}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Nested Replies */}
      {c.replies && c.replies.length > 0 && (
        <View style={{ paddingLeft: 36, marginTop: 8, borderLeftWidth: 1.5, borderLeftColor: '#E1DCDB', marginLeft: 14 }}>
          {c.replies.map((r: any) => {
            const isReplyOwner = r.username === currentUser?.username;
            return (
              <View key={r.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <InitialAvatar initials={r.avatarInitials} color={r.avatarColor || '#6F405F'} size={22} />
                    <Text style={[styles.commentUser, { marginLeft: 6, fontSize: 11.5, color: '#8C8385' }]}>{r.username}</Text>
                  </View>
                  {isReplyOwner && (
                    <TouchableOpacity onPress={() => deleteComment(r.id, postId)}>
                      <Text style={{ fontSize: 10, color: COLORS.error }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{ fontSize: 12.5, color: '#2D1D15', marginLeft: 28, marginTop: 2 }}>{r.content}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Reply Input Box */}
      {showReplyInput && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingLeft: 36, marginTop: 8 }}>
          <TextInput
            placeholder={`Reply to ${c.username}...`}
            placeholderTextColor={COLORS.zorba}
            value={replyText}
            onChangeText={setReplyText}
            style={[styles.input, { flex: 1, marginBottom: 0, height: 36, paddingVertical: 4 }]}
          />
          <TouchableOpacity onPress={handleSendReply} style={[styles.commentSendButton, { height: 36 }]}>
            <Text style={styles.commentSendText}>Reply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── CUSTOM COMPONENT: POST CARD ITEM WITH BOOKMARK AND TRANSLATION ──
function PostCardItem({ item, currentUser, handlePostReact, onNavigateToChat, setActiveReportPost, setReportModalVisible, onOpenComments }: {
  item: any;
  currentUser: any;
  handlePostReact: any;
  onNavigateToChat: any;
  setActiveReportPost: any;
  setReportModalVisible: any;
  onOpenComments: any;
}) {
  const { toggleSavePost, deletePost } = usePosts();
  const { currentLanguage, translateText } = useLanguage();
  const [showOriginal, setShowOriginal] = useState(false);

  const hasPreTranslation = item.originalContent && item.content && item.originalContent !== item.content;
  const displayContent = showOriginal
    ? (item.originalContent || item.content)
    : (hasPreTranslation ? item.content : translateText(item.originalContent || item.content, currentLanguage));

  const originalLanguage = item.language || 'EN';
  const showButton = hasPreTranslation || (originalLanguage !== currentLanguage);

  const userReacted = item.userReaction;
  const topicColors: Record<string, string> = {
    'mental health': '#3F7772',
    'career': '#D96C3D',
    'relationships': '#C46F76',
    'general': '#6F405F',
  };
  let topicThemeColor = COLORS.zorba;
  const topicLower = (item.topic || 'General').toLowerCase();
  for (const [key, val] of Object.entries(topicColors)) {
    if (topicLower.includes(key)) {
      topicThemeColor = val;
      break;
    }
  }

  const isPostOwner = item.username === currentUser?.username;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={40} />
        <View style={styles.postHeaderInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.postUsername}>{item.username}</Text>
            {isPostOwner && (
              <TouchableOpacity onPress={() => deletePost(item.id)}>
                <Text style={{ fontSize: 11, color: COLORS.error }}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.postMeta}>{item.postType}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => toggleSavePost(item.id)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18 }}>{item.isSaved ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
          <View style={[styles.topicBadgePill, { backgroundColor: topicThemeColor + '1E', borderColor: topicThemeColor }]}>
            <Text style={[styles.topicBadgeText, { color: topicThemeColor }]}>{item.topic}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{displayContent}</Text>

      {/* Dynamic Translation Label */}
      {showButton && (
        <TouchableOpacity onPress={() => setShowOriginal(!showOriginal)} style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.deepPlum, fontWeight: 'bold' }}>
            🌐 {showOriginal ? `Translate to ${currentLanguage === 'HI' ? 'Hindi' : (currentLanguage === 'MR' ? 'Marathi' : 'English')}` : `Show Original (${originalLanguage})`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Reactions display pills */}
      <View style={styles.reactionsDisplayRow}>
        {Object.keys(item.reactions).map(reaction => {
          const emojis: Record<string, string> = { relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯' };
          const count = item.reactions[reaction];
          const active = userReacted === reaction;
          if (count === 0 && !active) { return null; }
          return (
            <TouchableOpacity
              key={reaction}
              style={[styles.reactionBadge, active && styles.reactionBadgeActive]}
              onPress={() => handlePostReact(item.id, reaction)}
            >
              <Text style={[styles.reactionBadgeText, active && { color: '#FFF', fontWeight: 'bold' }]}>
                {emojis[reaction]} {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action row */}
      <View style={styles.postActionRow}>
        {/* Emoji bar picker */}
        <View style={styles.emojiPickerBar}>
          {Object.entries({ relate: '❤️', wellSaid: '👍', helpful: '🔥', stayStrong: '🤝', madeMeThink: '💯' }).map(([key, emoji]) => (
            <TouchableOpacity key={key} onPress={() => handlePostReact(item.id, key)} style={styles.emojiPickerButton}>
              <Text style={[styles.emojiPickerText, userReacted === key && { transform: [{ scale: 1.3 }] }]}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionButtonContainer}>
          {/* Comment triggers */}
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => onOpenComments(item)}
          >
            <Text style={styles.commentActionButtonText}>💬 {item.commentCount}</Text>
          </TouchableOpacity>

          {/* Chat triggers */}
          {item.username !== currentUser?.username && (
            <TouchableOpacity
              style={styles.chatActionButton}
              onPress={() => onNavigateToChat(item.username, item.authorId || item.userId || item.user?.id, item.avatarInitials, item.avatarColor)}
            >
              <Text style={styles.chatActionButtonText}>DM</Text>
            </TouchableOpacity>
          )}

          {/* Flag / Report Trigger */}
          {item.username !== currentUser?.username && (
            <TouchableOpacity
              style={styles.flagActionButton}
              onPress={() => {
                setActiveReportPost(item);
                setReportModalVisible(true);
              }}
            >
              <Text style={styles.flagActionButtonText}>🚩</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── HOME FEED SCREEN ──
function HomeFeedScreen({ onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, reactToPost, addComment, fileReport, loadComments } = usePosts();
  const { currentUser } = useAuth();

  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportNotes, setReportNotes] = useState('');
  const [activeReportPost, setActiveReportPost] = useState<any>(null);

  const topics = ['All', 'General', 'Mental Health', 'Career', 'Relationships', 'Tech & Society', 'Confessions'];

  const filteredPosts = posts.filter((p: any) => {
    if (selectedTopic === 'All') { return true; }
    const pTopic = (p.topic || 'General').toLowerCase();
    const sTopic = selectedTopic.toLowerCase();
    return pTopic.includes(sTopic) || sTopic.includes(pTopic);
  });

  const handlePostReact = (postId: any, key: any) => {
    reactToPost(postId, key);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedPost) { return; }
    addComment(selectedPost.id, commentText.trim(), currentUser);
    setCommentText('');
  };

  const handleFileReport = () => {
    if (!activeReportPost) { return; }
    fileReport(
      activeReportPost.id,
      'POST',
      activeReportPost.content,
      activeReportPost.username,
      reportReason,
      reportNotes.trim()
    );
    setReportNotes('');
    setReportModalVisible(false);
    setActiveReportPost(null);
    Alert.alert('Thank you', 'Content has been flagged for admin moderation.');
  };

  const activePostForModal = posts.find((p: any) => p.id === selectedPost?.id) || selectedPost;

  return (
    <View style={styles.feedContainer}>
      {/* Topics list */}
      <View style={styles.topicsScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsScroll}>
          {topics.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.topicChip,
                selectedTopic === t && { backgroundColor: COLORS.deepPlum, borderColor: COLORS.deepPlum },
              ]}
              onPress={() => setSelectedTopic(t)}
            >
              <Text style={[styles.topicChipText, selectedTopic === t && { color: '#FFF', fontWeight: 'bold' }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed list */}
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feedScroll}
        renderItem={({ item }) => (
          <PostCardItem
            item={item}
            currentUser={currentUser}
            handlePostReact={handlePostReact}
            onNavigateToChat={onNavigateToChat}
            setActiveReportPost={setActiveReportPost}
            setReportModalVisible={setReportModalVisible}
            onOpenComments={async (selectedPostItem: any) => {
              setSelectedPost(selectedPostItem);
              setCommentModalVisible(true);
              const comments = await loadComments(selectedPostItem.id);
              setSelectedPost((prev: any) => prev ? { ...prev, comments } : null);
            }}
          />
        )}
      />

      {/* Flag/Report Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <SafeAreaView style={styles.centerModalOverlay}>
          <View style={styles.reportModalCard}>
            <Text style={styles.reportModalTitle}>Flag Content</Text>
            <Text style={styles.reportModalSubtitle}>Help us keep Mann Ki Aawaj safe. Why are you flagging this?</Text>

            <View style={styles.reportSelectorRow}>
              {['Spam / Repetitive', 'Harassment', 'Hate Speech', 'Self-Harm'].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reportReasonChip, reportReason === reason && styles.reportReasonChipActive]}
                  onPress={() => setReportReason(reason)}
                >
                  <Text style={[styles.reportReasonText, reportReason === reason && { color: '#FFF' }]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Additional details (Optional)"
              placeholderTextColor={COLORS.zorba}
              value={reportNotes}
              onChangeText={setReportNotes}
              style={[styles.input, { height: 70, textAlignVertical: 'top', marginTop: 10 }]}
              multiline
            />

            <View style={styles.reportActionRow}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.reportCancelButton}>
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFileReport} style={styles.reportSubmitButton}>
                <Text style={styles.reportSubmitText}>Submit Flag</Text>
              </TouchableOpacity>
            </View>
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
                  <Text style={styles.modalCloseText}>✕</Text>
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
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item: c }) => (
                  <CommentItem comment={c} postId={activePostForModal.id} currentUser={currentUser} />
                )}
              />

              {/* Add comment drawer bar */}
              <View style={styles.commentComposerBar}>
                <TextInput
                  placeholder="Share a thoughtful reply..."
                  placeholderTextColor={COLORS.zorba}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={styles.commentComposerInput}
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.commentSendButton}>
                  <Text style={styles.commentSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

// ── CREATE POST SCREEN ──
function CreatePostScreen({ onPostCreated }: { onPostCreated: any }) {
  const { createPost } = usePosts();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('General');
  const [postType, setPostType] = useState('Thought');
  const [isRecording, setIsRecording] = useState(false);

  const topics = ['General', 'Mental Health', 'Career', 'Relationships', 'Tech & Society', 'Confessions'];
  const postTypes = ['Thought', 'Question', 'Advice', 'Story', 'Vent'];

  const handlePublish = () => {
    if (!content.trim()) { return; }
    createPost({ title, content, topic, postType }, currentUser);
    setTitle('');
    setContent('');
    onPostCreated();
  };

  const startVoiceRecording = async () => {
    setIsRecording(true);
    // Simulate speech-to-text recording period (2.5 seconds)
    setTimeout(async () => {
      try {
        // Send a dummy base64 audio string to backend
        const dummyBase64 = 'UklGRiQAAABXQVZFRm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        const transcribed = await apiService.voiceToText(dummyBase64, 'EN');

        if (transcribed) {
          setContent(prev => prev ? `${prev} ${transcribed}` : transcribed);
          Alert.alert('Speech-to-Text Success', `Transcribed: "${transcribed}"`);
        } else {
          // Fallback if backend doesn't return text
          const fallbackText = 'Sharing my thoughts freely and anonymously on Mann Ki Aawaj.';
          setContent(prev => prev ? `${prev} ${fallbackText}` : fallbackText);
          Alert.alert('Speech-to-Text Fallback', `Transcribed: "${fallbackText}"`);
        }
      } catch (err) {
        console.warn('Voice to text failed:', err);
      } finally {
        setIsRecording(false);
      }
    }, 2500);
  };

  return (
    <ScrollView style={styles.createContainer} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.screenTitle}>Create post anonymously</Text>

      <Text style={styles.fieldLabel}>Title (Optional)</Text>
      <TextInput
        placeholder="A summary of your thought..."
        placeholderTextColor={COLORS.zorba}
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.fieldLabel}>What is on your mind?</Text>
        <TouchableOpacity
          onPress={startVoiceRecording}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.deepPlumLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
        >
          <Text style={{ fontSize: 13, marginRight: 4 }}>🎙️</Text>
          <Text style={{ fontSize: 11, color: COLORS.deepPlum, fontWeight: 'bold' }}>Voice Post</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Type your thoughts here... Be honest, you are completely anonymous."
        placeholderTextColor={COLORS.zorba}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
      />

      <Text style={styles.fieldLabel}>Select Topic</Text>
      <View style={styles.pickerRow}>
        {topics.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.pickerChip, topic === t && styles.pickerChipActive]}
            onPress={() => setTopic(t)}
          >
            <Text style={[styles.pickerChipText, topic === t && styles.pickerChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Select Post Type</Text>
      <View style={styles.pickerRow}>
        {postTypes.map(pt => (
          <TouchableOpacity
            key={pt}
            style={[styles.pickerChip, postType === pt && styles.pickerChipActive]}
            onPress={() => setPostType(pt)}
          >
            <Text style={[styles.pickerChipText, postType === pt && styles.pickerChipTextActive]}>{pt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handlePublish} style={styles.publishButton}>
        <Text style={styles.publishButtonText}>Publish Anonymously</Text>
      </TouchableOpacity>

      {/* Pulsing Voice Recording Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isRecording}
      >
        <SafeAreaView style={styles.centerModalOverlay}>
          <View style={[styles.reportModalCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={[styles.reportModalTitle, { color: COLORS.error }]}>🎙️ Listening...</Text>
            <Text style={[styles.reportModalSubtitle, { textAlign: 'center', marginTop: 8, paddingHorizontal: 12 }]}>
              Speak now. Converting your voice to anonymous text in real-time.
            </Text>

            {/* Pulsing Ring Simulation */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(196, 111, 118, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 24,
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: COLORS.error,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24, color: '#FFF' }}>🎙️</Text>
              </View>
            </View>

            <ActivityIndicator size="small" color={COLORS.error} />
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// ── DIRECT MESSAGES SCREEN ──
function ChatScreen({ activeConversation, onBackToConversations }: { activeConversation: any; onBackToConversations: any }) {
  const { conversations, sendMessage, markAsRead, fetchMessagesForRoom, setActiveRoomId } = useChat();
  const { currentUser } = useAuth();
  const [selectedConvoId, setSelectedConvoId] = useState(activeConversation || null);
  const [msgText, setMsgText] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const startVoiceRecording = () => {
    setIsRecording(true);
    // Simulate speech-to-text recording period (2.5 seconds)
    setTimeout(async () => {
      try {
        // Send a dummy base64 audio string to backend
        const dummyBase64 = 'UklGRiQAAABXQVZFRm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        const transcribed = await apiService.voiceToText(dummyBase64, 'EN');

        if (transcribed) {
          setMsgText(prev => prev ? `${prev} ${transcribed}` : transcribed);
          Alert.alert('Speech-to-Text Success', `Transcribed: "${transcribed}"`);
        } else {
          // Fallback if backend doesn't return text
          const fallbackText = 'Sharing my thoughts freely and anonymously on Mann Ki Aawaj.';
          setMsgText(prev => prev ? `${prev} ${fallbackText}` : fallbackText);
          Alert.alert('Speech-to-Text Fallback', `Transcribed: "${fallbackText}"`);
        }
      } catch (err) {
        console.warn('Voice to text failed:', err);
        const fallbackText = 'Sharing my thoughts freely and anonymously on Mann Ki Aawaj.';
        setMsgText(prev => prev ? `${prev} ${fallbackText}` : fallbackText);
      } finally {
        setIsRecording(false);
      }
    }, 2500);
  };

  const activeConvo = conversations.find((c: any) => c.id === selectedConvoId);

  useEffect(() => {
    if (setActiveRoomId) {
      setActiveRoomId(selectedConvoId);
    }
    if (selectedConvoId && fetchMessagesForRoom) {
      fetchMessagesForRoom(selectedConvoId);
    }
    return () => {
      if (setActiveRoomId) {
        setActiveRoomId(null);
      }
    };
  }, [selectedConvoId, fetchMessagesForRoom, setActiveRoomId]);

  const handleSend = () => {
    if (!msgText.trim() || !selectedConvoId) { return; }
    sendMessage(selectedConvoId, msgText.trim(), currentUser);
    setMsgText('');
  };

  const handleSelectConvo = (convoId: any) => {
    setSelectedConvoId(convoId);
    markAsRead(convoId);
  };

  const formatMsgTime = (dateStr: string) => {
    if (!dateStr) return '5 hours ago';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '5 hours ago';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '5 hours ago';
    }
  };

  if (selectedConvoId && activeConvo) {
    const filteredMessages = activeConvo.messages.filter((m: any) =>
      !searchQuery || m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={[styles.chatDetailContainer, { backgroundColor: '#ECEAE8' }]}>
        {/* Mockup styled Header */}
        <View style={{
          height: 64,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E1DCDB',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          justifyContent: 'space-between',
        }}>
          {isSearching ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TextInput
                placeholder="Search messages..."
                placeholderTextColor={COLORS.zorba}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  height: 38,
                  borderWidth: 1,
                  borderColor: '#CEC7C5',
                  borderRadius: 19,
                  paddingHorizontal: 16,
                  fontSize: 13,
                  color: '#2D1D15',
                  backgroundColor: '#FAF8F8',
                }}
                autoFocus={true}
              />
              <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={{ marginLeft: 8, padding: 6 }}>
                <Text style={{ fontSize: 16, color: '#8C8385', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedConvoId(null);
                    if (onBackToConversations) { onBackToConversations(); }
                  }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 24, color: '#6F405F', fontWeight: '300', marginTop: -4 }}>‹</Text>
                </TouchableOpacity>

                <View style={{ position: 'relative', marginRight: 12 }}>
                  <InitialAvatar initials={activeConvo.avatarInitials} color={activeConvo.avatarColor} size={40} />
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#3F7772',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2D1D15' }}>{activeConvo.username}</Text>
                  <Text style={{ fontSize: 11, color: '#3F7772', marginTop: 1, fontWeight: '600' }}>Online</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={() => setIsSearching(true)}>
                  <Text style={{ fontSize: 18, color: '#8C8385' }}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={{ fontSize: 20, color: '#8C8385', fontWeight: 'bold' }}>⋮</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <FlatList
          data={filteredMessages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item: m }) => {
            const isMe = m.sender === 'me';
            return (
              <View style={[
                styles.messageBubbleContainer,
                isMe ? styles.msgMeContainer : styles.msgPartnerContainer,
                { marginBottom: 14, alignItems: 'flex-start' }
              ]}>
                {/* Partner avatar */}
                {!isMe && (
                  <View style={{ marginRight: 8, marginTop: 4 }}>
                    <InitialAvatar initials={activeConvo.avatarInitials} color={activeConvo.avatarColor} size={28} />
                  </View>
                )}

                <View style={{ maxWidth: '75%' }}>
                  {/* Message bubble */}
                  <View style={[
                    styles.messageBubble,
                    isMe ? styles.msgMeBubble : styles.msgPartnerBubble,
                    {
                      maxWidth: '100%',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  ]}>
                    <Text style={[styles.messageText, isMe ? styles.msgMeText : styles.msgPartnerText]}>
                      {m.text}
                    </Text>
                  </View>

                  {/* Message timestamp and checkmarks */}
                  {isMe ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, marginRight: 4 }}>
                      <Text style={{ fontSize: 10, color: '#A09795', marginRight: 4 }}>{formatMsgTime(m.createdAt)}</Text>
                      <Text style={{ fontSize: 10, color: '#4BA3C3', fontWeight: 'bold' }}>✓✓</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 4, marginLeft: 4 }}>
                      <Text style={{ fontSize: 10, color: '#A09795' }}>{formatMsgTime(m.createdAt)}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Emoji Selector Panel */}
        {showEmojiPicker && (
          <View style={{
            height: 50,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E1DCDB',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, alignItems: 'center' }}>
              {['😀', '😂', '😍', '👍', '🙏', '🎉', '🔥', '✨', '💡', '💯', '❤️', '😔', '🤝', '🌸'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => { setMsgText(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mockup styled Footer Composer */}
        <View style={{
          height: 64,
          flexDirection: 'row',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: '#E1DCDB',
          paddingHorizontal: 12,
          backgroundColor: '#FFFFFF',
          marginBottom: Platform.OS === 'ios' ? 16 : 0,
        }}>
          <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: 6, marginRight: 4 }}>
            <Text style={{ fontSize: 20, color: '#8C8385' }}>😊</Text>
          </TouchableOpacity>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={COLORS.zorba}
            value={msgText}
            onChangeText={setMsgText}
            style={{
              flex: 1,
              height: 40,
              borderWidth: 1,
              borderColor: '#CEC7C5',
              borderRadius: 20,
              paddingHorizontal: 16,
              fontSize: 13,
              color: '#2D1D15',
              backgroundColor: '#FAF8F8',
            }}
          />
          <TouchableOpacity onPress={startVoiceRecording} style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#F3EFEF',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}>
            <Text style={{ fontSize: 16 }}>🎙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSend} style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#6F405F',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}>
            <Text style={{ fontSize: 15, color: '#FFFFFF' }}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Pulsing Voice Recording Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isRecording}
        >
          <SafeAreaView style={styles.centerModalOverlay}>
            <View style={[styles.reportModalCard, { alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={[styles.reportModalTitle, { color: COLORS.error }]}>🎙️ Listening...</Text>
              <Text style={[styles.reportModalSubtitle, { textAlign: 'center', marginTop: 8, paddingHorizontal: 12 }]}>
                Speak now. Converting your voice to anonymous text in real-time.
              </Text>

              {/* Pulsing Ring Simulation */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(196, 111, 118, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 24,
              }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: COLORS.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24, color: '#FFF' }}>🎙️</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.chatContainer}>
      <Text style={styles.screenTitle}>Direct Messages</Text>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet. Send a DM from posts feed.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectConvo(item.id)} style={styles.convoRow}>
              <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={44} />
              <View style={styles.convoInfo}>
                <View style={styles.convoTitleRow}>
                  <Text style={styles.convoName}>{item.username}</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.convoLastMsg} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ── PROFILE SCREEN ──
function ProfileScreen() {
  const { currentUser, logout, updateProfile } = useAuth();
  const { posts } = usePosts();
  const { currentLanguage, changeLanguage, supportedLanguages, t } = useLanguage();

  const [bioInput, setBioInput] = useState(currentUser?.bio || '');
  const [isEditing, setIsEditing] = useState(false);

  // Info modal states
  const [aboutVisible, setAboutVisible] = useState(false);
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

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

  const AVATAR_COLORS = ['#6F405F', '#AA3BFF', '#3F7772', '#D96C3D', '#C46F76'];

  return (
    <ScrollView style={styles.profileContainer}>
      <View style={styles.profileHero}>
        <InitialAvatar initials={currentUser?.avatarInitials} color={currentUser?.avatarColor} size={84} />
        <Text style={styles.profileName}>{currentUser?.fullName}</Text>
        <Text style={styles.profileUsername}>{currentUser?.username}</Text>

        <View style={styles.avatarColorSelector}>
          <Text style={styles.selectorLabel}>Customize Avatar Color:</Text>
          <View style={styles.colorPaletteRow}>
            {AVATAR_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.paletteCircle,
                  { backgroundColor: color },
                  currentUser?.avatarColor === color && styles.paletteCircleActive,
                ]}
                onPress={() => updateProfile({ avatarColor: color })}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        <View style={styles.statColumn}>
          <Text style={styles.statNumber}>{ownPosts.length}</Text>
          <Text style={styles.statLabel}>Thoughts</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statNumber}>{reactionsReceived}</Text>
          <Text style={styles.statLabel}>Reactions</Text>
        </View>
      </View>

      {/* User Bio section */}
      <View style={styles.bioCard}>
        <View style={styles.bioHeaderRow}>
          <Text style={styles.bioTitle}>Anonymous Bio</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.bioEditButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.bioEditForm}>
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              multiline
              maxLength={150}
              style={styles.bioTextInput}
            />
            <TouchableOpacity onPress={handleSaveProfile} style={styles.bioSaveButton}>
              <Text style={styles.bioSaveText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.bioText}>{currentUser?.bio || 'No bio written yet...'}</Text>
        )}
      </View>

      {/* Support & Guidelines Section */}
      <View style={styles.bioCard}>
        <View style={styles.bioHeaderRow}>
          <Text style={styles.bioTitle}>📋 Support & Guidelines</Text>
        </View>
        <Text style={styles.bioText}>Review community policies, platform specifications, or reach out to support.</Text>

        <View style={styles.infoActionRow}>
          <TouchableOpacity onPress={() => setAboutVisible(true)} style={styles.infoActionBtn}>
            <Text style={styles.infoActionText}>ℹ️ About Platform</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGuidelinesVisible(true)} style={styles.infoActionBtn}>
            <Text style={styles.infoActionText}>📜 Guidelines</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoActionRow}>
          <TouchableOpacity onPress={() => setPrivacyVisible(true)} style={styles.infoActionBtn}>
            <Text style={styles.infoActionText}>🔒 Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setContactVisible(true)} style={styles.infoActionBtn}>
            <Text style={styles.infoActionText}>💬 Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferred Language Selector */}
      <View style={styles.bioCard}>
        <View style={styles.bioHeaderRow}>
          <Text style={styles.bioTitle}>🌐 {t('preferredLanguage', 'Preferred Language')}</Text>
        </View>
        <Text style={[styles.bioText, { marginBottom: 12 }]}>
          Change your language preference. This updates static UI text and feed translation targets.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {supportedLanguages.map((lang: any) => {
            const isActive = currentLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => changeLanguage(lang.code)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isActive ? COLORS.deepPlum : '#E1DCDB',
                  backgroundColor: isActive ? COLORS.deepPlum : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: isActive ? '#FFFFFF' : '#2D1D15',
                }}>
                  {lang.native}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>{t('logout', 'Log Out Session')}</Text>
      </TouchableOpacity>

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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
    </ScrollView>
  );
}

// ── NEW SCREEN: ADMIN CONSOLE DASHBOARD ──
function AdminDashboardScreen() {
  const { allRawPosts, reports, resolveReport, hidePost, blockUser } = usePosts();
  const [activeAdminTab, setActiveAdminTab] = useState('Metrics'); // Metrics or Reports

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const pendingReports = reports.filter((r: any) => r.status === 'PENDING');
  const totalPosts = allRawPosts.length;
  const blockedCount = allRawPosts.filter((p: any) => p.hidden).length;

  const handleResolveAction = (actionType: any) => {
    if (!selectedReport) { return; }

    // Execute context actions
    if (actionType === 'HIDE_POST') {
      hidePost(selectedReport.postId);
    } else if (actionType === 'BLOCK_USER') {
      blockUser(selectedReport.authorUsername);
    }

    resolveReport(selectedReport.id, actionType, adminNotes.trim());
    setAdminNotes('');
    setActionModalVisible(false);
    setSelectedReport(null);
    Alert.alert('Moderated', 'Moderation action resolved successfully.');
  };

  return (
    <View style={styles.feedContainer}>
      {/* Sub tabs */}
      <View style={styles.adminSubTabRow}>
        <TouchableOpacity
          style={[styles.adminSubTabButton, activeAdminTab === 'Metrics' && styles.adminSubTabButtonActive]}
          onPress={() => setActiveAdminTab('Metrics')}
        >
          <Text style={[styles.adminSubTabButtonText, activeAdminTab === 'Metrics' && { color: COLORS.deepPlum, fontWeight: '700' }]}>
            📊 Metrics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.adminSubTabButton, activeAdminTab === 'Reports' && styles.adminSubTabButtonActive]}
          onPress={() => setActiveAdminTab('Reports')}
        >
          <Text style={[styles.adminSubTabButtonText, activeAdminTab === 'Reports' && { color: COLORS.deepPlum, fontWeight: '700' }]}>
            🚩 Reports Queue ({pendingReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeAdminTab === 'Metrics' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.adminSectionHeader}>Platform Health</Text>
          <Text style={styles.adminSectionSub}>Activity analytics and safety statistics metrics.</Text>

          {/* Premium Metric Grid */}
          <View style={styles.metricGrid}>
            <View style={[styles.metricCard, { backgroundColor: 'rgba(217, 108, 61, 0.08)', borderColor: '#D96C3D' }]}>
              <Text style={styles.metricEmoji}>🚩</Text>
              <Text style={styles.metricNumber}>{pendingReports.length}</Text>
              <Text style={styles.metricTitle}>Pending Flags</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: 'rgba(111, 64, 95, 0.08)', borderColor: '#6F405F' }]}>
              <Text style={styles.metricEmoji}>📝</Text>
              <Text style={styles.metricNumber}>{totalPosts}</Text>
              <Text style={styles.metricTitle}>Total Posts</Text>
            </View>
          </View>

          <View style={[styles.metricGrid, { marginTop: 12 }]}>
            <View style={[styles.metricCard, { backgroundColor: 'rgba(63, 119, 114, 0.08)', borderColor: '#3F7772' }]}>
              <Text style={styles.metricEmoji}>👤</Text>
              <Text style={styles.metricNumber}>5</Text>
              <Text style={styles.metricTitle}>Active Handles</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: 'rgba(196, 111, 118, 0.08)', borderColor: '#C46F76' }]}>
              <Text style={styles.metricEmoji}>🛡️</Text>
              <Text style={styles.metricNumber}>{blockedCount}</Text>
              <Text style={styles.metricTitle}>Hidden Content</Text>
            </View>
          </View>

          {/* System logs view */}
          <View style={styles.systemLogsCard}>
            <Text style={styles.systemLogsTitle}>Live Console Status</Text>
            <View style={styles.logRow}>
              <Text style={styles.logBullet}>•</Text>
              <Text style={styles.logText}>Android SDK 36 compiler environment is active.</Text>
            </View>
            <View style={styles.logRow}>
              <Text style={styles.logBullet}>•</Text>
              <Text style={styles.logText}>Vite Webgl Rig manifest pipeline listening on local reverse proxy.</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Reports Queue List */
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isResolved = item.status === 'RESOLVED';
            return (
              <View style={[styles.reportCard, isResolved && { opacity: 0.6 }]}>
                <View style={styles.reportHeader}>
                  <View style={[styles.riskBadge, { backgroundColor: isResolved ? '#E1DCDB' : '#C46F76' }]}>
                    <Text style={styles.riskBadgeText}>{isResolved ? 'RESOLVED' : '🚨 ACTION REQ'}</Text>
                  </View>
                  <Text style={styles.reportTime}>{item.reason}</Text>
                </View>

                <View style={styles.reportQuoteBlock}>
                  <Text style={styles.reportQuoteUser}>{item.authorUsername} wrote:</Text>
                  <Text style={styles.reportQuoteText} numberOfLines={3}>"{item.reportedContent}"</Text>
                </View>

                {!!item.reporterNotes && (
                  <Text style={styles.reportNotesText}>
                    <Text style={{ fontWeight: 'bold' }}>Reporter Claim: </Text>
                    {item.reporterNotes}
                  </Text>
                )}

                {isResolved ? (
                  <View style={styles.resolutionBadge}>
                    <Text style={styles.resolutionBadgeText}>
                      Decision: {item.actionTaken} | Notes: {item.adminNotes || 'None'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.resolveActionBtn}
                    onPress={() => {
                      setSelectedReport(item);
                      setActionModalVisible(true);
                    }}
                  >
                    <Text style={styles.resolveActionBtnText}>Moderate Content</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Moderation Action Modal */}
      {selectedReport && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={actionModalVisible}
          onRequestClose={() => setActionModalVisible(false)}
        >
          <SafeAreaView style={styles.centerModalOverlay}>
            <View style={styles.reportModalCard}>
              <Text style={styles.reportModalTitle}>Moderation Command</Text>
              <Text style={styles.reportModalSubtitle}>Choose the safety action to execute on this content.</Text>

              <View style={styles.moderationCardQuote}>
                <Text style={styles.moderationCardQuoteText} numberOfLines={2}>"{selectedReport.reportedContent}"</Text>
              </View>

              <TextInput
                placeholder="Reason or notes for action logs..."
                placeholderTextColor={COLORS.zorba}
                value={adminNotes}
                onChangeText={setAdminNotes}
                style={[styles.input, { height: 60, textAlignVertical: 'top', marginTop: 10 }]}
                multiline
              />

              <View style={styles.moderationActionColumn}>
                <TouchableOpacity
                  style={[styles.moderationActionBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => handleResolveAction('KEEP')}
                >
                  <Text style={styles.moderationActionBtnText}>✅ Keep Content (Dismiss Report)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moderationActionBtn, { backgroundColor: COLORS.warning }]}
                  onPress={() => handleResolveAction('HIDE_POST')}
                >
                  <Text style={styles.moderationActionBtnText}>🚫 Hide Content (Remove Feed Post)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.moderationActionBtn, { backgroundColor: COLORS.error }]}
                  onPress={() => handleResolveAction('BLOCK_USER')}
                >
                  <Text style={styles.moderationActionBtnText}>💀 Block Author ({selectedReport.authorUsername})</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setActionModalVisible(false)} style={styles.moderationCancelBtn}>
                <Text style={styles.moderationCancelBtnText}>Cancel Decision</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

// ── NEW SCREEN: NOTIFICATIONS CENTER ──
function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { posts, loadComments, addComment, reactToPost } = usePosts();
  const { currentUser } = useAuth();

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleOpenPostDetails = async (post: any) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setComments([]);
    try {
      const cms = await loadComments(post.id);
      setComments(cms || []);
    } catch (e) {
      console.warn('Failed to load comments in notifications screen:', e);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) { return; }
    try {
      await addComment(selectedPost.id, commentText.trim(), currentUser);
      setCommentText('');
      const cms = await loadComments(selectedPost.id);
      setComments(cms || []);
    } catch (e) {
      console.warn('Failed to add comment:', e);
    }
  };

  const handlePostReact = (postId: any, key: any) => {
    reactToPost(postId, key);
  };

  const currentPost = posts.find((p: any) => String(p.id) === String(selectedPost?.id)) || selectedPost;

  return (
    <View style={styles.feedContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E1DCDB' }}>
        <Text style={styles.screenTitle}>Notification Center ({unreadCount})</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={[styles.commentSendButton, { paddingHorizontal: 10, paddingVertical: 4, height: 'auto' }]}>
            <Text style={[styles.commentSendText, { fontSize: 11 }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const targetPost = posts.find((p: any) => String(p.id) === String(item.targetPostId));
            return (
              <TouchableOpacity
                onPress={() => {
                  markAsRead(item.id);
                  if (targetPost) {
                    handleOpenPostDetails(targetPost);
                  }
                }}
                style={[
                  styles.convoRow,
                  { borderBottomWidth: 1, borderBottomColor: '#F8F5F4', alignItems: 'flex-start', paddingHorizontal: 16 },
                  !item.isRead && { backgroundColor: 'rgba(111, 64, 95, 0.04)' },
                ]}
              >
                <View style={{ marginTop: 2 }}>
                  <InitialAvatar initials={item.actorInitials} color="#6F405F" size={40} />
                </View>
                <View style={styles.convoInfo}>
                  <Text style={[styles.convoLastMsg, { color: '#2D1D15', fontSize: 13, fontWeight: item.isRead ? '400' : 'bold' }]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.convoLastMsg, { fontSize: 10, color: COLORS.zorba, marginTop: 4 }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>

                  {targetPost && (
                    <View style={{
                      marginTop: 8,
                      flexDirection: 'row',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E1DCDB',
                      overflow: 'hidden',
                    }}>
                      <View style={{ width: 4, backgroundColor: '#6F405F' }} />
                      <View style={{ flex: 1, padding: 10 }}>
                        {targetPost.title ? (
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2D1D15', marginBottom: 2 }}>
                            {targetPost.title}
                          </Text>
                        ) : null}
                        <Text numberOfLines={2} style={{ fontSize: 11, color: '#666', lineHeight: 15 }}>
                          {targetPost.content}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selectedPost && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={commentModalVisible}
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments ({comments.length})</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Selected post reference */}
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#E1DCDB', backgroundColor: '#FFF' }}>
                <PostCardItem
                  item={currentPost}
                  currentUser={currentUser}
                  handlePostReact={handlePostReact}
                  onNavigateToChat={() => { }}
                  setActiveReportPost={() => { }}
                  setReportModalVisible={() => { }}
                  onOpenComments={() => { }}
                />
              </View>

              {/* Comment list */}
              <FlatList
                data={comments}
                keyExtractor={c => c.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item: c }) => (
                  <CommentItem comment={c} postId={selectedPost.id} currentUser={currentUser} />
                )}
              />

              {/* Add comment drawer bar */}
              <View style={styles.commentComposerBar}>
                <TextInput
                  placeholder="Share a thoughtful reply..."
                  placeholderTextColor={COLORS.zorba}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={styles.commentComposerInput}
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.commentSendButton}>
                  <Text style={styles.commentSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

// ── NEW SCREEN: SAVED BOOKMARKS SCREEN ──
function SavedPostsScreen({ onNavigateToChat: _onNavigateToChat }: { onNavigateToChat: any }) {
  const { posts, toggleSavePost } = usePosts();
  const savedPosts = posts.filter((p: any) => p.isSaved);

  return (
    <View style={styles.feedContainer}>
      <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E1DCDB' }}>
        <Text style={styles.screenTitle}>Saved Bookmarks ({savedPosts.length})</Text>
      </View>
      {savedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookmarked posts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feedScroll}
          renderItem={({ item }) => {
            return (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <InitialAvatar initials={item.avatarInitials} color={item.avatarColor} size={40} />
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.postUsername}>{item.username}</Text>
                    <Text style={styles.postMeta}>{item.postType}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleSavePost(item.id)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 18 }}>⭐</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postContent}>{item.content}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ── MAIN CORE ENTRY ──
function MainDashboard() {
  const [activeTab, setActiveTab] = useState('Feed'); // Feed, Create, Chat, Notifications, Saved, Profile, Admin
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const { startNewConversation } = useChat();
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();

  const handleStartConvo = async (username: any, authorId: any, initials: any, color: any) => {
    const convoId = await startNewConversation(username, authorId, initials, color);
    setChatTarget(convoId);
    setActiveTab('Chat');
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {activeTab === 'Admin' ? 'Mann Ki Aawaj Admin' : 'Mann Ki Aawaj'}
        </Text>
        <Text style={[styles.headerDot, activeTab === 'Admin' && { color: COLORS.error }]}>•</Text>
      </View>

      {/* Content router */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Feed' && <HomeFeedScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Create' && <CreatePostScreen onPostCreated={() => setActiveTab('Feed')} />}
        {activeTab === 'Chat' && <ChatScreen activeConversation={chatTarget} onBackToConversations={() => setChatTarget(null)} />}
        {activeTab === 'Notifications' && <NotificationsScreen />}
        {activeTab === 'Saved' && <SavedPostsScreen onNavigateToChat={handleStartConvo} />}
        {activeTab === 'Profile' && <ProfileScreen />}
        {activeTab === 'Admin' && <AdminDashboardScreen />}
      </View>

      {/* Custom Tab Navigator */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabButton} onPress={() => { setActiveTab('Feed'); setChatTarget(null); }}>
          <Text style={[styles.tabButtonText, activeTab === 'Feed' && styles.tabButtonTextActive]}>📰 {t('home', 'Feed')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => { setActiveTab('Create'); setChatTarget(null); }}>
          <Text style={[styles.tabButtonText, activeTab === 'Create' && styles.tabButtonTextActive]}>✏️ {t('share', 'Share')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => { setActiveTab('Chat'); }}>
          <Text style={[styles.tabButtonText, activeTab === 'Chat' && styles.tabButtonTextActive]}>💬 {t('dms', 'DMs')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => { setActiveTab('Notifications'); setChatTarget(null); }}>
          <Text style={[styles.tabButtonText, activeTab === 'Notifications' && styles.tabButtonTextActive]}>
            🔔 {unreadCount > 0 ? `(${unreadCount})` : t('notif', 'Notif')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={() => setMoreMenuVisible(true)}>
          <Text style={[styles.tabButtonText, (activeTab === 'Saved' || activeTab === 'Profile' || activeTab === 'Admin') && styles.tabButtonTextActive]}>
            ≡ {t('more', 'More')}
          </Text>
        </TouchableOpacity>
      </View>

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
                <Text style={{ fontSize: 20 }}>⭐</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.deepPlum }}>
                  {t('savedPosts', 'Saved Thoughts')}
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
                <Text style={{ fontSize: 20 }}>👤</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.deepPlum }}>
                  {t('me', 'My Profile')}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#C8BDBA' }}>›</Text>
            </TouchableOpacity>

            {currentUser?.role === 'ROLE_ADMIN' && (
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
                  <Text style={{ fontSize: 20 }}>🛡️</Text>
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
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <PostProvider>
            <ChatProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#F8F5F4" />
              <AuthWrapper />
            </ChatProvider>
          </PostProvider>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function AuthWrapper() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F5F4', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6F405F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F5F4' }}>
      {currentUser ? <MainDashboard /> : <AuthScreen />}
    </SafeAreaView>
  );
}

// ── BRAND STYLE SHEET ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F4',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1D15',
    letterSpacing: 0.5,
  },
  headerDot: {
    color: '#6F405F',
    fontSize: 22,
    marginLeft: 3,
    fontWeight: 'bold',
  },
  tabBar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E1DCDB',
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#8C8385',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#6F405F',
    fontWeight: 'bold',
  },

  // Auth Screen styles
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8F5F4',
  },
  authCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 24,
    ...SHADOWS.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  authLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(111, 64, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authLogoText: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#8C8385',
    marginBottom: 24,
    textAlign: 'center',
  },
  authHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6F405F',
    marginBottom: 16,
    alignSelf: 'flex-start',
    letterSpacing: 0.2,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#2D1D15',
    backgroundColor: '#FAF8F8',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#6F405F',
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  switchAuthButton: {
    marginTop: 18,
  },
  switchAuthText: {
    color: '#8C8385',
    fontSize: 13,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: 'rgba(196, 111, 118, 0.12)',
    padding: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(196, 111, 118, 0.3)',
  },
  errorText: {
    color: '#C46F76',
    fontSize: 13,
    textAlign: 'center',
  },

  // Common styles
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Feed Screen styles
  feedContainer: {
    flex: 1,
  },
  topicsScrollContainer: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
  },
  topicsScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FAF8F8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CEC7C5',
  },
  topicChipText: {
    fontSize: 12,
    color: '#8C8385',
  },
  feedScroll: {
    padding: 12,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2D1D15',
  },
  postMeta: {
    fontSize: 11,
    color: '#8C8385',
    marginTop: 1,
  },
  topicBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
  },
  topicBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  postContent: {
    fontSize: 14,
    color: '#6b6375',
    lineHeight: 20,
    marginBottom: 14,
  },
  reactionsDisplayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  reactionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FAF8F8',
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  reactionBadgeActive: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  reactionBadgeText: {
    fontSize: 11,
    color: '#8C8385',
  },
  postActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8F5F4',
    paddingTop: 12,
  },
  emojiPickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emojiPickerButton: {
    padding: 3,
  },
  emojiPickerText: {
    fontSize: 18,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FAF8F8',
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  commentActionButtonText: {
    fontSize: 12,
    color: '#8C8385',
    fontWeight: '600',
  },
  chatActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(111, 64, 95, 0.08)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(111, 64, 95, 0.2)',
  },
  chatActionButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  flagActionButton: {
    padding: 4,
  },
  flagActionButtonText: {
    fontSize: 13,
  },

  // Create Screen styles
  createContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F405F',
    marginBottom: 6,
    marginTop: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FAF8F8',
    borderWidth: 1,
    borderColor: '#CEC7C5',
  },
  pickerChipActive: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  pickerChipText: {
    fontSize: 12,
    color: '#8C8385',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  publishButton: {
    backgroundColor: '#6F405F',
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 30,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Comment Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 29, 21, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
  },
  modalCloseButton: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#8C8385',
  },
  modalPostBrief: {
    backgroundColor: '#FAF8F8',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
  },
  modalPostUser: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#6F405F',
    marginBottom: 2,
  },
  modalPostText: {
    fontSize: 13,
    color: '#8C8385',
  },
  commentCard: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F4',
    paddingBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2D1D15',
    marginLeft: 8,
  },
  commentContent: {
    fontSize: 13,
    color: '#6b6375',
    marginLeft: 36,
  },
  commentComposerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1DCDB',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  commentComposerInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#2D1D15',
    backgroundColor: '#FAF8F8',
  },
  commentSendButton: {
    marginLeft: 10,
    paddingHorizontal: 14,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendText: {
    color: '#6F405F',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Chat/Conversation list styles
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#9F9794',
    textAlign: 'center',
    fontSize: 14,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
  },
  convoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  convoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2D1D15',
  },
  unreadBadge: {
    backgroundColor: '#6F405F',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  convoLastMsg: {
    fontSize: 12,
    color: '#8C8385',
    marginTop: 3,
  },

  // Chat Detail Thread styles
  chatDetailContainer: {
    flex: 1,
    backgroundColor: '#FAF8F8',
  },
  chatDetailHeader: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backButton: {
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 13,
    color: '#6F405F',
    fontWeight: 'bold',
  },
  chatHeaderName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2D1D15',
    marginLeft: 8,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  msgMeContainer: {
    justifyContent: 'flex-end',
  },
  msgPartnerContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  msgMeBubble: {
    backgroundColor: '#6F405F',
    borderBottomRightRadius: 2,
  },
  msgPartnerBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgMeText: {
    color: '#FFFFFF',
  },
  msgPartnerText: {
    color: '#2D1D15',
  },
  chatComposerRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1DCDB',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  chatComposerInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#2D1D15',
    backgroundColor: '#FAF8F8',
  },
  chatSendButton: {
    marginLeft: 10,
    backgroundColor: '#6F405F',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Profile Screen styles
  profileContainer: {
    flex: 1,
  },
  profileHero: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginTop: 10,
  },
  profileUsername: {
    fontSize: 13,
    color: '#8C8385',
    marginTop: 2,
  },
  avatarColorSelector: {
    marginTop: 16,
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C8385',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paletteCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CEC7C5',
  },
  paletteCircleActive: {
    borderWidth: 3,
    borderColor: '#2D1D15',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    ...SHADOWS.subtle,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  statLabel: {
    fontSize: 11,
    color: '#8C8385',
    marginTop: 2,
  },
  bioCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    ...SHADOWS.subtle,
  },
  bioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  bioEditButtonText: {
    fontSize: 12,
    color: '#8C8385',
  },
  bioText: {
    fontSize: 13,
    color: '#6b6375',
    lineHeight: 18,
  },
  bioEditForm: {
    width: '100%',
  },
  bioTextInput: {
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: RADIUS.sm,
    padding: 10,
    fontSize: 13,
    color: '#2D1D15',
    backgroundColor: '#FAF8F8',
    height: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  bioSaveButton: {
    backgroundColor: '#6F405F',
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioSaveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  adminToggleBtn: {
    marginTop: 12,
    backgroundColor: '#8C8385',
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 30,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(196, 111, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196, 111, 118, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#C46F76',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Admin Portal styling
  adminSubTabRow: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1DCDB',
  },
  adminSubTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  adminSubTabButtonActive: {
    borderBottomColor: '#6F405F',
  },
  adminSubTabButtonText: {
    fontSize: 13,
    color: '#8C8385',
    fontWeight: '500',
  },
  adminSectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginTop: 8,
  },
  adminSectionSub: {
    fontSize: 12,
    color: '#8C8385',
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  metricEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
    color: '#8C8385',
    fontWeight: '600',
  },
  systemLogsCard: {
    backgroundColor: '#2D1D15',
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 18,
    ...SHADOWS.subtle,
  },
  systemLogsTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  logBullet: {
    color: '#C46F76',
    fontWeight: 'bold',
    marginRight: 8,
  },
  logText: {
    color: '#FAF8F8',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },

  // Reports list styling
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    ...SHADOWS.soft,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportTime: {
    fontSize: 11,
    color: '#8C8385',
  },
  reportQuoteBlock: {
    backgroundColor: '#FAF8F8',
    borderLeftWidth: 3,
    borderLeftColor: '#6F405F',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  reportQuoteUser: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 3,
  },
  reportQuoteText: {
    fontSize: 12.5,
    color: '#6b6375',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reportNotesText: {
    fontSize: 12,
    color: '#8C8385',
    marginBottom: 14,
    lineHeight: 16,
  },
  resolveActionBtn: {
    backgroundColor: '#6F405F',
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveActionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  resolutionBadge: {
    padding: 8,
    backgroundColor: 'rgba(63, 119, 114, 0.08)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(63, 119, 114, 0.3)',
  },
  resolutionBadgeText: {
    fontSize: 11,
    color: '#3F7772',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modals & Centered cards
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 29, 21, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  reportModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 20,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  reportModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 6,
  },
  reportModalSubtitle: {
    fontSize: 12.5,
    color: '#8C8385',
    marginBottom: 14,
    lineHeight: 16,
  },
  reportSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  reportReasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FAF8F8',
    borderWidth: 1,
    borderColor: '#CEC7C5',
  },
  reportReasonChipActive: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  reportReasonText: {
    fontSize: 11.5,
    color: '#8C8385',
  },
  reportActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  reportCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  reportCancelText: {
    color: '#8C8385',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reportSubmitButton: {
    backgroundColor: '#C46F76',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.sm,
  },
  reportSubmitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Moderation modal specifics
  moderationCardQuote: {
    backgroundColor: '#FAF8F8',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#CEC7C5',
    marginBottom: 10,
  },
  moderationCardQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8C8385',
  },
  moderationActionColumn: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 14,
  },
  moderationActionBtn: {
    height: 42,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moderationActionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  moderationCancelBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  moderationCancelBtnText: {
    color: '#8C8385',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  infoActionBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#FAF8F8',
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoActionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6F405F',
  },
  policyHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginTop: 14,
    marginBottom: 6,
  },
  policyBody: {
    fontSize: 13,
    color: '#8C8385',
    lineHeight: 18,
    marginBottom: 12,
  },
  policyBullet: {
    fontSize: 13,
    color: '#8C8385',
    lineHeight: 18,
    marginBottom: 8,
    paddingLeft: 8,
  },
  headerLoginShortcut: {
    position: 'absolute',
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(111, 64, 95, 0.1)',
  },
  headerLoginShortcutText: {
    color: '#6F405F',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#CEC7C5',
    borderRadius: RADIUS.sm,
    backgroundColor: '#FAF8F8',
    marginBottom: 14,
    paddingRight: 10,
  },
  passwordEyeBtn: {
    padding: 8,
  },
  passwordEyeText: {
    fontSize: 16,
  },
  privacyBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  privacyBadge: {
    backgroundColor: 'rgba(45, 29, 21, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  privacyBadgeText: {
    fontSize: 11,
    color: '#8C8385',
    fontWeight: '600',
  },
  checkboxesContainer: {
    width: '100%',
    marginVertical: 12,
    gap: 10,
  },
  checkRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#8C8385',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  checkboxBoxChecked: {
    backgroundColor: '#6F405F',
    borderColor: '#6F405F',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkRowText: {
    fontSize: 12,
    color: '#2D1D15',
    flex: 1,
    lineHeight: 18,
  },
  otpNoticeRow: {
    backgroundColor: 'rgba(111, 64, 95, 0.06)',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(111, 64, 95, 0.15)',
    marginBottom: 10,
  },
  otpNoticeText: {
    fontSize: 12,
    color: '#6F405F',
  },
  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  otpResendBtn: {
    paddingVertical: 8,
  },
  otpResendText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#6F405F',
    textDecorationLine: 'underline',
  },
  otpVerifyBtn: {
    backgroundColor: '#6F405F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.sm,
  },
  otpVerifyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  authBackBtn: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingVertical: 4,
  },
  authBackBtnText: {
    fontSize: 12.5,
    color: '#8C8385',
    fontWeight: '600',
  },
  landingHeroBlock: {
    padding: 24,
    backgroundColor: '#0B0A16',
    alignItems: 'center',
    textAlign: 'center',
  },
  badgeBanner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 16,
  },
  badgeBannerText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  landingHeroHeadline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  landingHeroSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  landingHeroCtaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  landingHeroCtaBtnPrimary: {
    backgroundColor: '#D89C7A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.sm,
  },
  landingHeroCtaTextPrimary: {
    color: '#0B0A16',
    fontWeight: 'bold',
    fontSize: 14,
  },
  landingHeroCtaBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.sm,
  },
  landingHeroCtaTextSecondary: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  trustBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
    width: '100%',
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustBadgeIcon: {
    fontSize: 14,
  },
  trustBadgeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  landingSection: {
    padding: 24,
    backgroundColor: '#F8F5F4',
  },
  landingSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1D15',
    textAlign: 'center',
  },
  landingTitleDivider: {
    width: 32,
    height: 3,
    backgroundColor: '#D89C7A',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  featureCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E1DCDB',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 16,
    ...SHADOWS.subtle,
  },
  featureCardIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8F5F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureCardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6F405F',
    marginBottom: 6,
  },
  featureCardBody: {
    fontSize: 13,
    color: '#8C8385',
    textAlign: 'center',
    lineHeight: 18,
  },
  howItWorksRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  howItWorksNumberBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(111, 64, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  howItWorksContent: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D1D15',
    marginBottom: 4,
  },
  howItWorksBody: {
    fontSize: 13,
    color: '#8C8385',
    lineHeight: 18,
  },
  safetyBulletBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E1DCDB',
  },
  safetyBulletIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  safetyBulletText: {
    fontSize: 13,
    color: '#8C8385',
    flex: 1,
    lineHeight: 18,
  },
  landingFooterNav: {
    backgroundColor: '#2D1D15',
    padding: 32,
    alignItems: 'center',
  },
  footerBrandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8F5F4',
    marginBottom: 6,
  },
  footerBrandDesc: {
    fontSize: 12.5,
    color: '#8C8385',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 245, 244, 0.1)',
    paddingBottom: 20,
    width: '100%',
  },
  footerNavLink: {
    paddingVertical: 4,
  },
  footerNavLinkText: {
    fontSize: 13,
    color: '#FAF8F8',
    fontWeight: '600',
  },
  footerCopyright: {
    fontSize: 11,
    color: '#8C8385',
  },
});

