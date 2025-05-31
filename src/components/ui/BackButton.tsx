import { TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';

interface BackButtonProps {
  color?: string;
  size?: number;
  onPress?: () => void;
}

export function BackButton({
  color = 'white',
  size = 24,
  onPress
}: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={handlePress}
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.s,
  },
});
