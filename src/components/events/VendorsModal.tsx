import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING } from '@/src/lib/constants';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { VendorData, ToastType } from '@/src/types/events';

interface VendorsModalProps {
  visible: boolean;
  onClose: () => void;
  vendorData: VendorData[];
}

export function VendorsModal({ visible, onClose, vendorData }: VendorsModalProps) {
  const showCopyNotification = (message: string, type: ToastType = 'success'): void => {
    Toast.show({
      type,
      text1: message,
    });
  };

  const copyInstagramHandles = async (): Promise<void> => {
    const igHandles = vendorData
      .filter((vendor): vendor is VendorData & { social: { instagram: string } } => 
        Boolean(vendor.social?.instagram)
      )
      .map((vendor) => `@${vendor.social.instagram.replace('@', '')}`)
      .join('\n');

    if (igHandles) {
      await Clipboard.setStringAsync(igHandles);
      showCopyNotification('Instagram handles copied!', 'success');
    } else {
      showCopyNotification('No Instagram handles found', 'info');
    }
  };

  const copyFacebookHandles = async (): Promise<void> => {
    const fbHandles = vendorData
      .filter((vendor): vendor is VendorData & { social: { facebook: string } } => 
        Boolean(vendor.social?.facebook)
      )
      .map((vendor) => vendor.social.facebook)
      .join('\n');

    if (fbHandles) {
      await Clipboard.setStringAsync(fbHandles);
      showCopyNotification('Facebook handles copied!', 'success');
    } else {
      showCopyNotification('No Facebook handles found', 'info');
    }
  };

  const copyEmails = async (): Promise<void> => {
    const emails = vendorData
      .filter((vendor): vendor is VendorData & { email: string } => 
        Boolean(vendor.email)
      )
      .map((vendor) => vendor.email)
      .join('\n');

    if (emails) {
      await Clipboard.setStringAsync(emails);
      showCopyNotification('Email addresses copied!', 'success');
    } else {
      showCopyNotification('No email addresses found', 'info');
    }
  };

  const renderVendorItem: ListRenderItem<VendorData> = ({ item }) => (
    <Card variant="outlined" style={styles.vendorCard}>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>
          {item.displayName || 'Unknown Vendor'}
        </Text>
        {item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.map((category, index) => (
              <View key={`${item.userId}-category-${index}`} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Event Vendors</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {vendorData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No vendors have joined this event yet.</Text>
            </View>
          ) : (
            <FlatList
              data={vendorData}
              keyExtractor={(item, index) => `${item.userId}-${index}`}
              contentContainerStyle={styles.vendorsList}
              showsVerticalScrollIndicator={true}
              renderItem={renderVendorItem}
            />
          )}
        </View>

        {vendorData.length > 0 && (
          <View style={styles.copyButtonsContainer}>
            <Button
              title="Copy IG handles"
              onPress={copyInstagramHandles}
              variant="outline"
              size="medium"
              style={styles.copyButton}
            />
            <Button
              title="Copy FB handles"
              onPress={copyFacebookHandles}
              variant="outline"
              size="medium"
              style={styles.copyButton}
            />
            <Button
              title="Copy emails"
              onPress={copyEmails}
              variant="outline"
              size="medium"
              style={styles.copyButton}
            />
          </View>
        )}

      </SafeAreaView>
      <Toast />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  vendorsList: {
    padding: SPACING.m,
    paddingBottom: SPACING.l,
  },
  vendorCard: {
    marginBottom: SPACING.m,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
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
  copyButtonsContainer: {
    padding: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: 'white',
  },
  copyButton: {
    marginBottom: SPACING.s,
  },
});