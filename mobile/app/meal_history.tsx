import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Calendar, Trash2, ArrowUp, ChevronRight, Flame, Zap, BarChart2, MapPin, ThumbsUp, ZoomIn, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { getMealLogs, deleteMealLog, updateMealLogCategory, updateMealLogName, updateMealLogLocation } from '../src/lib/meal_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../src/context/AlertContext';
import ImageView from 'react-native-image-viewing';
import { theme } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

interface MealCardProps {
    item: any;
    isSelected: boolean;
    isFavorite: boolean;
    updatingId: string | null;
    editingId: string | null;
    editValue: string;
    editingLocId: string | null;
    editLocValue: string;
    onDelete: (id: string) => void;
    onUpdateCategory: (id: string, category: string) => void;
    onUpdateName: (id: string, name: string) => void;
    onUpdateLocation: (id: string, loc: string) => void;
    onSetEditingId: (id: string | null) => void;
    onSetEditValue: (val: string) => void;
    onSetEditingLocId: (id: string | null) => void;
    onSetEditLocValue: (val: string) => void;
    onToggleFavorite: (id: string) => void;
    onZoomImage: (url: string) => void;
    onShowCategoryPicker: (id: string) => void;
    onStartEdit: (id: string, y: number) => void;
    onOpenMap: (item: any) => void;
}

const MealCard = React.memo(({
    item, isSelected, isFavorite, updatingId, editingId, editValue,
    editingLocId, editLocValue, onDelete, onUpdateName, onUpdateLocation,
    onSetEditingId, onSetEditValue, onSetEditingLocId, onSetEditLocValue,
    onToggleFavorite, onZoomImage, onShowCategoryPicker, onStartEdit, onOpenMap
}: MealCardProps) => {
    const cardY = useRef(0);

    return (
        <BlurView
            intensity={40}
            tint="light"
            style={[styles.mealCard, isSelected && styles.mealCardSelected]}
            onLayout={(e) => {
                cardY.current = e.nativeEvent.layout.y;
            }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => onShowCategoryPicker(item.id)} style={styles.typeBadge}>
                        <Text style={styles.typeText}>{item.meal_type}</Text>
                        <ChevronRight size={10} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                    <Text style={styles.timeText}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
            </View>

            <View style={styles.mealMain}>
                <TouchableOpacity style={styles.imageBox} onPress={() => item.image_url && onZoomImage(item.image_url)}>
                    {item.image_url ? (
                        <>
                            <Image source={{ uri: item.image_url }} style={styles.mealImg} />
                            <View style={styles.zoomIcon}><ZoomIn size={12} color="#fff" /></View>
                        </>
                    ) : (
                        <View style={styles.imgPlaceholder}><Text style={{ fontSize: 24 }}>🍱</Text></View>
                    )}
                </TouchableOpacity>

                <View style={styles.mealInfo}>
                    {editingId === item.id ? (
                        <TextInput
                            style={styles.nameInput}
                            value={editValue}
                            onChangeText={onSetEditValue}
                            onBlur={() => onUpdateName(item.id, editValue)}
                            onSubmitEditing={() => onUpdateName(item.id, editValue)}
                            autoFocus
                        />
                    ) : (
                        <TouchableOpacity onPress={() => {
                            onStartEdit(item.id, cardY.current);
                            onSetEditingId(item.id);
                            onSetEditValue(item.food_name);
                        }}>
                            <Text style={styles.mealName} numberOfLines={1}>{item.food_name}</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.scoreRow}>
                        <View style={[styles.scoreDot, { backgroundColor: item.health_score >= 7 ? theme.colors.primary : (item.health_score >= 4 ? theme.colors.secondary : '#ef4444') }]} />
                        <Text style={styles.scoreText}>METABOLIC SCORE: {item.health_score}/10</Text>
                    </View>
                    {editingLocId === item.id ? (
                        <TextInput
                            style={styles.locationInput}
                            value={editLocValue}
                            onChangeText={onSetEditLocValue}
                            onBlur={() => onUpdateLocation(item.id, editLocValue)}
                            onSubmitEditing={() => onUpdateLocation(item.id, editLocValue)}
                            autoFocus
                            placeholder="Restaurant or Place Name"
                            placeholderTextColor={theme.colors.text.muted}
                        />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingVertical: 2 }}>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onOpenMap(item);
                                }}
                                style={{ padding: 2 }}
                            >
                                <MapPin size={12} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => {
                                    onStartEdit(item.id, cardY.current);
                                    onSetEditingLocId(item.id);
                                    onSetEditLocValue(item.place_name || '');
                                }}
                            >
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {item.place_name || item.address || 'Unknown Location'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={() => onToggleFavorite(item.id)}
                        style={[styles.favBtn, isFavorite && styles.favBtnActive]}
                    >
                        <ThumbsUp size={14} color={isFavorite ? theme.colors.primary : theme.colors.text.secondary} fill={isFavorite ? theme.colors.primary : 'none'} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.macroStrip}>
                <View style={styles.macroTile}><Flame size={12} color={theme.colors.secondary} /><Text style={styles.macroVal}>{item.calories} <Text style={styles.macroUnit}>kcal</Text></Text></View>
                <View style={styles.macroTile}><Zap size={12} color={theme.colors.primary} /><Text style={styles.macroVal}>{item.protein} <Text style={styles.macroUnit}>g</Text></Text></View>
                <View style={styles.macroTile}><BarChart2 size={12} color="#818cf8" /><Text style={styles.macroVal}>{item.fat} <Text style={styles.macroUnit}>g</Text></Text></View>
                <View style={styles.macroTile}><ArrowUp size={12} color="#ec4899" /><Text style={styles.macroVal}>{item.carbs} <Text style={styles.macroUnit}>g</Text></Text></View>
            </View>

            {item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
        </BlurView>
    );
});

export default function MealHistoryScreen() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const params = useLocalSearchParams();
    const { date, highlightId } = params;

    const [selectedDate, setSelectedDate] = useState(() => {
        if (date) {
            const parts = (date as string).split('-');
            if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return new Date(date as string);
        }
        return new Date();
    });

    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showCategoryPicker, setShowCategoryPicker] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<{ [key: string]: 'up' | 'down' | null }>({});
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [editingLocId, setEditingLocId] = useState<string | null>(null);
    const [editLocValue, setEditLocValue] = useState('');

    const mainScrollRef = useRef<ScrollView>(null);
    const itemPositions = useRef<Map<string, number>>(new Map());

    const dates = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    });

    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const stored = await AsyncStorage.getItem('meal_favorites');
                if (stored) setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        };
        loadFavorites();
        fetchLogs();
    }, []);

    const toggleFavorite = async (id: string) => {
        const newFavs = { ...favorites };
        if (newFavs[id] === 'up') delete newFavs[id];
        else newFavs[id] = 'up';
        setFavorites(newFavs);
        try {
            await AsyncStorage.setItem('meal_favorites', JSON.stringify(newFavs));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await getMealLogs(user.id);
            if (data) setAllLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    const displayedLogs = React.useMemo(() => {
        if (showFavoritesOnly) return allLogs.filter(l => favorites[l.id] === 'up');
        return allLogs.filter(log => new Date(log.created_at).toDateString() === selectedDate.toDateString());
    }, [allLogs, showFavoritesOnly, selectedDate, favorites]);

    const handleDelete = (id: string) => {
        showAlert({
            title: "Delete Meal",
            message: "Are you sure you want to delete this meal record?",
            type: 'confirm',
            confirmText: "Delete",
            onConfirm: async () => {
                const { error } = await deleteMealLog(id);
                if (!error) setAllLogs(prev => prev.filter(l => l.id !== id));
                else showAlert({ title: "Error", message: "Failed to delete meal.", type: 'error' });
            }
        });
    };

    const handleUpdateCategory = async (id: string, newCategory: string) => {
        setUpdatingId(id);
        const { error } = await updateMealLogCategory(id, newCategory);
        if (!error) setAllLogs(prev => prev.map(l => l.id === id ? { ...l, meal_type: newCategory } : l));
        setUpdatingId(null);
        setShowCategoryPicker(null);
    };

    const handleUpdateName = async (id: string, newName: string) => {
        if (!newName || newName === allLogs.find(l => l.id === id)?.food_name) {
            setEditingId(null);
            return;
        }
        const { error } = await updateMealLogName(id, newName);
        if (!error) setAllLogs(prev => prev.map(l => l.id === id ? { ...l, food_name: newName } : l));
        setEditingId(null);
    };

    const handleUpdateLocation = async (id: string, newLoc: string) => {
        const targetLog = allLogs.find(l => l.id === id);
        if (newLoc === targetLog?.place_name) {
            setEditingLocId(null);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await updateMealLogLocation(id, user.id, targetLog?.address || null, newLoc);

            if (!error) {
                // Bulk update local state as well
                setAllLogs(prev => prev.map(l => {
                    if (l.id === id) return { ...l, place_name: newLoc };
                    if (targetLog?.address && l.address === targetLog.address && !l.place_name) {
                        return { ...l, place_name: newLoc };
                    }
                    return l;
                }));
            }
        } catch (e) {
            console.error(e);
        }

        setEditingLocId(null);
    };



    const handleOpenMap = (item: any) => {
        const { location_lat, location_lng, place_name, address } = item;
        const searchQuery = [place_name, address].filter(Boolean).join(', ');
        const query = encodeURIComponent(searchQuery || '');

        if (!query && !location_lat) {
            showAlert({ title: "No Location", message: "Location details are missing for this meal.", type: 'error' });
            return;
        }

        const url = Platform.select({
            ios: query
                ? `maps:0,0?q=${query}`
                : `maps:0,0?q=Meal Location@${location_lat},${location_lng}`,
            android: query
                ? `geo:0,0?q=${query}`
                : `geo:${location_lat},${location_lng}?q=${location_lat},${location_lng}(Meal Location)`
        });

        if (url) {
            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query || `${location_lat},${location_lng}`}`;
                    Linking.openURL(fallbackUrl);
                }
            }).catch(err => console.error('Map opening error:', err));
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <ChevronLeft size={24} color={theme.colors.text.primary} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{showFavoritesOnly ? 'Favorites' : 'History'}</Text>
                    <TouchableOpacity onPress={() => setShowFavoritesOnly(!showFavoritesOnly)} style={[styles.toggleBtn, showFavoritesOnly && styles.toggleBtnActive]}>
                        <ThumbsUp size={20} color={showFavoritesOnly ? theme.colors.primary : theme.colors.text.muted} fill={showFavoritesOnly ? theme.colors.primary : 'none'} />
                    </TouchableOpacity>
                </View>

                {!showFavoritesOnly && (
                    <View style={styles.dateBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                            {dates.map((d, i) => {
                                const isSelected = d.toDateString() === selectedDate.toDateString();
                                return (
                                    <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={[styles.dateCard, isSelected && styles.dateCardActive]}>
                                        <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                        <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>{d.getDate()}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {loading ? (
                    <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>
                ) : (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <ScrollView ref={mainScrollRef} contentContainerStyle={styles.list}>
                            {displayedLogs.length === 0 ? (
                                <View style={styles.empty}>
                                    <Calendar size={60} color={theme.colors.text.muted} style={{ opacity: 0.3, marginBottom: 16 }} />
                                    <Text style={styles.emptyText}>No logs found for this period.</Text>
                                </View>
                            ) : (
                                displayedLogs.map(item => (
                                    <MealCard
                                        key={item.id}
                                        item={item}
                                        isSelected={selectedId === String(item.id)}
                                        isFavorite={favorites[item.id] === 'up'}
                                        updatingId={updatingId}
                                        editingId={editingId}
                                        editValue={editValue}
                                        editingLocId={editingLocId}
                                        editLocValue={editLocValue}
                                        onDelete={handleDelete}
                                        onUpdateCategory={handleUpdateCategory}
                                        onUpdateName={handleUpdateName}
                                        onUpdateLocation={handleUpdateLocation}
                                        onSetEditingId={setEditingId}
                                        onSetEditValue={setEditValue}
                                        onSetEditingLocId={setEditingLocId}
                                        onSetEditLocValue={setEditLocValue}
                                        onToggleFavorite={toggleFavorite}
                                        onZoomImage={setZoomImage}
                                        onShowCategoryPicker={setShowCategoryPicker}
                                        onStartEdit={(id, y) => {
                                            mainScrollRef.current?.scrollTo({ y: y - 20, animated: true });
                                        }}
                                        onOpenMap={handleOpenMap}
                                    />
                                ))
                            )}
                            <View style={{ height: 100 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                )}
            </SafeAreaView>

            <Modal visible={!!showCategoryPicker} transparent animationType="fade">
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.modalContent}>
                    <BlurView intensity={80} tint="dark" style={styles.pickerCard}>
                        <Text style={styles.pickerHeader}>Category</Text>
                        {MEAL_TYPES.map(type => (
                            <TouchableOpacity key={type} style={styles.pickerBtn} onPress={() => handleUpdateCategory(showCategoryPicker!, type)}>
                                <Text style={styles.pickerText}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCategoryPicker(null)}><X size={20} color="#fff" /></TouchableOpacity>
                    </BlurView>
                </View>
            </Modal>

            <ImageView images={zoomImage ? [{ uri: zoomImage }] : []} imageIndex={0} visible={!!zoomImage} onRequestClose={() => setZoomImage(null)} swipeToCloseEnabled doubleTapToZoomEnabled />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    iconBlur: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    backBtn: {},
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    toggleBtn: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.colors.glass.border },
    toggleBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: theme.colors.primary },
    dateBar: { height: 90, marginBottom: 8 },
    dateScroll: { paddingHorizontal: 20, gap: 12 },
    dateCard: { width: 55, height: 75, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    dateCardActive: { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.primary },
    dateDay: { fontSize: 11, color: theme.colors.text.secondary, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
    dateNum: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    dateTextActive: { color: theme.colors.text.primary },
    list: { padding: 20, gap: 16 },
    mealCard: { borderRadius: 28, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    mealCardSelected: { borderColor: theme.colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    typeText: { fontSize: 10, fontWeight: '900', color: theme.colors.text.secondary, textTransform: 'uppercase' },
    timeText: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '600' },
    deleteBtn: { padding: 6 },
    mealMain: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    imageBox: { width: 70, height: 70, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative' },
    mealImg: { width: '100%', height: '100%' },
    imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    zoomIcon: { position: 'absolute', right: 4, bottom: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 3 },
    mealInfo: { flex: 1, justifyContent: 'center' },
    mealName: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 4 },
    nameInput: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, borderBottomWidth: 1, borderBottomColor: theme.colors.primary, padding: 0 },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    scoreDot: { width: 6, height: 6, borderRadius: 3 },
    scoreText: { fontSize: 10, fontWeight: '800', color: theme.colors.text.secondary, letterSpacing: 0.5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingVertical: 2 },
    locationText: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: '600' },
    locationInput: { fontSize: 10, color: theme.colors.text.primary, borderBottomWidth: 1, borderBottomColor: theme.colors.primary, padding: 0, marginTop: 4 },
    favBtn: { alignSelf: 'flex-start', marginTop: 10, padding: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: theme.colors.glass.border },
    favBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
    macroStrip: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    macroTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    macroVal: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary, marginTop: 4 },
    macroUnit: { fontSize: 9, color: theme.colors.text.secondary, fontWeight: '600' },
    description: { fontSize: 12, color: theme.colors.text.secondary, fontStyle: 'italic', lineHeight: 18 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { color: theme.colors.text.muted, fontSize: 16, fontWeight: '600' },
    modalContent: { flex: 1, justifyContent: 'center', padding: 30 },
    pickerCard: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    pickerHeader: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 20 },
    pickerBtn: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    pickerText: { fontSize: 16, color: '#fff', textAlign: 'center', fontWeight: '600' },
    closeBtn: { position: 'absolute', top: 20, right: 20, padding: 4 }
});
