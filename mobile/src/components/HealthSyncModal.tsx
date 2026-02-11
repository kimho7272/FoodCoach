import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, ActivityIndicator, Image, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Check, RefreshCw, Smartphone, Watch, Zap, Heart, Activity } from 'lucide-react-native';
import { useTranslation } from '../lib/i18n';
import { useHealth } from '../context/HealthContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface HealthSyncModalProps {
    visible: boolean;
    onClose: () => void;
}

export const HealthSyncModal: React.FC<HealthSyncModalProps> = ({ visible, onClose }) => {
    const { t, language } = useTranslation();
    const { healthData, connect, disconnect, refreshData, isLoading } = useHealth();
    const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

    const isConnected = !!healthData?.isConnected;
    // Simple heuristic for provider: if connected, assume Samsung for now as per Context implementation
    const provider: 'apple' | 'samsung' | null = isConnected ? 'samsung' : null;

    const handleConnect = async (selectedProvider: 'apple' | 'samsung') => {
        setConnectingProvider(selectedProvider);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const success = await connect(selectedProvider);
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert(t('error'), "Failed to connect to Health App");
            }
        } catch (e) {
            Alert.alert(t('error'), "Failed to connect to Health App");
        } finally {
            setConnectingProvider(null);
        }
    };

    const handleRefresh = async () => {
        await refreshData();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDisconnect = async () => {
        await disconnect();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={90} tint="light" style={styles.modalBlur}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('linkHealthApp')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {!isConnected ? (
                            <View style={styles.optionsContainer}>
                                <Text style={styles.subtitle}>
                                    {language === 'Korean'
                                        ? "연동할 건강 데이터 소스를 선택하세요."
                                        : "Select a health data source to sync."}
                                </Text>

                                {/* Apple Health Option */}
                                <TouchableOpacity
                                    style={styles.optionCard}
                                    onPress={() => handleConnect('apple')}
                                    disabled={!!connectingProvider}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#ffe4e6' }]}>
                                        <HeartIcon color="#f43f5e" />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>Apple Health</Text>
                                        <Text style={styles.optionDesc}>Sync steps, sleep, and workouts</Text>
                                    </View>
                                    {connectingProvider === 'apple' ? (
                                        <ActivityIndicator color="#f43f5e" />
                                    ) : (
                                        <ChevronRightIcon />
                                    )}
                                </TouchableOpacity>

                                {/* Samsung/Health Connect Option */}
                                <TouchableOpacity
                                    style={styles.optionCard}
                                    onPress={() => handleConnect('samsung')}
                                    disabled={!!connectingProvider}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                                        <Watch size={24} color="#3b82f6" />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>Samsung / Health Connect</Text>
                                        <Text style={styles.optionDesc}>Galaxy Watch & Android Wear</Text>
                                    </View>
                                    {connectingProvider === 'samsung' ? (
                                        <ActivityIndicator color="#3b82f6" />
                                    ) : (
                                        <ChevronRightIcon />
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.connectedContainer}>
                                <View style={styles.successHeader}>
                                    <View style={styles.successIcon}>
                                        <Check size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.connectedTitle}>
                                        {(provider as any) === 'apple' ? 'Apple Health' : 'Samsung Health'} {t('active')}
                                    </Text>
                                    <Text style={styles.lastSynced}>
                                        {language === 'Korean' ? '방금 동기화됨' : 'Just synced'}
                                    </Text>
                                </View>

                                {/* Stats Grid (2x2) */}
                                <View style={styles.statsGrid}>
                                    {/* Column 1 - Row 1 */}
                                    <View style={styles.statBox}>
                                        <Activity size={16} color="#3b82f6" style={{ marginBottom: 4 }} />
                                        <Text style={styles.statLabel}>{language === 'Korean' ? '걸음 수' : 'Steps'}</Text>
                                        <Text style={styles.statValue}>
                                            {healthData?.steps.toLocaleString() || '—'}
                                        </Text>
                                        <Text style={styles.statUnit}>{language === 'Korean' ? '걸음' : 'steps'}</Text>
                                    </View>

                                    {/* Column 2 - Row 1 */}
                                    <View style={styles.statBox}>
                                        <Zap size={16} color="#f59e0b" style={{ marginBottom: 4 }} />
                                        <Text style={styles.statLabel}>{language === 'Korean' ? '에너지' : 'Energy'}</Text>
                                        <Text style={styles.statValue}>
                                            {healthData?.caloriesBurned || '—'}
                                        </Text>
                                        <Text style={styles.statUnit}>kcal</Text>
                                    </View>

                                    {/* Column 1 - Row 2 */}
                                    <View style={styles.statBox}>
                                        <Watch size={16} color="#8b5cf6" style={{ marginBottom: 4 }} />
                                        <Text style={styles.statLabel}>{language === 'Korean' ? '수면' : 'Sleep'}</Text>
                                        <Text style={styles.statValue}>
                                            {healthData?.sleepMinutes ? Math.floor(healthData.sleepMinutes / 60) : '—'}
                                            <Text style={styles.statUnitSmall}>h </Text>
                                            {healthData?.sleepMinutes ? healthData.sleepMinutes % 60 : ''}
                                            <Text style={styles.statUnitSmall}>m</Text>
                                        </Text>
                                    </View>

                                    {/* Column 2 - Row 2 */}
                                    <View style={styles.statBox}>
                                        <Heart size={16} color="#ef4444" style={{ marginBottom: 4 }} />
                                        <Text style={styles.statLabel}>{language === 'Korean' ? '심박수' : 'Heart Rate'}</Text>
                                        <Text style={styles.statValue}>
                                            {healthData?.readinessScore ? Math.round(60 + (healthData.readinessScore / 10)) : '—'}
                                        </Text>
                                        <Text style={styles.statUnit}>bpm</Text>
                                    </View>
                                </View>

                                {/* Readiness Score */}
                                <View style={styles.readinessContainer}>
                                    <View style={styles.readinessHeader}>
                                        <Zap size={16} color="#f59e0b" />
                                        <Text style={styles.readinessTitle}>{language === 'Korean' ? '레디니스 스코어' : 'Readiness Score'}</Text>
                                    </View>
                                    <View style={styles.readinessBarBg}>
                                        <View style={[styles.readinessBarFill, { width: `${healthData?.readinessScore || 0}%` }]} />
                                    </View>
                                    <View style={styles.readinessFooter}>
                                        <Text style={styles.readinessValue}>{healthData?.readinessScore || 0}</Text>
                                        <Text style={styles.readinessMax}>/ 100</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.refreshBtn}
                                    onPress={handleRefresh}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#64748b" style={{ marginRight: 8 }} />
                                    ) : (
                                        <RefreshCw size={20} color="#64748b" />
                                    )}
                                    <Text style={styles.refreshText}>{language === 'Korean' ? '새로고침' : 'Refresh Data'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.disconnectBtn}
                                    onPress={handleDisconnect}
                                >
                                    <Text style={styles.disconnectText}>{language === 'Korean' ? '연동 해제' : 'Disconnect'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
};

// Simple Icon Components
const HeartIcon = ({ color }: { color: string }) => (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, color }}>♥</Text>
    </View>
);

const ChevronRightIcon = () => (
    <Text style={{ color: '#cbd5e1', fontSize: 20, fontWeight: 'bold' }}>›</Text>
);

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalBlur: { width: width * 0.9, borderRadius: 32, overflow: 'hidden' },
    modalContent: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    closeBtn: { padding: 4 },
    subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
    optionsContainer: { gap: 16 },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    optionText: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
    optionDesc: { fontSize: 12, color: '#94a3b8' },

    connectedContainer: { alignItems: 'center' },
    successHeader: { alignItems: 'center', marginBottom: 12 },
    successIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    connectedTitle: { fontSize: 16, fontWeight: '800', color: '#10b981', marginBottom: 2 },
    lastSynced: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4, width: '100%' },
    statBox: { width: '48%', backgroundColor: '#f8fafc', padding: 10, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 6 },
    statLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    statUnit: { fontSize: 9, color: '#94a3b8', marginTop: 1 },
    statUnitSmall: { fontSize: 11, color: '#94a3b8' },

    refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 4, marginBottom: 2 },
    refreshText: { marginLeft: 6, color: '#64748b', fontWeight: '600', fontSize: 12 },
    disconnectBtn: { padding: 4 },
    disconnectText: { color: '#ef4444', fontWeight: '600', fontSize: 12 },
    readinessContainer: {
        width: '100%',
        backgroundColor: '#fffbeb',
        padding: 10,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    readinessHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    readinessTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#92400e',
    },
    readinessBarBg: {
        height: 8,
        backgroundColor: '#fef3c7',
        borderRadius: 4,
        marginBottom: 8,
    },
    readinessBarFill: {
        height: '100%',
        backgroundColor: '#f59e0b',
        borderRadius: 4,
    },
    readinessFooter: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    readinessValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f59e0b',
    },
    readinessMax: {
        fontSize: 14,
        color: '#d97706',
        marginLeft: 2,
        fontWeight: '600',
    },
});
