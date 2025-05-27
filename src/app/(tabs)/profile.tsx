import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/src/lib/constants';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { LogOut, Save, Instagram } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut, createUserProfile, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setCompanyName(user.company_name || '');
      setPhone(user.phone || '');
      setInstagramHandle(user.instagram_handle || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);

    const userData = {
      display_name: displayName,
      company_name: companyName,
      phone,
      instagram_handle: instagramHandle.startsWith('@')
        ? instagramHandle.substring(1)
        : instagramHandle,
    };

    const { success, error } = await createUserProfile(userData);

    setLoading(false);

    if (success) {
      Alert.alert('Success', 'Profile updated successfully');
      refreshUser();
    } else {
      Alert.alert('Error', error || 'Failed to update profile');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Card style={styles.profileCard} variant="elevated">
          <Text style={styles.sectionTitle}>Your Information</Text>

          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
          />

          <Input
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Your business name"
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />

          <View style={styles.instagramContainer}>
            <Input
              label="Instagram Handle"
              value={instagramHandle}
              onChangeText={setInstagramHandle}
              placeholder="@yourhandle"
              autoCapitalize="none"
              containerStyle={styles.instagramInput}
            />
            <Instagram size={24} color={COLORS.secondary[500]} style={styles.instagramIcon} />
          </View>

          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={loading}
            icon={<Save size={18} color="white" style={styles.buttonIcon} />}
            iconPosition="left"
            style={styles.saveButton}
          />
        </Card>

        <Card style={styles.accountCard} variant="outlined">
          <Text style={styles.sectionTitle}>Account</Text>

          <Text style={styles.emailText}>
            Email: <Text style={styles.emailValue}>{user.email}</Text>
          </Text>

          <Button
            title="Sign Out"
            onPress={signOut}
            variant="outline"
            icon={<LogOut size={18} color={COLORS.error[600]} style={styles.buttonIcon} />}
            iconPosition="left"
            style={styles.signOutButton}
            textStyle={styles.signOutText}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    backgroundColor: COLORS.primary[700],
    padding: SPACING.m,
    paddingBottom: SPACING.l,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  scrollView: {
    flex: 1,
    padding: SPACING.m,
  },
  profileCard: {
    marginBottom: SPACING.m,
  },
  accountCard: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: SPACING.m,
    fontFamily: 'Inter-SemiBold',
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  saveButton: {
    marginTop: SPACING.m,
  },
  signOutButton: {
    marginTop: SPACING.m,
    borderColor: COLORS.error[500],
  },
  signOutText: {
    color: COLORS.error[600],
  },
  emailText: {
    fontSize: 16,
    color: COLORS.gray[700],
    fontFamily: 'Inter-Regular',
  },
  emailValue: {
    color: COLORS.gray[900],
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  instagramContainer: {
    position: 'relative',
  },
  instagramInput: {
    marginBottom: SPACING.m,
  },
  instagramIcon: {
    position: 'absolute',
    right: 12,
    bottom: 32,
  },
});
