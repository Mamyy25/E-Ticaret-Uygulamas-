import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/colors';

export default function Divider({ style }) {
  return (
    <View
      style={[
        { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 0 },
        style,
      ]}
    />
  );
}
