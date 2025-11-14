import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../globalStyles/theme';
import { Body } from '../../globalStyles/typography';
import { supabase } from '../../lib/supabase';

type User = {
  id: string;
  email: string;
  name?: string;
  position?: string;
  phone?: string;
  avatar?: string; // Changed from avatar_url to avatar to match your database
  created_at: string;
};

export default function Personal() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    console.log('🔍 Fetching users from Supabase...');

    try {
      // Verify Supabase client is initialized
      if (!supabase) {
        const error = new Error('Supabase client is not initialized');
        console.error('❌', error.message);
        return;
      }

      // Log the Supabase URL (without the key for security)
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      console.log(
        '🔗 Supabase URL:',
        supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set'
      );

      // Make the request
      const { data, error, status } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      console.log(`📊 Supabase response status: ${status}`);

      if (error) {
        // More detailed error logging
        const errorDetails = {
          message: error.message,
          code: error.code || 'NO_ERROR_CODE',
          details: error.details || 'No additional details',
          hint: error.hint || 'No hint provided',
        };

        console.error('❌ Supabase query error:', JSON.stringify(errorDetails, null, 2));

        // Handle specific error cases
        if (error.code === 'PGRST301' || error.code === '42P01') {
          console.error(
            '⚠️  Table not found. Make sure you have a "users" table in your Supabase database.'
          );
        } else if (error.message.includes('permission denied')) {
          console.error(
            '🔒 Permission denied. Check your Row Level Security (RLS) policies in Supabase.'
          );
        }

        setUsers([]);
        return;
      }

      if (data && data.length > 0) {
        console.log(`✅ Successfully fetched ${data.length} users`);
        setUsers(data);
      } else {
        console.log('ℹ️  No users found in the database');
        setUsers([]);
      }
    } catch (error: any) {
      // Try to extract more detailed error information
      let errorDetails = 'Unknown error';

      if (error?.message) {
        errorDetails = error.message;
      } else if (typeof error === 'string') {
        errorDetails = error;
      } else if (error?.toString) {
        errorDetails = error.toString();
      }

      console.error('❌ Error in fetchUsers:', {
        error: errorDetails,
        code: error?.code || 'NO_CODE',
        details: error?.details || 'No details available',
        status: error?.status || 'NO_STATUS',
        type: error?.name || 'UnknownErrorType',
        isNetworkError: error?.message?.includes('Network request failed') || false,
        isAuthError: error?.status === 401 || error?.status === 403,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // Log network specific errors
      if (error?.message?.includes('Network request failed')) {
        console.error('Network error - Please check your internet connection');
      }

      // Log Supabase specific errors
      if (error?.code) {
        console.error(`Supabase error [${error.code}]: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Close useCallback with empty dependency array

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Load data when component mounts
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        await fetchUsers();
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error in data loading:', error);
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]); // Add fetchUsers to dependencies

  const handlePhonePress = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    // This will open the phone's dialer with the number pre-filled
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // Function to get avatar URL from Supabase storage
  const getAvatarUrl = useCallback((path?: string): string | null => {
    if (!path) {
      console.log('No avatar path provided');
      return null;
    }

    // If the path is already a full URL, return it as is
    if (path.startsWith('http')) {
      return path;
    }

    // For local development, you might need to construct the full URL
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('Supabase URL is not configured');
      return null;
    }

    // Clean up the path to remove any duplicate 'avatars' segments
    const cleanPath = path.startsWith('avatars/') ? path.substring(8) : path;

    // Construct the public URL for the avatar
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`;
    console.log('Generated avatar URL:', publicUrl);
    return publicUrl;
  }, []); // Close useCallback with empty dependency array

  const router = useRouter();

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => {
      console.log('Rendering user:', item.name, 'Avatar path:', item.avatar);
      const avatarUrl = getAvatarUrl(item.avatar);

      return (
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => handleUserPress(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
                onError={({ nativeEvent }) => {
                  console.log('Error loading avatar for', item.name, ':', nativeEvent.error);
                }}
                onLoad={() => console.log('Successfully loaded avatar for', item.name)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color={COLORS.white} style={{ opacity: 0.7 }} />
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
            onPress={(e) => {
              e.stopPropagation();
              if (item.phone) handlePhonePress(item.phone);
            }}
            disabled={!item.phone}
          >
            <Ionicons
              name="call-outline"
              size={24}
              color={item.phone ? COLORS.primary : COLORS.gray}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [getAvatarUrl, handlePhonePress, handleUserPress]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      paddingHorizontal: SPACING.md,
      paddingTop: 30,
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
      borderRadius: 8,
      padding: SPACING.sm,
      paddingLeft: SPACING.md - 2, // Adjust left padding to account for border
      marginBottom: SPACING.md,
      marginLeft: 6, // Space for the border
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
      shadowColor: COLORS.gray,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderLeftWidth: 6,
      borderLeftColor: COLORS.primary,
      position: 'relative',
      overflow: 'hidden',
    },
    avatarContainer: {
      marginRight: SPACING.md,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: '#f0f0f0', // Fallback color
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
      marginBottom: 1,
      color: COLORS.primary,
    },
    userEmail: {
      paddingTop: 0,
      paddingBottom: 2,
      fontSize: TYPOGRAPHY.sm,
      color: COLORS.text,
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
