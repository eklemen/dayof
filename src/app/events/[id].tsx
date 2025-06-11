import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, Users, Settings, UserPlus, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING } from '@/src/lib/constants';
import { formatDate } from '@/src/lib/utils';
import { ChatInterface } from '@/src/components/chat/ChatInterface';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useGetEvent } from '@/src/services/service-hooks/useGetEvent';
import { useGetUsersInEvent } from '@/src/services/service-hooks/useGetUsersInEvent';
import { getCategoriesForUser, getUserProfile } from '@/src/services/firestoreQueries';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id || '';
  const { data: event, isLoading: loading, error } = useGetEvent(eventId);
  const { data: eventUsers } = useGetUsersInEvent(eventId);

  console.log('Event data:', { event, loading, error, eventId });

  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);
  const [vendorData, setVendorData] = useState<any[]>([]);

  const handleOpenThread = (parentId: string) => {
    setThreadParentId(parentId);
    setShowThread(true);
  };

  const handleCloseThread = () => {
    setShowThread(false);
    setThreadParentId(null);
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleViewVendors = async () => {
    setShowMenu(false);

    if (!eventUsers || eventUsers.length === 0) {
      setVendorData([]);
      setShowVendorsModal(true);
      return;
    }

    console.log('eventUsers---------->', eventUsers[0]);
    // Prepare vendor data with categories and full user profiles
    const vendorsWithCategories = await Promise.all(
      eventUsers.map(async (member: any) => {
        try {
          const [userProfile, userCategories] = await Promise.all([
            getUserProfile(member.userId),
            getCategoriesForUser(eventId, member.userId)
          ]);

          return {
            ...member,
            ...userProfile,
            categories: userCategories || []
          };
        } catch (error) {
          console.error('Error fetching vendor data:', error);
          return {
            ...member,
            displayName: 'Unknown User',
            categories: [],
            email: undefined,
            social: {}
          };
        }
      })
    );

    setVendorData(vendorsWithCategories);
    setShowVendorsModal(true);
  };

  const handleCloseVendorsModal = () => {
    setShowVendorsModal(false);
  };

  const showCopyNotification = (message: string, type: 'success' | 'info' = 'success') => {

    Toast.show({
      type,
      text1: message,

    });
  };

  const copyInstagramHandles = async () => {
    const igHandles = vendorData
      .filter((vendor: any) => vendor.social?.instagram)
      .map((vendor: any) => `@${vendor.social.instagram.replace('@', '')}`)
      .join('\n');

    if (igHandles) {
      await Clipboard.setStringAsync(igHandles);
      showCopyNotification('Instagram handles copied!', 'success');
    } else {
      showCopyNotification('No Instagram handles found', 'info');
    }
  };

  const copyFacebookHandles = async () => {
    const fbHandles = vendorData
      .filter((vendor: any) => vendor.social?.facebook)
      .map((vendor: any) => vendor.social.facebook)
      .join('\n');

    if (fbHandles) {
      await Clipboard.setStringAsync(fbHandles);
      showCopyNotification('Facebook handles copied!', 'success');
    } else {
      showCopyNotification('No Facebook handles found', 'info');
    }
  };

  const copyEmails = async () => {
    const emails = vendorData
      .filter((vendor: any) => vendor.email)
      .map((vendor: any) => vendor.email)
      .join('\n');

    console.log('emails---------->', emails);
    if (emails) {
      await Clipboard.setStringAsync(emails);
      showCopyNotification('Email addresses copied!', 'success');
    } else {
      showCopyNotification('No email addresses found', 'info');
    }
  };

  const handleEventSettings = () => {
    setShowMenu(false);
    // Navigate to event settings
  };

  const handleInviteUsers = () => {
    setShowMenu(false);
    // Navigate to invite users
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading event details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    console.log('Event error details:', { error, event, eventId });
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Event not found</Text>
        <Text style={{ marginTop: 8, color: 'red' }}>
          {error ? `Error: ${JSON.stringify(error)}` : 'No event data found'}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 16, padding: 12, backgroundColor: COLORS.primary[700], borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {event.eventName}
          </Text>
          <Text style={styles.subtitle}>
            {event.startDate ? formatDate(event.startDate) : 'TBD'} - {event.endDate ? formatDate(event.endDate) : 'TBD'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <Menu size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ChatInterface
          eventId={eventId}
          onOpenThread={handleOpenThread}
        />
      </View>

      <Modal
        visible={showThread}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.threadContainer}>
          {threadParentId && (
            <ChatInterface
              eventId={eventId}
              parentId={threadParentId}
              onClose={handleCloseThread}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showMenu}
        animationType="fade"
        transparent
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={handleCloseMenu}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleViewVendors}>
              <Users size={20} color={COLORS.gray[700]} />
              <Text style={styles.menuItemText}>View Vendors</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleInviteUsers}>
              <UserPlus size={20} color={COLORS.gray[700]} />
              <Text style={styles.menuItemText}>Invite Users</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleEventSettings}>
              <Settings size={20} color={COLORS.gray[700]} />
              <Text style={styles.menuItemText}>Event Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showVendorsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseVendorsModal}
      >
        <SafeAreaView style={styles.vendorsModalContainer}>
          <View style={styles.vendorsModalHeader}>
            <Text style={styles.vendorsModalTitle}>Event Vendors</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseVendorsModal}
            >
              <X size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.vendorsModalContent}>
            {vendorData.length === 0 ? (
              <View style={styles.emptyVendorsContainer}>
                <Text style={styles.emptyVendorsText}>No vendors have joined this event yet.</Text>
              </View>
            ) : (
              <FlatList
                data={vendorData}
                keyExtractor={(item, index) => `${item.userId || item.id}-${index}`}
                contentContainerStyle={styles.vendorsList}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => (
                  <Card variant="outlined" style={styles.vendorCard}>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>
                        {item.displayName || 'Unknown Vendor'}
                      </Text>
                      {item.categories && item.categories.length > 0 && (
                        <View style={styles.categoriesContainer}>
                          {item.categories.map((category: string, index: number) => (
                            <View key={index} style={styles.categoryBadge}>
                              <Text style={styles.categoryText}>{category}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Card>
                )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.primary[700],
    padding: SPACING.m,
    paddingBottom: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.m,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.m,
  },
  menuButton: {
    padding: 4,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: SPACING.m,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: SPACING.xs,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  menuItemText: {
    marginLeft: SPACING.s,
    fontSize: 16,
    color: COLORS.gray[700],
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  threadContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  vendorsModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom: SPACING.xxl,
    marginBottom: SPACING.m,
    borderWidth: 1,
  },
  vendorsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  vendorsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  vendorsModalContent: {
    flex: 1,
  },
  emptyVendorsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  emptyVendorsText: {
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
