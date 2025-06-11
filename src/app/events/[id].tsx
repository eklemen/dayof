import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';
import { formatDate } from '@/src/lib/utils';
import { ChatInterface } from '@/src/components/chat/ChatInterface';
import { VendorsModal } from '@/src/components/events/VendorsModal';
import { MenuModal } from '@/src/components/events/MenuModal';
import { useGetEvent } from '@/src/services/service-hooks/useGetEvent';
import { useVendors } from '@/src/hooks/useVendors';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id || '';
  const { data: event, isLoading: loading, error } = useGetEvent(eventId);
  const { vendorData, loadVendorData } = useVendors(eventId);

  console.log('Event data:', { event, loading, error, eventId });

  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);

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
    await loadVendorData();
    setShowVendorsModal(true);
  };

  const handleCloseVendorsModal = () => {
    setShowVendorsModal(false);
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

      <MenuModal
        visible={showMenu}
        onClose={handleCloseMenu}
        onViewVendors={handleViewVendors}
        onInviteUsers={handleInviteUsers}
        onEventSettings={handleEventSettings}
      />

      <VendorsModal
        visible={showVendorsModal}
        onClose={handleCloseVendorsModal}
        vendorData={vendorData}
      />
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
  content: {
    flex: 1,
  },
  threadContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
});