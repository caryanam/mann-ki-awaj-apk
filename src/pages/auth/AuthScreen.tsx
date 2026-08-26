import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, Image, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { LockIcon, ShieldIcon, MicIcon, LanguageIcon, FlagIcon, ProfileIcon, EyeIcon, CheckIcon, TrashIcon, ArrowRightIcon } from '../../components/common/Icons';
import { AgreementCheckRow } from '../../components/common/AgreementCheckRow';
import { apiService } from '../../services/apiService';

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

const LogInIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <View style={{ width: size, height: size, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
    {/* Door bracket */}
    <View style={{
      position: 'absolute',
      left: 2,
      top: 1,
      bottom: 1,
      width: 6,
      borderTopWidth: 1.8,
      borderBottomWidth: 1.8,
      borderLeftWidth: 1.8,
      borderColor: color,
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 2,
    }} />
    {/* Arrow */}
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 4,
    }}>
      <View style={{ width: 8, height: 1.8, backgroundColor: color }} />
      <View style={{
        width: 5,
        height: 5,
        borderTopWidth: 1.8,
        borderRightWidth: 1.8,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginLeft: -4,
      }} />
    </View>
  </View>
);

const KeyRoundIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.6, height: size * 0.6, borderWidth: 1.8, borderColor: color, borderRadius: size * 0.3 }} />
    <View style={{ width: 1.8, height: size * 0.5, backgroundColor: color, position: 'absolute', bottom: 1 }} />
    <View style={{ width: size * 0.3, height: 1.8, backgroundColor: color, position: 'absolute', bottom: 3, right: 3 }} />
    <View style={{ width: size * 0.2, height: 1.8, backgroundColor: color, position: 'absolute', bottom: 6, right: 3 }} />
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
  const scrollViewRef = useRef<ScrollView>(null);

  // Views: 'landing' | 'login' | 'register' | 'forgot_password'
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot_password'>('landing');

  // Input states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot Password flow states
  const [forgotStep, setForgotStep] = useState(1); // 1: Request, 2: Verify, 3: Reset, 4: Success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotResendTimer, setForgotResendTimer] = useState(0);

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

  // Input focus states for UI styling
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [emailSignupFocused, setEmailSignupFocused] = useState(false);
  const [passwordSignupFocused, setPasswordSignupFocused] = useState(false);

  useEffect(() => {
    if (resendTimer > 0 || forgotResendTimer > 0) {
      const interval = setInterval(() => {
        if (resendTimer > 0) setResendTimer(prev => prev - 1);
        if (forgotResendTimer > 0) setForgotResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer, forgotResendTimer]);

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
      setConfirm18(false);
      setAcceptTerms(false);
      setAcceptGuidelines(false);

      // Auto login user matching web flow!
      try {
        await login(email.trim(), password);
        setPassword('');
      } catch (loginErr) {
        setPassword('');
        goToView('login');
        Alert.alert(
          'Registration Success',
          'Your account has been registered and verified successfully! Please log in now using your credentials.'
        );
      }
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

  // Forgot Password flow handlers
  const handleSendForgotOtp = async () => {
    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your email or mobile number.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await apiService.forgotPassword(forgotIdentifier.trim());
      setForgotStep(2);
      setForgotOtp('');
      setForgotResendTimer(30);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    if (forgotOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await apiService.verifyForgotPasswordOtp(forgotIdentifier.trim(), forgotOtp.trim());
      setForgotStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await apiService.resetPassword(forgotIdentifier.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    if (forgotResendTimer > 0) return;
    try {
      await apiService.forgotPassword(forgotIdentifier.trim());
      setForgotResendTimer(30);
      Alert.alert('OTP Resent', 'A new verification code has been sent.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend recovery OTP.');
    }
  };

  // Switch view helpers
  const goToView = (view: 'landing' | 'login' | 'register' | 'forgot_password') => {
    setErrorMsg('');
    setAuthView(view);
  };



  if (authView === 'login') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.authContainer, { backgroundColor: '#FCFAF9', justifyContent: 'center' }]}
      >
        {/* Background Decorative Ambient Blobs */}
        <View style={{ position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#FAF1ED', opacity: 0.8, zIndex: 0 }} />
        <View style={{ position: 'absolute', bottom: -100, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#F5ECF0', opacity: 0.8, zIndex: 0 }} />
        <View style={{ position: 'absolute', top: '35%', left: -90, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFDF9', opacity: 0.6, zIndex: 0 }} />

        <View style={[styles.authCard, { paddingVertical: 32, paddingHorizontal: 24, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1, shadowColor: '#6F405F', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 }]}>
          {/* Back Pill Button */}
          <TouchableOpacity
            onPress={() => goToView('landing')}
            style={{
              alignSelf: 'flex-start',
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: '#E8E1E5',
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 }
            }}
          >
            <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: '800' }}>← Back</Text>
          </TouchableOpacity>

          {/* Logo Circle Container */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: '#F1ECEF',
            shadowColor: '#6F405F',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.14,
            shadowRadius: 10,
            elevation: 5,
            marginBottom: 20
          }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 46, height: 46, borderRadius: 10 }} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: '900', color: '#6F405F', marginBottom: 8, letterSpacing: -0.5 }}>Welcome Back</Text>
          <Text style={{ fontSize: 13, color: '#8C8385', marginBottom: 28, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 }}>
            Sign in to your account using your registered email or mobile number.
          </Text>

          {!!errorMsg && (
            <View style={[styles.errorBanner, { width: '100%', marginBottom: 18, borderRadius: 14 }]}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Email/Mobile Input Label */}
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6, letterSpacing: 0.2 }}>
            Email Address or Mobile Number *
          </Text>

          {/* Email/Mobile Input Box */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 54,
            borderWidth: 1.8,
            borderColor: emailFocused ? '#6F405F' : '#E8E1E5',
            borderRadius: 16,
            paddingHorizontal: 16,
            marginBottom: 16,
            backgroundColor: emailFocused ? '#FFFFFF' : '#FAF8F8',
            shadowColor: '#6F405F',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: emailFocused ? 0.08 : 0,
            shadowRadius: 4,
            elevation: emailFocused ? 2 : 0,
          }}>
            <View style={{ width: 20, alignItems: 'center' }}>
              {/^\d+$/.test(email.trim()) ? <PhoneIcon color={emailFocused ? '#6F405F' : '#A0909C'} size={18} /> : <MailIcon color={emailFocused ? '#6F405F' : '#A0909C'} size={18} />}
            </View>
            <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
            <TextInput
              placeholder="Enter registered mail or mobile"
              placeholderTextColor="#CEC7C5"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', fontWeight: '600', padding: 0 }}
            />
          </View>

          {/* Password Input Label Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#2D1D15', letterSpacing: 0.2 }}>Password *</Text>
            <TouchableOpacity
              onPress={() => {
                setErrorMsg('');
                setForgotStep(1);
                setForgotIdentifier('');
                setForgotOtp('');
                setForgotNewPassword('');
                setForgotConfirmPassword('');
                setForgotResendTimer(0);
                goToView('forgot_password');
              }}
            >
              <Text style={{ fontSize: 12.5, color: '#6F405F', fontWeight: '700', textDecorationLine: 'underline' }}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Password Input Box */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 54,
            borderWidth: 1.8,
            borderColor: passwordFocused ? '#6F405F' : '#E8E1E5',
            borderRadius: 16,
            paddingHorizontal: 16,
            marginBottom: 26,
            backgroundColor: passwordFocused ? '#FFFFFF' : '#FAF8F8',
            shadowColor: '#6F405F',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: passwordFocused ? 0.08 : 0,
            shadowRadius: 4,
            elevation: passwordFocused ? 2 : 0,
          }}>
            <View style={{ width: 20, alignItems: 'center' }}>
              <LockIcon color={passwordFocused ? '#6F405F' : '#A0909C'} size={18} />
            </View>
            <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#CEC7C5"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', fontWeight: '600', padding: 0 }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
              {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
            </TouchableOpacity>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[{
              width: '100%',
              height: 54,
              backgroundColor: '#6F405F',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.16,
              shadowRadius: 8,
              elevation: 4
            }, loading && { opacity: 0.8 }]}
            onPress={handleLoginSubmit}
            disabled={loading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!loading && <LogInIcon color="#FFFFFF" size={17} />}
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15.5 }}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Switch auth button */}
          <TouchableOpacity onPress={() => goToView('register')} style={{ marginTop: 24 }}>
            <Text style={{ color: '#8C8385', fontSize: 13, fontWeight: '600' }}>
              Don't have an account? <Text style={{ color: '#6F405F', fontWeight: '800', textDecorationLine: 'underline' }}>Create Anonymous Account</Text>
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
        style={[styles.authContainer, { backgroundColor: '#FCFAF9', justifyContent: 'center' }]}
      >
        {/* Background Decorative Ambient Blobs */}
        <View style={{ position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#FAF1ED', opacity: 0.8, zIndex: 0 }} />
        <View style={{ position: 'absolute', bottom: -100, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#F5ECF0', opacity: 0.8, zIndex: 0 }} />
        <View style={{ position: 'absolute', top: '35%', left: -90, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFDF9', opacity: 0.6, zIndex: 0 }} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: 20, paddingBottom: 40, width: '100%' }} showsVerticalScrollIndicator={false} style={{ zIndex: 1, width: '100%' }}>
          <View style={[styles.authCard, { paddingVertical: 32, paddingHorizontal: 24, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.8)', shadowColor: '#6F405F', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 }]}>
            {/* Back Pill Button */}
            <TouchableOpacity
              onPress={() => goToView('landing')}
              style={{
                alignSelf: 'flex-start',
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: '#E8E1E5',
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 }
              }}
            >
              <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: '800' }}>← Back</Text>
            </TouchableOpacity>

            {/* Logo Circle Container */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: '#F1ECEF',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.14,
              shadowRadius: 10,
              elevation: 5,
              marginBottom: 20
            }}>
              <Image source={require('../../assets/logo.png')} style={{ width: 46, height: 46, borderRadius: 10 }} />
            </View>

            <Text style={{ fontSize: 26, fontWeight: '900', color: '#6F405F', marginBottom: 8, letterSpacing: -0.5 }}>Create Account</Text>
            <Text style={{ fontSize: 13, color: '#8C8385', marginBottom: 20, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 }}>
              Your identity stays private. Your voice matters.
            </Text>

            {/* Privacy Capsules Column */}
            <View style={{ gap: 8, marginBottom: 24, width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(110, 64, 95, 0.04)', borderWidth: 1, borderColor: 'rgba(110, 64, 95, 0.08)' }}>
                <Text style={{ fontSize: 14 }}>🔒</Text>
                <Text style={{ fontSize: 11.5, color: '#6F405F', fontWeight: '700', flex: 1 }}>Real name is kept 100% private</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(110, 64, 95, 0.04)', borderWidth: 1, borderColor: 'rgba(110, 64, 95, 0.08)' }}>
                <Text style={{ fontSize: 14 }}>🎭</Text>
                <Text style={{ fontSize: 11.5, color: '#6F405F', fontWeight: '700', flex: 1 }}>Only anonymous handle visible to others</Text>
              </View>
            </View>

            {!!errorMsg && (
              <View style={[styles.errorBanner, { width: '100%', marginBottom: 18, borderRadius: 14 }]}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Full Name Input Label */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6, letterSpacing: 0.2 }}>
              Real Full Name (Kept Private) *
            </Text>

            {/* Full Name Input Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 54,
              borderWidth: 1.8,
              borderColor: fullNameFocused ? '#6F405F' : '#E8E1E5',
              borderRadius: 16,
              paddingHorizontal: 16,
              marginBottom: 14,
              backgroundColor: fullNameFocused ? '#FFFFFF' : '#FAF8F8',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: fullNameFocused ? 0.08 : 0,
              shadowRadius: 4,
              elevation: fullNameFocused ? 2 : 0,
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <ProfileIcon color={fullNameFocused ? '#6F405F' : '#A0909C'} size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Your real name (kept private)"
                placeholderTextColor="#CEC7C5"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFullNameFocused(true)}
                onBlur={() => setFullNameFocused(false)}
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', fontWeight: '600', padding: 0 }}
              />
            </View>

            {/* Mobile Number Input Label */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6, letterSpacing: 0.2, marginTop: 4 }}>
              Mobile Number *
            </Text>

            {/* Mobile Number Input Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 54,
              borderWidth: 1.8,
              borderColor: mobileFocused ? '#6F405F' : '#E8E1E5',
              borderRadius: 16,
              paddingHorizontal: 16,
              marginBottom: 14,
              backgroundColor: mobileFocused ? '#FFFFFF' : '#FAF8F8',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: mobileFocused ? 0.08 : 0,
              shadowRadius: 4,
              elevation: mobileFocused ? 2 : 0,
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <PhoneIcon color={mobileFocused ? '#6F405F' : '#A0909C'} size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor="#CEC7C5"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                onFocus={() => setMobileFocused(true)}
                onBlur={() => setMobileFocused(false)}
                keyboardType="phone-pad"
                maxLength={10}
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', fontWeight: '600', padding: 0 }}
              />
            </View>

            {/* Email Input Label */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6, letterSpacing: 0.2, marginTop: 4 }}>
              Email Address *
            </Text>

            {/* Email Input Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 54,
              borderWidth: 1.8,
              borderColor: emailSignupFocused ? '#6F405F' : '#E8E1E5',
              borderRadius: 16,
              paddingHorizontal: 16,
              marginBottom: 14,
              backgroundColor: emailSignupFocused ? '#FFFFFF' : '#FAF8F8',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: emailSignupFocused ? 0.08 : 0,
              shadowRadius: 4,
              elevation: emailSignupFocused ? 2 : 0,
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <MailIcon color={emailSignupFocused ? '#6F405F' : '#A0909C'} size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Enter e-mail id"
                placeholderTextColor="#CEC7C5"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailSignupFocused(true)}
                onBlur={() => setEmailSignupFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', fontWeight: '600', padding: 0 }}
              />
            </View>

            {/* Password Input Label */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6, letterSpacing: 0.2, marginTop: 4 }}>
              Create Password *
            </Text>

            {/* Password Input Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              height: 54,
              borderWidth: 1.8,
              borderColor: passwordSignupFocused ? '#6F405F' : '#E8E1E5',
              borderRadius: 16,
              paddingHorizontal: 16,
              marginBottom: 20,
              backgroundColor: passwordSignupFocused ? '#FFFFFF' : '#FAF8F8',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: passwordSignupFocused ? 0.08 : 0,
              shadowRadius: 4,
              elevation: passwordSignupFocused ? 2 : 0,
            }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <LockIcon color={passwordSignupFocused ? '#6F405F' : '#A0909C'} size={18} />
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
              <TextInput
                placeholder="Create a strong password"
                placeholderTextColor="#CEC7C5"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordSignupFocused(true)}
                onBlur={() => setPasswordSignupFocused(false)}
                secureTextEntry={!showPassword}
                style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', fontWeight: '600', padding: 0 }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
              </TouchableOpacity>
            </View>

            {/* Checkboxes agreement list */}
            <View style={{ width: '100%', marginBottom: 20 }}>
              <AgreementCheckRow
                checked={confirm18}
                onPress={() => setConfirm18(!confirm18)}
                text={
                  <Text style={{ color: '#8C8385', fontSize: 12.5 }}>
                    I confirm I am <Text style={{ fontWeight: 'bold', color: '#2D1D15' }}>18 years or older</Text>
                  </Text>
                }
              />
              <AgreementCheckRow
                checked={acceptTerms}
                onPress={() => setAcceptTerms(!acceptTerms)}
                text={
                  <Text style={{ color: '#8C8385', fontSize: 12.5 }}>
                    I accept the <Text style={{ textDecorationLine: 'underline', color: '#6F405F', fontWeight: 'bold' }}>Terms & Conditions</Text>
                  </Text>
                }
              />
              <AgreementCheckRow
                checked={acceptGuidelines}
                onPress={() => setAcceptGuidelines(!acceptGuidelines)}
                text={
                  <Text style={{ color: '#8C8385', fontSize: 12.5 }}>
                    I agree to <Text style={{ textDecorationLine: 'underline', color: '#6F405F', fontWeight: 'bold' }}>Guidelines</Text> and <Text style={{ textDecorationLine: 'underline', color: '#6F405F', fontWeight: 'bold' }}>Hate Speech Policy</Text>
                  </Text>
                }
              />
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[{
                width: '100%',
                height: 54,
                backgroundColor: '#6F405F',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.16,
                shadowRadius: 8,
                elevation: 4
              }, (!canRegister || loading) && { opacity: 1, backgroundColor: '#c5bdc0', shadowOpacity: 0, elevation: 0 }]}
              onPress={handleRegisterSubmit}
              disabled={!canRegister || loading}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15.5 }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Switch auth button */}
            <TouchableOpacity onPress={() => goToView('login')} style={{ marginTop: 24 }}>
              <Text style={{ color: '#8C8385', fontSize: 13, fontWeight: '600' }}>
                Already have an account? <Text style={{ color: '#6F405F', fontWeight: '800', textDecorationLine: 'underline' }}>Login</Text>
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

  if (authView === 'forgot_password') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.authContainer}
      >
        <View style={styles.authCard}>
          {/* Back Pill Button */}
          {forgotStep !== 4 && (
            <TouchableOpacity
              onPress={() => {
                if (forgotStep > 1) {
                  setForgotStep(forgotStep - 1);
                  setErrorMsg('');
                } else {
                  goToView('login');
                }
              }}
              style={{
                alignSelf: 'flex-start',
                marginBottom: 20,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FAF6F8',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#F1ECEF',
              }}
            >
              <Text style={{ fontSize: 11, color: '#6F405F', fontWeight: 'bold' }}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* STEP 1: Enter Email or Mobile */}
          {forgotStep === 1 && (
            <>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6F405F', marginBottom: 6 }}>Forgot Password</Text>
              <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 24, textAlign: 'center', lineHeight: 16 }}>
                Enter your registered email address or mobile number to receive a 6-digit recovery OTP.
              </Text>

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
                marginBottom: 20,
                backgroundColor: '#FAF8F8',
              }}>
                <View style={{ width: 20, alignItems: 'center' }}>
                  {/^\d+$/.test(forgotIdentifier.trim()) ? <PhoneIcon color="#6F405F" size={18} /> : <MailIcon color="#6F405F" size={18} />}
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Enter registered mail or mobile"
                  placeholderTextColor="#CEC7C5"
                  value={forgotIdentifier}
                  onChangeText={(val) => { setForgotIdentifier(val); setErrorMsg(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
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
                }, (!forgotIdentifier.trim() || loading) && { opacity: 0.7 }]}
                onPress={handleSendForgotOtp}
                disabled={!forgotIdentifier.trim() || loading}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {!loading && <KeyRoundIcon color="#FFFFFF" size={17} />}
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                    {loading ? 'Checking Account...' : 'Send Recovery OTP'}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2: Verify OTP */}
          {forgotStep === 2 && (
            <>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6F405F', marginBottom: 6 }}>Verify OTP Code</Text>
              <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 24, textAlign: 'center', lineHeight: 16 }}>
                Verification OTP sent to <Text style={{ color: '#6F405F', fontWeight: 'bold' }}>{forgotIdentifier}</Text>. Please enter the 6-digit code below.
              </Text>

              {/* OTP Input Label */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6 }}>
                6-Digit OTP Code *
              </Text>

              {/* OTP Input */}
              <TextInput
                maxLength={6}
                keyboardType="number-pad"
                value={forgotOtp}
                onChangeText={(val) => { setForgotOtp(val.replace(/\D/g, '')); setErrorMsg(''); }}
                placeholder="Enter OTP"
                placeholderTextColor="#CEC7C5"
                style={{
                  width: '100%',
                  height: 52,
                  borderWidth: 1.5,
                  borderColor: '#E8E1E5',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  marginBottom: 16,
                  backgroundColor: '#FAF8F8',
                  fontSize: 18,
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: 4,
                  color: '#2D1D15'
                }}
              />

              {/* Resend Cooldown Section */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: '#8C8385' }}>Didn't receive code?</Text>
                <TouchableOpacity
                  onPress={handleForgotResendOtp}
                  disabled={forgotResendTimer > 0 || loading}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: forgotResendTimer > 0 ? '#CEC7C5' : '#6F405F',
                    textDecorationLine: 'underline'
                  }}>
                    {forgotResendTimer > 0 ? `Resend (${forgotResendTimer}s)` : 'Resend OTP'}
                  </Text>
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
                }, (forgotOtp.length !== 6 || loading) && { opacity: 0.7 }]}
                onPress={handleVerifyForgotOtp}
                disabled={forgotOtp.length !== 6 || loading}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3: Reset Password */}
          {forgotStep === 3 && (
            <>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6F405F', marginBottom: 6 }}>Reset Password</Text>
              <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 24, textAlign: 'center', lineHeight: 16 }}>
                Enter a new strong password below.
              </Text>

              {/* New Password Label */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6 }}>
                New Password *
              </Text>

              {/* New Password Input */}
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
                  <LockIcon color="#6F405F" size={18} />
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#EADBE4', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Enter new password"
                  placeholderTextColor="#CEC7C5"
                  value={forgotNewPassword}
                  onChangeText={(val) => { setForgotNewPassword(val); setErrorMsg(''); }}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                  {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
                </TouchableOpacity>
              </View>

              {/* Confirm Password Label */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D1D15', alignSelf: 'flex-start', marginBottom: 6 }}>
                Confirm Password *
              </Text>

              {/* Confirm Password Input */}
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
                  placeholder="Confirm new password"
                  placeholderTextColor="#CEC7C5"
                  value={forgotConfirmPassword}
                  onChangeText={(val) => { setForgotConfirmPassword(val); setErrorMsg(''); }}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, height: '100%', fontSize: 14, color: '#2D1D15', padding: 0 }}
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
                }, (!forgotNewPassword.trim() || !forgotConfirmPassword.trim() || loading) && { opacity: 0.7 }]}
                onPress={handleResetPasswordSubmit}
                disabled={!forgotNewPassword.trim() || !forgotConfirmPassword.trim() || loading}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 4: Success Screen */}
          {forgotStep === 4 && (
            <>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#DCFCE7',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                marginTop: 10
              }}>
                <Text style={{ color: '#15803D', fontSize: 28, fontWeight: 'bold' }}>✓</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6F405F', marginBottom: 6 }}>Password Reset Success</Text>
              <Text style={{ fontSize: 12, color: '#8C8385', marginBottom: 24, textAlign: 'center', lineHeight: 18 }}>
                Your password has been reset successfully. You can now log in with your new password.
              </Text>

              {/* Back to Login button */}
              <TouchableOpacity
                style={{
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
                }}
                onPress={() => {
                  goToView('login');
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // DEFAULT VIEW: Landing Page ('landing')
  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 26, height: 26, borderRadius: 6, marginRight: 8 }} />
          <Text style={[styles.headerText, { fontWeight: 'bold' }]}>Aawaj Man Ki</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => goToView('login')}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 100,
              backgroundColor: 'rgba(111, 64, 95, 0.1)',
            }}
          >
            <Text style={{ color: '#6F405F', fontWeight: 'bold', fontSize: 12.5 }}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goToView('register')} style={{ backgroundColor: '#D89C7A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: '#0B0A16', fontSize: 12, fontWeight: 'bold' }}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1, backgroundColor: '#FFF8F2' }}>
        {/* 1. HERO SECTION */}
        <View style={landingStyles.heroBlock}>
          {/* Marathi Tagline Pill */}
          <View style={landingStyles.taglinePill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldIcon color="#F2B08D" size={14} />
              <Text style={{ color: '#F2B08D', fontWeight: 'bold', fontSize: 13 }}>
                मनातलं बोला… ओळख सुरक्षित ठेवा.
              </Text>
            </View>
          </View>

          <Text style={landingStyles.heroTitle}>
            Where Thoughts{'\n'}Matter More{'\n'}
            <Text style={{ color: '#F2B08D' }}>Than Identity.</Text>
          </Text>

          <Text style={landingStyles.heroSub}>
            Share your thoughts, opinions, experiences and emotions freely without revealing who you are. AI-powered moderation keeps conversations respectful, meaningful and safe.
          </Text>

          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 28 }}>
            <TouchableOpacity onPress={() => goToView('register')} style={landingStyles.btnPrimary}>
              <Text style={{ color: '#0B0A16', fontWeight: '900', fontSize: 14 }}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ y: 440, animated: true })} style={landingStyles.btnSecondary}>
              <Text style={{ color: '#F2B08D', fontWeight: '900', fontSize: 14 }}>Explore Features</Text>
            </TouchableOpacity>
          </View>

          {/* Web-aligned Trust Badges Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 20, width: '100%' }}>
            {['Anonymous by Design', 'AI Moderated', 'Voice-to-Text', 'Indian Languages'].map((badge) => (
              <View key={badge} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }}>
                <Text style={{ fontSize: 11, color: '#F2B08D' }}>✓</Text>
                <Text style={{ color: '#E4DDD9', fontSize: 11.5, fontWeight: '500' }}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. WHY AAWAJ MAN KI? (COMPARISON SECTION) */}
        <View style={landingStyles.section}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#6F405F', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
            Why Aawaj Man Ki?
          </Text>
          <Text style={landingStyles.sectionTitle}>
            Social media is built for followers. We are built for conversations.
          </Text>
          <Text style={landingStyles.sectionTitleSub}>
            A calm, judgment-free space designed for ideas, empathy, and your authentic voice.
          </Text>

          {/* Comparison Cards Grid (Traditional Social Media VS Aawaj Man Ki) */}
          <View style={{ gap: 16 }}>
            {/* Traditional Social Media */}
            <View style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E8DDD5', backgroundColor: '#FAF6F4', position: 'relative' }}>
              <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#8C8385', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Traditional Social Media
              </Text>
              <View style={{ gap: 10 }}>
                {['Followers', 'Likes', 'Personal Branding', 'Identity', 'Popularity', 'Toxicity & Hate'].map((item) => (
                  <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(239, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold', marginTop: -1 }}>✕</Text>
                    </View>
                    <Text style={{ fontSize: 13.5, color: '#5C5254', fontWeight: '500' }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* VS Badge */}
            <View style={{ alignSelf: 'center', zIndex: 1, marginVertical: -8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF8F2' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>VS</Text>
              </View>
            </View>

            {/* Aawaj Man Ki */}
            <View style={{ padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: '#6F405F', backgroundColor: '#FFFDFB', shadowColor: '#6F405F', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#6F405F', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Aawaj Man Ki
              </Text>
              <View style={{ gap: 10 }}>
                {['Anonymous', 'Respectful', 'Ideas First', 'AI Moderated', 'Meaningful Discussions', 'Toxicity Free'].map((item) => (
                  <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: 'bold', marginTop: -0.5 }}>✓</Text>
                    </View>
                    <Text style={{ fontSize: 13.5, color: '#2D1D15', fontWeight: 'bold' }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 3. WHAT MAKES US DIFFERENT */}
        <View style={[landingStyles.section, { backgroundColor: '#F9F5F3' }]}>
          <Text style={landingStyles.sectionTitle}>What Makes Us Different</Text>
          <View style={styles.landingTitleDivider} />

          {/* Premium Feature Cards */}
          <View style={landingStyles.featureCard}>
            <View style={landingStyles.featureIcon}>
              <LockIcon color="#6F405F" size={24} />
            </View>
            <Text style={landingStyles.featureTitle}>Anonymous by Design</Text>
            <Text style={landingStyles.featureBody}>No real names. No public profiles. Pure text & voice expression.</Text>
            <TouchableOpacity onPress={() => setAboutVisible(true)}>
              <Text style={landingStyles.learnMoreText}>Learn More →</Text>
            </TouchableOpacity>
          </View>

          <View style={landingStyles.featureCard}>
            <View style={landingStyles.featureIcon}>
              <ShieldIcon color="#6F405F" size={24} />
            </View>
            <Text style={landingStyles.featureTitle}>AI-Powered Safety</Text>
            <Text style={landingStyles.featureBody}>Detects hate speech. Filters abuse. Protects conversations.</Text>
            <TouchableOpacity onPress={() => setGuidelinesVisible(true)}>
              <Text style={landingStyles.learnMoreText}>Learn More →</Text>
            </TouchableOpacity>
          </View>

          <View style={landingStyles.featureCard}>
            <View style={landingStyles.featureIcon}>
              <MicIcon color="#6F405F" size={24} />
            </View>
            <Text style={landingStyles.featureTitle}>Voice-to-Text</Text>
            <Text style={landingStyles.featureBody}>Speak naturally. Supports Indian languages. Audio deleted after processing.</Text>
            <TouchableOpacity onPress={() => setAboutVisible(true)}>
              <Text style={landingStyles.learnMoreText}>Learn More →</Text>
            </TouchableOpacity>
          </View>

          {/* Quick bullet points */}
          <View style={{ gap: 12, marginTop: 8 }}>
            {[
              { title: 'Discussion First', desc: 'Ideas over popularity. Quality conversations that matter.' },
              { title: 'Privacy First', desc: 'No identity exposure. No follower counts. Privacy by default.' },
              { title: 'Community Moderation', desc: 'Report harmful content. Human + AI review for healthy discussions.' },
            ].map((item) => (
              <View key={item.title} style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE6E4' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6F405F', marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ fontSize: 12.5, color: '#8C8385', lineHeight: 17 }}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. HOW IT WORKS */}
        <View style={[landingStyles.section, { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EBE6E4' }]}>
          <Text style={landingStyles.sectionTitle}>How It Works</Text>
          <View style={styles.landingTitleDivider} />

          {/* Timeline Connector Layout */}
          <View style={{ position: 'relative', paddingLeft: 12 }}>
            {/* Vertical Line */}
            <View style={{ position: 'absolute', left: 24, top: 20, bottom: 20, width: 2, backgroundColor: '#EBE6E4', borderStyle: 'dashed' }} />

            {[
              { num: '1', title: 'Register Privately', body: 'Your phone number and name are kept strictly private.' },
              { num: '2', title: 'Write Anonymously', body: 'Publish thoughts with initials-based colored avatars.' },
              { num: '3', title: 'Interact with Empathy', body: 'React with helpful support emojis or send safe anonymous DMs.' },
              { num: '4', title: 'Safe Spaces', body: 'Real-time automated content filtration keeps discussions respectful.' },
            ].map((step, idx) => (
              <View key={step.num} style={{ flexDirection: 'row', marginBottom: idx === 3 ? 0 : 24, gap: 16, alignItems: 'flex-start' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>{step.num}</Text>
                </View>
                <View style={{ flex: 1, marginTop: 2 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#2D1D15', marginBottom: 4 }}>{step.title}</Text>
                  <Text style={{ fontSize: 13, color: '#8C8385', lineHeight: 18 }}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. BUILT FOR EVERY VOICE */}
        <View style={landingStyles.section}>
          <Text style={landingStyles.sectionTitle}>Built for Every Voice</Text>
          <Text style={landingStyles.sectionTitleSub}>
            A space for every Indian who wants to share, listen and connect.
          </Text>

          {/* Badge capsules grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {['Students', 'Young Professionals', 'Creators', 'Thinkers', 'Dreamers', 'Parents', 'Professionals', 'Anyone'].map((tag) => (
              <View key={tag} style={landingStyles.voiceChip}>
                <Text style={landingStyles.voiceChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. A SANCTUARY FOR ALL (TESTIMONIAL CARD) */}
        <View style={[landingStyles.section, { backgroundColor: '#FAF5F2', alignItems: 'center' }]}>
          <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#6F405F', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>
            A Sanctuary For All
          </Text>

          <View style={landingStyles.testimonialCard}>
            {/* Watermark Quote */}
            <Text style={{ position: 'absolute', top: -14, left: 16, fontSize: 80, color: 'rgba(255, 255, 255, 0.08)', fontWeight: 'bold' }}>“</Text>

            <Text style={landingStyles.testimonialQuote}>
              "Finally a platform where my thoughts matter more than my job title or social standing."
            </Text>
            <Text style={landingStyles.testimonialAuthor}>— Anonymous Creator</Text>
          </View>
        </View>

        {/* 7. FOOTER SUPPORT & CONTACT */}
        <View style={landingStyles.footerBlock}>
          <Text style={landingStyles.footerBrand}>Aawaj Man Ki</Text>
          <Text style={landingStyles.footerDesc}>
            Your trusted platform for anonymous, safe, and judgment-free conversations. AI-powered moderation keeps discussions respectful and toxicity-free.
          </Text>

          {/* Quick Links Section */}
          <Text style={landingStyles.footerHeader}>Quick Links</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
            <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}><Text style={landingStyles.footerTextLink}>Home</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ y: 440, animated: true })}><Text style={landingStyles.footerTextLink}>Features</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ y: 1460, animated: true })}><Text style={landingStyles.footerTextLink}>How It Works</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setAboutVisible(true)}><Text style={landingStyles.footerTextLink}>About Us</Text></TouchableOpacity>
          </View>

          {/* Resources */}
          <Text style={landingStyles.footerHeader}>Resources</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => setGuidelinesVisible(true)}><Text style={landingStyles.footerTextLink}>FAQs</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setPrivacyVisible(true)}><Text style={landingStyles.footerTextLink}>Privacy Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setGuidelinesVisible(true)}><Text style={landingStyles.footerTextLink}>Guidelines</Text></TouchableOpacity>
          </View>

          {/* Contact Details */}
          <Text style={landingStyles.footerHeader}>Contact Us</Text>
          <View style={{ gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <Text style={landingStyles.footerContactText}>✉ support@awaazmanki.com</Text>
            <Text style={landingStyles.footerContactText}>📞 +91 99999 99999</Text>
            <Text style={landingStyles.footerContactText}>📍 Pune, Maharashtra</Text>
          </View>

          <View style={landingStyles.footerDivider} />

          <Text style={landingStyles.footerCopy}>© 2026 Aawaj Man Ki. All rights reserved by Caryanamindia Pvt Ltd</Text>
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

const landingStyles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE9',
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  navLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C8385',
  },
  heroBlock: {
    backgroundColor: '#1E101D', // Deeper plum
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  taglinePill: {
    backgroundColor: 'rgba(242, 176, 141, 0.12)',
    borderColor: 'rgba(242, 176, 141, 0.35)',
    borderWidth: 1.2,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#E6DDD8',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  btnPrimary: {
    backgroundColor: '#F2B08D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 26,
    shadowColor: '#F2B08D',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnSecondary: {
    borderColor: 'rgba(242, 176, 141, 0.5)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  section: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFDFB',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D1D15',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  sectionTitleSub: {
    fontSize: 13.5,
    color: '#8C8385',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0EBE9',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2D1D15',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(111, 64, 95, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6F405F',
    marginBottom: 8,
  },
  featureBody: {
    fontSize: 13,
    color: '#8C8385',
    textAlign: 'center',
    lineHeight: 18,
  },
  learnMoreText: {
    color: '#6F405F',
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 14,
  },
  voiceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE6E4',
  },
  voiceChipText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6F405F',
  },
  testimonialCard: {
    backgroundColor: '#4A2B40', // Immersive dark plum
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  testimonialQuote: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 14,
    zIndex: 1,
  },
  testimonialAuthor: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F2B08D',
    zIndex: 1,
  },
  footerBlock: {
    backgroundColor: '#1E0E18', // Deep rich black-plum
    padding: 32,
    alignItems: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 20,
  },
  footerBrand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F2B08D',
    marginBottom: 8,
  },
  footerDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  footerHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F2B08D',
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerTextLink: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  footerContactText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    marginVertical: 18,
  },
  footerCopy: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});

// ── CUSTOM COMPONENT: COMMENT ITEM WITH NESTED REPLIES ──
