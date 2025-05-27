import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, Users } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';
import { formatDate } from '@/src/lib/utils';
import { ChatInterface } from '@/src/components/chat/ChatInterface';
import { VendorsList } from '@/src/components/vendors/VendorsList';
import { useEvents } from '@/src/hooks/useEvents';
import { useAuth } from '@/src/hooks/useAuth';

type Tab = 'chat' | 'vendors';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id || '';
  const { getEvent } = useEvents();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);
    const eventData = await getEvent(eventId);
    setEvent(eventData);
    setLoading(false);
  };

  const handleOpenThread = (parentId: string) => {
    setThreadParentId(parentId);
    setShowThread(true);
  };

  const handleCloseThread = () => {
    setShowThread(false);
    setThreadParentId(null);
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading event details...</Text>
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
            {event.event_name}
          </Text>
          <Text style={styles.subtitle}>
            {formatDate(event.start_date)} - {formatDate(event.end_date)}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <MessageSquare
            size={20}
            color={activeTab === 'chat' ? COLORS.primary[700] : COLORS.gray[500]}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'chat' && styles.activeTabText
          ]}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendors' && styles.activeTab]}
          onPress={() => setActiveTab('vendors')}
        >
          <Users
            size={20}
            color={activeTab === 'vendors' ? COLORS.primary[700] : COLORS.gray[500]}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'vendors' && styles.activeTabText
          ]}>
            Vendors
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'chat' ? (
          <ChatInterface
            eventId={eventId}
          />
        ) : (
          <VendorsList eventId={eventId} />
        )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary[700],
  },
  tabText: {
    marginLeft: SPACING.xs,
    fontSize: 16,
    color: COLORS.gray[500],
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: COLORS.primary[700],
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  threadContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
});
