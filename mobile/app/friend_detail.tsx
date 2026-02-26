import React, { useEffect, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Platform, Linking, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { getMealLogs } from '../src/lib/meal_service';
import { useTranslation } from '../src/lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, MessageCircle, Calendar, User, Zap, Activity, Heart, MapPin, ZoomIn, Flame, BarChart2, ArrowUp, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageView from 'react-native-image-viewing';
import { messageService } from '../src/services/message_service';
import { MealChatModal } from '../src/components/MealChatModal';

const { width } = Dimensions.get('window');

export default function FriendDetailScreen() {
    const { userId } = useLocalSearchParams();
    const router = useRouter();
    const { t, language } = useTranslation();
    const [friendProfile, setFriendProfile] = useState<{
        id: string;
        avatar_url: string | null;
        nickname: string | null;
    } | undefined | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [alias, setAlias] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [isEditingAlias, setIsEditingAlias] = useState(false);
    const [tempAlias, setTempAlias] = useState('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [friendUnreadCount, setFriendUnreadCount] = useState(0);
    const [activeChatMeal, setActiveChatMeal] = useState<any>(null);
    const [isGeneralChatVisible, setIsGeneralChatVisible] = useState(false);

    const sliderPos = useSharedValue(0);
    const tabWidth = (Dimensions.get('window').width - 48 - 8) / 2;

    const animatedSliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: withSpring(sliderPos.value * tabWidth, { damping: 20, stiffness: 120 }) }]
    }));

    const handleTabChange = (tab: 'recent' | 'favorites') => {
        setActiveTab(tab);
        sliderPos.value = tab === 'recent' ? 0 : 1;
    };

    useEffect(() => {
        // Listen for new messages to update unread counts
        const channel = supabase
            .channel('unread_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'social_messages'
            }, () => {
                loadUnreadCounts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadUnreadCounts = async () => {
        if (userId) {
            const count = await messageService.getUnreadCountForFriend(userId as string);
            setFriendUnreadCount(count);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchFriendData();
            loadAlias();
            loadUnreadCounts();
        }
    }, [userId]);

    const loadAlias = async () => {
        try {
            const saved = await AsyncStorage.getItem('friend_aliases');
            if (saved && userId) {
                const aliases = JSON.parse(saved);
                if (aliases[userId as string]) {
                    setAlias(aliases[userId as string]);
                }
            }
        } catch (e) {
            console.error('Failed to load alias', e);
        }
    };
    const handleSaveAlias = async () => {
        try {
            const saved = await AsyncStorage.getItem('friend_aliases');
            const aliases = saved ? JSON.parse(saved) : {};
            aliases[userId as string] = tempAlias;
            await AsyncStorage.setItem('friend_aliases', JSON.stringify(aliases));
            setAlias(tempAlias || null);
            setIsEditingAlias(false);
        } catch (e) {
            console.error('Failed to save alias', e);
        }
    };

    const fetchFriendData = async () => {
        try {
            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            setFriendProfile(profile);

            // 2. Fetch Logs
            const { data: allLogs } = await getMealLogs(userId as string);
            const logsData = allLogs || [];

            setLogs(logsData); // Keep all for filtering by tab

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <BlurView intensity={20} tint="light" style={styles.backBtnBlur}>
                            <ChevronLeft size={24} color={theme.colors.text.primary} />
                        </BlurView>
                    </TouchableOpacity>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarWrapper}>
                            <LinearGradient
                                colors={theme.colors.gradients.primary as any}
                                style={styles.avatarBorder}
                            >
                                <View style={styles.avatarContainer}>
                                    {friendProfile?.avatar_url ? (
                                        <Image source={{ uri: friendProfile.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <User size={40} color={theme.colors.text.secondary} />
                                        </View>
                                    )}
                                </View>
                            </LinearGradient>
                            <View style={styles.activeBadge} />
                        </View>

                        <View style={styles.nameRow}>
                            <TouchableOpacity
                                onPress={() => {
                                    setTempAlias(alias || friendProfile?.nickname || '');
                                    setIsEditingAlias(true);
                                }}
                            >
                                <Text style={styles.profileName}>{alias || friendProfile?.nickname || 'Friend'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.chatIconBtn}
                                onPress={() => setIsGeneralChatVisible(true)}
                            >
                                <MessageCircle size={24} color={theme.colors.primary} />
                                {friendUnreadCount > 0 && (
                                    <View style={styles.badgeContainer}>
                                        <Text style={styles.badgeText}>{friendUnreadCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>


                    </View>

                    <View style={styles.tabContainer}>
                        <Animated.View style={[styles.tabIndicator, animatedSliderStyle, { width: tabWidth }]} />
                        <TouchableOpacity
                            onPress={() => handleTabChange('recent')}
                            style={styles.tabBtn}
                            activeOpacity={0.7}
                        >
                            <Calendar size={14} color={activeTab === 'recent' ? '#fff' : theme.colors.text.muted} style={{ marginRight: 6 }} />
                            <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
                                {language === 'Korean' ? '최근 식단' : 'Recent Meal'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleTabChange('favorites')}
                            style={styles.tabBtn}
                            activeOpacity={0.7}
                        >
                            <Heart size={14} color={activeTab === 'favorites' ? '#fff' : theme.colors.text.muted} fill={activeTab === 'favorites' ? '#fff' : 'none'} style={{ marginRight: 6 }} />
                            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
                                {language === 'Korean' ? '추천 식단' : 'Thumbs Up'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {(() => {
                        const fourteenDaysAgo = new Date();
                        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

                        const filteredLogs = activeTab === 'recent'
                            ? logs.filter(l => new Date(l.created_at) >= fourteenDaysAgo)
                            : logs.filter(l => l.is_favorite == true || l.is_favorite === 'true' || l.is_favorite === 1);

                        if (filteredLogs.length === 0) {
                            return (
                                <BlurView intensity={20} tint="light" style={styles.emptyCard}>
                                    <Calendar size={48} color={theme.colors.text.muted} />
                                    <Text style={styles.emptyText}>
                                        {activeTab === 'recent'
                                            ? (language === 'Korean' ? '최근 14일간 기록이 없습니다' : 'No meals in the last 14 days')
                                            : (language === 'Korean' ? '추천된 식단이 없습니다' : 'No Thumbs Up meals found')}
                                    </Text>
                                </BlurView>
                            );
                        }

                        return filteredLogs.map((log) => (
                            <BlurView key={log.id} intensity={40} tint="light" style={styles.mealCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.headerLeft}>
                                        <View style={styles.typeBadge}>
                                            <Text style={styles.typeText}>
                                                {language === 'Korean' && log.meal_type === 'Breakfast' ? '아침' :
                                                    language === 'Korean' && log.meal_type === 'Lunch' ? '점심' :
                                                        language === 'Korean' && log.meal_type === 'Dinner' ? '저녁' :
                                                            language === 'Korean' && log.meal_type === 'Snack' ? '간식' : log.meal_type}
                                            </Text>
                                        </View>
                                        <Text style={styles.timeText}>
                                            {new Date(log.created_at).toLocaleDateString(language === 'Korean' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.mealMain}>
                                    <TouchableOpacity style={styles.imageBox} onPress={() => log.image_url && setZoomImage(log.image_url)}>
                                        {log.image_url ? (
                                            <>
                                                <Image source={{ uri: log.image_url }} style={styles.mealImg} />
                                                <View style={styles.zoomIcon}><ZoomIn size={12} color="#fff" /></View>
                                            </>
                                        ) : (
                                            <View style={styles.imgPlaceholder}><Text style={{ fontSize: 24 }}>🍱</Text></View>
                                        )}
                                    </TouchableOpacity>

                                    <View style={styles.mealInfo}>
                                        <Text style={styles.mealName} numberOfLines={1}>{log.food_name}</Text>
                                        <View style={styles.scoreRow}>
                                            <View style={[styles.scoreDot, { backgroundColor: log.health_score >= 7 ? theme.colors.primary : (log.health_score >= 4 ? theme.colors.secondary : '#ef4444') }]} />
                                            <Text style={styles.scoreText}>{language === 'Korean' ? '건강 점수' : 'METABOLIC SCORE'}: {log.health_score}/10</Text>
                                        </View>
                                        {(log.place_name || log.address) && (
                                            <TouchableOpacity
                                                style={styles.locationRow}
                                                onPress={() => {
                                                    const query = encodeURIComponent(log.place_name || log.address);
                                                    const url = Platform.select({
                                                        ios: `maps:0,0?q=${query}`,
                                                        android: `https://www.google.com/maps/search/?api=1&query=${query}`
                                                    });
                                                    if (url) Linking.openURL(url);
                                                }}
                                            >
                                                <MapPin size={12} color={theme.colors.primary} />
                                                <Text style={styles.locationText} numberOfLines={1}>
                                                    {log.place_name || log.address}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
                                            <TouchableOpacity
                                                style={styles.chatEntryBtn}
                                                onPress={() => setActiveChatMeal(log)}
                                            >
                                                <View style={styles.chatIconWrapper}>
                                                    <MessageCircle size={16} color={theme.colors.primary} />
                                                </View>
                                                <Text style={styles.chatBtnText}>
                                                    {t('chatWithFood') || 'Chat with food'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.macroStrip}>
                                    <View style={styles.macroTile}><Flame size={12} color={theme.colors.secondary} /><Text style={styles.macroVal}>{log.calories} <Text style={styles.macroUnit}>kcal</Text></Text></View>
                                    <View style={styles.macroTile}><Zap size={12} color={theme.colors.primary} /><Text style={styles.macroVal}>{log.protein} <Text style={styles.macroUnit}>g</Text></Text></View>
                                    <View style={styles.macroTile}><BarChart2 size={12} color="#818cf8" /><Text style={styles.macroVal}>{log.fat} <Text style={styles.macroUnit}>g</Text></Text></View>
                                    <View style={styles.macroTile}><ArrowUp size={12} color="#ec4899" /><Text style={styles.macroVal}>{log.carbs} <Text style={styles.macroUnit}>g</Text></Text></View>
                                </View>

                                {log.description && (
                                    <Text style={styles.description}>
                                        {language === 'Korean' && log.description_ko ? log.description_ko : log.description}
                                    </Text>
                                )}
                            </BlurView>
                        ));
                    })()}

                    <View style={{ height: 60 }} />
                </ScrollView>
                <ImageView
                    images={zoomImage ? [{ uri: zoomImage }] : []}
                    imageIndex={0}
                    visible={!!zoomImage}
                    onRequestClose={() => setZoomImage(null)}
                />

                <MealChatModal
                    isVisible={!!activeChatMeal || isGeneralChatVisible}
                    onClose={() => {
                        setActiveChatMeal(null);
                        setIsGeneralChatVisible(false);
                        loadUnreadCounts();
                    }}
                    meal={activeChatMeal}
                    otherUserId={userId as string}
                    otherUserNickname={alias || friendProfile?.nickname || (language === 'Korean' ? '친구' : 'Friend')}
                />

                <Modal
                    visible={isEditingAlias}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsEditingAlias(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setIsEditingAlias(false)}
                    >
                        <View style={styles.aliasModal}>
                            <Text style={styles.aliasTitle}>{language === 'Korean' ? '별명 변경' : 'Change Nickname'}</Text>
                            <TextInput
                                style={styles.aliasInput}
                                value={tempAlias}
                                onChangeText={setTempAlias}
                                placeholder={language === 'Korean' ? '이름 입력' : 'Enter name'}
                                placeholderTextColor={theme.colors.text.muted}
                                autoFocus
                            />
                            <View style={styles.aliasActions}>
                                <TouchableOpacity style={styles.aliasCancel} onPress={() => setIsEditingAlias(false)}>
                                    <Text style={styles.aliasCancelText}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.aliasSave} onPress={handleSaveAlias}>
                                    <Text style={styles.aliasSaveText}>{t('save')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    backBtn: { borderRadius: 12, overflow: 'hidden' },
    backBtnBlur: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    scrollContent: { padding: 24, paddingTop: 0 },
    profileSection: { alignItems: 'center', marginBottom: 8 },
    avatarWrapper: { position: 'relative', marginBottom: 8 },
    avatarBorder: { padding: 2, borderRadius: 34 },
    avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.background.secondary, overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    activeBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.primary, borderWidth: 2, borderColor: theme.colors.background.primary },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    profileName: { fontSize: 18, fontWeight: '900', color: theme.colors.text.primary },
    chatIconBtn: { position: 'relative', padding: 4 },
    badgeContainer: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.background.primary },
    badgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
    chatEntryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    chatIconWrapper: { position: 'relative' },
    unreadBadge: { position: 'absolute', top: -6, right: -8, backgroundColor: '#ef4444', minWidth: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, borderWidth: 1, borderColor: theme.colors.background.primary },
    unreadText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
    chatBtnText: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
    sectionHeader: { marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    sectionSub: { fontSize: 12, color: theme.colors.text.muted, marginTop: 2 },
    mealCard: { borderRadius: 28, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    typeText: { fontSize: 10, fontWeight: '900', color: theme.colors.text.secondary, textTransform: 'uppercase' },
    timeText: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '600' },
    mealMain: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    imageBox: { width: 70, height: 70, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative' },
    mealImg: { width: '100%', height: '100%' },
    imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    zoomIcon: { position: 'absolute', right: 4, bottom: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: 3 },
    mealInfo: { flex: 1, justifyContent: 'center' },
    mealName: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 4 },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    scoreDot: { width: 6, height: 6, borderRadius: 3 },
    scoreText: { fontSize: 10, fontWeight: '800', color: theme.colors.text.secondary, letterSpacing: 0.5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingVertical: 2 },
    locationText: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: '600', flex: 1 },
    macroStrip: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    macroTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    macroVal: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary, marginTop: 4 },
    macroUnit: { fontSize: 9, color: theme.colors.text.secondary, fontWeight: '600' },
    description: { fontSize: 12, color: theme.colors.text.secondary, fontStyle: 'italic', lineHeight: 18 },
    emptyCard: { padding: 48, borderRadius: 32, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    emptyText: { color: theme.colors.text.muted, fontSize: 15, marginTop: 12, fontWeight: '600', textAlign: 'center' },
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.glass.border, position: 'relative', height: 52 },
    tabIndicator: { position: 'absolute', top: 4, left: 4, bottom: 4, backgroundColor: theme.colors.primary, borderRadius: 16, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', zIndex: 1 },
    tabText: { fontSize: 14, fontWeight: '700', color: theme.colors.text.muted },
    tabTextActive: { color: theme.colors.text.primary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    aliasModal: { width: '100%', backgroundColor: theme.colors.background.secondary, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.glass.border },
    aliasTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 8 },
    aliasSub: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 20 },
    aliasInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: theme.colors.text.primary, fontSize: 16, borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: 24 },
    aliasActions: { flexDirection: 'row', gap: 12 },
    aliasCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    aliasCancelText: { color: theme.colors.text.secondary, fontWeight: '700' },
    aliasSave: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.colors.primary },
    aliasSaveText: { color: '#fff', fontWeight: '800' },
});
