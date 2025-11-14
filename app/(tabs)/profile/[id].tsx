import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '../../../Components/Header';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../globalStyles/theme';
import { Body, Title } from '../../../globalStyles/typography';
import { supabase } from '../../../lib/supabase';

type User = {
  uuid: string; // Using 'uuid' as the primary identifier
  id?: string; // Keep for backward compatibility
  email: string;
  name?: string;
  position?: string;
  phone?: string;
  avatar?: string;
};

type CategoryKey = 'darbnespeja' | 'komandejums' | 'macibas' | 'islaiciga' | 'atvalinajums' | 'cits';

type CategoryMeta = {
  key: CategoryKey;
  label: string;
  color: string;
};

type PrombutneCategoryRow = {
  kategorija: CategoryKey | null;
};

const CATEGORY_META: CategoryMeta[] = [
  { key: 'darbnespeja', label: 'Darbnespējas lapa', color: '#e11d48' },
  { key: 'komandejums', label: 'Komandējums', color: '#0ea5e9' },
  { key: 'macibas', label: 'Mācības', color: '#a855f7' },
  { key: 'islaiciga', label: 'Īslaicīga prombūtne', color: '#f59e0b' },
  { key: 'atvalinajums', label: 'Atvaļinājums', color: '#22c55e' },
  { key: 'cits', label: 'Cits iemesls', color: '#64748b' },
];

const INITIAL_CATEGORY_STATS: Record<CategoryKey, number> = CATEGORY_META.reduce(
  (acc, cat) => {
    acc[cat.key] = 0;
    return acc;
  },
  {} as Record<CategoryKey, number>
);

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [categoryStats, setCategoryStats] =
    useState<Record<CategoryKey, number>>(INITIAL_CATEGORY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: any } | null>(null);

  // Handle missing ID in the render method instead of early return
  // to maintain hook call order

  const getAvatarUrl = useCallback((path?: string | null): string | null => {
    if (!path) return null;

    // If it's already a full URL, return it
    if (path.startsWith('http')) {
      return path;
    }

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
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!id) {
        console.error('❌ No user ID provided');
        if (isMounted) setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching user with ID:', id);

        // First try to fetch by uuid
        const { data, error, status } = await supabase
          .from('users')
          .select('*')
          .eq('id', id as string)
          .maybeSingle();

        console.log(`📊 Supabase response status: ${status}`);

        if (error) {
          // More detailed error logging
          const errorDetails = {
            message: error.message || 'Unknown error occurred',
            code: error.code || 'NO_ERROR_CODE',
            details: error.details || 'No additional details',
            hint: error.hint || 'No hint provided',
            status: error.status || 'NO_STATUS',
            id: id || 'NO_ID',
            timestamp: new Date().toISOString(),
          };

          // Log the error with all available context
          console.error('❌ Supabase query error:', {
            ...errorDetails,
            // Stringify the entire error object for debugging
            rawError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          });

          // Create a new error with more context
          const enhancedError = new Error(`Supabase query failed: ${errorDetails.message}`);
          Object.assign(enhancedError, errorDetails);
          throw enhancedError;
        }

        if (!data) {
          // If not found by ID, try to find by email as a fallback
          console.log('🔍 User not found by ID, trying with email...');
          const {
            data: userByEmail,
            error: emailError,
            status: emailStatus,
          } = await supabase
            .from('users')
            .select('*')
            .eq('email', id as string)
            .maybeSingle();

          console.log(`📊 Supabase email lookup status: ${emailStatus}`);

          if (emailError) {
            const emailErrorDetails = {
              message: emailError.message,
              code: emailError.code || 'NO_ERROR_CODE',
              details: emailError.details || 'No additional details',
              hint: emailError.hint || 'No hint provided',
            };
            console.error(
              '❌ Error fetching user by email:',
              JSON.stringify(emailErrorDetails, null, 2)
            );
            throw emailError;
          }

          if (!userByEmail) {
            console.error('❌ User not found by ID or email');
            throw new Error('User not found');
          }

          if (isMounted) {
            setUser(userByEmail);
          }
          return;
        }

        if (!isMounted) return;

        console.log('✅ Fetched user data:', data);

        if (!data) {
          console.error('❌ No user data returned from the server');
          throw new Error('No user data returned from the server');
        }

        if (isMounted) {
          setUser(data);
        }

        // Fetch category statistics
        try {
          const {
            data: categoryRows,
            error: categoryError,
          } = await supabase
            .from('prombutne')
            .select('kategorija')
            .eq('user_id', id as string);

          if (categoryError) {
            console.warn('⚠️ Error fetching category stats:', categoryError);
            setCategoryStats(INITIAL_CATEGORY_STATS);
          } else if (categoryRows) {
            const counts = { ...INITIAL_CATEGORY_STATS };
            (categoryRows as PrombutneCategoryRow[]).forEach((row) => {
              if (row?.kategorija && counts[row.kategorija] !== undefined) {
                counts[row.kategorija] += 1;
              }
            });
            setCategoryStats(counts);
          }
        } catch (categoryStatsError) {
          console.warn('Failed to load category stats:', categoryStatsError);
          setCategoryStats(INITIAL_CATEGORY_STATS);
        }
      } catch (error) {
        if (!isMounted) return;

        // Try to extract more detailed error information
        let errorDetails = 'Unknown error';

        if (error?.message) {
          errorDetails = error.message;
        } else if (typeof error === 'string') {
          errorDetails = error;
        } else if (error?.toString) {
          errorDetails = error.toString();
        }

        const errorMessage = errorDetails.includes('invalid input syntax for type id')
          ? 'Invalid user ID format'
          : errorDetails;

        if (isMounted) {
          setError(errorMessage);
        }

        console.error('❌ Error in fetchUser:', {
          error: errorDetails,
          code: error?.code || 'NO_CODE',
          details: error?.details || 'No details available',
          status: error?.status || 'NO_STATUS',
          type: error?.name || 'UnknownErrorType',
          isNetworkError: error?.message?.includes('Network request failed') || false,
          isAuthError: error?.status === 401 || error?.status === 403,
          id,
          timestamp: new Date().toISOString(),
        });

        // Log network specific errors
        if (error?.message?.includes('Network request failed')) {
          console.error('🌐 Network error - Please check your internet connection');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        {error.details && (
          <Text style={styles.errorDetails}>
            {typeof error.details === 'string'
              ? error.details
              : JSON.stringify(error.details, null, 2)}
          </Text>
        )}
      </View>
    );
  }

  // Handle missing ID
  if (!id) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: No user ID provided</Text>
      </View>
    );
  }

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
                onError={({ nativeEvent }) => {
                  console.log('Error loading avatar:', nativeEvent.error);
                }}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color={COLORS.white} style={{ opacity: 0.7 }} />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Body style={styles.name} numberOfLines={1}>
              {user.name || 'No Name'}
            </Body>
            {user.position && (
              <Body variant="secondary" style={styles.position} numberOfLines={1}>
                {user.position}
              </Body>
            )}
            <Body variant="secondary" style={styles.userDetail} numberOfLines={1}>
              <FontAwesome
                name="envelope"
                size={16}
                color={COLORS.primary}
                style={styles.smallIcon}
              />{' '}
              {user.email || 'No email'}
            </Body>
            {user.phone && (
              <Body variant="secondary" style={styles.userDetail} numberOfLines={1}>
                <FontAwesome
                  name="phone"
                  size={16}
                  color={COLORS.primary}
                  style={styles.smallIcon}
                />{' '}
                {user.phone}
              </Body>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Title style={styles.sectionTitle}>Prombūtnes statistika</Title>
          <View style={styles.categoryGrid}>
            {CATEGORY_META.map((cat) => (
              <View
                key={cat.key}
                style={[
                  styles.categoryCard,
                  { borderLeftColor: cat.color },
                ]}
              >
                <Body style={styles.categoryValue}>{categoryStats[cat.key] ?? 0}</Body>
                <Body style={styles.categoryLabel}>{cat.label}</Body>
              </View>
            ))}
          </View>
        </View>

        {/* Add more sections here as needed */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    fontSize: TYPOGRAPHY.md,
    textAlign: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorDetails: {
    color: '#666',
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    padding: SPACING.md,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    marginHorizontal: SPACING.md,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: 0,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLite,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  position: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  smallIcon: {
    marginRight: SPACING.lg,
  },
  userDetail: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statsContainer: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.backgroundLite,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
    borderLeftWidth: 6,
  },
  categoryValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.gray,
  },
});
