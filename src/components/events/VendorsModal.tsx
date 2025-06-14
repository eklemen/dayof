// VendorsModal.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { COLORS, SPACING } from '@/src/lib/constants';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { VendorData, ToastType } from '@/src/types/events';

interface VendorsModalProps {
  visible: boolean;
  onClose: () => void;
  vendorData: VendorData[];
}
const BUTTON_BAR_HEIGHT = 100;

export function VendorsModal({ visible, onClose, vendorData }: VendorsModalProps) {
  const insets = useSafeAreaInsets();

  /* ---------- utilities ---------- */
  const showToast = (msg: string, type: ToastType = 'success') => Toast.show({ type, text1: msg });

  const copyHelper = async (list: string[], label: string) => {
    if (list.length) {
      await Clipboard.setStringAsync(list.join('\n'));
      showToast(`${label} copied!`);
    } else {
      showToast(`No ${label.toLowerCase()} found`, 'info');
    }
  };

  const copyInstagramHandles = () =>
    copyHelper(
      vendorData
        .filter((v) => v.social?.instagram)
        .map((v) => `@${v.social!.instagram.replace('@', '')}`),
      'Instagram handles'
    );

  const copyFacebookHandles = () =>
    copyHelper(
      vendorData.filter((v) => v.social?.facebook).map((v) => v.social!.facebook),
      'Facebook handles'
    );

  const copyEmails = () =>
    copyHelper(
      vendorData.filter((v) => v.email).map((v) => v.email!),
      'Email addresses'
    );

  /* ---------- list render ---------- */
  const renderVendor: ListRenderItem<VendorData> = ({ item }) => (
    <Card variant="outlined" style={styles.vendorCard}>
      <Text style={styles.vendorName}>{item.displayName || 'Unknown Vendor'}</Text>

      {item.categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {item.categories.map((cat) => (
            <View key={`${item.userId}-${cat}`} style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* scrollable list */}
        <FlatList
          data={vendorData}
          keyExtractor={(item, idx) => `${item.userId}-${idx}`}
          renderItem={renderVendor}
          contentContainerStyle={{
            padding: SPACING.m,
            paddingBottom: BUTTON_BAR_HEIGHT + insets.bottom + SPACING.m,
          }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.m }} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Event Vendors</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No vendors have joined this event yet.</Text>
            </View>
          }
        />

        {/* sticky button bar */}
        <View
          style={[
            styles.buttonBar,
            { paddingBottom: insets.bottom || SPACING.m }, // safe-area pad
          ]}
        >
          <Button title="Copy IG handles" onPress={copyInstagramHandles} variant="outline" />
          <Button title="Copy FB handles" onPress={copyFacebookHandles} variant="outline" />
          <Button title="Copy emails" onPress={copyEmails} variant="outline" />
        </View>
      </SafeAreaView>
      <Toast />
    </Modal>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
    fontFamily: 'Inter-Bold',
  },

  empty: { paddingVertical: SPACING.l, alignItems: 'center' },
  emptyText: {
    color: COLORS.gray[600],
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },

  vendorCard: { padding: SPACING.m },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    fontFamily: 'Inter-SemiBold',
  },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  categoryBadge: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontFamily: 'Inter-Medium',
  },

  footer: {
    marginTop: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.m,
  },
  footerBtn: { marginBottom: SPACING.s },
  buttonBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 150,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    flexDirection: 'column',
    gap: SPACING.s,
    height: BUTTON_BAR_HEIGHT,
    zIndex: 100, // ensure above FlatList
  },
});
