import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Users, Settings, UserPlus } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onViewVendors: () => void;
  onInviteUsers: () => void;
  onEventSettings: () => void;
}

export function MenuModal({ 
  visible, 
  onClose, 
  onViewVendors, 
  onInviteUsers, 
  onEventSettings 
}: MenuModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={onViewVendors}>
            <Users size={20} color={COLORS.gray[700]} />
            <Text style={styles.menuItemText}>View Vendors</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={onInviteUsers}>
            <UserPlus size={20} color={COLORS.gray[700]} />
            <Text style={styles.menuItemText}>Invite Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={onEventSettings}>
            <Settings size={20} color={COLORS.gray[700]} />
            <Text style={styles.menuItemText}>Event Settings</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
});