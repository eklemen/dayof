import { useState, type JSX } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
import { Event } from '@/src/types/events';

export default function EventDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams();
  const eventId: string = Array.isArray(id) ? id[0] : id || '';
  const { data: event, isLoading: loading, error } = useGetEvent(eventId);
  const { vendorData, loadVendorData } = useVendors(eventId);

  console.log('Event data:', { event, loading, error, eventId });

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showVendorsModal, setShowVendorsModal] = useState<boolean>(false);

  const handleOpenThread = (message: any): void => {
    router.push({
      pathname: '/events/thread',
      params: {
        eventId,
        message: JSON.stringify(message)
      }
    });
  };

  const handleMenuPress = (): void => {
    setShowMenu(true);
  };

  const handleCloseMenu = (): void => {
    setShowMenu(false);
  };

  const handleViewVendors = async (): Promise<void> => {
    setShowMenu(false);
    await loadVendorData();
    setShowVendorsModal(true);
  };

  const handleCloseVendorsModal = (): void => {
    setShowVendorsModal(false);
  };

  const handleEventSettings = (): void => {
    setShowMenu(false);
    // Navigate to event settings
  };

  const handleInviteUsers = (): void => {
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
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: COLORS.primary[700],
            borderRadius: 8,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const formattedEndDate = event.endDate ? ` - ${formatDate(event.endDate)}` : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {event.eventName}
          </Text>
          <Text style={styles.subtitle}>
            {event.startDate ? formatDate(event.startDate) : 'Date not set'}
            {formattedEndDate}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Menu size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ChatInterface eventId={eventId} onOpenThread={handleOpenThread} />
      </View>

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
});
