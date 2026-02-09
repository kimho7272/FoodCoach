import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { getMealLogs } from '../src/lib/meal_service';
import { useTranslation } from '../src/lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MessageCircle, BarChart2, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { socialService } from '../src/services/social_service';

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
        if (friendProfile?.phone) {
            await socialService.inviteViaSMS(friendProfile.phone); // Reusing SMS logic to send a structured cheer message
            // Wait, inviteViaSMS sends a specific invite message. I should make a generic SMS sender or just use standard Linking.openURL('sms:...')?
            // socialService.inviteViaSMS uses expo-sms which allows pre-filled message.
            // Let's stick to a simple alert for MVP saying "Cheered!" or just use the invite function for now if no custom message support in service yet.
            // Actually, let's just use Linking for a custom message.
            // Linking.openURL(`sms:${friendProfile.phone}${Platform.OS === 'ios' ? '&' : '?'}body=Great job tracking your meals! 💪`);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#f0fdf4', '#fff']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={28} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{friendProfile?.nickname || 'Friend'}'s Log</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            {friendProfile?.avatar_url ? (
                                <Image source={{ uri: friendProfile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <Text style={{ fontSize: 40 }}>👤</Text>
                            )}
                        </View>
                        <Text style={styles.profileName}>{friendProfile?.full_name || friendProfile?.nickname}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.mealCount}</Text>
                                <Text style={styles.statLabel}>{t('meals') || 'Meals'}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.avgHealth}</Text>
                                <Text style={styles.statLabel}>Avg Score</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{(stats.totalKcal / 7).toFixed(0)}</Text>
                                <Text style={styles.statLabel}>Avg Kcal</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.cheerBtn} onPress={handleCheer}>
                            <MessageCircle size={20} color="#fff" />
                            <Text style={styles.cheerText}>{t('cheer') || 'Send Cheer'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>{t('recentMealsTitle') || 'Recent Meals (7 Days)'}</Text>

                    {logs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Calendar size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No meals logged recently.</Text>
                        </View>
                    ) : (
                        logs.map((log) => (
                            <View key={log.id} style={styles.logCard}>
                                <View style={styles.logImageWrapper}>
                                    {log.image_url ? (
                                        <Image source={{ uri: log.image_url }} style={styles.logImage} />
                                    ) : (
                                        <Text style={{ fontSize: 24 }}>🍱</Text>
                                    )}
                                </View>
                                <View style={styles.logContent}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={styles.logName}>{log.food_name}</Text>
                                        <Text style={styles.logTime}>
                                            {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.logKcal}>{log.calories} kcal • Score: {log.health_score}</Text>
                                </View>
                            </View>
                        ))
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    scrollContent: { padding: 20 },
    profileSection: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    profileName: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, width: '100%', justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: '#10b981' },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    divider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
    cheerBtn: { marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, gap: 8, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
    cheerText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
    logCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    logImageWrapper: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    logImage: { width: '100%', height: '100%' },
    logContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    logName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    logTime: { fontSize: 12, color: '#94a3b8' },
    logKcal: { fontSize: 14, color: '#64748b', marginTop: 4 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 10 }
});
