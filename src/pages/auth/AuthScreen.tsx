import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, RADIUS, SHADOWS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { LockIcon, ShieldIcon, MicIcon, LanguageIcon, FlagIcon, ProfileIcon, EyeIcon } from '../../components/common/Icons';
import { AgreementCheckRow } from '../../components/common/AgreementCheckRow';

// ── CUSTOM LIGHTWEIGHT VECTOR ICONS ──
const MailIcon = ({ color = '#6F405F', size = 18 }) => (
  <View style={{ width: size, height: size * 0.72, borderWidth: 1.8, borderColor: color, borderRadius: 3, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      position: 'absolute',
      top: -size * 0.44,
      width: size * 0.8,
      height: size * 0.8,
      borderWidth: 1.8,
      borderColor: color,
      transform: [{ rotate: '45deg' }]
    }} />
  </View>
);

const PhoneIcon = ({ color = '#6F405F', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 11, height: 17, borderWidth: 1.8, borderColor: color, borderRadius: 2.5, justifyContent: 'space-between', paddingVertical: 2, alignItems: 'center' }}>
      <View style={{ width: 4, height: 1, backgroundColor: color, borderRadius: 0.5 }} />
      <View style={{ width: 3, height: 3, borderRadius: 1.5, borderWidth: 1, borderColor: color }} />
    </View>
  </View>
);

const EyeOffIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size - 2,
      height: size - 8,
      borderRadius: (size - 8) / 2,
      borderWidth: 2,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.5
    }}>
      <View style={{ width: size / 3, height: size / 3, borderRadius: size / 6, backgroundColor: color }} />
    </View>
    <View style={{
      position: 'absolute',
      width: size + 2,
      height: 2,
      backgroundColor: color,
      transform: [{ rotate: '-45deg' }]
    }} />
  </View>
);

export function AuthScreen() {
  const { login, register, verifyEmailOtp, resendEmailOtp } = useAuth() as any;

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
          <TouchableOpacity onPress={() => goToView('landing')} style={{ alignSelf: 'flex-start', marginBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF6F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#F1ECEF' }}>
            <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: 'bold' }}>← Back</Text>
          </TouchableOpacity>
          
          <View style={{
            shadowColor: '#6F405F',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 4,
            marginBottom: 16
          }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 64, height: 64, borderRadius: 16 }} />
          </View>
          
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6F405F', marginBottom: 6 }}>Welcome Back</Text>
          <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 24, textAlign: 'center', lineHeight: 16 }}>
            Sign in to your account using your registered email or mobile number.
          </Text>

          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Email/Mobile Input Label */}
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6 }}>
            Email Address or Mobile Number *
          </Text>
          
          {/* Email/Mobile Input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 52,
            borderWidth: 1.5,
            borderColor: '#E8E1E5',
            borderRadius: 14,
            paddingHorizontal: 16,
            marginBottom: 14,
            backgroundColor: '#FAF8F8',
          }}>
            <View style={{ width: 20, alignItems: 'center' }}>
              <MailIcon color="#6F405F" size={18} />
            </View>
            <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
            <TextInput
              placeholder="Enter registered mail or mobile"
              placeholderTextColor="#CEC7C5"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
            />
          </View>

          {/* Password Input Label Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15' }}>Password *</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Password Reset Assistance',
                  'To protect privacy on our anonymous platform, passwords cannot be reset automatically. If you lost your password, please contact safety support at support@awaazmanki.com with your registered email and mobile number.'
                );
              }}
            >
              <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: '600', textDecorationLine: 'underline' }}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Password Input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 52,
            borderWidth: 1.5,
            borderColor: '#E8E1E5',
            borderRadius: 14,
            paddingHorizontal: 16,
            marginBottom: 20,
            backgroundColor: '#FAF8F8',
          }}>
            <View style={{ width: 20, alignItems: 'center' }}>
              <LockIcon color="#6F405F" size={18} />
            </View>
            <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#CEC7C5"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
              {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
            </TouchableOpacity>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[{
              width: '100%',
              height: 52,
              backgroundColor: '#6F405F',
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4
            }, loading && { opacity: 0.7 }]}
            onPress={handleLoginSubmit}
            disabled={loading}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
              {loading ? 'Signing In...' : '→] Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Switch auth button */}
          <TouchableOpacity onPress={() => goToView('register')} style={{ marginTop: 20 }}>
            <Text style={{ color: '#8C8385', fontSize: 13, fontWeight: '600' }}>
              Don't have an account? <Text style={{ color: '#6F405F', fontWeight: 'bold', textDecorationLine: 'underline' }}>Create Anonymous Account</Text>
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20, width: '100%' }} showsVerticalScrollIndicator={false}>
          <View style={styles.authCard}>
            <TouchableOpacity onPress={() => goToView('landing')} style={{ alignSelf: 'flex-start', marginBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF6F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#F1ECEF' }}>
              <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: 'bold' }}>← Back</Text>
            </TouchableOpacity>
            
            <View style={{
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 16
            }}>
              <Image source={require('../../assets/logo.png')} style={{ width: 64, height: 64, borderRadius: 16 }} />
            </View>
            
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6F405F', marginBottom: 6 }}>Create Account</Text>
            <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 16, textAlign: 'center', lineHeight: 16 }}>
              Your identity stays private. Your voice matters.
            </Text>

            {/* Privacy Capsules Row */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, width: '100%', justifyContent: 'center' }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FAF6F8', borderWidth: 1, borderColor: '#F1ECEF' }}>
                <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: '600' }}>🔒 Real name private</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FAF6F8', borderWidth: 1, borderColor: '#F1ECEF' }}>
                <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: '600' }}>🎭 Anonymous handle</Text>
              </View>
            </View>

            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Full Name Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 52,
              borderWidth: 1.5,
              borderColor: '#E8E1E5',
              borderRadius: 14,
              paddingHorizontal: 16,
              marginBottom: 14,
              backgroundColor: '#FAF8F8',
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <ProfileIcon color="#6F405F" size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Full Name (private)"
                placeholderTextColor="#CEC7C5"
                value={fullName}
                onChangeText={setFullName}
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
              />
            </View>

            {/* Mobile Number Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 52,
              borderWidth: 1.5,
              borderColor: '#E8E1E5',
              borderRadius: 14,
              paddingHorizontal: 16,
              marginBottom: 14,
              backgroundColor: '#FAF8F8',
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <PhoneIcon color="#6F405F" size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Mobile Number (private)"
                placeholderTextColor="#CEC7C5"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                maxLength={10}
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
              />
            </View>

            {/* Email Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 52,
              borderWidth: 1.5,
              borderColor: '#E8E1E5',
              borderRadius: 14,
              paddingHorizontal: 16,
              marginBottom: 14,
              backgroundColor: '#FAF8F8',
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <MailIcon color="#6F405F" size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#CEC7C5"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
              />
            </View>

            {/* Password Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 52,
              borderWidth: 1.5,
              borderColor: '#E8E1E5',
              borderRadius: 14,
              paddingHorizontal: 16,
              marginBottom: 16,
              backgroundColor: '#FAF8F8',
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <LockIcon color="#6F405F" size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Password (min 8 chars)"
                placeholderTextColor="#CEC7C5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
              </TouchableOpacity>
            </View>

            {/* Checkboxes agreement list */}
            <View style={{ width: '100%', marginBottom: 18 }}>
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

            {/* Submit button */}
            <TouchableOpacity
              style={[{
                width: '100%',
                height: 52,
                backgroundColor: '#6F405F',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4
              }, (!canRegister || loading) && { opacity: 0.5, backgroundColor: '#CEC7C5', shadowOpacity: 0, elevation: 0 }]}
              onPress={handleRegisterSubmit}
              disabled={!canRegister || loading}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Switch auth button */}
            <TouchableOpacity onPress={() => goToView('login')} style={{ marginTop: 20 }}>
              <Text style={{ color: '#8C8385', fontSize: 13, fontWeight: '600' }}>
                Already have an account? <Text style={{ color: '#6F405F', fontWeight: 'bold' }}>Login</Text>
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
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16 }]}>
        <Image source={require('../../assets/logo.png')} style={{ width: 26, height: 26, borderRadius: 6, marginRight: 8 }} />
        <Text style={styles.headerText}>AwaajManki</Text>
        <Text style={styles.headerDot}>•</Text>
        <TouchableOpacity onPress={() => goToView('login')} style={styles.headerLoginShortcut}>
          <Text style={styles.headerLoginShortcutText}>Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1 }}>
        {/* 1. HERO SECTION */}
        <View style={styles.landingHeroBlock}>
          <View style={styles.badgeBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldIcon color="#C46F76" size={12} />
              <Text style={[styles.badgeBannerText, { marginLeft: 6 }]}>India's Anonymous Discussion Platform</Text>
            </View>
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
              <LockIcon color="#FF8E95" size={20} />
              <Text style={[styles.trustBadgeLabel, { marginTop: 4 }]}>Anonymous</Text>
            </View>
            <View style={styles.trustBadgeItem}>
              <ShieldIcon color="#FF8E95" size={20} />
              <Text style={[styles.trustBadgeLabel, { marginTop: 4 }]}>AI Moderated</Text>
            </View>
            <View style={styles.trustBadgeItem}>
              <MicIcon color="#FF8E95" size={20} />
              <Text style={[styles.trustBadgeLabel, { marginTop: 4 }]}>Voice-to-Text</Text>
            </View>
            <View style={styles.trustBadgeItem}>
              <LanguageIcon color="#FF8E95" size={20} />
              <Text style={[styles.trustBadgeLabel, { marginTop: 4 }]}>Languages</Text>
            </View>
          </View>
        </View>

        {/* 2. FEATURES SECTION */}
        <View style={styles.landingSection}>
          <Text style={styles.landingSectionTitle}>What Makes Us Different</Text>
          <View style={styles.landingTitleDivider} />

          <View style={styles.featureCardItem}>
            <View style={styles.featureCardIconCircle}>
              <LockIcon color="#6F405F" size={24} />
            </View>
            <Text style={styles.featureCardHeader}>Anonymous by Design</Text>
            <Text style={styles.featureCardBody}>No real names. No public profiles. Custom anonymous avatars generated for you.</Text>
          </View>

          <View style={styles.featureCardItem}>
            <View style={styles.featureCardIconCircle}>
              <ShieldIcon color="#6F405F" size={24} />
            </View>
            <Text style={styles.featureCardHeader}>AI-Powered Safety</Text>
            <Text style={styles.featureCardBody}>Detects hate speech. Filters harassment. Keeps community conversations safe.</Text>
          </View>

          <View style={styles.featureCardItem}>
            <View style={styles.featureCardIconCircle}>
              <MicIcon color="#6F405F" size={24} />
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
            <View style={{ marginRight: 10, marginTop: 2 }}>
              <FlagIcon color="#C46F76" size={16} />
            </View>
            <Text style={styles.safetyBulletText}>
              Zero tolerance policy for hate speech, harassment, spam, and personal info exposure.
            </Text>
          </View>
          <View style={styles.safetyBulletBlock}>
            <View style={{ marginRight: 10, marginTop: 2 }}>
              <ShieldIcon color="#6F405F" size={16} />
            </View>
            <Text style={styles.safetyBulletText}>
              Automated moderation classification runs before any post or comment goes public.
            </Text>
          </View>
          <View style={styles.safetyBulletBlock}>
            <View style={{ marginRight: 10, marginTop: 2 }}>
              <ProfileIcon color="#6F405F" size={16} />
            </View>
            <Text style={styles.safetyBulletText}>
              Flagged content is reviewed by human admins, allowing direct post hide or author ban actions.
            </Text>
          </View>
        </View>

        {/* 5. FOOTER POLICY NAV */}
        <View style={styles.landingFooterNav}>
          <Text style={styles.footerBrandTitle}>AwaajManki</Text>
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

          <Text style={styles.footerCopyright}>© 2026 AwaajManki. Privacy Guaranteed.</Text>
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
              <Text style={styles.modalTitle}>About AwaajManki</Text>
              <TouchableOpacity onPress={() => setAboutVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.policyHeading}>Our Vision</Text>
              <Text style={styles.policyBody}>
                AwaajManki is an 18+ anonymous, text-first social platform designed to create a safe, respectful space for self-expression without public social pressure.
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
                AwaajManki strictly segregates registration data (Full Name, Phone Number, Email) from public profiles. Your real identity is never exposed to other members under any circumstance.
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
