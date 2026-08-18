import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { styles } from '../../styles/appStyles';

export function AgreementCheckRow({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.checkRowContainer}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <Text style={styles.checkRowText}>{text}</Text>
    </TouchableOpacity>
  );
}
