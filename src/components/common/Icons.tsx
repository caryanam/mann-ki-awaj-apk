import React from 'react';
import { View, Text } from 'react-native';

export const HamburgerIcon = ({ color = '#2D1D15' }) => (
  <View style={{ width: 18, height: 12, justifyContent: 'space-between' }}>
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

export const HomeIcon = ({ color = '#8C8385', size = 20 }) => {
  const wallSize = size * 0.7;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Roof sides */}
      <View style={{
        position: 'absolute',
        top: 2,
        width: size * 0.65,
        height: size * 0.65,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
      {/* Base walls */}
      <View style={{
        position: 'absolute',
        bottom: 1,
        width: wallSize,
        height: wallSize,
        borderWidth: 2,
        borderTopWidth: 0,
        borderColor: color,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
        {/* Door */}
        <View style={{
          width: wallSize * 0.35,
          height: wallSize * 0.5,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 1.5,
          borderTopRightRadius: 1.5,
        }} />
      </View>
    </View>
  );
};

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

export const BellIcon = ({ color = '#8C8385', size = 20 }) => {
  const bellWidth = size * 0.75;
  const bellHeight = size * 0.65;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Bell body outline */}
      <View style={{
        width: bellWidth,
        height: bellHeight,
        borderWidth: 2,
        borderColor: color,
        borderBottomWidth: 0,
        borderTopLeftRadius: bellWidth / 2,
        borderTopRightRadius: bellWidth / 2,
        justifyContent: 'center',
        alignItems: 'center',
      }} />
      {/* Bell bottom horizontal bar */}
      <View style={{
        width: bellWidth + 4,
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
        marginTop: -0.5,
      }} />
      {/* Clapper */}
      <View style={{
        width: size * 0.22,
        height: size * 0.15,
        borderWidth: 2,
        borderColor: color,
        borderTopWidth: 0,
        borderBottomLeftRadius: size * 0.1,
        borderBottomRightRadius: size * 0.1,
        marginTop: 1,
      }} />
    </View>
  );
};

export const ProfileIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size / 2, height: size / 2, borderRadius: size / 4, backgroundColor: color, marginBottom: 2 }} />
    <View style={{ width: size - 2, height: size / 2 - 1, borderTopLeftRadius: size / 3, borderTopRightRadius: size / 3, backgroundColor: color, overflow: 'hidden' }} />
  </View>
);

export const StarIcon = ({ color = '#8C8385', size = 20 }) => {
  const width = size * 0.72;
  const height = size * 0.95;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: width,
        height: height,
        borderWidth: 2,
        borderColor: color,
        borderBottomWidth: 0,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        overflow: 'hidden',
      }}>
        {/* Left inner cutout line */}
        <View style={{
          position: 'absolute',
          bottom: -width * 0.35,
          left: -2,
          width: width * 0.6,
          height: width * 0.6,
          borderWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }} />
        {/* Right inner cutout line */}
        <View style={{
          position: 'absolute',
          bottom: -width * 0.35,
          right: -2,
          width: width * 0.6,
          height: width * 0.6,
          borderWidth: 2,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
        }} />
      </View>
    </View>
  );
};

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

export const ExploreIcon = ({ color = '#8C8385', size = 20 }) => {
  const compassSize = size * 0.95;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Dial Outline */}
      <View style={{
        width: compassSize,
        height: compassSize,
        borderRadius: compassSize / 2,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Needle Container (rotated diagonally) */}
        <View style={{
          width: compassSize * 0.65,
          height: compassSize * 0.65,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ rotate: '45deg' }],
        }}>
          {/* North needle */}
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 3.5,
            borderRightWidth: 3.5,
            borderBottomWidth: compassSize * 0.3,
            borderStyle: 'solid',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#EF4444',
            marginBottom: 1,
          }} />
          {/* South needle */}
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 3.5,
            borderRightWidth: 3.5,
            borderTopWidth: compassSize * 0.3,
            borderStyle: 'solid',
            borderLeftColor: 'transparent',
          }} />
        </View>
      </View>
    </View>
  );
};

export const TagIcon = ({ color = '#8C8385', size = 18 }) => {
  const width = size * 0.9;
  const height = size * 0.55;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: width,
        height: height,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'flex-start',
        transform: [{ rotate: '-45deg' }],
        paddingLeft: 3,
      }}>
        {/* Tag hole */}
        <View style={{
          width: 3.5,
          height: 3.5,
          borderRadius: 1.75,
          backgroundColor: color,
        }} />
      </View>
    </View>
  );
};
