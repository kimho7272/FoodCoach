import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, Platform, Modal, TextInput, ActivityIndicator, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Bell, LogOut, ChevronRight, Award, ShieldCheck, Heart, Zap, Save, X, Globe, Smartphone, Camera, Lock, Trash2, Key, Info, Watch } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getPreferences, savePreferences, runProactiveAgent, UserPreferences } from '../../src/lib/proactive_agent';
import { useTranslation } from '../../src/lib/i18n';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTour } from '../../src/context/TourContext';
import { useAlert } from '../../src/context/AlertContext';
import { TourTarget } from '../../src/components/TourTarget';

import { HealthSyncModal } from '../../src/components/HealthSyncModal';

import { useFocusEffect } from 'expo-router';

const { width, height: screenHeight } = Dimensions.get('window');

export type FuelingStrategy = {
    goal: 'steady' | 'peak' | 'weight' | 'muscle';
    calorieTargetType: 'smart' | 'manual';
    manualCalorieTarget: number;
    macroProfile: 'balanced' | 'performance' | 'keto' | 'protein';
    activityLevel: 'sedentary' | 'moderate' | 'elite';
};

const STRATEGY_KEY = 'user_fueling_strategy';
const DEFAULT_STRATEGY: FuelingStrategy = {
    goal: 'steady',
    calorieTargetType: 'smart',
    manualCalorieTarget: 2000,
    macroProfile: 'balanced',
    activityLevel: 'moderate',
};

const GlassItem = ({ icon, title, badge, onPress, isLast = false }: any) => (
    <TouchableOpacity onPress={onPress}>
        <BlurView intensity={40} tint="light" style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.menuIconContainer}>
                {icon}
            </View>
            <Text style={styles.menuTitle}>{title}</Text>
            {badge && (
                <View style={[styles.badge, badge === 'Inactive' && styles.badgeInactive]}>
                    <Text style={[styles.badgeText, badge === 'Inactive' && styles.badgeTextInactive]}>{badge}</Text>
                </View>
            )}
            <ChevronRight size={18} color="#94a3b8" />
        </BlurView>
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showAlert } = useAlert();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
    const [isHealthModalVisible, setIsHealthModalVisible] = useState(false);
    const [strategy, setStrategy] = useState<FuelingStrategy>(DEFAULT_STRATEGY);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const { language, setLanguage, t } = useTranslation();
    const { startTour } = useTour();
    const [notifPrefs, setNotifPrefs] = useState<UserPreferences>({
        lunch_enabled: true,
        lunch_time: { hour: 13, minute: 0 },
        dinner_enabled: true,
        dinner_time: { hour: 19, minute: 0 }
    });

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(profile);
        }
    };

    useEffect(() => {
        fetchProfile();
        loadNotifPrefs();
        loadLanguage();
        loadStrategy();
        loadSettings();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchProfile();
            loadStrategy();
        }, [])
    );

    const loadSettings = async () => {
        try {
            const haptics = await AsyncStorage.getItem('haptics_enabled');
            if (haptics !== null) setHapticsEnabled(JSON.parse(haptics));
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const toggleHaptics = async (value: boolean) => {
        setHapticsEnabled(value);
        if (value) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await AsyncStorage.setItem('haptics_enabled', JSON.stringify(value));
    };

    const triggerHaptic = (type: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
        if (hapticsEnabled) {
            Haptics.impactAsync(type);
        }
    };

    const loadStrategy = async () => {
        try {
            const stored = await AsyncStorage.getItem(STRATEGY_KEY);
            if (stored) setStrategy(JSON.parse(stored));
        } catch (e) {
            console.error("Failed to load strategy", e);
        }
    };

    const handleSaveStrategy = async (newStrategy: FuelingStrategy) => {
        triggerHaptic();
        setStrategy(newStrategy);
        await AsyncStorage.setItem(STRATEGY_KEY, JSON.stringify(newStrategy));
    };

    const loadLanguage = async () => {
        // Handled by LanguageProvider
    };

    const handleSaveLanguage = async (lang: any) => {
        await setLanguage(lang);
        setIsLanguageModalVisible(false);
    };

    const loadNotifPrefs = async () => {
        const prefs = await getPreferences();
        setNotifPrefs(prefs);
    };

    const handleSaveNotifPrefs = async (newPrefs: UserPreferences) => {
        setNotifPrefs(newPrefs);
        await savePreferences(newPrefs);
        await runProactiveAgent();
    };

    const handleLogout = () => {
        showAlert({
            title: t('signOutTitle'),
            message: t('signOutMessage'),
            type: 'confirm',
            confirmText: t('logout'),
            onConfirm: async () => {
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    console.error("Sign out error:", e);
                } finally {
                    // Ensure the alert modal closes smoothly before navigating
                    // Using router.dismissAll() to clear stack history if possible
                    setTimeout(() => {
                        if (router.canGoBack()) {
                            router.dismissAll();
                        }
                        router.replace('/login');
                    }, 500);
                }
            }
        });
    };

    const handleDeleteAccount = async () => {
        showAlert({
            title: t('deleteConfirmTitle'),
            message: t('deleteAccountWarning'),
            type: 'confirm',
            confirmText: t('deleteConfirmBtn'),
            onConfirm: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    // Delete logs
                    await supabase
                        .from('food_logs')
                        .delete()
                        .eq('user_id', user.id);

                    // Delete profile
                    await supabase
                        .from('profiles')
                        .delete()
                        .eq('id', user.id);

                    await supabase.auth.signOut();
                    router.replace('/login');
                } catch (error: any) {
                    showAlert({ title: t('error'), message: error.message, type: 'error' });
                }
            }
        });
    };

    const handleChangePassword = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email);
            if (error) {
                showAlert({ title: t('error'), message: error.message, type: 'error' });
            } else {
                showAlert({
                    title: t('success'),
                    message: language === 'Korean' ? "비밀번호 재설정 이메일이 발송되었습니다." : "Password reset email sent!",
                    type: 'success'
                });
            }
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert({ title: 'Permission Rejected', message: 'We need access to your gallery to change your profile picture.', type: 'error' });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            uploadAvatar(result.assets[0].base64);
        }
    };

    const uploadAvatar = async (base64: string) => {
        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const fileName = `${user.id}/avatar_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('meal-images')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await fetchProfile();
            showAlert({
                title: t('success'),
                message: language === 'Korean' ? "프로필 사진이 업데이트되었습니다!" : "Profile picture updated!",
                type: 'success'
            });
        } catch (error: any) {
            showAlert({ title: t('failed'), message: error.message, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = () => {
        router.push('/edit_profile');
    };

    const calculateBMI = () => {
        if (!userProfile?.height || !userProfile?.weight) return null;
        const hInM = userProfile.height / 100;
        const bmi = userProfile.weight / (hInM * hInM);
        return bmi.toFixed(1);
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { label: t('underweight'), color: '#3b82f6' };
        if (bmi < 25) return { label: t('healthy'), color: '#10b981' };
        if (bmi < 30) return { label: t('overweight'), color: '#f59e0b' };
        return { label: t('obese'), color: '#ef4444' };
    };

    const bmiValue = calculateBMI();
    const bmiInfo = bmiValue ? getBMICategory(parseFloat(bmiValue)) : null;

    const unitHeight = userProfile?.height ? `${userProfile.height}cm` : '—';
    const unitWeight = userProfile?.weight ? `${userProfile.weight}kg` : '—';

    const handleHealthLink = () => {
        setIsHealthModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fef3c7', '#dcfce7', '#d1fae5', '#e0e7ff', '#fae8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('account')}</Text>
                        <TouchableOpacity style={styles.settingsBtn} onPress={() => setIsSettingsModalVisible(true)}>
                            <Settings size={22} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Hero */}
                    <BlurView intensity={80} tint="light" style={styles.profileHero}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            <View style={styles.avatarInner}>
                                {uploading ? (
                                    <ActivityIndicator color="#10b981" />
                                ) : userProfile?.avatar_url ? (
                                    <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImg} />
                                ) : (
                                    <Text style={styles.avatarEmoji}>🍱</Text>
                                )}
                            </View>
                            <View style={styles.cameraBadge}>
                                <Camera size={14} color="white" />
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.userName}>{userProfile?.full_name || 'Foodie Explorer'}</Text>
                        <Text style={styles.userNickname}>@{userProfile?.nickname || 'foodie'}</Text>
                        <Text style={styles.userEmail}>{userProfile?.email || 'foodie@example.com'}</Text>

                        {bmiValue && (
                            <View style={[styles.bmiBadge, { backgroundColor: bmiInfo?.color + '20' }]}>
                                <Text style={[styles.bmiText, { color: bmiInfo?.color }]}>BMI {bmiValue} • {bmiInfo?.label}</Text>
                            </View>
                        )}

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{unitHeight}</Text>
                                <Text style={styles.statLabel}>{t('height')}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{unitWeight}</Text>
                                <Text style={styles.statLabel}>{t('weight')}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{userProfile?.target_calories || 2000}</Text>
                                <Text style={styles.statLabel}>kcal</Text>
                            </View>
                        </View>
                    </BlurView>

                    {/* Menu Sections */}
                    <Text style={styles.sectionLabel}>{t('personalInfo').toUpperCase()}</Text>
                    <View style={styles.menuContainer}>
                        <GlassItem
                            icon={<User size={20} color="#10b981" />}
                            title={t('editProfile')}
                            onPress={() => router.push('/edit_profile')}
                        />
                        <GlassItem
                            icon={<ShieldCheck size={20} color="#6366f1" />}
                            title={t('privacySecurity')}
                            isLast
                            onPress={() => setIsPrivacyModalVisible(true)}
                        />
                    </View>

                    <Text style={styles.sectionLabel}>{language === 'Korean' ? '생태계' : 'ECOSYSTEM'}</Text>
                    <View style={styles.menuContainer}>
                        <GlassItem
                            icon={<Smartphone size={20} color="#10b981" />}
                            title={t('linkHealthApp')}
                            onPress={() => setIsHealthModalVisible(true)}
                        />
                        <GlassItem
                            icon={<Heart size={20} color="#ef4444" />}
                            title={t('metabolicGuide')}
                            onPress={() => router.push('/metabolic_report')}
                        />
                        <TourTarget id="strategy_item">
                            <GlassItem
                                icon={<Zap size={20} color="#f59e0b" />}
                                title={t('fuelingStrategy')}
                                isLast
                                onPress={() => router.push('/fueling_strategy')}
                            />
                        </TourTarget>
                    </View>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <LogOut size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>{t('logout')}</Text>
                    </TouchableOpacity>


                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>



            <HealthSyncModal
                visible={isHealthModalVisible}
                onClose={() => setIsHealthModalVisible(false)}
            />
            {/* Notification Settings Modal */}
            <Modal
                visible={isNotificationModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsNotificationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('notifications')}</Text>
                                <TouchableOpacity onPress={() => setIsNotificationModalVisible(false)}>
                                    <X size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Lunch Reminder */}
                                <View style={styles.notifSection}>
                                    <View style={styles.notifRow}>
                                        <View>
                                            <Text style={styles.notifTitle}>🍛 {t('lunchReminder')}</Text>
                                            <Text style={styles.notifSub}>{t('lunchSub')}</Text>
                                        </View>
                                        <Switch
                                            value={notifPrefs.lunch_enabled}
                                            onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, lunch_enabled: val })}
                                            trackColor={{ false: '#e2e8f0', true: '#d1fae5' }}
                                            thumbColor={notifPrefs.lunch_enabled ? '#10b981' : '#94a3b8'}
                                        />
                                    </View>

                                    {notifPrefs.lunch_enabled && (
                                        <View style={styles.timeAdjustmentRow}>
                                            <View style={styles.timeBlock}>
                                                <TouchableOpacity onPress={() => {
                                                    let newHour = notifPrefs.lunch_time.hour - 1;
                                                    if (newHour < 0) newHour = 23;
                                                    handleSaveNotifPrefs({ ...notifPrefs, lunch_time: { ...notifPrefs.lunch_time, hour: newHour } });
                                                }} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                <Text style={styles.timeValue}>{String(notifPrefs.lunch_time.hour).padStart(2, '0')}</Text>
                                                <TouchableOpacity onPress={() => {
                                                    let newHour = (notifPrefs.lunch_time.hour + 1) % 24;
                                                    handleSaveNotifPrefs({ ...notifPrefs, lunch_time: { ...notifPrefs.lunch_time, hour: newHour } });
                                                }} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                            </View>
                                            <Text style={styles.timeColon}>:</Text>
                                            <View style={styles.timeBlock}>
                                                <TouchableOpacity onPress={() => {
                                                    let newMin = notifPrefs.lunch_time.minute - 15;
                                                    if (newMin < 0) newMin = 45;
                                                    handleSaveNotifPrefs({ ...notifPrefs, lunch_time: { ...notifPrefs.lunch_time, minute: newMin } });
                                                }} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                <Text style={styles.timeValue}>{String(notifPrefs.lunch_time.minute).padStart(2, '0')}</Text>
                                                <TouchableOpacity onPress={() => {
                                                    let newMin = (notifPrefs.lunch_time.minute + 15) % 60;
                                                    handleSaveNotifPrefs({ ...notifPrefs, lunch_time: { ...notifPrefs.lunch_time, minute: newMin } });
                                                }} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Dinner Reminder */}
                                <View style={styles.notifSection}>
                                    <View style={styles.notifRow}>
                                        <View>
                                            <Text style={styles.notifTitle}>🥗 {t('dinnerReminder')}</Text>
                                            <Text style={styles.notifSub}>{t('dinnerSub')}</Text>
                                        </View>
                                        <Switch
                                            value={notifPrefs.dinner_enabled}
                                            onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, dinner_enabled: val })}
                                            trackColor={{ false: '#e2e8f0', true: '#d1fae5' }}
                                            thumbColor={notifPrefs.dinner_enabled ? '#10b981' : '#94a3b8'}
                                        />
                                    </View>

                                    {notifPrefs.dinner_enabled && (
                                        <View style={styles.timeAdjustmentRow}>
                                            <View style={styles.timeBlock}>
                                                <TouchableOpacity onPress={() => {
                                                    let newHour = notifPrefs.dinner_time.hour - 1;
                                                    if (newHour < 0) newHour = 23;
                                                    handleSaveNotifPrefs({ ...notifPrefs, dinner_time: { ...notifPrefs.dinner_time, hour: newHour } });
                                                }} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                <Text style={styles.timeValue}>{String(notifPrefs.dinner_time.hour).padStart(2, '0')}</Text>
                                                <TouchableOpacity onPress={() => {
                                                    let newHour = (notifPrefs.dinner_time.hour + 1) % 24;
                                                    handleSaveNotifPrefs({ ...notifPrefs, dinner_time: { ...notifPrefs.dinner_time, hour: newHour } });
                                                }} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                            </View>
                                            <Text style={styles.timeColon}>:</Text>
                                            <View style={styles.timeBlock}>
                                                <TouchableOpacity onPress={() => {
                                                    let newMin = notifPrefs.dinner_time.minute - 15;
                                                    if (newMin < 0) newMin = 45;
                                                    handleSaveNotifPrefs({ ...notifPrefs, dinner_time: { ...notifPrefs.dinner_time, minute: newMin } });
                                                }} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                <Text style={styles.timeValue}>{String(notifPrefs.dinner_time.minute).padStart(2, '0')}</Text>
                                                <TouchableOpacity onPress={() => {
                                                    let newMin = (notifPrefs.dinner_time.minute + 15) % 60;
                                                    handleSaveNotifPrefs({ ...notifPrefs, dinner_time: { ...notifPrefs.dinner_time, minute: newMin } });
                                                }} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.activeStatusCard}>
                                    <Text style={[styles.statusLabel, { color: notifPrefs.lunch_enabled || notifPrefs.dinner_enabled ? '#10b981' : '#ef4444' }]}>
                                        Status: {notifPrefs.lunch_enabled || notifPrefs.dinner_enabled ? 'Active' : 'Inactive'}
                                    </Text>
                                    <Text style={styles.statusSub}>
                                        {notifPrefs.lunch_enabled || notifPrefs.dinner_enabled
                                            ? "You will receive reminders at scheduled times."
                                            : "All notifications are currently turned off."}
                                    </Text>
                                </View>
                            </ScrollView>
                        </View>
                    </BlurView>
                </View>
            </Modal>
            {/* Language Selection Modal */}
            <Modal
                visible={isLanguageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('languageModalTitle')}</Text>
                                <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                                    <X size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.langList}>
                                {[
                                    { label: 'English', value: 'English', sub: 'Default System Language' },
                                    { label: '한국어', value: 'Korean', sub: '한국어 언어 팩 지원' }
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[styles.langItem, language === item.value && styles.langItemActive]}
                                        onPress={() => handleSaveLanguage(item.value)}
                                    >
                                        <View>
                                            <Text style={[styles.langLabel, language === item.value && styles.langLabelActive]}>{item.label}</Text>
                                            <Text style={styles.langSub}>{item.sub}</Text>
                                        </View>
                                        {language === item.value && <Zap size={20} color="#10b981" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </BlurView>
                </View>
            </Modal>

            {/* Privacy & Security Modal */}
            <Modal
                visible={isPrivacyModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsPrivacyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('privacySecurity')}</Text>
                                <TouchableOpacity onPress={() => setIsPrivacyModalVisible(false)}>
                                    <X size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Data Security Section */}
                                <View style={styles.notifSection}>
                                    <View style={styles.notifRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.notifTitle}>{t('dataSecurity')}</Text>
                                            <Text style={styles.notifSub}>{t('dataSecurityDesc')}</Text>
                                        </View>
                                        <ShieldCheck size={24} color="#10b981" />
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8 }}>
                                        <Lock size={14} color="#10b981" />
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#10b981' }}>{t('dataEncryptionDetail')}</Text>
                                    </View>
                                </View>

                                {/* App Permissions */}
                                <Text style={styles.inputLabel}>{t('appPermissions')}</Text>
                                <View style={styles.menuContainer}>
                                    <View style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }]}>
                                        <Camera size={20} color="#64748b" />
                                        <Text style={[styles.menuTitle, { marginLeft: 16 }]}>{t('cameraAccess')}</Text>
                                        <Text style={styles.badgeText}>{t('active')}</Text>
                                    </View>
                                    <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                                        <Bell size={20} color="#64748b" />
                                        <Text style={[styles.menuTitle, { marginLeft: 16 }]}>{t('notificationAccess')}</Text>
                                        <Text style={styles.badgeText}>{t('active')}</Text>
                                    </View>
                                </View>

                                {/* Account Actions */}
                                <Text style={styles.inputLabel}>ACCOUNT ACTIONS</Text>
                                <TouchableOpacity
                                    style={[styles.langItem, { marginBottom: 12 }]}
                                    onPress={handleChangePassword}
                                >
                                    <Key size={20} color="#3b82f6" />
                                    <Text style={[styles.langLabel, { flex: 1, marginLeft: 16, fontSize: 16 }]}>{t('changePassword')}</Text>
                                    <ChevronRight size={20} color="#94a3b8" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.langItem, { borderColor: '#fee2e2' }]}
                                    onPress={handleDeleteAccount}
                                >
                                    <Trash2 size={20} color="#ef4444" />
                                    <Text style={[styles.langLabel, { flex: 1, marginLeft: 16, fontSize: 16, color: '#ef4444' }]}>{t('deleteAccount')}</Text>
                                    <ChevronRight size={20} color="#94a3b8" />
                                </TouchableOpacity>

                                {/* Legal Links */}
                                <View style={{ marginTop: 24, gap: 12, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => {
                                        triggerHaptic();
                                        showAlert({ title: t('privacyPolicy'), message: "Privacy Policy details...", type: 'info' });
                                    }}>
                                        <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 12 }}>{t('privacyPolicy')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        triggerHaptic();
                                        showAlert({ title: t('termsOfService'), message: "Terms of Service details...", type: 'info' });
                                    }}>
                                        <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 12 }}>{t('termsOfService')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </BlurView>
                </View>
            </Modal>



            {/* Settings Modal */}
            <Modal
                visible={isSettingsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsSettingsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('settingsTitle')}</Text>
                                <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
                                    <X size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* App Preferences */}
                                <Text style={styles.inputLabel}>{t('appPreferences')}</Text>
                                <View style={styles.menuContainer}>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            triggerHaptic();
                                            setIsSettingsModalVisible(false);
                                            setIsNotificationModalVisible(true);
                                        }}
                                    >
                                        <Bell size={20} color="#3b82f6" />
                                        <Text style={[styles.menuTitle, { marginLeft: 16 }]}>{t('notifications')}</Text>
                                        <ChevronRight size={18} color="#94a3b8" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            triggerHaptic();
                                            setIsSettingsModalVisible(false);
                                            setIsLanguageModalVisible(true);
                                        }}
                                    >
                                        <Globe size={20} color="#6366f1" />
                                        <Text style={[styles.menuTitle, { marginLeft: 16 }]}>{t('language')}</Text>
                                        <ChevronRight size={18} color="#94a3b8" />
                                    </TouchableOpacity>

                                    <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.notifTitle}>{t('hapticFeedback')}</Text>
                                            <Text style={styles.notifSub}>{t('hapticDesc')}</Text>
                                        </View>
                                        <Switch
                                            value={hapticsEnabled}
                                            onValueChange={toggleHaptics}
                                            trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                                        />
                                    </View>
                                </View>

                                {/* Support */}
                                <Text style={styles.inputLabel}>{t('supportFeedback')}</Text>
                                <View style={styles.menuContainer}>
                                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                                        triggerHaptic();
                                        Linking.openURL('mailto:foodcoach.dev@gmail.com?subject=Support Request');
                                    }}>
                                        <Info size={20} color="#64748b" />
                                        <Text style={[styles.menuTitle, { marginLeft: 16 }]}>{t('helpCenter')}</Text>
                                        <ChevronRight size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => {
                                        triggerHaptic();
                                        setIsSettingsModalVisible(false);
                                        startTour();
                                    }}>
                                        <Smartphone size={20} color="#10b981" />
                                        <Text style={[styles.menuTitle, { marginLeft: 16 }]}>{t('tutorial')}</Text>
                                        <ChevronRight size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>

                                {/* About */}
                                <Text style={styles.inputLabel}>{t('aboutLegal')}</Text>
                                <View style={styles.menuContainer}>
                                    <View style={styles.menuItem}>
                                        <Text style={[styles.menuTitle, { fontWeight: '600' }]}>{t('appVersion')}</Text>
                                        <Text style={styles.badgeText}>v1.2.5 (Extreme Edition)</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => {
                                        triggerHaptic();
                                        showAlert({
                                            title: t('openSource'),
                                            message: "React Native, Expo, Supabase, Lucide Icons, Expo Blur, NativeWind, and more premium libraries.",
                                            type: 'info'
                                        });
                                    }}>
                                        <Text style={[styles.menuTitle, { fontWeight: '600' }]}>{t('openSource')}</Text>
                                        <ChevronRight size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ alignItems: 'center', marginTop: 12, opacity: 0.5 }}>
                                    <Text style={styles.poweredBy}>{language === 'Korean' ? 'AI 대사 코어 제공' : 'Powered by AI Metabolic Core'}</Text>
                                </View>

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </BlurView>
                </View>
            </Modal >
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
    settingsBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12 },
    profileHero: { borderRadius: 32, padding: 20, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 16 },
    avatarContainer: { marginBottom: 14 },
    avatarInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5, overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarEmoji: { fontSize: 36 },
    cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
    userName: { fontSize: 20, fontWeight: '800', color: '#10b981', marginBottom: 2 },
    userNickname: { fontSize: 15, fontWeight: '700', color: '#1e293b', opacity: 0.8, marginBottom: 2 },
    userEmail: { fontSize: 13, color: '#64748b', fontWeight: 'bold', marginBottom: 8 },
    bmiBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 10 },
    bmiText: { fontSize: 12, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    statLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
    divider: { width: 1, height: '60%', backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'center' },
    sectionLabel: { fontSize: 12, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginLeft: 16, marginBottom: 8 },
    menuContainer: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    menuIconContainer: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    menuTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },
    badge: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
    badgeInactive: { backgroundColor: 'rgba(148,163,184,0.1)' },
    badgeText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
    badgeTextInactive: { color: '#94a3b8' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8, marginTop: 8 },
    logoutText: { fontSize: 15, fontWeight: '800', color: '#ef4444' },
    footerInfo: { alignItems: 'center', marginTop: 24, opacity: 0.5 },
    versionText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    poweredBy: { fontSize: 10, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalBlur: { width: width * 0.9, borderRadius: 32, overflow: 'hidden' },
    modalContent: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
    input: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '700', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
    rowInputs: { flexDirection: 'row', marginBottom: 12 },
    saveBtn: { backgroundColor: '#10b981', borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12, shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    unitToggleRowInline: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
    unitBtnSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    unitBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    unitBtnTextSmall: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
    unitBtnTextActive: { color: '#0f172a' },
    adjustmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    adjustBtn: { width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    adjustBtnText: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
    adjustValue: { fontSize: 18, fontWeight: '800', color: '#10b981' },
    weightCenterRow: { alignItems: 'center', marginBottom: 16 },
    ftInContainer: { flexDirection: 'row', gap: 12 },
    ftInBlock: { flex: 1, alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    ftInValue: { fontSize: 18, fontWeight: '800', color: '#10b981', marginBottom: 8 },
    miniBtnRow: { flexDirection: 'row', gap: 8 },
    miniBtn: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    weightBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stepBtn: { flex: 1, height: 44, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    stepBtnTxt: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
    notifSection: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    notifTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
    notifSub: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    timeAdjustmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 12 },
    timeBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 8, gap: 12 },
    timeValue: { fontSize: 18, fontWeight: '800', color: '#10b981', minWidth: 24, textAlign: 'center' },
    timeColon: { fontSize: 20, fontWeight: '800', color: '#94a3b8' },
    activeStatusCard: { padding: 20, alignItems: 'center' },
    statusLabel: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    statusSub: { fontSize: 12, color: '#64748b', textAlign: 'center', fontWeight: 'bold' },
    langList: { gap: 12 },
    langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    langItemActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    langLabel: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    langLabelActive: { color: '#10b981' },
    langSub: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginTop: 2 }
});
