import { View, Text, Button } from 'react-native';
import * as Linking from 'expo-linking';

export default function TestDeepLink() {
  const testDeepLink = () => {
    const url = 'dayof://auth/callback?test=true';
    console.log('Testing deep link:', url);
    Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Deep Link Test</Text>
      <Button title="Test Deep Link" onPress={testDeepLink} />
    </View>
  );
}
