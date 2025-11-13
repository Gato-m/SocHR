import { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { flexPatterns } from '../../globalStyles/layoutStyles';
import { COLORS, SPACING, TYPOGRAPHY } from '../../globalStyles/theme';
import { Body, Title } from '../../globalStyles/typography';
import { supabase } from '../../lib/supabase';

type User = {
  id: string;
  email: string;
  name?: string;
  position?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
};

export default function Personal() {
  const [users, setUsers] = useState<Array<User>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePhonePress = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    // This will open the phone's dialer with the number pre-filled
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image 
            source={{ 
              uri: item.avatar_url,
              cache: 'force-cache' 
            }} 
            style={styles.avatar}
            resizeMode="cover"
            onError={({ nativeEvent: { error } }) => {
              console.log('Error loading avatar:', error);
            }}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={COLORS.white} />
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Body style={styles.userName} numberOfLines={1}>
          {item.name || 'No name'}
        </Body>
        {item.position && (
          <Body variant="secondary" style={styles.userPosition} numberOfLines={1}>
            {item.position}
          </Body>
        )}
        <Body variant="secondary" style={styles.userEmail} numberOfLines={1}>
          {item.email}
        </Body>
      </View>
      
      <TouchableOpacity 
        style={styles.phoneButton}
        onPress={() => handlePhonePress(item.phone)}
        disabled={!item.phone}
      >
        <Ionicons 
          name="call-outline" 
          size={24} 
          color={item.phone ? COLORS.primary : COLORS.gray} 
        />
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: SPACING.md,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    title: {
      color: COLORS.text,
      fontSize: TYPOGRAPHY.xl,
      fontWeight: 'bold',
      marginBottom: SPACING.md,
    },
    text: {
      color: COLORS.text,
      marginBottom: SPACING.md,
    },
    listContent: {
      paddingBottom: SPACING.xl,
    },
    userCard: {
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
      shadowColor: COLORS.gray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    avatarContainer: {
      marginRight: SPACING.md,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: COLORS.lightGray,
    },
    avatarPlaceholder: {
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInfo: {
      flex: 1,
      marginRight: SPACING.md,
    },
    userName: {
      fontWeight: '600',
      fontSize: TYPOGRAPHY.md,
      marginBottom: 2,
    },
    userPosition: {
      fontSize: TYPOGRAPHY.sm,
      marginBottom: 2,
      color: COLORS.primary,
    },
    userEmail: {
      fontSize: TYPOGRAPHY.xs,
      color: COLORS.gray,
    },
    phoneButton: {
      padding: SPACING.sm,
      marginLeft: SPACING.sm,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Team Members</Title>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item: User, index: number) => `user-${item.id || `index-${index}`}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Body>No users found</Body>
          </View>
        }
      />
    </View>
  );
}
