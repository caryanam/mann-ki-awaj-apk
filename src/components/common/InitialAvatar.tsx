import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../styles/appStyles';

export function InitialAvatar({ initials, color, size = 44 }: { initials: any; color: any; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}
