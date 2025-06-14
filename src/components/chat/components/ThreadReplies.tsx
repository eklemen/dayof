import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '@/src/lib/constants';

interface ThreadRepliesProps {
  replyCount: number;
  onPress?: () => void;
}

export function ThreadReplies({ replyCount, onPress }: ThreadRepliesProps) {
  if (replyCount === 0) {
    return null;
  }

  const replyText = replyCount === 1 ? '1 reply' : `${replyCount} replies`;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.line} />
      <Text style={styles.text}>{replyText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    marginLeft: 44, // Align with message content, accounting for avatar
  },
  line: {
    width: 16,
    height: 1,
    backgroundColor: COLORS.gray[300],
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    color: COLORS.primary[600],
    fontWeight: '500',
  },
});