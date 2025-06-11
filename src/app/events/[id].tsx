import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, Users, Settings, UserPlus } from 'lucide-react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING } from '@/src/lib/constants';
import { formatDate } from '@/src/lib/utils';
import { ChatInterface } from '@/src/components/chat/ChatInterface';
import { VendorsList } from '@/src/components/vendors/VendorsList';
import { useGetEvent } from '@/src/services/service-hooks/useGetEvent';
import { useGetUsersInEvent } from '@/src/services/service-hooks/useGetUsersInEvent';
import { useGetCategoriesForEvent } from '@/src/services/service-hooks/useGetCategoriesForEvent';
import { useGetCategoriesForUser } from '@/src/services/service-hooks/useGetCategoriesForUser';
import { getCategoriesForUser } from '@/src/services/firestoreQueries';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  console.log('id from params---------->', id);
  const eventId = Array.isArray(id) ? id[0] : id || '';
  const { data: event, isLoading: loading, error } = useGetEvent(eventId);
  const { data: eventUsers } = useGetUsersInEvent(eventId);
  const { data: categories } = useGetCategoriesForEvent(eventId);
  const { showActionSheetWithOptions } = useActionSheet();

  console.log('Event data:', { event, loading, error, eventId });

  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
      showActionSheetWithOptions(
        {
          options: ['Cancel'],
          cancelButtonIndex: 0,
          title: 'No Vendors',
          message: 'No vendors have joined this event yet.'
        },
        () => {}
      );
      return;
    }

    // Prepare vendor data with categories
    const vendorData = await Promise.all(
      eventUsers.map(async (user: any) => {
        try {
          const userCategories = await getCategoriesForUser(eventId, user.userId);
          return {
            ...user,
            categories: userCategories || []
          };
        } catch {
          return {
            ...user,
            categories: []
          };
        }
      })
    );

    // Create vendor list for action sheet
    const vendorOptions = vendorData.map((vendor: any) => {
      const categoriesText = vendor.categories.length > 0 
        ? ` (${vendor.categories.join(', ')})`
        : '';
      return `${vendor.displayName || 'Unknown Vendor'}${categoriesText}`;
    });

    const options = [
      ...vendorOptions,
      'Copy IG handles',
      'Copy FB handles', 
      'Copy emails',
      'Cancel'
    ];

    const copyStartIndex = vendorOptions.length;
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: 'Event Vendors',
        destructiveButtonIndex: undefined,
      },
      async (buttonIndex?: number) => {
        if (buttonIndex === undefined || buttonIndex === cancelButtonIndex) return;
        
        if (buttonIndex === copyStartIndex) {
          // Copy IG handles
          const igHandles = vendorData
            .filter((vendor: any) => vendor.social?.instagram)
            .map((vendor: any) => `@${vendor.social.instagram.replace('@', '')}`)
            .join('\n');
          
          if (igHandles) {
            await Clipboard.setStringAsync(igHandles);
          }
        } else if (buttonIndex === copyStartIndex + 1) {
          // Copy FB handles
          const fbHandles = vendorData
            .filter((vendor: any) => vendor.social?.facebook)
            .map((vendor: any) => vendor.social.facebook)
            .join('\n');
          
          if (fbHandles) {
            await Clipboard.setStringAsync(fbHandles);
          }
        } else if (buttonIndex === copyStartIndex + 2) {
          // Copy emails
          const emails = vendorData
            .filter((vendor: any) => vendor.email)
            .map((vendor: any) => vendor.email)
            .join('\n');
          
          if (emails) {
            await Clipboard.setStringAsync(emails);
          }
        }
      }
    );
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
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
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
});
