import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { getMealLogs } from '../src/lib/meal_service';
import { useTranslation } from '../src/lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, MessageCircle, Calendar, User, Zap, Activity, Heart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function FriendDetailScreen() {
    const { userId } = useLocalSearchParams();
    const router = useRouter();
    const { t, language } = useTranslation();
    const [friendProfile, setFriendProfile] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalKcal: 0, avgHealth: 0, mealCount: 0 });

    useEffect(() => {
        if (userId) {
            fetchFriendData();
        }
    }, [userId]);

    const fetchFriendData = async () => {
        try {
            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            setFriendProfile(profile);

            // 2. Fetch Logs (Last 7 Days)
            const { data: allLogs } = await getMealLogs(userId as string);

            // Filter last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentLogs = (allLogs || []).filter((log: any) =>
                new Date(log.created_at) >= sevenDaysAgo
            );

            setLogs(recentLogs);

            // Calculate Stats
            const totalKcal = recentLogs.reduce((sum: number, log: any) => sum + (log.calories || 0), 0);
            const totalScore = recentLogs.reduce((sum: number, log: any) => sum + (log.health_score || 0), 0);

            setStats({
                totalKcal,
                avgHealth: recentLogs.length > 0 ? Math.round(totalScore / recentLogs.length) : 0,
                mealCount: recentLogs.length
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheer = async () => {
        // Mock cheer functionality or navigation to chat/SMS
        // For now, let's just trigger a toast/alert or similar if implemented
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
                    <Text style={styles.headerTitle}>{friendProfile?.nickname || friendProfile?.full_name || 'Friend'}</Text>
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

                        <Text style={styles.profileName}>{friendProfile?.full_name || friendProfile?.nickname}</Text>

                        <View style={styles.statsRow}>
                            <BlurView intensity={30} tint="light" style={styles.statBox}>
                                <Activity size={18} color={theme.colors.primary} />
                                <Text style={styles.statValue}>{stats.mealCount}</Text>
                                <Text style={styles.statLabel}>{t('meals') || 'Meals'}</Text>
                            </BlurView>
                            <BlurView intensity={30} tint="light" style={styles.statBox}>
                                <Heart size={18} color={theme.colors.danger} />
                                <Text style={styles.statValue}>{stats.avgHealth}</Text>
                                <Text style={styles.statLabel}>Avg Score</Text>
                            </BlurView>
                            <BlurView intensity={30} tint="light" style={styles.statBox}>
                                <Zap size={18} color={theme.colors.accent} />
                                <Text style={styles.statValue}>{(stats.totalKcal / 7).toFixed(0)}</Text>
                                <Text style={styles.statLabel}>Avg Kcal</Text>
                            </BlurView>
                        </View>

                        <TouchableOpacity style={styles.cheerBtn} onPress={handleCheer}>
                            <LinearGradient
                                colors={theme.colors.gradients.primary as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.cheerGradient}
                            >
                                <MessageCircle size={20} color={theme.colors.text.inverse} />
                                <Text style={styles.cheerText}>{t('cheer') || 'Send Cheer'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('recentMealsTitle') || 'Recent Activity'}</Text>
                        <Text style={styles.sectionSub}>Past 7 Days</Text>
                    </View>

                    {logs.length === 0 ? (
                        <BlurView intensity={20} tint="light" style={styles.emptyCard}>
                            <Calendar size={48} color={theme.colors.text.muted} />
                            <Text style={styles.emptyText}>No recent activity shared</Text>
                        </BlurView>
                    ) : (
                        logs.map((log) => (
                            <BlurView key={log.id} intensity={40} tint="light" style={styles.logCard}>
                                <View style={styles.logImageWrapper}>
                                    {log.image_url ? (
                                        <Image source={{ uri: log.image_url }} style={styles.logImage} />
                                    ) : (
                                        <LinearGradient
                                            colors={['#334155', '#1e293b']}
                                            style={styles.logImagePlaceholder}
                                        >
                                            <Activity size={24} color={theme.colors.text.muted} />
                                        </LinearGradient>
                                    )}
                                    <View style={styles.scoreBadge}>
                                        <Text style={styles.scoreText}>{log.health_score}</Text>
                                    </View>
                                </View>
                                <View style={styles.logContent}>
                                    <View style={styles.logHeader}>
                                        <Text style={styles.logName} numberOfLines={1}>{log.food_name}</Text>
                                        <Text style={styles.logTime}>
                                            {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <View style={styles.logDetails}>
                                        <View style={styles.kcalBadge}>
                                            <Text style={styles.kcalText}>{log.calories} kcal</Text>
                                        </View>
                                        <Text style={styles.mealType}>{log.meal_type}</Text>
                                    </View>
                                </View>
                            </BlurView>
                        ))
                    )}

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { borderRadius: 12, overflow: 'hidden' },
    backBtnBlur: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    scrollContent: { padding: 24 },
    profileSection: { alignItems: 'center', marginBottom: 32 },
    avatarWrapper: { position: 'relative', marginBottom: 16 },
    avatarBorder: { padding: 3, borderRadius: 60 },
    avatarContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: theme.colors.background.secondary, overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    activeBadge: { position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary, borderWidth: 3, borderColor: theme.colors.background.primary },
    profileName: { fontSize: 26, fontWeight: '900', color: theme.colors.text.primary, marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' },
    statBox: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    statValue: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginVertical: 4 },
    statLabel: { fontSize: 10, color: theme.colors.text.muted, fontWeight: 'bold', textTransform: 'uppercase' },
    cheerBtn: { marginTop: 24, width: '100%', borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    cheerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    cheerText: { color: theme.colors.text.inverse, fontWeight: '800', fontSize: 16 },
    sectionHeader: { marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    sectionSub: { fontSize: 12, color: theme.colors.text.muted, marginTop: 2 },
    logCard: { flexDirection: 'row', borderRadius: 24, padding: 12, marginBottom: 12, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    logImageWrapper: { width: 70, height: 70, borderRadius: 18, position: 'relative', overflow: 'hidden' },
    logImage: { width: '100%', height: '100%' },
    logImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scoreBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(16, 185, 129, 0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    scoreText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    logContent: { flex: 1, marginLeft: 16 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    logName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, flex: 1, marginRight: 8 },
    logTime: { fontSize: 12, color: theme.colors.text.muted },
    logDetails: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kcalBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    kcalText: { fontSize: 12, color: theme.colors.primary, fontWeight: '700' },
    mealType: { fontSize: 12, color: theme.colors.text.muted },
    emptyCard: { padding: 48, borderRadius: 32, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    emptyText: { color: theme.colors.text.muted, fontSize: 15, marginTop: 12, fontWeight: '600' }
});
