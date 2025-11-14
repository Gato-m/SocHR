import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../Components/Header";
import { COLORS, TYPOGRAPHY } from "../../globalStyles/theme";
import { supabase } from "../../lib/supabase";

type CategoryKey =
	| "darbnespeja"
	| "komandejums"
	| "macibas"
	| "islaiciga"
	| "atvalinajums"
	| "cits";

type Category = {
	key: CategoryKey;
	label: string;
	color: string;
	requiresReason?: boolean;
};

const CATEGORIES: Category[] = [
	{ key: "darbnespeja", label: "Darbnespējas lapa", color: "#e11d48" },
	{ key: "komandejums", label: "Komandējums", color: "#0ea5e9" },
	{ key: "macibas", label: "Mācības", color: "#a855f7" },
	{ key: "islaiciga", label: "Īslaicīga prombūtne", color: "#f59e0b" },
	{ key: "atvalinajums", label: "Atvaļinājums", color: "#22c55e" },
	{
		key: "cits",
		label: "Cits iemesls",
		color: "#64748b",
		requiresReason: true,
	},
];

type CalendarDay = {
	date: Date | null; // null = placeholder for leading/trailing cells
	key: string;
};

export default function AddData() {
	const [authUser, setAuthUser] = useState<{ id: string } | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(
		[],
	);
	const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(
		null,
	);
	const [otherReason, setOtherReason] = useState<string>("");
	const [comment, setComment] = useState<string>("");
	const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
	const [isCallable, setIsCallable] = useState<boolean>(false);
	const [currentMonth, setCurrentMonth] = useState<Date>(
		truncateToMonth(new Date()),
	);
	const [dateCategoryMap, setDateCategoryMap] = useState<
		Record<string, CategoryKey>
	>({}); // ISO -> category
	const [gridSize, setGridSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});
	const isDraggingRef = useRef(false);
	const seenWhileDraggingRef = useRef<Set<string>>(new Set());

	const days = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
	const assignedCategoryMetas = useMemo(() => {
		const uniqueKeys = Array.from(new Set(Object.values(dateCategoryMap)));
		return uniqueKeys
			.map((key) => CATEGORIES.find((c) => c.key === key)!)
			.filter(Boolean);
	}, [dateCategoryMap]);
	const anyRequiresReason = useMemo(
		() => assignedCategoryMetas.some((c) => c.requiresReason),
		[assignedCategoryMetas],
	);

	const toggleCategory = (key: CategoryKey) => {
		setSelectedCategories((prev) => {
			if (prev.includes(key)) {
				const next = prev.filter((k) => k !== key);
				if (activeCategory === key) {
					setActiveCategory(next.length ? next[next.length - 1] : null);
				}
				return next;
			} else {
				setActiveCategory(key);
				return [...prev, key];
			}
		});
	};

	useEffect(() => {
		// Load authenticated user from Supabase
		(async () => {
			try {
				const { data, error } = await supabase.auth.getUser();
				if (error) {
					console.error("Auth error:", error.message);
					setAuthUser(null);
				} else {
					setAuthUser(data.user ?? null);
				}
			} catch (e: any) {
				console.error("Auth fetch failed:", e?.message || e);
				setAuthUser(null);
			}
		})();

		// Reset reason when none of the selected categories require it
		if (!anyRequiresReason) setOtherReason("");
	}, [anyRequiresReason]);

	const toggleDate = (date: Date | null) => {
		if (!date) return;
		if (!activeCategory) {
			Alert.alert("Kļūda", "Lūdzu, vispirms izvēlieties kategoriju");
			return;
		}
		const iso = toISODate(date);
		setDateCategoryMap((prev) => {
			const { [iso]: existing, ...rest } = prev;
			if (existing) {
				return rest; // toggle off
			}
			return { ...prev, [iso]: activeCategory };
		});
	};

	const onCalendarLayout = (e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setGridSize({ width, height });
	};

	const handleCalendarResponderGrant = () => {
		isDraggingRef.current = true;
		seenWhileDraggingRef.current = new Set();
	};

	const handleCalendarResponderRelease = () => {
		isDraggingRef.current = false;
		seenWhileDraggingRef.current.clear();
	};

	const handleCalendarMove = (e: GestureResponderEvent) => {
		if (
			!isDraggingRef.current ||
			gridSize.width === 0 ||
			gridSize.height === 0 ||
			!activeCategory
		)
			return;
		const { locationX, locationY } = e.nativeEvent;
		// Grid is 7 cols x up to 6 rows
		const col = Math.min(
			6,
			Math.max(0, Math.floor((locationX / gridSize.width) * 7)),
		);
		const row = Math.min(
			5,
			Math.max(0, Math.floor((locationY / gridSize.height) * 6)),
		);
		const idx = row * 7 + col;
		const item = days[idx];
		if (!item || !item.date) return;
		const iso = toISODate(item.date);
		if (seenWhileDraggingRef.current.has(iso)) return;
		seenWhileDraggingRef.current.add(iso);
		setDateCategoryMap((prev) =>
			prev[iso] ? prev : { ...prev, [iso]: activeCategory },
		);
	};

	const submit = async () => {
		if (!authUser?.id) {
			Alert.alert("Kļūda", "Jābūt autorizētam lietotājam.");
			return;
		}
		const selectedEntries = Object.entries(dateCategoryMap);
		if (selectedEntries.length === 0) {
			Alert.alert("Kļūda", "Lūdzu, izvēlieties vismaz vienu datumu.");
			return;
		}
		if (
			assignedCategoryMetas.some((c) => c.requiresReason) &&
			!otherReason.trim()
		) {
			Alert.alert("Kļūda", "Lūdzu, ievadiet iemeslu (cits iemesls).");
			return;
		}

		const rows = selectedEntries.map(([d, key]) => {
			const cat = CATEGORIES.find((c) => c.key === key);
			return {
				user_id: authUser.id,
				kategorija: key,
				iemesls: cat?.requiresReason ? otherReason.trim() : null,
				komentari: comment.trim() || null,
				datums: d,
				callable: isCallable,
			};
		});

		const { error } = await supabase.from("prombutne").insert(rows);
		if (error) {
			Alert.alert("Kļūda", error.message || "Neizdevās pievienot ierakstu.");
			return;
		}

		Alert.alert("Gatavs", "Prombūtnes ieraksti pievienoti.");
		setDateCategoryMap({});
		setSelectedCategories([]);
		setActiveCategory(null);
		setComment("");
		setIsCallable(false);
		setOtherReason("");
	};

	const goPrevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
	const goNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

	return (
		<View style={styles.container}>
				<Header />
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={true}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.tabsRow}>
					{CATEGORIES.map((cat) => (
						<TouchableOpacity
							key={cat.key}
							style={[
								styles.tabChip,
								selectedCategories.includes(cat.key)
									? {
											...styles.tabChipActive,
											backgroundColor: cat.color,
											borderLeftColor: cat.color,
											borderLeftWidth: 6,
										}
									: { borderLeftColor: cat.color, borderLeftWidth: 6 },
							]}
							onPress={() => toggleCategory(cat.key)}
						>
							<View style={styles.categoryContent}>
								<Text
									style={[
										styles.tabLabel,
										selectedCategories.includes(cat.key) &&
											styles.tabLabelActive,
									]}
								>
									{cat.label}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.buttonRow}>
					<TouchableOpacity
						style={[
							styles.callableButton,
							isCallable && {
								backgroundColor: COLORS.atvalinajums,
								borderLeftColor: COLORS.primary,
							},
						]}
						onPress={() => setIsCallable(!isCallable)}
						activeOpacity={0.7}
					>
						<Ionicons
							name="call"
							size={20}
							color={isCallable ? "#fff" : COLORS.primary}
						/>
						<Text
							style={[
								styles.callableButtonText,
								isCallable && styles.callableButtonTextActive,
							]}
						>
							Būšu sazvanāms
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.commentButton,
							(comment || showCommentInput) && {
								backgroundColor: COLORS.atvalinajums,
								borderLeftColor: COLORS.primary,
							},
						]}
						onPress={() => setShowCommentInput(!showCommentInput)}
						activeOpacity={0.7}
					>
						<Ionicons
							name="chatbubble-ellipses"
							size={20}
							color={comment || showCommentInput ? "#fff" : COLORS.primary}
						/>
						<Text
							style={[
								styles.commentButtonText,
								(comment || showCommentInput) && styles.commentButtonTextActive,
							]}
						>
							Komentāri
						</Text>
					</TouchableOpacity>
				</View>

				{showCommentInput && (
					<View style={styles.fieldBlock}>
						<TextInput
							style={[styles.input, styles.inputMultiline]}
							value={comment}
							onChangeText={setComment}
							placeholder="Īss komentārs"
							placeholderTextColor="#666"
							multiline
							numberOfLines={4}
							maxLength={200}
						/>
					</View>
				)}

				{/* <Calendar
        onDayPress={(day) => {
          console.log('selected day', day);
        }}
      /> */}
				<View style={styles.calendarHeader}>
					<TouchableOpacity onPress={goPrevMonth} style={styles.monthBtn}>
						<Text style={styles.monthBtnText}>◀</Text>
					</TouchableOpacity>
					<Text style={styles.monthTitle}>{formatMonth(currentMonth)}</Text>
					<TouchableOpacity onPress={goNextMonth} style={styles.monthBtn}>
						<Text style={styles.monthBtnText}>▶</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.weekRow}>
					{["P", "O", "T", "C", "Pk", "S", "Sv"].map((w) => (
						<Text key={w} style={styles.weekCell}>
							{w}
						</Text>
					))}
				</View>
				<View
					style={styles.calendarGrid}
					onLayout={onCalendarLayout}
					onStartShouldSetResponder={() => true}
					onMoveShouldSetResponder={() => true}
					onResponderGrant={handleCalendarResponderGrant}
					onResponderRelease={handleCalendarResponderRelease}
					onResponderMove={handleCalendarMove}
				>
					{days.map((d) => {
						const iso = d.date ? toISODate(d.date) : "";
						const assignedCategory = iso && dateCategoryMap[iso];
						const selected = !!d.date && !!assignedCategory;
						const selectedColor = assignedCategory
							? CATEGORIES.find((c) => c.key === assignedCategory)?.color ||
								COLORS.primary
							: COLORS.primary;
						return (
							<TouchableOpacity
								key={d.key}
								style={styles.dayCell}
								onPress={() => toggleDate(d.date)}
								disabled={!d.date}
							>
								<View
									style={[
										styles.dayInner,
										// Non-selected actual dates get background lite
										!selected &&
											d.date && { backgroundColor: COLORS.backgroundLite },
										// Selected dates get assigned category color
										selected && { backgroundColor: selectedColor },
									]}
								>
									<Text
										style={[
											styles.dayText,
											!d.date && styles.dayTextDisabled,
											selected && styles.dayTextSelected,
										]}
									>
										{d.date ? d.date.getDate() : ""}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>

				<View style={styles.submitContainer}>
					<TouchableOpacity
						style={[styles.resetBtn, { backgroundColor: COLORS.slimiba }]}
						onPress={() => {
							setSelectedCategories([]);
							setActiveCategory(null);
							setDateCategoryMap({});
							setComment("");
							setIsCallable(false);
							setOtherReason("");
							setShowCommentInput(false);
							Alert.alert("Dati notīrīti", "Visi ievadītie dati ir notīrīti.");
						}}
					>
						<Ionicons
							name="trash-outline"
							size={18}
							color="#ffffff"
							style={styles.resetIcon}
						/>
						<Text style={[styles.resetBtnText, { color: "#ffffff" }]}>
							Notīrīt datus
						</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.submitBtn} onPress={submit}>
						<Text style={styles.submitText}>Pievienot</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingBottom: 40,
	},
	logoContainer: {
		paddingTop: 20,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 10,
	},
	soclogo: {
		width: 60,
		height: 60,
	},
	tabsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 16,
	},
	buttonRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 16,
	},
	tabChip: {
		padding: 12,
		borderRadius: 8,
		backgroundColor: COLORS.backgroundLite,
		borderLeftWidth: 6,
		flex: 1,
		minWidth: "45%",
	},
	callableButton: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 8,
		backgroundColor: COLORS.backgroundLite,
		borderLeftWidth: 6,
		borderLeftColor: COLORS.atvalinajums,
		flex: 1,
		gap: 8,
	},
	callableButtonText: {
		color: COLORS.text,
		fontWeight: "500",
		fontSize: TYPOGRAPHY.md,
	},
	callableButtonTextActive: {
		color: "#fff",
		fontWeight: "600",
	},
	commentButton: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 8,
		backgroundColor: COLORS.backgroundLite,
		borderLeftWidth: 6,
		borderLeftColor: COLORS.primary,
		flex: 1,
		gap: 8,
	},
	commentButtonText: {
		color: COLORS.text,
		fontWeight: "500",
		fontSize: TYPOGRAPHY.md,
	},
	commentButtonTextActive: {
		color: "#fff",
		fontWeight: "600",
	},
	tabChipActive: {
		borderLeftWidth: 6,
	},
	tabLabel: {
		color: COLORS.text,
		fontSize: TYPOGRAPHY.md,
		fontWeight: "500",
		marginLeft: 8,
	},
	categoryContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	checkmarkIcon: {
		width: 20,
		textAlign: "center",
		marginRight: -3,
	},
	sectionHeader: {
		color: COLORS.text,
		fontSize: TYPOGRAPHY.md,
		opacity: 0.8,
		textAlign: "center",
		paddingHorizontal: 16,
		marginBottom: 20,
	},
	tabLabelActive: {
		color: "#fff",
		fontWeight: "600",
	},
	fieldBlock: {
		marginBottom: 20,
	},
	label: {
		color: COLORS.text,
		marginBottom: 8,
		fontWeight: "500",
	},
	input: {
		backgroundColor: COLORS.backgroundLite,
		borderRadius: 8,
		padding: 12,
		color: COLORS.text,
		fontSize: 13,
	},
	inputMultiline: {
		minHeight: 100,
		textAlignVertical: "top",
	},
	calendarHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
		marginTop: 16,
		paddingHorizontal: 40,
	},
	monthBtn: {
		padding: 8,
	},
	monthBtnText: {
		fontSize: 16,
		color: COLORS.primary,
		fontWeight: "bold",
	},
	monthTitle: {
		fontSize: TYPOGRAPHY.lg,
		fontWeight: "600",
		color: COLORS.text,
	},
	weekRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.backgroundLiteBorder,
		paddingBottom: 8,
	},
	weekCell: {
		width: "14.2%",
		textAlign: "center",
		color: COLORS.text,
		opacity: 0.7,
		fontWeight: "500",
	},
	calendarGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: -50,
	},
	dayCell: {
		width: "14.2%",
		aspectRatio: 1,
		padding: 4,
	},
	dayInner: {
		flex: 1,
		borderRadius: 6,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "transparent",
	},
	dayText: {
		color: COLORS.text,
		fontWeight: "500",
		fontSize: TYPOGRAPHY.md,
	},
	dayTextDisabled: {
		opacity: 0.3,
	},
	dayTextSelected: {
		color: "#fff",
		fontWeight: "600",
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 20,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: COLORS.primary,
		marginBottom: 20,
	},
	checkbox: {
		width: 24,
		height: 24,
		// borderRadius: 12,
		// borderWidth: 2,
		// borderColor: colors.primary,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 22,
	},
	checkboxChecked: {
		backgroundColor: COLORS.primary,
	},
	checkboxLabel: {
		color: COLORS.text,
		fontSize: 16,
	},
	checkboxLabelActive: {
		color: "#fff",
		fontWeight: "600",
	},
	submitContainer: {
		marginTop: 24,
		marginBottom: 20,
		gap: 12,
	},
	resetBtn: {
		padding: 14,
		borderRadius: 8,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
	},
	resetBtnText: {
		fontSize: TYPOGRAPHY.md,
		fontWeight: "500",
	},
	resetIcon: {
		marginRight: 8,
	},
	submitBtn: {
		backgroundColor: COLORS.primary,
		padding: 16,
		borderRadius: 8,
		alignItems: "center",
	},
	submitText: {
		fontSize: TYPOGRAPHY.md,
		fontWeight: "700",
		color: "#fff",
	},
});

function truncateToMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
	return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function formatMonth(d: Date): string {
	const month = d.toLocaleString("lv-LV", { month: "long" });
	return `${capitalize(month)} ${d.getFullYear()}`;
}

function capitalize(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function toISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function buildMonthGrid(firstOfMonth: Date): CalendarDay[] {
	const year = firstOfMonth.getFullYear();
	const month = firstOfMonth.getMonth();
	const first = new Date(year, month, 1);
	const startWeekday = (first.getDay() + 6) % 7; // Monday=0 ... Sunday=6
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const grid: CalendarDay[] = [];
	for (let i = 0; i < startWeekday; i++) {
		grid.push({ date: null, key: `pad-${i}` });
	}
	for (let d = 1; d <= daysInMonth; d++) {
		const date = new Date(year, month, d);
		grid.push({ date, key: `d-${toISODate(date)}` });
	}
	// pad the final row to complete weeks (6 rows, 7 cols)
	while (grid.length % 7 !== 0) {
		grid.push({ date: null, key: `trail-${grid.length}` });
	}
	while (grid.length < 42) {
		grid.push({ date: null, key: `trail-${grid.length}` });
	}
	return grid;
}
