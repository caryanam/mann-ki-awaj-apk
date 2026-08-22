import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../utils/translations';

// ── CUSTOM VECTOR ICONS ──
const RefreshCwIcon = ({ color = '#6F405F', size = 13 }) => (
  <View style={{ width: size, height: size, borderBottomWidth: 1.8, borderLeftWidth: 1.8, borderColor: color, borderRadius: size / 2, borderRightColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: 0,
      height: 0,
      borderLeftWidth: 3.5,
      borderLeftColor: 'transparent',
      borderRightWidth: 3.5,
      borderRightColor: 'transparent',
      borderBottomWidth: 5,
      borderBottomColor: color,
      position: 'absolute',
      top: -2.5,
      right: -2,
      transform: [{ rotate: '45deg' }]
    }} />
  </View>
);

const CheckCircleIcon = ({ color = '#6F405F', size = 24 }) => (
  <View style={{ width: size, height: size, borderWidth: 2, borderColor: color, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.45,
      height: size * 0.25,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      borderColor: color,
      transform: [{ rotate: '-45deg' }],
      marginTop: -size * 0.08
    }} />
  </View>
);

const ArrowRightIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.6, height: 1.8, backgroundColor: color }} />
    <View style={{
      width: size * 0.35,
      height: size * 0.35,
      borderTopWidth: 1.8,
      borderRightWidth: 1.8,
      borderColor: color,
      transform: [{ rotate: '45deg' }],
      marginLeft: size * 0.25,
      position: 'absolute'
    }} />
  </View>
);

const ArrowLeftIcon = ({ color = '#2D1D15', size = 15 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.6, height: 1.8, backgroundColor: color }} />
    <View style={{
      width: size * 0.35,
      height: size * 0.35,
      borderBottomWidth: 1.8,
      borderLeftWidth: 1.8,
      borderColor: color,
      transform: [{ rotate: '45deg' }],
      marginRight: size * 0.25,
      position: 'absolute'
    }} />
  </View>
);

const SparklesIcon = ({ color = '#6F405F', size = 14 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
    {/* Vertical pill */}
    <View style={{
      width: size * 0.28,
      height: size * 0.9,
      borderRadius: (size * 0.28) / 2,
      backgroundColor: color,
      position: 'absolute',
    }} />
    {/* Horizontal pill */}
    <View style={{
      width: size * 0.9,
      height: size * 0.28,
      borderRadius: (size * 0.28) / 2,
      backgroundColor: color,
      position: 'absolute',
    }} />
    {/* Center circle mask matching the container background #FDFBFB to create the star tapering effect */}
    <View style={{
      width: size * 0.38,
      height: size * 0.38,
      borderRadius: (size * 0.38) / 2,
      backgroundColor: '#FDFBFB',
      position: 'absolute',
    }} />
  </View>
);

const CheckIcon = ({ color = '#6F405F', size = 16 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.55,
      height: size * 0.3,
      borderBottomWidth: 2.2,
      borderLeftWidth: 2.2,
      borderColor: color,
      transform: [{ rotate: '-45deg' }],
      marginTop: -2
    }} />
  </View>
);

// ── USERNAME GENERATOR DATA ──
const USERNAME_PREFIXES = [
  'quiet', 'hidden', 'thought', 'open', 'unfinished', 'plain', 'mind', 'new', 'silent',
  'calm', 'gentle', 'inner', 'honest', 'kind', 'deep', 'serene', 'wandering', 'soft', 'subtle'
];

const USERNAME_NOUNS = [
  'chapter', 'page', 'window', 'journal', 'line', 'truth', 'space', 'canvas', 'paragraph',
  'harbor', 'note', 'voice', 'thought', 'horizon', 'whisper', 'reflect', 'echo', 'passage', 'verse'
];

function generateUsernameSuggestions(count = 4) {
  const suggestions = new Set<string>();
  let attempts = 0;

  while (suggestions.size < count && attempts < 200) {
    attempts++;
    const p = USERNAME_PREFIXES[Math.floor(Math.random() * USERNAME_PREFIXES.length)];
    const n = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];

    const num = Math.floor(Math.random() * 90) + 10;
    const uname = attempts % 2 === 0 ? `@${p}${n}` : `@${p}${n}${num}`;
    suggestions.add(uname);
  }

  return Array.from(suggestions);
}

const AVATAR_COLORS = [
  { id: 'plum', hex: '#6F405F', name: 'Deep Plum' },
  { id: 'teal', hex: '#3F7772', name: 'Deep Teal' },
  { id: 'terracotta', hex: '#D96C3D', name: 'Terracotta' },
  { id: 'charcoal', hex: '#2D1D15', name: 'Charcoal' },
  { id: 'emerald', hex: '#2E7D52', name: 'Emerald' },
  { id: 'indigo', hex: '#4A3B6F', name: 'Indigo' },
];

export function ProfileSetupScreen() {
  const { updateProfile } = useAuth() as any;
  const { changeLanguage } = useLanguage() as any;

  const [step, setStep] = useState(1); // 1: Username & Avatar, 2: Bio & Language

  // Form State
  const selectedColor = AVATAR_COLORS[0].hex;
  const [username, setUsername] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('EN');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Language Modal State
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Generate suggestions on load
  useEffect(() => {
    refreshSuggestions();
  }, []);

  const refreshSuggestions = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 400);
    const list = generateUsernameSuggestions(4);
    setSuggestions(list);
    if (list[0]) {
      setUsername(list[0]);
    }
  };

  const handleNextStep = () => {
    if (!username) {
      setErrorMsg('Please select one of the suggested handles.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!bio.trim() || bio.trim().length < 5) {
      setErrorMsg('Bio must be at least 5 characters.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const cleanUname = username.startsWith('@') ? username.slice(1) : username;

      // Update Auth Context & Backend profile
      await updateProfile({
        username: cleanUname,
        bio: bio.trim(),
        avatarColor: selectedColor,
        preferredLanguage: preferredLanguage,
      });

      // Change Active Translation language
      if (changeLanguage) {
        await changeLanguage(preferredLanguage);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Profile setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLangLabel = SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.native || preferredLanguage;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F5F4', position: 'relative' }}>
      {/* Ambient background decoration blobs */}
      <View style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#FAF1ED', opacity: 0.8, zIndex: 0 }} />
      <View style={{ position: 'absolute', bottom: -50, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: '#F5ECF0', opacity: 0.9, zIndex: 0 }} />
      <View style={{ position: 'absolute', top: '35%', right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFDF9', opacity: 0.7, zIndex: 0 }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, zIndex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            {/* Logo Circle Container */}
            <View style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#E8E1E5',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#2D1D15',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 4,
              marginBottom: 12,
            }}>
              <Image source={require('../../assets/logo.png')} style={{ width: 40, height: 40, borderRadius: 10 }} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#6F405F' }}>Profile Setup</Text>
            <Text style={{ fontSize: 13, color: '#8C8385', marginTop: 4 }}>
              Share your thoughts, not your identity
            </Text>
          </View>

          {/* Stepper Wizard Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#2D1D15',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 6,
          }}>
            {/* Progress Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#6F405F', letterSpacing: 0.6 }}>
                FIRST-TIME SETUP • STEP {step} OF 2
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === step ? 24 : 8,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === step ? '#6F405F' : i < step ? '#C8B1C0' : '#E8E1E5',
                    }}
                  />
                ))}
              </View>
            </View>

            {errorMsg ? (
              <View style={{
                backgroundColor: '#FDF2F2',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#FDE8E8',
                marginBottom: 16,
              }}>
                <Text style={{ color: '#E02424', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {/* STEP 1: USERNAME SELECTION */}
            {step === 1 && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D1D15' }}>
                    Select Your Anonymous Handle
                  </Text>
                  <Text style={{ fontSize: 12, color: '#8C8385', marginTop: 4 }}>
                    Select one of the guaranteed unique anonymous handles below to represent you.
                  </Text>
                </View>

                {/* Selected display box */}
                <View style={{
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#6F405F',
                  backgroundColor: 'rgba(111, 64, 95, 0.06)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#8C8385', textTransform: 'uppercase' }}>
                      Selected Anonymous Handle
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#6F405F', marginTop: 2 }}>
                      {username}
                    </Text>
                  </View>
                  <CheckCircleIcon color="#6F405F" size={22} />
                </View>

                {/* Suggestion list card */}
                <View style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: '#FDFBFB',
                  borderWidth: 1.5,
                  borderColor: '#E8E1E5',
                  shadowColor: '#2D1D15',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#2D1D15', display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                      <SparklesIcon color="#6F405F" size={13} />Available Unique Handles
                    </Text>
                    <TouchableOpacity
                      onPress={refreshSuggestions}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                      disabled={spinning}
                    >
                      <RefreshCwIcon color="#6F405F" size={12} />
                      <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: 'bold' }}>Suggest More</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Grid Stack */}
                  <View style={{ gap: 10 }}>
                    {/* Row 1 */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {suggestions.slice(0, 2).map((sug) => {
                        const isSelected = username === sug;
                        return (
                          <TouchableOpacity
                            key={sug}
                            onPress={() => { setUsername(sug); setErrorMsg(''); }}
                            style={{
                              flex: 1,
                              paddingVertical: 12,
                              paddingHorizontal: 12,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: isSelected ? '#6F405F' : '#E8E1E5',
                              backgroundColor: isSelected ? 'rgba(111, 64, 95, 0.08)' : '#FFFFFF',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.8}
                              style={{
                                fontSize: 13,
                                fontWeight: 'bold',
                                color: isSelected ? '#6F405F' : '#2D1D15',
                                flex: 1,
                                marginRight: 4,
                              }}
                            >
                              {sug}
                            </Text>
                            {isSelected && <CheckIcon color="#6F405F" size={12} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Row 2 */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {suggestions.slice(2, 4).map((sug) => {
                        const isSelected = username === sug;
                        return (
                          <TouchableOpacity
                            key={sug}
                            onPress={() => { setUsername(sug); setErrorMsg(''); }}
                            style={{
                              flex: 1,
                              paddingVertical: 12,
                              paddingHorizontal: 12,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: isSelected ? '#6F405F' : '#E8E1E5',
                              backgroundColor: isSelected ? 'rgba(111, 64, 95, 0.08)' : '#FFFFFF',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.8}
                              style={{
                                fontSize: 13,
                                fontWeight: 'bold',
                                color: isSelected ? '#6F405F' : '#2D1D15',
                                flex: 1,
                                marginRight: 4,
                              }}
                            >
                              {sug}
                            </Text>
                            {isSelected && <CheckIcon color="#6F405F" size={12} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleNextStep}
                  style={{
                    backgroundColor: '#2D1D15',
                    height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                      Next: Add Bio
                    </Text>
                    <ArrowRightIcon color="#FFFFFF" size={16} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: BIO & LANGUAGE */}
            {step === 2 && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D1D15' }}>
                    Write Anonymous Bio
                  </Text>
                  <Text style={{ fontSize: 12, color: '#8C8385', marginTop: 4 }}>
                    Describe your perspective, values, or topics you like discussing without sharing identity details.
                  </Text>
                </View>

                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#2D1D15' }}>
                      Anonymous Bio *
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: bio.trim().length >= 5 ? '#15803D' : '#8C8385' }}>
                      {bio.length} / 250 chars
                    </Text>
                  </View>

                  <TextInput
                    multiline
                    numberOfLines={4}
                    maxLength={250}
                    placeholder="Share your perspective, values, or topics you like discussing..."
                    placeholderTextColor="#CEC7C5"
                    value={bio}
                    onChangeText={(val) => { setBio(val); setErrorMsg(''); }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: '#E8E1E5',
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 13.5,
                      color: '#2D1D15',
                      height: 100,
                      textAlignVertical: 'top',
                      backgroundColor: '#FAF8F8',
                    }}
                  />
                </View>

                {/* Preferred Language picker */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#2D1D15' }}>
                    Preferred Language *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLangModalVisible(true)}
                    style={{
                      height: 48,
                      borderWidth: 1.5,
                      borderColor: '#E8E1E5',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      backgroundColor: '#FFFFFF',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontSize: 13.5, color: '#2D1D15', fontWeight: 'bold' }}>
                      {selectedLangLabel}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6F405F', fontWeight: 'bold' }}>Change ▾</Text>
                  </TouchableOpacity>
                </View>

                {/* Actions stack */}
                <View style={{ gap: 12, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting || bio.trim().length < 5}
                    style={{
                      height: 52,
                      borderRadius: 12,
                      backgroundColor: submitting
                        ? '#6F405F'
                        : bio.trim().length < 5
                          ? '#F3EEF1'
                          : '#6F405F',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          color: bio.trim().length < 5 ? '#A58BA0' : '#FFFFFF',
                          fontWeight: 'bold',
                          fontSize: 15.5,
                        }}
                      >
                        Complete Profile & Finish
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setStep(1); setErrorMsg(''); }}
                    style={{
                      height: 52,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: '#E8E1E5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ArrowLeftIcon color="#2D1D15" size={14} />
                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2D1D15' }}>Go Back</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(45,29,21,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '60%',
            paddingBottom: 24,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F5ECEB',
            }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D1D15' }}>Select Preferred Language</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18, color: '#8C8385', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = preferredLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      setPreferredLanguage(lang.code);
                      setLangModalVisible(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isSelected ? '#FAF6F8' : 'transparent',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{
                      fontSize: 14.5,
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: isSelected ? '#6F405F' : '#2D1D15',
                    }}>
                      {lang.native} ({lang.label || lang.code})
                    </Text>
                    {isSelected && <CheckIcon color="#6F405F" size={15} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
