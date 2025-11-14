import { COLORS, TYPOGRAPHY } from '@/globalStyles/theme';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CategoryKey =
  | 'darbnespeja'
  | 'komandejums'
  | 'macibas'
  | 'islaiciga'
  | 'atvalinajums'
  | 'cits';

type Category = {
  key: CategoryKey;
  label: string;
  color: string;
};

const CATEGORIES: Category[] = [
  { key: 'darbnespeja', label: 'Darbnespējas lapa', color: '#e11d48' },
  { key: 'komandejums', label: 'Komandējums', color: '#0ea5e9' },
  { key: 'macibas', label: 'Mācības', color: '#a855f7' },
  { key: 'islaiciga', label: 'Īslaicīga prombūtne', color: '#f59e0b' },
  { key: 'atvalinajums', label: 'Atvaļinājums', color: '#22c55e' },
  { key: 'cits', label: 'Cits iemesls', color: '#64748b' },
];

const colors = {
  ...COLORS,
  borderColor: COLORS.borderColorGray,
};

const fontSizes = TYPOGRAPHY;

type PrombutneRow = {
  id?: number;
  user_id: string;
  kategorija: CategoryKey;
  iemesls: string | null;
  komentari: string | null;
  datums: string; // YYYY-MM-DD
  callable?: boolean | null;
};

type User = {
  id: string | number;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

type UserAgg = {
  user: User;
  dates: string[];
  comments: string[];
  callable: boolean;
};

type UserRow = {
  id: string | number;
  user_id: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

export default function Index() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [windowDates, setWindowDates] = useState<string[]>(get7DayWindow(new Date()));
  const flatListRef = useRef<FlatList>(null);

  // Update window dates when selected date changes
  useEffect(() => {
    setWindowDates(get7DayWindow(selectedDate));
  }, [selectedDate]);

  // Auto-scroll to selected date when it changes
  useEffect(() => {
    if (flatListRef.current) {
      const index = windowDates.findIndex((date) => date === toISODate(selectedDate));
      if (index >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            viewPosition: 0.5,
            animated: true,
          });
        }, 100);
      }
    }
  }, [selectedDate, windowDates]);
  const [recordsByCategory, setRecordsByCategory] = useState<Record<CategoryKey, UserAgg[]>>({
    darbnespeja: [],
    komandejums: [],
    macibas: [],
    islaiciga: [],
    atvalinajums: [],
    cits: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setWindowDates(get7DayWindow(selectedDate));
  }, [selectedDate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all prombutne rows for the 7-day window
      // Get records only for the dates in our 7-day window
      const { data: rows, error } = await supabase
        .from('prombutne')
        .select('id,user_id,kategorija,iemesls,komentari,datums,callable')
        .in('datums', windowDates);
      if (error) throw error;

      const typedRows: PrombutneRow[] = rows ?? [];

      const userIds = Array.from(new Set(typedRows.map((r) => r.user_id)));
      console.log('User IDs from prombutne:', userIds);

      const usersById: Record<string, User> = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id,user_id,name,email,avatar_url,phone')
          .in('user_id', userIds);

        if (usersError) throw usersError;

        (users ?? []).forEach((u: UserRow) => {
          console.log(`Mapping user: ${u.name}, user_id: ${u.user_id}, Phone: ${u.phone}`);
          usersById[String(u.user_id)] = {
            id: u.id,
            name: u.name,
            email: u.email,
            avatar_url: u.avatar_url,
            phone: u.phone,
          };
        });
      }

      console.log('UsersById object:', usersById);

      const grouped: Record<CategoryKey, Record<string, UserAgg>> = {
        darbnespeja: {},
        komandejums: {},
        macibas: {},
        islaiciga: {},
        atvalinajums: {},
        cits: {},
      };

      typedRows.forEach((r) => {
        const cat = r.kategorija;
        const uid = String(r.user_id);

        if (!grouped[cat][uid]) {
          grouped[cat][uid] = {
            user: usersById[uid] || { id: uid, name: 'Nezināms', email: '' },
            dates: [],
            comments: [],
            callable: r.callable || false,
          };
        }

        grouped[cat][uid].dates.push(r.datums);
        if (r.komentari) grouped[cat][uid].comments.push(r.komentari);
        // Update callable to true if any record is callable
        if (r.callable) grouped[cat][uid].callable = true;
      });

      const finalGrouped = Object.fromEntries(
        CATEGORIES.map((c) => [
          c.key,
          Object.values(grouped[c.key]).sort((a, b) =>
            String(a.user.name || a.user.email || a.user.id).localeCompare(
              String(b.user.name || b.user.email || b.user.id)
            )
          ),
        ])
      ) as Record<CategoryKey, UserAgg[]>;

      // Debug logging
      console.log('=== STATISTIKA DEBUG ===');
      Object.entries(finalGrouped).forEach(([category, users]) => {
        users.forEach((userAgg) => {
          console.log(
            `Category: ${category} | User: ${userAgg.user.name} | Phone: ${userAgg.user.phone} | Callable: ${userAgg.callable}`
          );
        });
      });

      setRecordsByCategory(finalGrouped);
    } catch (e) {
      console.log('Index fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [windowDates]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const monthLabel = useMemo(() => formatMonth(selectedDate), [selectedDate]);

  const goPrevMonth = () => setSelectedDate(addMonths(selectedDate, -1));
  const goNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const renderHeader = () => (
    <>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goPrevMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <TouchableOpacity onPress={goNextMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekSlider}>
        <View style={styles.weekList}>
          {windowDates.map((date, index) => {
            const d = parseISODate(date);
            const isSelected = toISODate(selectedDate) === date;
            const isCurrent = index === 2; // Center item is the current date

            return (
              <TouchableOpacity
                key={date}
                onPress={() => setSelectedDate(d)}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillActive,
                  isCurrent && styles.currentDayPill,
                ]}
              >
                <Text
                  style={[
                    styles.dayPillDate,
                    isSelected && styles.dayPillDateActive,
                    isCurrent && styles.currentDayText,
                  ]}
                >
                  {weekdayShort(d)}
                </Text>
                <Text
                  style={[
                    styles.dayPillWeek,
                    isSelected && styles.dayPillWeekActive,
                    isCurrent && styles.currentDayText,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );

  const renderCategory = ({ item: cat }: { item: Category }) => {
    const categoryItems = recordsByCategory[cat.key];
    const selectedDateStr = toISODate(selectedDate);

    // Check if any item in this category has data for the selected date
    const hasDataForSelectedDate = categoryItems.some((item) =>
      item.dates.some((date) => {
        const normalizedDate = date.includes('T') ? date.split('T')[0] : date;
        return normalizedDate === selectedDateStr;
      })
    );

    return (
      <View style={[styles.section, { borderLeftColor: cat.color }]}>
        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>{cat.label}</Text>
          {hasDataForSelectedDate ? (
            categoryItems
              .filter((item) =>
                item.dates.some((date) => {
                  const normalizedDate = date.includes('T') ? date.split('T')[0] : date;
                  return normalizedDate === selectedDateStr;
                })
              )
              .map((item, index) => (
                <UserCard
                  key={`${cat.key}-${item.user.id}-${index}`}
                  user={item.user}
                  dates={item.dates}
                  comments={item.comments}
                  router={router}
                  callable={item.callable}
                  selectedDate={selectedDate}
                />
              ))
          ) : !loading ? (
            <Text style={styles.empty}>Nav ierakstu</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS !== 'web' && styles.safeAreaTight]}>
      <View style={styles.container}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={renderHeader}
          ListHeaderComponentStyle={styles.listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

function UserCard({
  user,
  dates,
  comments,
  router,
  callable,
  selectedDate,
}: {
  user: User;
  dates: string[];
  comments: string[];
  router: ReturnType<typeof useRouter>;
  callable: boolean;
  selectedDate: Date;
}) {
  // Normalize the selected date to ensure consistent format
  const normalizeDate = (dateStr: string) => {
    // If the date string includes time, extract just the date part
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  const selectedDateStr = normalizeDate(toISODate(selectedDate));

  // Find all entries that match the selected date
  const matchingIndices = dates.reduce<number[]>((acc, date, index) => {
    const normalizedDate = normalizeDate(date);
    if (normalizedDate === selectedDateStr) {
      acc.push(index);
    }
    return acc;
  }, []);

  // If no matching dates, don't show the card
  if (matchingIndices.length === 0) {
    return null;
  }

  // Get comments for the matching dates
  const filteredComments = matchingIndices.map((index) => comments[index]).filter(Boolean);
  const resolved = resolveAvatar(user);

  const handlePress = async () => {
    // Fetch full user data from database
    const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (userData) {
      router.push({
        pathname: '/(tabs)/profile/[id]',
        params: {
          id: String(userData.id || ''),
          name: userData.name || '',
          email: userData.email || '',
          amats: userData.amats || '',
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || '',
          created_at: userData.created_at || '',
          from: 'statistika',
        },
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.cardRow,
        {
          borderTopWidth: 1.5,
          borderTopColor: '#d0d0d0', // Using a darker gray for better visibility
          backgroundColor: 'transparent',
          marginBottom: 8,
          marginTop: 4,
        },
      ]}
      onPress={handlePress}
    >
      <Image source={resolved ? { uri: resolved } : undefined} style={styles.cardAvatar} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{user.name || user.email || String(user.id)}</Text>
        {filteredComments.length > 0 ? (
          <Text style={styles.cardComment} numberOfLines={2}>
            {filteredComments.join(' • ')}
          </Text>
        ) : null}
      </View>
      <View style={styles.cardActions}>
        {callable && (
          <TouchableOpacity
            style={[styles.phoneIconCallable, !user.phone && styles.phoneIconDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              if (user.phone) {
                Linking.openURL(`tel:${user.phone}`);
              }
            }}
            disabled={!user.phone}
          >
            <Ionicons name="call" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function resolveAvatar(user: User): string | undefined {
  if (user.avatar_url && /^https?:\/\//i.test(user.avatar_url)) return user.avatar_url;
  if (user.avatar_url) {
    const match = String(user.avatar_url).match(/^([^/]+)\/(.+)$/);
    const bucket = match ? match[1] : 'avatars';
    const objectPath = match ? match[2] : String(user.avatar_url);
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return data?.publicUrl || undefined;
  }
  if (user.name || user.email) {
    const txt = encodeURIComponent(String(user.name || user.email));
    return `https://ui-avatars.com/api/?name=${txt}&background=0D8ABC&color=fff`;
  }
  return undefined;
}

function get7DayWindow(center: Date): string[] {
  // Show 5 days: 2 before, current, 2 after
  const start = addDays(center, -2);
  return Array.from({ length: 5 }, (_, i) => toISODate(addDays(start, i)));
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function weekdayShort(d: Date): string {
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const days = ['Sv', 'P', 'O', 'T', 'C', 'Pie', 'S'];
  return days[day];
}

function monthName(d: Date): string {
  return d.toLocaleString('lv-LV', { month: 'long' });
}

function formatMonth(d: Date): string {
  const m = monthName(d);
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaTight: {
    paddingTop: -22,
  },
  listHeader: {
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  headerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: 44, // Fixed height for consistent vertical centering
  },
  weekSlider: {
    height: 90,
    marginBottom: -20,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
  monthBtn: {
    paddingHorizontal: 42,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44, // Ensure consistent touch target size
    height: 36, // Match the height of the month title
  },
  monthBtnText: {
    color: colors.text ? colors.text : '#fff',
  },
  monthTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1, // Take up available space to help with centering
  },
  weekList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dayPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '18%',
    height: 50,
    borderBottomWidth: 2,
    borderColor: COLORS.gray,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.15,
    // shadowRadius: 3.84,
    // elevation: 1,
  },
  currentDayPill: {
    opacity: 1,
    // backgroundColor: colors.primary,
    // borderColor: colors.atvalinajums,
    // borderWidth: 1.5,
    height: 55,
  },
  dayPillActive: {
    backgroundColor: colors.primary,
    opacity: 1,
    borderColor: colors.primary,
  },
  dayPillDate: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.text,
  },
  dayPillDateActive: {
    color: '#fff',
  },
  currentDayText: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayPillWeek: {
    fontSize: fontSizes.sm,
    color: colors.text,
    opacity: 0.7,
    marginTop: -2,
  },
  dayPillWeekActive: {
    color: '#fff',
    opacity: 1,
  },
  sectionBody: {
    flex: 1,
    backgroundColor: colors.backgroundLite,
    borderRadius: 0, // Removed border radius from inner container
    padding: 10,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.15,
    // shadowRadius: 3.84,
    // elevation: 1,
  },
  sectionTitle: {
    color: colors.text || '#fff',
    fontWeight: '700',
    marginBottom: 5,
    paddingLeft: 6,
    fontSize: fontSizes.md,
  },
  empty: {
    color: colors.text || '#fff',
    opacity: 0.7,
    paddingHorizontal: 6,
  },
  section: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.backgroundLite,
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.15,
    // shadowRadius: 3.84,
    // elevation: 3, // Default color, will be overridden by inline style
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundLite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // For iOS shadow to work, we need to set a background color and overflow
    overflow: 'visible',
    // Add a bit more margin to prevent shadow clipping
    marginVertical: 6,
  },
  avatarFallback: {
    backgroundColor: '#e0e0e0',
  },
  avatarText: {
    color: colors.text,
    fontWeight: '600',
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.backgroundLite,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: colors.text || '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: 1,
  },
  cardComment: {
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 12,
  },
  phoneIconButton: {
    padding: 8,
    // backgroundColor: '#dcdcdc',
    // borderRadius: 20,
    // borderWidth: 1,
    // borderColor: '#067c49ff',
  },
  phoneIconCallable: {
    padding: 8,
    color: colors.primary,
  },
  phoneIconDisabled: {
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  soclogo: {
    width: 60,
    height: 60,
  },
});
