import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Users, Settings, UserPlus, LucideIcon } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';

interface MenuAction {
  id: 'viewVendors' | 'inviteUsers' | 'eventSettings';
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

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
  const menuActions: MenuAction[] = [
    {
      id: 'viewVendors',
      label: 'View Vendors',
      icon: Users,
      onPress: onViewVendors,
    },
    {
      id: 'inviteUsers',
      label: 'Invite Users',
      icon: UserPlus,
      onPress: onInviteUsers,
    },
    {
      id: 'eventSettings',
      label: 'Event Settings',
      icon: Settings,
      onPress: onEventSettings,
    },
  ];

  const handleMenuItemPress = (action: MenuAction): void => {
    action.onPress();
  };

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
          {menuActions.map((action) => (
            <TouchableOpacity 
              key={action.id}
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress(action)}
            >
              <action.icon size={20} color={COLORS.gray[700]} />
              <Text style={styles.menuItemText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
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