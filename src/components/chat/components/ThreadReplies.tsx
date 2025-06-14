import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '@/src/lib/constants';

interface ThreadRepliesProps {
  replyCount: number;
  onPress?: () => void;
}

export function ThreadReplies({ replyCount, onPress }: ThreadRepliesProps) {
  console.log('ThreadReplies component rendered with replyCount:', replyCount);

  const replyText = replyCount === 1 ? '1 reply' : `${replyCount} replies`;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.line} />
      <Text style={styles.text}>{replyText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    paddingHorizontal: 8,
    marginLeft: 64,
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
