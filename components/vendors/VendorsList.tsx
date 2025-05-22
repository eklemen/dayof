import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useEvents } from '@/hooks/useEvents';
import { COLORS, SPACING } from '@/lib/constants';
import { formatInstagramHandles } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react-native';

interface VendorsListProps {
  eventId: string;
}

export function VendorsList({ eventId }: VendorsListProps) {
  const { getEventMembers } = useEvents();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [eventId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { success, data } = await getEventMembers(eventId);
    
    if (success && data) {
      setMembers(data);
    }
    
    setLoading(false);
  };

  const copyInstagramHandles = async () => {
    const handles = members
      .filter(m => m.users.instagram_handle)
      .map(m => m.users.instagram_handle);
      
    const formattedHandles = formatInstagramHandles(handles);
    
    await Clipboard.setStringAsync(formattedHandles);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const renderVendorItem = ({ item }: { item: any }) => {
    return (
      <Card variant="outlined" style={styles.vendorCard}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.users.display_name}</Text>
          
          {item.users.company_name && (
            <Text style={styles.companyName}>{item.users.company_name}</Text>
          )}
          
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
        
        {item.users.instagram_handle && (
          <View style={styles.instagramContainer}>
            <Text style={styles.instagramHandle}>
              @{item.users.instagram_handle.replace('@', '')}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendors</Text>
        
        <Button
          title={copied ? 'Copied!' : 'Copy All Instagram Handles'}
          onPress={copyInstagramHandles}
          variant={copied ? 'outline' : 'primary'}
          icon={copied ? <Check size={16} color={COLORS.success[500]} /> : <Copy size={16} color="white" />}
          iconPosition="left"
          size="small"
        />
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading vendors...</Text>
      ) : members.length === 0 ? (
        <Text style={styles.emptyText}>No vendors have joined this event yet.</Text>
      ) : (
        <FlatList
          data={members}
          renderItem={renderVendorItem}
          keyExtractor={(item, index) => `${item.users.id}-${index}`}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  listContent: {
    paddingBottom: SPACING.l,
  },
  vendorCard: {
    marginBottom: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
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
  },
  instagramContainer: {
    paddingLeft: SPACING.m,
  },
  instagramHandle: {
    fontSize: 14,
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});