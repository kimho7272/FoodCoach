import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Calendar, Trash2, ArrowUp, ArrowDown, ChevronRight, Flame, Zap, BarChart2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { getMealLogs, deleteMealLog, updateMealLogCategory, updateMealLogName } from '../src/lib/meal_service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealHistoryScreen() {
    const router = useRouter();
    const { date, highlightId } = useLocalSearchParams();

    // Initialize selectedDate from params if present
    const [selectedDate, setSelectedDate] = useState(() => {
        if (date) {
            // Robust local date parsing for YYYY-MM-DD
            const parts = (date as string).split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return new Date(date as string);
        }
        return new Date();
    });

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showCategoryPicker, setShowCategoryPicker] = useState<string | null>(null);
    const hasScrolledRef = useRef<string | null>(null);
    const scrollAttempts = useRef(0);
    const dateScrollRef = useRef<ScrollView>(null);
    const mainScrollRef = useRef<ScrollView>(null);
    const itemPositions = useRef<Map<string, number>>(new Map());

    // Generate dates (today at the left)
    const dates = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await getMealLogs(user.id);
            if (data) {
                const filtered = data.filter((log: any) =>
                    new Date(log.created_at).toDateString() === selectedDate.toDateString()
                );

                const defaultSorted = [...filtered].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                const orderKey = `meal_order_${user.id}_${selectedDate.toDateString()}`;
                const savedOrder = await AsyncStorage.getItem(orderKey);

                if (savedOrder) {
                    const idOrder = JSON.parse(savedOrder);
                    const sorted = [...filtered].sort((a, b) => {
                        const idxA = idOrder.indexOf(a.id);
                        const idxB = idOrder.indexOf(b.id);

                        // New items (not in saved order) go to the FRONT (top)
                        if (idxA === -1 && idxB === -1) {
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        }
                        if (idxA === -1) return -1;
                        if (idxB === -1) return 1;

                        return idxA - idxB;
                    });
                    setLogs(sorted);
                } else {
                    setLogs(defaultSorted);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset/Sync state when navigation parameters change
    useEffect(() => {
        if (date) {
            const parts = (date as string).split('-');
            if (parts.length === 3) {
                const newDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                if (newDate.toDateString() !== selectedDate.toDateString()) {
                    setSelectedDate(newDate);
                    itemPositions.current.clear(); // Only clear when the ACTUAL date changes
                }
            }
        }
        hasScrolledRef.current = null;
        scrollAttempts.current = 0;
    }, [highlightId, date, selectedDate]);

    const performScroll = useCallback((force = false) => {
        if (!highlightId || !mainScrollRef.current || loading) return;
        const targetId = String(highlightId);

        // Skip if already scrolled to this ID (unless forced via onLayout)
        if (!force && hasScrolledRef.current === targetId) return;

        const yPos = itemPositions.current.get(targetId);
        if (yPos !== undefined && yPos > 0) {
            const screenHeight = Dimensions.get('window').height;
            // Center the card: Item Y - (Screen/2) + Header Offset correction
            const targetOffset = Math.max(0, yPos - (screenHeight / 2) + 160);

            mainScrollRef.current.scrollTo({ y: targetOffset, animated: true });
            hasScrolledRef.current = targetId;
            return true;
        }

        if (scrollAttempts.current < 15) {
            scrollAttempts.current++;
            setTimeout(() => performScroll(), 100);
        }
        return false;
    }, [loading, highlightId]);

    useEffect(() => {
        if (!loading && highlightId && logs.length > 0) {
            // Multiple attempts to catch slow rendering
            performScroll();
            const t1 = setTimeout(() => performScroll(), 500);
            const t2 = setTimeout(() => performScroll(), 1500);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [loading, highlightId, logs.length, performScroll]);

    const saveOrder = async (newLogs: any[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const orderKey = `meal_order_${user.id}_${selectedDate.toDateString()}`;
        const idOrder = newLogs.map(l => l.id);
        await AsyncStorage.setItem(orderKey, JSON.stringify(idOrder));
    };

    const moveItem = async (index: number, direction: 'up' | 'down') => {
        const newLogs = [...logs];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newLogs.length) return;

        [newLogs[index], newLogs[targetIndex]] = [newLogs[targetIndex], newLogs[index]];
        setLogs(newLogs);
        await saveOrder(newLogs);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Meal",
            "Are you sure you want to delete this meal record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await deleteMealLog(id);
                        if (!error) {
                            setLogs(logs.filter(l => l.id !== id));
                        } else {
                            Alert.alert("Error", "Failed to delete meal.");
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateCategory = async (id: string, newCategory: any) => {
        setUpdatingId(id);
        const { error } = await updateMealLogCategory(id, newCategory);
        if (!error) {
            setLogs(prev => prev.map(l => l.id === id ? { ...l, meal_type: newCategory } : l));
        } else {
            Alert.alert("Error", "Failed to update category.");
        }
        setUpdatingId(null);
        setShowCategoryPicker(null);
    };

    const handleUpdateName = async (id: string, newName: string) => {
        if (!newName || newName === logs.find(l => l.id === id)?.food_name) {
            setEditingId(null);
            return;
        }

        const { error } = await updateMealLogName(id, newName);
        if (!error) {
            setLogs(prev => prev.map(l => l.id === id ? { ...l, food_name: newName } : l));
        } else {
            Alert.alert("Error", "Failed to update name.");
        }
        setEditingId(null);
    };

    const formatDate = (date: Date) => {
        const today = new Date().toDateString();
        if (date.toDateString() === today) return 'Today';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const MealCard = ({ item, index }: { item: any, index: number }) => {
        const isHighlighted = item.id === highlightId;

        return (
            <View
                onLayout={(e) => {
                    itemPositions.current.set(item.id, e.nativeEvent.layout.y);
                    if (String(item.id) === String(highlightId)) {
                        performScroll(true);
                    }
                }}
                style={[
                    styles.mealCard,
                    isHighlighted && { borderColor: '#10b981', borderWidth: 2, shadowOpacity: 0.1, shadowRadius: 20 }
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => setShowCategoryPicker(item.id)} style={styles.typeBadge}>
                            <Text style={styles.typeText}>{item.meal_type}</Text>
                            <ChevronRight size={12} color="#64748b" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                        <Text style={styles.timeText}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            style={[styles.actionBtn, index === 0 && { opacity: 0.3 }]}
                        >
                            <ChevronUp size={20} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => moveItem(index, 'down')}
                            disabled={index === logs.length - 1}
                            style={[styles.actionBtn, index === logs.length - 1 && { opacity: 0.3 }]}
                        >
                            <ChevronDown size={20} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={[styles.actionBtn, styles.deleteBtn]}
                        >
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.imageWrapper}>
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={styles.mealImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={{ fontSize: 32 }}>≡ƒì▒</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.textInfo}>
                        {editingId === item.id ? (
                            <TextInput
                                style={[styles.foodName, styles.nameInput]}
                                value={editValue}
                                onChangeText={setEditValue}
                                onBlur={() => handleUpdateName(item.id, editValue)}
                                onSubmitEditing={() => handleUpdateName(item.id, editValue)}
                                autoFocus
                                selectTextOnFocus
                            />
                        ) : (
                            <TouchableOpacity onPress={() => { setEditingId(item.id); setEditValue(item.food_name); }}>
                                <Text style={styles.foodName} numberOfLines={1}>{item.food_name}</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.scoreRow}>
                            <View style={[styles.scoreDot, { backgroundColor: item.health_score >= 7 ? '#10b981' : (item.health_score >= 4 ? '#f59e0b' : '#ef4444') }]} />
                            <Text style={styles.scoreText}>Health Score: {item.health_score}/10</Text>
                        </View>
                    </View>
                </View>

                {/* Macro Row - Fixed Width Alignment */}
                <View style={styles.macroRowAlign}>
                    <View style={styles.macroBox}>
                        <Flame size={14} color="#f59e0b" />
                        <Text style={styles.macroValueText}>{item.calories}</Text>
                        <Text style={styles.macroLabelText}>kcal</Text>
                    </View>
                    <View style={styles.macroBox}>
                        <Zap size={14} color="#10b981" />
                        <Text style={styles.macroValueText}>{item.protein}</Text>
                        <Text style={styles.macroLabelText}>P</Text>
                    </View>
                    <View style={styles.macroBox}>
                        <BarChart2 size={14} color="#6366f1" />
                        <Text style={styles.macroValueText}>{item.fat}</Text>
                        <Text style={styles.macroLabelText}>F</Text>
                    </View>
                    <View style={styles.macroBox}>
                        <ArrowUp size={14} color="#ec4899" />
                        <Text style={styles.macroValueText}>{item.carbs}</Text>
                        <Text style={styles.macroLabelText}>C</Text>
                    </View>
                </View>

                <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>{item.description || 'No description provided.'}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        >
            <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={28} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meal History</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Date Selector */}
                <View style={styles.dateContainer}>
                    <ScrollView
                        ref={dateScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateScrollContent}
                    >
                        {dates.map((date, idx) => {
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setSelectedDate(date)}
                                    style={[styles.dateItem, isSelected && styles.dateItemActive]}
                                >
                                    <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </Text>
                                    <Text style={[styles.dateNumber, isSelected && styles.dateTextActive]}>
                                        {date.getDate()}
                                    </Text>
                                    {isSelected && <View style={styles.activeDot} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#10b981" />
                    </View>
                ) : logs.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Calendar size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No meals logged for {formatDate(selectedDate)}</Text>
                        <TouchableOpacity
                            style={styles.addNowBtn}
                            onPress={() => router.push('/(tabs)/analysis' as any)}
                        >
                            <Text style={styles.addNowBtnText}>Log New Meal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        ref={mainScrollRef}
                        style={styles.listScroll}
                        contentContainerStyle={styles.listContent}
                    >
                        {logs.map((item, index) => (
                            <MealCard key={item.id} item={item} index={index} />
                        ))}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Category Picker Modal */}
            <Modal
                transparent
                visible={!!showCategoryPicker}
                animationType="fade"
                onRequestClose={() => setShowCategoryPicker(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryPicker(null)}
                >
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} />
                    <View style={styles.pickerCard}>
                        <Text style={styles.pickerTitle}>Select Category</Text>
                        {MEAL_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={styles.pickerItem}
                                onPress={() => showCategoryPicker && handleUpdateCategory(showCategoryPicker, type)}
                            >
                                <Text style={styles.pickerItemText}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },

    dateContainer: { height: 100, marginBottom: 10 },
    dateScrollContent: { paddingHorizontal: 20, alignItems: 'center' },
    dateItem: { width: 60, height: 80, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    dateItemActive: { backgroundColor: '#10b981' },
    dateDay: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 4 },
    dateNumber: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    dateTextActive: { color: 'white' },
    activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'white', marginTop: 4 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 16, color: '#64748b', textAlign: 'center', fontSize: 16, fontWeight: '600' },
    addNowBtn: { marginTop: 24, backgroundColor: '#10b981', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
    addNowBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    listScroll: { flex: 1 },
    listContent: { padding: 20 },
    mealCard: { backgroundColor: 'white', borderRadius: 30, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { backgroundColor: '#fee2e2' },

    typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    typeText: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
    timeText: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },

    mainInfo: { flexDirection: 'row', marginBottom: 20 },
    imageWrapper: { width: 80, height: 80, borderRadius: 20, overflow: 'hidden', backgroundColor: '#f1f5f9' },
    mealImage: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    textInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    foodName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    nameInput: { borderBottomWidth: 1, borderBottomColor: '#10b981', paddingBottom: 0, marginBottom: 2 },
    scoreRow: { flexDirection: 'row', alignItems: 'center' },
    scoreDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    scoreText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },

    macroRowAlign: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    macroBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    macroValueText: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginTop: 4 },
    macroLabelText: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },

    descriptionBox: { paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    descriptionText: { fontSize: 13, color: '#64748b', lineHeight: 18, fontStyle: 'italic' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    pickerCard: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
    pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
    pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    pickerItemText: { fontSize: 16, fontWeight: '600', color: '#1e293b', textAlign: 'center' }
});
