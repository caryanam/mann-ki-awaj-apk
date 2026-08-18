import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../styles/theme';

export const HamburgerIcon = ({ color = '#2D1D15' }) => (
  <View style={{ width: 18, height: 12, justifyContent: 'space-between' }}>
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

export const HomeIcon = ({ color = '#8C8385', size = 20 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: 0,
      height: 0,
      borderLeftWidth: size / 2,
      borderRightWidth: size / 2,
      borderBottomWidth: size / 2 - 1,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: color,
    }} />
    <View style={{
      width: size - 4,
      height: size / 2,
      backgroundColor: color,
      marginTop: -1,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
    }} />
  </View>
);

export const PlusIcon = ({ color = '#FFFFFF', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ position: 'absolute', width: size, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ position: 'absolute', width: 2.5, height: size, backgroundColor: color, borderRadius: 1.5 }} />
  </View>
);

export const ChatIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size - 2, backgroundColor: color, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      position: 'absolute',
      bottom: -2,
      left: 4,
      width: 0,
      height: 0,
      borderLeftWidth: 3,
      borderRightWidth: 3,
      borderTopWidth: 3,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: color,
    }} />
    <View style={{ width: size - 6, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1, marginBottom: 2 }} />
    <View style={{ width: size - 10, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1, alignSelf: 'flex-start', marginLeft: 3 }} />
  </View>
);

export const BellIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size - 4, height: size - 6, backgroundColor: color, borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2 }} />
    <View style={{ width: size, height: 2, backgroundColor: color, borderRadius: 1, marginTop: 1 }} />
    <View style={{ width: 4, height: 2, backgroundColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: 1 }} />
  </View>
);

export const ProfileIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size / 2, height: size / 2, borderRadius: size / 4, backgroundColor: color, marginBottom: 2 }} />
    <View style={{ width: size - 2, height: size / 2 - 1, borderTopLeftRadius: size / 3, borderTopRightRadius: size / 3, backgroundColor: color, overflow: 'hidden' }} />
  </View>
);

export const StarIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size - 6, height: size - 2, backgroundColor: color, borderRadius: 2 }}>
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 0,
        borderLeftWidth: (size - 6) / 2,
        borderRightWidth: (size - 6) / 2,
        borderBottomWidth: 3,
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FCFAF9',
      }} />
    </View>
  </View>
);

export const DocIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size - 4, height: size, backgroundColor: color, borderRadius: 2, padding: 2, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: '80%', height: 1.5, backgroundColor: '#FFFFFF', marginBottom: 2, borderRadius: 1 }} />
    <View style={{ width: '80%', height: 1.5, backgroundColor: '#FFFFFF', marginBottom: 2, borderRadius: 1 }} />
    <View style={{ width: '50%', height: 1.5, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', marginLeft: 2, borderRadius: 1 }} />
  </View>
);

export const FlagIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-start' }}>
    <View style={{ width: 2, height: size, backgroundColor: color }} />
    <View style={{ width: size - 4, height: size * 0.6, backgroundColor: color, borderTopRightRadius: 2, borderBottomRightRadius: 2 }} />
  </View>
);

export const LanguageIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, borderWidth: 2, borderColor: color, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ position: 'absolute', width: size - 4, height: 1.5, backgroundColor: color }} />
    <View style={{ position: 'absolute', width: 1.5, height: size - 4, backgroundColor: color }} />
    <View style={{ width: size - 6, height: size - 6, borderWidth: 1, borderColor: color, borderRadius: (size - 6) / 2 }} />
  </View>
);

export const HelpIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, borderWidth: 2, borderColor: color, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size - 8, color: color, fontWeight: 'bold', lineHeight: size - 6, textAlign: 'center' }}>?</Text>
  </View>
);

export const SettingsIcon = ({ color = '#8C8385', size = 18 }) => {
  const innerSize = size * 0.55;
  const toothSize = size * 0.16;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Ring */}
      <View style={{
        width: innerSize + 4,
        height: innerSize + 4,
        borderRadius: (innerSize + 4) / 2,
        borderWidth: 2.2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Inner hole */}
        <View style={{ width: innerSize * 0.35, height: innerSize * 0.35, borderRadius: (innerSize * 0.35) / 2, backgroundColor: color }} />
      </View>
      
      {/* 8 Gear Teeth */}
      {[0, 45, 90, 135].map((angle) => (
        <View
          key={angle}
          style={{
            position: 'absolute',
            width: toothSize,
            height: size,
            justifyContent: 'space-between',
            alignItems: 'center',
            transform: [{ rotate: `${angle}deg` }],
          }}
        >
          <View style={{ width: toothSize, height: toothSize * 1.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: toothSize, height: toothSize * 1.5, backgroundColor: color, borderRadius: 1 }} />
        </View>
      ))}
    </View>
  );
};

export const LogoutIcon = ({ color = '#C46F76', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size - 4, height: size, borderWidth: 2, borderColor: color, borderRightWidth: 0, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }}>
      <View style={{
        position: 'absolute',
        right: -6,
        top: size / 2 - 3,
        width: 6,
        height: 4,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        right: -8,
        top: size / 2 - 5,
        width: 0,
        height: 0,
        borderLeftWidth: 3,
        borderTopWidth: 3,
        borderBottomWidth: 3,
        borderStyle: 'solid',
        borderLeftColor: color,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      }} />
    </View>
  </View>
);

export const ShieldIcon = ({ color = '#8C8385', size = 20 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size - 2,
      height: size - 4,
      backgroundColor: color,
      borderBottomLeftRadius: size / 2,
      borderBottomRightRadius: size / 2,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    }} />
  </View>
);

export const MicIcon = ({ color = '#8C8385', size = 20 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.45, height: size * 0.65, borderRadius: size * 0.22, backgroundColor: color }} />
    <View style={{ width: size * 0.6, height: size * 0.4, borderBottomLeftRadius: size * 0.3, borderBottomRightRadius: size * 0.3, borderWidth: 2, borderColor: color, borderTopWidth: 0, marginTop: -2 }} />
    <View style={{ width: 2, height: 4, backgroundColor: color }} />
    <View style={{ width: size * 0.4, height: 2, backgroundColor: color }} />
  </View>
);

export const LockIcon = ({ color = '#8C8385', size = 20 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size - 6, height: size / 2 + 2, borderTopLeftRadius: (size - 6) / 2, borderTopRightRadius: (size - 6) / 2, borderWidth: 2.5, borderColor: color, borderBottomWidth: 0 }} />
    <View style={{ width: size - 2, height: size / 2, backgroundColor: color, borderRadius: 2, marginTop: -2 }} />
  </View>
);

export const EyeIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size - 2,
      height: size - 8,
      borderRadius: (size - 8) / 2,
      borderWidth: 2,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{ width: size / 3, height: size / 3, borderRadius: size / 6, backgroundColor: color }} />
    </View>
  </View>
);

export const BanIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size - 2,
      height: size - 2,
      borderRadius: (size - 2) / 2,
      borderWidth: 2,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        position: 'absolute',
        width: size - 6,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  </View>
);

export const BarChartIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 }}>
    <View style={{ width: 3, height: size * 0.4, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 3, height: size * 0.8, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 3, height: size * 0.6, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 3, height: size * 0.9, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

export const LogsIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 2 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 }}>
      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color, marginRight: 4 }} />
      <View style={{ width: size - 9, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 }}>
      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color, marginRight: 4 }} />
      <View style={{ width: size - 9, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color, marginRight: 4 }} />
      <View style={{ width: size - 11, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  </View>
);
