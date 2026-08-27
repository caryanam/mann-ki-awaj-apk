import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, Image, StyleSheet, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../styles/theme';
import { styles } from '../../styles/appStyles';
import { LockIcon, ShieldIcon, MicIcon, LanguageIcon, FlagIcon, ProfileIcon, EyeIcon, CheckIcon, TrashIcon, ArrowRightIcon, InfoIcon, ChevronLeftIcon, BackArrowIcon } from '../../components/common/Icons';
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FCFAF9', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCFAF9" translucent={true} />
        
        {/* Seamless Header Bar */}
        <View style={{
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          backgroundColor: '#FCFAF9',
        }}>
          <TouchableOpacity
            onPress={() => goToView('landing')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#EFE5EB',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <ChevronLeftIcon color="#6F405F" size={20} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D1D15' }}>Sign In</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: '#FCFAF9' }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Branding */}
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <View style={{
                width: 68,
                height: 68,
                borderRadius: 22,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#EDE5EA',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 4,
                marginBottom: 16
              }}>
                <Image source={require('../../assets/logo.png')} style={{ width: 42, height: 42, borderRadius: 10 }} />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#2D1D15', marginBottom: 6, letterSpacing: -0.5 }}>Welcome Back</Text>
              <Text style={{ fontSize: 13.5, color: '#8C8385', textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 }}>
                Sign in to continue your anonymous, safe conversations.
              </Text>
            </View>

            {!!errorMsg && (
              <View style={[styles.errorBanner, { width: '100%', marginBottom: 18, borderRadius: 14 }]}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email/Mobile Input Group */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 8 }}>
                Email Address or Mobile Number
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: 54,
                borderWidth: 1.5,
                borderColor: emailFocused ? '#6F405F' : '#E8E1E5',
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: emailFocused ? 0.08 : 0.03,
                shadowRadius: 6,
                elevation: emailFocused ? 2 : 1,
              }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  {/^\d+$/.test(email.trim()) ? <PhoneIcon color={emailFocused ? '#6F405F' : '#A0909C'} size={18} /> : <MailIcon color={emailFocused ? '#6F405F' : '#A0909C'} size={18} />}
                </View>
                <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Enter email or mobile number"
                  placeholderTextColor="#CEC7C5"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                />
              </View>
            </View>

            {/* Password Input Group */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33' }}>Password</Text>
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
                  <Text style={{ fontSize: 12.5, color: '#6F405F', fontWeight: '700' }}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: 54,
                borderWidth: 1.5,
                borderColor: passwordFocused ? '#6F405F' : '#E8E1E5',
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: passwordFocused ? 0.08 : 0.03,
                shadowRadius: 6,
                elevation: passwordFocused ? 2 : 1,
              }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  <LockIcon color={passwordFocused ? '#6F405F' : '#A0909C'} size={18} />
                </View>
                <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Enter password"
                  placeholderTextColor="#CEC7C5"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                  {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[{
                width: '100%',
                height: 54,
                backgroundColor: '#6F405F',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4
              }, loading && { opacity: 0.8 }]}
              onPress={handleLoginSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!loading && <LogInIcon color="#FFFFFF" size={18} />}
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Switch to Register */}
            <TouchableOpacity onPress={() => goToView('register')} style={{ marginTop: 28, alignItems: 'center' }}>
              <Text style={{ color: '#8C8385', fontSize: 13.5, fontWeight: '500' }}>
                Don't have an account? <Text style={{ color: '#6F405F', fontWeight: '800' }}>Create Anonymous Account</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (authView === 'register') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FCFAF9', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCFAF9" translucent={true} />
        
        {/* Seamless Header Bar */}
        <View style={{
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          backgroundColor: '#FCFAF9',
        }}>
          <TouchableOpacity
            onPress={() => goToView('landing')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#EFE5EB',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <ChevronLeftIcon color="#6F405F" size={20} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D1D15' }}>Create Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: '#FCFAF9' }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Branding */}
            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <Text style={{ fontSize: 25, fontWeight: '900', color: '#2D1D15', marginBottom: 4, letterSpacing: -0.4 }}>Join Awaaj Man Ki</Text>
              <Text style={{ fontSize: 13.5, color: '#8C8385', textAlign: 'center', lineHeight: 18 }}>
                Your identity stays private. Your voice matters.
              </Text>
            </View>

            {/* Privacy Shield Capsule */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: 'rgba(111, 64, 95, 0.12)',
              marginBottom: 18,
              shadowColor: '#6F405F',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <Text style={{ fontSize: 16 }}>🔒</Text>
              <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: '700', flex: 1 }}>
                Real name & phone are 100% private. Only your anonymous handle is shown.
              </Text>
            </View>

            {!!errorMsg && (
              <View style={[styles.errorBanner, { width: '100%', marginBottom: 16, borderRadius: 14 }]}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Full Name Input Group */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 6 }}>
                Full Name (Kept Private) *
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: 54,
                borderWidth: 1.5,
                borderColor: fullNameFocused ? '#6F405F' : '#E8E1E5',
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: fullNameFocused ? 0.08 : 0.03,
                shadowRadius: 6,
                elevation: fullNameFocused ? 2 : 1,
              }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  <ProfileIcon color={fullNameFocused ? '#6F405F' : '#A0909C'} size={18} />
                </View>
                <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Your real name (kept private)"
                  placeholderTextColor="#CEC7C5"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                  style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                />
              </View>
            </View>

            {/* Mobile Number Input Group */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 6 }}>
                Mobile Number *
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: 54,
                borderWidth: 1.5,
                borderColor: mobileFocused ? '#6F405F' : '#E8E1E5',
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: mobileFocused ? 0.08 : 0.03,
                shadowRadius: 6,
                elevation: mobileFocused ? 2 : 1,
              }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  <PhoneIcon color={mobileFocused ? '#6F405F' : '#A0909C'} size={18} />
                </View>
                <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#CEC7C5"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  onFocus={() => setMobileFocused(true)}
                  onBlur={() => setMobileFocused(false)}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                />
              </View>
            </View>

            {/* Email Input Group */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 6 }}>
                Email Address *
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: 54,
                borderWidth: 1.5,
                borderColor: emailSignupFocused ? '#6F405F' : '#E8E1E5',
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: emailSignupFocused ? 0.08 : 0.03,
                shadowRadius: 6,
                elevation: emailSignupFocused ? 2 : 1,
              }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  <MailIcon color={emailSignupFocused ? '#6F405F' : '#A0909C'} size={18} />
                </View>
                <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Enter your email address"
                  placeholderTextColor="#CEC7C5"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailSignupFocused(true)}
                  onBlur={() => setEmailSignupFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                />
              </View>
            </View>

            {/* Password Input Group */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 6 }}>
                Create Password *
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: 54,
                borderWidth: 1.5,
                borderColor: passwordSignupFocused ? '#6F405F' : '#E8E1E5',
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: passwordSignupFocused ? 0.08 : 0.03,
                shadowRadius: 6,
                elevation: passwordSignupFocused ? 2 : 1,
              }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  <LockIcon color={passwordSignupFocused ? '#6F405F' : '#A0909C'} size={18} />
                </View>
                <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                <TextInput
                  placeholder="Create a strong password"
                  placeholderTextColor="#CEC7C5"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordSignupFocused(true)}
                  onBlur={() => setPasswordSignupFocused(false)}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                  {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkboxes Agreement List */}
            <View style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#EFEAE8',
              marginBottom: 20
            }}>
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
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4
              }, (!canRegister || loading) && { opacity: 1, backgroundColor: '#c5bdc0', shadowOpacity: 0, elevation: 0 }]}
              onPress={handleRegisterSubmit}
              disabled={!canRegister || loading}
              activeOpacity={0.88}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Switch to Login */}
            <TouchableOpacity onPress={() => goToView('login')} style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={{ color: '#8C8385', fontSize: 13.5, fontWeight: '500' }}>
                Already have an account? <Text style={{ color: '#6F405F', fontWeight: '800' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

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
      </SafeAreaView>
    );
  }

  if (authView === 'forgot_password') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FCFAF9', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCFAF9" translucent={true} />
        
        {/* Seamless Header Bar */}
        <View style={{
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          backgroundColor: '#FCFAF9',
        }}>
          {forgotStep !== 4 ? (
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
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#EFE5EB',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#6F405F',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <ChevronLeftIcon color="#6F405F" size={20} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D1D15' }}>
            {forgotStep === 4 ? 'Success' : forgotStep === 3 ? 'New Password' : forgotStep === 2 ? 'Verify OTP' : 'Forgot Password'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: '#FCFAF9' }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: Enter Email or Mobile */}
            {forgotStep === 1 && (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <View style={{
                    width: 68,
                    height: 68,
                    borderRadius: 22,
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#EDE5EA',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 4,
                    marginBottom: 16
                  }}>
                    <KeyRoundIcon color="#6F405F" size={30} />
                  </View>
                  <Text style={{ fontSize: 25, fontWeight: '900', color: '#2D1D15', marginBottom: 6, letterSpacing: -0.4 }}>
                    Forgot Password?
                  </Text>
                  <Text style={{ fontSize: 13.5, color: '#8C8385', textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 }}>
                    Enter your registered email address or mobile number to receive a 6-digit recovery OTP.
                  </Text>
                </View>

                {!!errorMsg && (
                  <View style={[styles.errorBanner, { width: '100%', marginBottom: 18, borderRadius: 14 }]}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Email/Mobile Input Group */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 8 }}>
                    Email Address or Mobile Number *
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    height: 54,
                    borderWidth: 1.5,
                    borderColor: '#E8E1E5',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1,
                  }}>
                    <View style={{ width: 22, alignItems: 'center' }}>
                      {/^\d+$/.test(forgotIdentifier.trim()) ? <PhoneIcon color="#6F405F" size={18} /> : <MailIcon color="#6F405F" size={18} />}
                    </View>
                    <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                    <TextInput
                      placeholder="Enter registered email or mobile"
                      placeholderTextColor="#CEC7C5"
                      value={forgotIdentifier}
                      onChangeText={(val) => { setForgotIdentifier(val); setErrorMsg(''); }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                    />
                  </View>
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
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 4
                  }, (!forgotIdentifier.trim() || loading) && { opacity: 0.7 }]}
                  onPress={handleSendForgotOtp}
                  disabled={!forgotIdentifier.trim() || loading}
                  activeOpacity={0.88}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {!loading && <KeyRoundIcon color="#FFFFFF" size={18} />}
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                      {loading ? 'Sending OTP...' : 'Send Recovery OTP'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Back to Login Link */}
                <TouchableOpacity onPress={() => goToView('login')} style={{ marginTop: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#8C8385', fontSize: 13.5, fontWeight: '500' }}>
                    Remember your password? <Text style={{ color: '#6F405F', fontWeight: '800' }}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: Verify OTP */}
            {forgotStep === 2 && (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <View style={{
                    width: 68,
                    height: 68,
                    borderRadius: 22,
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#EDE5EA',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 4,
                    marginBottom: 16
                  }}>
                    <LockIcon color="#6F405F" size={28} />
                  </View>
                  <Text style={{ fontSize: 25, fontWeight: '900', color: '#2D1D15', marginBottom: 6, letterSpacing: -0.4 }}>
                    Verify OTP Code
                  </Text>
                  <Text style={{ fontSize: 13.5, color: '#8C8385', textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 }}>
                    Code sent to <Text style={{ color: '#6F405F', fontWeight: 'bold' }}>{forgotIdentifier}</Text>. Enter the 6-digit code below.
                  </Text>
                </View>

                {!!errorMsg && (
                  <View style={[styles.errorBanner, { width: '100%', marginBottom: 18, borderRadius: 14 }]}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* 6-digit OTP Box */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 8, textAlign: 'center' }}>
                    Enter 6-Digit Code
                  </Text>
                  <TextInput
                    maxLength={6}
                    keyboardType="number-pad"
                    value={forgotOtp}
                    onChangeText={(val) => { setForgotOtp(val.replace(/\D/g, '')); setErrorMsg(''); }}
                    placeholder="••••••"
                    placeholderTextColor="#CEC7C5"
                    style={{
                      width: '100%',
                      height: 58,
                      borderWidth: 1.5,
                      borderColor: '#6F405F',
                      borderRadius: 16,
                      backgroundColor: '#FFFFFF',
                      fontSize: 24,
                      fontWeight: '900',
                      textAlign: 'center',
                      letterSpacing: 12,
                      color: '#2D1D15',
                      shadowColor: '#6F405F',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  />
                </View>

                {/* Resend Cooldown Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 13, color: '#8C8385' }}>Didn't receive code?</Text>
                  <TouchableOpacity
                    onPress={handleForgotResendOtp}
                    disabled={forgotResendTimer > 0 || loading}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: 'bold',
                      color: forgotResendTimer > 0 ? '#CEC7C5' : '#6F405F',
                      textDecorationLine: 'underline'
                    }}>
                      {forgotResendTimer > 0 ? `Resend in ${forgotResendTimer}s` : 'Resend OTP'}
                    </Text>
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
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 4
                  }, (forgotOtp.length !== 6 || loading) && { opacity: 0.7 }]}
                  onPress={handleVerifyForgotOtp}
                  disabled={forgotOtp.length !== 6 || loading}
                  activeOpacity={0.88}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: Reset Password */}
            {forgotStep === 3 && (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <View style={{
                    width: 68,
                    height: 68,
                    borderRadius: 22,
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#EDE5EA',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 4,
                    marginBottom: 16
                  }}>
                    <LockIcon color="#6F405F" size={28} />
                  </View>
                  <Text style={{ fontSize: 25, fontWeight: '900', color: '#2D1D15', marginBottom: 6, letterSpacing: -0.4 }}>
                    Set New Password
                  </Text>
                  <Text style={{ fontSize: 13.5, color: '#8C8385', textAlign: 'center', lineHeight: 18 }}>
                    Create a strong, secure password for your account.
                  </Text>
                </View>

                {!!errorMsg && (
                  <View style={[styles.errorBanner, { width: '100%', marginBottom: 18, borderRadius: 14 }]}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* New Password Input */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 8 }}>
                    New Password *
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    height: 54,
                    borderWidth: 1.5,
                    borderColor: '#E8E1E5',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1,
                  }}>
                    <View style={{ width: 22, alignItems: 'center' }}>
                      <LockIcon color="#6F405F" size={18} />
                    </View>
                    <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                    <TextInput
                      placeholder="Enter new strong password"
                      placeholderTextColor="#CEC7C5"
                      value={forgotNewPassword}
                      onChangeText={(val) => { setForgotNewPassword(val); setErrorMsg(''); }}
                      secureTextEntry={!showPassword}
                      style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 4 }}>
                      {showPassword ? <EyeIcon color="#6F405F" size={20} /> : <EyeOffIcon color="#8C8385" size={20} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#3A2E33', marginBottom: 8 }}>
                    Confirm New Password *
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    height: 54,
                    borderWidth: 1.5,
                    borderColor: '#E8E1E5',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1,
                  }}>
                    <View style={{ width: 22, alignItems: 'center' }}>
                      <LockIcon color="#6F405F" size={18} />
                    </View>
                    <View style={{ width: 1, height: 22, backgroundColor: '#F0EAEE', marginHorizontal: 12 }} />
                    <TextInput
                      placeholder="Re-enter new password"
                      placeholderTextColor="#CEC7C5"
                      value={forgotConfirmPassword}
                      onChangeText={(val) => { setForgotConfirmPassword(val); setErrorMsg(''); }}
                      secureTextEntry={!showPassword}
                      style={{ flex: 1, height: '100%', fontSize: 14.5, color: '#2D1D15', fontWeight: '600', padding: 0 }}
                    />
                  </View>
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
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 4
                  }, (!forgotNewPassword.trim() || !forgotConfirmPassword.trim() || loading) && { opacity: 0.7 }]}
                  onPress={handleResetPasswordSubmit}
                  disabled={!forgotNewPassword.trim() || !forgotConfirmPassword.trim() || loading}
                  activeOpacity={0.88}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 4: Success Screen */}
            {forgotStep === 4 && (
              <View style={{ alignItems: 'center', marginVertical: 32 }}>
                <View style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: '#DCFCE7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  shadowColor: '#16A34A',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4
                }}>
                  <Text style={{ color: '#15803D', fontSize: 34, fontWeight: '900' }}>✓</Text>
                </View>
                <Text style={{ fontSize: 26, fontWeight: '900', color: '#2D1D15', marginBottom: 8, letterSpacing: -0.4, textAlign: 'center' }}>
                  Password Reset!
                </Text>
                <Text style={{ fontSize: 14, color: '#8C8385', marginBottom: 32, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 }}>
                  Your password has been reset successfully. You can now sign in to your anonymous account with your new credentials.
                </Text>

                {/* Back to Login button */}
                <TouchableOpacity
                  style={{
                    width: '100%',
                    height: 54,
                    backgroundColor: '#6F405F',
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#6F405F',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 4
                  }}
                  onPress={() => {
                    goToView('login');
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    Sign In to Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // DEFAULT VIEW: Landing Page ('landing')
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1E101D', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E101D" translucent={true} />
      <View style={{ flex: 1, backgroundColor: '#FCFAF9' }}>
        {/* Modern Mobile App Top Header (Dark Theme matching Landing Page) */}
        <View style={{
          backgroundColor: '#1E101D',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          paddingHorizontal: 16,
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 30, height: 30, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#F2B08D' }} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 }}>Awaaj Man Ki</Text>
            <Text style={{ fontSize: 18, color: '#F2B08D', marginLeft: 3, fontWeight: '900', transform: [{ translateY: -1 }] }}>•</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setAboutVisible(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.15)'
              }}
            >
              <InfoIcon color="#FFFFFF" size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => goToView('login')}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 100,
                backgroundColor: 'rgba(242, 176, 141, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(242, 176, 141, 0.35)',
              }}
            >
              <Text style={{ color: '#F2B08D', fontWeight: 'bold', fontSize: 12.5 }}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Mobile Content */}
        <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {/* Ambient Background Decorative Gradient Header Card */}
          <View style={mobileLandingStyles.heroContainer}>
            {/* Tagline Badge */}
            <View style={mobileLandingStyles.taglineBadge}>
              <Text style={{ fontSize: 12 }}>🛡️</Text>
              <Text style={mobileLandingStyles.taglineText}>मनातलं बोला… ओळख सुरक्षित ठेवा.</Text>
            </View>

            <Text style={mobileLandingStyles.mainTitle}>
              Where Thoughts{'\n'}Matter More Than{'\n'}
              <Text style={{ color: '#F2B08D' }}>Your Identity.</Text>
            </Text>

            <Text style={mobileLandingStyles.mainSubtitle}>
              Share honest emotions, opinions, and stories completely anonymously. AI safety filters ensure respectful, toxicity-free conversations.
            </Text>

            {/* Quick Feature Pills Horizontal Row */}
            <View style={mobileLandingStyles.chipRow}>
              {['🔒 100% Anonymous', '🤖 AI Safe Space', '🎙️ Voice & Audio', '🇮🇳 Indian Languages'].map((feature) => (
                <View key={feature} style={mobileLandingStyles.chipPill}>
                  <Text style={mobileLandingStyles.chipText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Interactive Floating App Post Previews (Simulating App UI) */}
          <View style={{ paddingHorizontal: 16, marginTop: -20, zIndex: 2 }}>
            <View style={mobileLandingStyles.previewCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>MK</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2D1D15' }}>Anonymous Soul</Text>
                    <Text style={{ fontSize: 10, color: '#8C8385' }}>#LifeThoughts • 5m ago</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#10B981' }}>🛡️ 100% Anonymous</Text>
                </View>
              </View>
              <Text style={{ fontSize: 13.5, color: '#2D1D15', lineHeight: 19, fontWeight: '500', marginBottom: 10 }}>
                "It feels so liberating to share what I'm truly feeling without worrying about who is judging me. A true safe haven."
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: '#F5ECEE', paddingTop: 8 }}>
                <Text style={{ fontSize: 11.5, color: '#6F405F', fontWeight: 'bold' }}>❤️ 142 Relate</Text>
                <Text style={{ fontSize: 11.5, color: '#8C8385', fontWeight: '600' }}>💬 28 Thoughts</Text>
                <Text style={{ fontSize: 11.5, color: '#8C8385', fontWeight: '600' }}>⭐ Helpful</Text>
              </View>
            </View>

            {/* Audio Snippet Preview */}
            <View style={[mobileLandingStyles.previewCard, { marginTop: 10, backgroundColor: '#FFFDFB', borderColor: '#F2B08D' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#D96C3D', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>AK</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2D1D15' }}>Anonymous Thinker</Text>
                    <Text style={{ fontSize: 10, color: '#8C8385' }}>#Career • Marathi Voice Note</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#FAF5F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#6F405F' }}>🎙️ Voice-to-Text</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FAF6F4', padding: 8, borderRadius: 12, marginBottom: 6 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#6F405F', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11 }}>▶</Text>
                </View>
                <View style={{ flex: 1, height: 4, backgroundColor: '#E1DCDB', borderRadius: 2 }}>
                  <View style={{ width: '60%', height: 4, backgroundColor: '#6F405F', borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#8C8385', fontWeight: 'bold' }}>0:45</Text>
              </View>
              <Text style={{ fontSize: 12.5, color: '#5C5254', fontStyle: 'italic' }}>
                "माझ्या करिअरच्या नव्या टप्प्यावर काय करावे? तुमचे विचार सांगा..."
              </Text>
            </View>
          </View>

          {/* App Feature Highlights Grid */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', marginBottom: 12 }}>
              Why People Love Awaaj Man Ki
            </Text>

            <View style={{ gap: 10 }}>
              {[
                { icon: '🔒', title: 'Zero Identity Exposure', desc: 'No phone numbers, full names, or photos are ever made public. Express yourself without social pressure.' },
                { icon: '🤖', title: 'Real-time AI Moderation', desc: 'Advanced AI filters prevent toxicity, hate speech, and harassment before publication.' },
                { icon: '🎙️', title: 'Native Voice & Audio', desc: 'Speak naturally in Hindi, Marathi, or English. Listen to background relaxing ambient music while reading.' },
                { icon: '💬', title: 'Private & Safe Discussions', desc: 'Engage in thoughtful 1-on-1 anonymous chats with community members who relate to your thoughts.' },
              ].map((card) => (
                <View key={card.title} style={mobileLandingStyles.featureRowCard}>
                  <View style={mobileLandingStyles.featureIconCircle}>
                    <Text style={{ fontSize: 20 }}>{card.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#2D1D15', marginBottom: 2 }}>{card.title}</Text>
                    <Text style={{ fontSize: 12, color: '#8C8385', lineHeight: 16 }}>{card.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* How It Works In 3 Steps */}
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#2D1D15', marginBottom: 14 }}>
              How It Works
            </Text>

            <View style={mobileLandingStyles.stepsContainer}>
              {[
                { num: '1', title: 'Create Anonymous Profile', desc: 'Pick your custom initials and avatar color in seconds.' },
                { num: '2', title: 'Speak Your Thoughts', desc: 'Write or speak freely on trending topics or life moments.' },
                { num: '3', title: 'Connect with Empathy', desc: 'React, support others, and receive meaningful responses.' },
              ].map((step, idx) => (
                <View key={step.num} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: idx === 2 ? 0 : 14 }}>
                  <View style={mobileLandingStyles.stepNumberBadge}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{step.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: '#2D1D15', marginBottom: 2 }}>{step.title}</Text>
                    <Text style={{ fontSize: 12, color: '#8C8385', lineHeight: 16 }}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Resources & Policies Footer Links */}
          <View style={{ paddingHorizontal: 16, marginTop: 24, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => setGuidelinesVisible(true)}>
                <Text style={mobileLandingStyles.legalLink}>Community Guidelines</Text>
              </TouchableOpacity>
              <Text style={{ color: '#CEC7C5' }}>•</Text>
              <TouchableOpacity onPress={() => setPrivacyVisible(true)}>
                <Text style={mobileLandingStyles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={{ color: '#CEC7C5' }}>•</Text>
              <TouchableOpacity onPress={() => setContactVisible(true)}>
                <Text style={mobileLandingStyles.legalLink}>Support</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#8C8385', textAlign: 'center' }}>
              18+ Safe Community • © 2026 Aawaj Man Ki
            </Text>
          </View>
        </ScrollView>

        {/* Floating Native Mobile Bottom Action Bar */}
        <View style={mobileLandingStyles.bottomActionBar}>
          <TouchableOpacity
            onPress={() => goToView('register')}
            style={mobileLandingStyles.primaryCtaBtn}
            activeOpacity={0.88}
          >
            <Text style={mobileLandingStyles.primaryCtaText}>Create Anonymous Account</Text>
            <Text style={{ fontSize: 16, color: '#FFFFFF', marginLeft: 6 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => goToView('login')}
            style={mobileLandingStyles.secondaryCtaBtn}
            activeOpacity={0.7}
          >
            <Text style={mobileLandingStyles.secondaryCtaText}>I already have an account • <Text style={{ color: '#6F405F', fontWeight: 'bold' }}>Log In</Text></Text>
          </TouchableOpacity>
        </View>

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
    </SafeAreaView>
  );
}

const mobileLandingStyles = StyleSheet.create({
  heroContainer: {
    backgroundColor: '#1E101D',
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 176, 141, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(242, 176, 141, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  taglineText: {
    color: '#F2B08D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#D4C9C3',
    textAlign: 'center',
    lineHeight: 18.5,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  chipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F0EAEE',
    shadowColor: '#6F405F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  featureRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECEB',
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5ECEE',
  },
  stepsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0ECEB',
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6F405F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  legalLink: {
    fontSize: 12,
    color: '#6F405F',
    fontWeight: 'bold',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EAEE',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    shadowColor: '#2D1D15',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  primaryCtaBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#6F405F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6F405F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryCtaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  secondaryCtaText: {
    fontSize: 12.5,
    color: '#8C8385',
    fontWeight: '500',
  },
});

// ── CUSTOM COMPONENT: COMMENT ITEM WITH NESTED REPLIES ──
