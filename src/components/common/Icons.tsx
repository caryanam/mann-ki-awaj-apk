import React from 'react';
import { View, Text, Platform } from 'react-native';

export const HamburgerIcon = ({ color = '#2D1D15' }) => (
  <View style={{ width: 18, height: 12, justifyContent: 'space-between' }}>
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

export const HomeIcon = ({ color = '#8C8385', size = 20 }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Roof sides */}
      <View style={{
        position: 'absolute',
        top: 2,
        width: size * 0.7,
        height: size * 0.7,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
      {/* Base walls */}
      <View style={{
        position: 'absolute',
        bottom: 1.5,
        width: size * 0.65,
        height: size * 0.52,
        borderWidth: 2,
        borderTopWidth: 0,
        borderColor: color,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
        {/* Door */}
        <View style={{
          width: size * 0.22,
          height: size * 0.28,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
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
  const bellWidth = size * 0.72;
  const bellHeight = size * 0.62;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Bell Top Loop */}
      <View style={{
        width: size * 0.24,
        height: size * 0.2,
        borderWidth: 1.8,
        borderColor: color,
        borderBottomWidth: 0,
        borderTopLeftRadius: size * 0.12,
        borderTopRightRadius: size * 0.12,
        marginBottom: -2,
      }} />
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
        height: 2.2,
        backgroundColor: color,
        borderRadius: 1.1,
        marginTop: -0.5,
      }} />
      {/* Clapper */}
      <View style={{
        width: size * 0.22,
        height: size * 0.16,
        borderWidth: 2,
        borderColor: color,
        borderTopWidth: 0,
        borderBottomLeftRadius: size * 0.11,
        borderBottomRightRadius: size * 0.11,
        marginTop: 1.5,
      }} />
    </View>
  );
};

export const ProfileIcon = ({ color = '#8C8385', size = 18 }) => {
  const headSize = size * 0.42;
  const bodyWidth = size - 1;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outlined Head */}
      <View style={{
        width: headSize,
        height: headSize,
        borderRadius: headSize / 2,
        borderWidth: 2,
        borderColor: color,
        marginBottom: 2,
      }} />
      {/* Outlined Body */}
      <View style={{
        width: bodyWidth,
        height: size * 0.4,
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: color,
        borderTopLeftRadius: size * 0.3,
        borderTopRightRadius: size * 0.3,
        backgroundColor: 'transparent',
      }} />
    </View>
  );
};

export const StarIcon = ({ color = '#8C8385', size = 20 }) => {
  const width = size * 0.65;
  const height = size * 0.85;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: width,
        height: height,
        borderWidth: 2,
        borderColor: color,
        borderBottomWidth: 0,
        borderTopLeftRadius: 3.5,
        borderTopRightRadius: 3.5,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Centered rotated square to form a perfect triangular bookmark cutout */}
        <View style={{
          position: 'absolute',
          bottom: -width * 0.35,
          left: '50%',
          marginLeft: -width * 0.355,
          width: width * 0.71,
          height: width * 0.71,
          borderWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
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

export const HelpIcon = ({ color = '#8C8385', size = 18 }) => {
  const ringSize = size * 0.95;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: ringSize,
        height: ringSize,
        borderRadius: ringSize / 2,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: size * 0.58,
          color: color,
          fontWeight: '900',
          textAlign: 'center',
          includeFontPadding: false,
          textAlignVertical: 'center',
          lineHeight: size * 0.65,
          marginTop: Platform.OS === 'android' ? -1 : 0,
        }}>?</Text>
      </View>
    </View>
  );
};

export const SettingsIcon = ({ color = '#8C8385', size = 18 }) => {
  const innerSize = size * 0.52;
  const toothSize = size * 0.16;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Ring */}
      <View style={{
        width: innerSize + 4,
        height: innerSize + 4,
        borderRadius: (innerSize + 4) / 2,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Inner hole */}
        <View style={{ width: innerSize * 0.35, height: innerSize * 0.35, borderRadius: (innerSize * 0.35) / 2, borderWidth: 1.8, borderColor: color }} />
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

export const LogoutIcon = ({ color = '#C46F76', size = 18 }) => {
  const doorWidth = size * 0.45;
  const doorHeight = size * 0.95;
  const arrowWidth = size * 0.6;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Left side Door Frame (Bracket) */}
      <View style={{
        position: 'absolute',
        left: 0,
        width: doorWidth,
        height: doorHeight,
        borderWidth: 2.2,
        borderColor: color,
        borderRightWidth: 0,
        borderTopLeftRadius: 3.5,
        borderBottomLeftRadius: 3.5,
      }} />
      
      {/* Arrow Shaft & Head pointing to the right */}
      <View style={{
        position: 'absolute',
        right: 0,
        width: arrowWidth,
        height: size * 0.5,
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}>
        {/* Horizontal Shaft */}
        <View style={{ width: arrowWidth, height: 2.2, backgroundColor: color }} />
        {/* Caret Arrow Head */}
        <View style={{
          position: 'absolute',
          right: 1,
          width: 6,
          height: 6,
          borderTopWidth: 2.2,
          borderRightWidth: 2.2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }} />
      </View>
    </View>
  );
};

export const ShieldIcon = ({ color = '#8C8385', size = 20 }) => {
  const width = size * 0.82;
  const height = size * 0.9;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: width,
        height: height,
        borderWidth: 2,
        borderColor: color,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: width / 2,
        borderBottomRightRadius: width / 2,
        alignItems: 'center',
      }}>
        {/* Center line inside shield */}
        <View style={{ width: 2, height: height * 0.65, backgroundColor: color, marginTop: 2 }} />
      </View>
    </View>
  );
};

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
            borderRightColor: 'transparent',
            borderTopColor: color,
          }} />
        </View>
      </View>
    </View>
  );
};

export const TagIcon = ({ color = '#8C8385', size = 18 }) => {
  const width = size * 0.85;
  const height = size * 0.55;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: width,
        height: height,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'flex-start',
        transform: [{ rotate: '-40deg' }],
        paddingLeft: 3.5,
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

export const MusicIcon = ({ color = '#8C8385', size = 18 }) => {
  const noteWidth = size * 0.35;
  const stemHeight = size * 0.62;
  return (
    <View style={{ width: size, height: size }}>
      {/* Note 1 (Left) */}
      <View style={{ position: 'absolute', left: 0, bottom: 1 }}>
        <View style={{ width: noteWidth, height: noteWidth * 0.8, borderRadius: noteWidth / 2, backgroundColor: color }} />
        <View style={{ position: 'absolute', right: 0, bottom: noteWidth * 0.35, width: 2, height: stemHeight, backgroundColor: color }} />
      </View>
      
      {/* Note 2 (Right) */}
      <View style={{ position: 'absolute', right: 0, bottom: 3 }}>
        <View style={{ width: noteWidth, height: noteWidth * 0.8, borderRadius: noteWidth / 2, backgroundColor: color }} />
        <View style={{ position: 'absolute', right: 0, bottom: noteWidth * 0.35, width: 2, height: stemHeight, backgroundColor: color }} />
      </View>

      {/* Connecting Beam (Angled Top Bar) */}
      <View style={{
        position: 'absolute',
        top: 2,
        left: noteWidth - 2,
        right: 0,
        height: 3,
        backgroundColor: color,
        transform: [{ rotate: '-10deg' }],
      }} />
    </View>
  );
};

export const InboxIcon = ({ color = '#8C8385', size = 18 }) => {
  const boxWidth = size - 2;
  const boxHeight = size * 0.7;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: boxWidth,
        height: boxHeight,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          position: 'absolute',
          top: -2,
          width: boxWidth * 0.45,
          height: boxHeight * 0.45,
          borderWidth: 2,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: '#FFFFFF',
        }} />
      </View>
    </View>
  );
};

export const CheckIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.5,
      height: size * 0.25,
      borderLeftWidth: 2.2,
      borderBottomWidth: 2.2,
      borderColor: color,
      transform: [{ rotate: '-45deg' }],
      marginTop: -2,
    }} />
  </View>
);

export const TrashIcon = ({ color = '#8C8385', size = 18 }) => {
  const width = size * 0.58;
  const height = size * 0.65;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Lid Top Hook */}
      <View style={{ width: width * 0.4, height: 2, backgroundColor: color, borderTopLeftRadius: 1, borderTopRightRadius: 1, marginBottom: 1 }} />
      {/* Lid Bar */}
      <View style={{ width: width + 4, height: 2, backgroundColor: color, borderRadius: 1 }} />
      {/* Can body */}
      <View style={{
        width: width,
        height: height,
        borderWidth: 1.8,
        borderColor: color,
        borderTopWidth: 0,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        paddingHorizontal: 2.5,
        paddingVertical: 2,
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 1,
      }}>
        {/* Inner lines */}
        <View style={{ width: 1.5, height: '80%', backgroundColor: color }} />
        <View style={{ width: 1.5, height: '80%', backgroundColor: color }} />
      </View>
    </View>
  );
};

export const ArrowRightIcon = ({ color = '#8C8385', size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.6, height: 2, backgroundColor: color }} />
    <View style={{
      position: 'absolute',
      right: size * 0.2,
      width: size * 0.3,
      height: size * 0.3,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderColor: color,
      transform: [{ rotate: '45deg' }],
    }} />
  </View>
);
