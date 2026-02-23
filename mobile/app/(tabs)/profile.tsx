import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, Platform, Modal, TextInput, ActivityIndicator, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Settings, User, Bell, Shield, ChevronRight, LogOut, Camera, Globe, Heart, Activity, Apple, Smartphone, Info, Lock, Trash2, Key } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useTranslation } from '../../src/lib/i18n';
import { useAlert } from '../../src/context/AlertContext';
import { HealthSyncModal } from '../../src/components/HealthSyncModal';
import { useHealth } from '../../src/context/HealthContext';
import { theme } from '../../src/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { t, language, setLanguage } = useTranslation();
    const { showAlert } = useAlert();
    const { healthData } = useHealth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [syncModalVisible, setSyncModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Settings States
    const [notifications, setNotifications] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].uri) {
            uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri: string) => {
        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const filename = `avatars/${user.id}_${Date.now()}.jpg`;
            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type: 'image/jpeg',
            } as any);

            const { data, error } = await supabase.storage
                .from('meal-images') // Reusing meal-images bucket or check if 'avatars' exists
                .upload(filename, formData);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('meal-images')
                .getPublicUrl(filename);

            await (supabase as any)
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            setProfile({ ...profile, avatar_url: publicUrl });
            showAlert({ title: t('success'), message: t('avatarUpdated') || 'Avatar updated!', type: 'success' });
        } catch (error) {
            console.error(error);
            showAlert({ title: t('error'), message: 'Failed to upload image', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        showAlert({
            title: t('logout') || 'Logout',
            message: language === 'Korean' ? '정말 로그아웃 하시겠습니까?' : 'Are you sure you want to logout?',
            type: 'confirm',
            onConfirm: async () => {
                await supabase.auth.signOut();
                router.replace('/login' as any);
            }
        });
    };

    const renderSettingItem = ({ icon: Icon, label, value, subValue, onPress, showArrow = true, color = theme.colors.text.primary }: any) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={[styles.settingLeft, { flex: 2 }]}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Icon size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color }]} numberOfLines={1}>{label}</Text>
                    {subValue && <Text style={styles.settingSubValue} numberOfLines={1}>{subValue}</Text>}
                </View>
            </View>
            <View style={[styles.settingRight, { flex: 1, justifyContent: 'flex-end', gap: 6 }]}>
                {value && (
                    <Text style={[styles.settingValue, { color: theme.colors.primary, fontWeight: '700', fontSize: 13 }]} numberOfLines={1}>
                        {value}
                    </Text>
                )}
                {showArrow && <ChevronRight size={18} color={theme.colors.text.muted} />}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={theme.colors.gradients.background as any}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={theme.colors.gradients.background as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('account') || 'Account'}</Text>
                    </View>

                    {/* Profile Hero */}
                    <BlurView intensity={60} tint="light" style={styles.profileHero}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <User size={40} color={theme.colors.text.secondary} />
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Camera size={14} color="white" />
                            </View>
                            {uploading && (
                                <View style={styles.uploadOverlay}>
                                    <ActivityIndicator color="white" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.profileName}>{profile?.nickname || profile?.full_name || 'User'}</Text>
                        <Text style={styles.profileEmail}>{profile?.email}</Text>

                        <TouchableOpacity
                            style={styles.editProfileBtn}
                            onPress={() => router.push('/edit_profile')}
                        >
                            <Text style={styles.editProfileText}>{t('editProfile') || 'Edit Profile'}</Text>
                        </TouchableOpacity>
                    </BlurView>

                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <BlurView intensity={20} tint="light" style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('bmi') || 'BMI'}</Text>
                            <Text style={styles.statValue}>
                                {profile?.weight && profile?.height ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : '--'}
                            </Text>
                        </BlurView>
                        <BlurView intensity={20} tint="light" style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('height') || 'Height'}</Text>
                            <Text style={styles.statValue}>{profile?.height || '--'}cm</Text>
                        </BlurView>
                        <BlurView intensity={20} tint="light" style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('weight') || 'Weight'}</Text>
                            <Text style={styles.statValue}>{profile?.weight || '--'}kg</Text>
                        </BlurView>
                    </View>

                    {/* Sections */}
                    {/* Ecosystem Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ecosystem</Text>
                        <BlurView intensity={40} tint="light" style={styles.sectionCard}>
                            {renderSettingItem({
                                icon: healthData?.isConnected ? Heart : Activity,
                                label: t('linkHealthApp') || 'Link Health App',
                                subValue: healthData?.isConnected ? (Platform.OS === 'ios' ? 'Apple Health' : 'Samsung Health') : null,
                                value: healthData?.isConnected ? (language === 'Korean' ? '연결됨' : 'Connected') : (t('notConnected') || 'Not Connected'),
                                onPress: () => setSyncModalVisible(true),
                                color: healthData?.isConnected ? theme.colors.primary : theme.colors.text.primary
                            })}
                        </BlurView>
                    </View>

                    {/* Nutrition Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('target') || 'Target'}</Text>
                        <BlurView intensity={40} tint="light" style={styles.sectionCard}>
                            {renderSettingItem({
                                icon: Apple,
                                label: t('fuelingStrategy') || 'Fueling Strategy',
                                subValue: profile?.target_calories ? `${profile.target_calories} kcal` : '1800 kcal',
                                value: 'AI Optimized',
                                onPress: () => router.push('/fueling_strategy')
                            })}
                        </BlurView>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('settings') || 'Settings'}</Text>
                        <BlurView intensity={40} tint="light" style={styles.sectionCard}>
                            <View style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        <Bell size={20} color={theme.colors.text.primary} />
                                    </View>
                                    <Text style={styles.settingLabel}>{t('notifications') || 'Notifications'}</Text>
                                </View>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#334155', true: theme.colors.primary }}
                                    thumbColor="#fff"
                                />
                            </View>
                            <View style={styles.divider} />
                            {renderSettingItem({
                                icon: Globe,
                                label: t('language') || 'Language',
                                value: language,
                                onPress: () => {
                                    const isKorean = language === 'Korean';
                                    showAlert({
                                        title: t('languageModalTitle') || 'Language / 언어',
                                        message: isKorean ? '변경하실 언어를 선택해 주세요.' : 'Select the language you want to use.',
                                        type: 'confirm',
                                        activeButton: isKorean ? 'confirm' : 'cancel',
                                        onConfirm: async () => {
                                            await setLanguage('Korean');
                                        },
                                        onCancel: async () => {
                                            await setLanguage('English');
                                        },
                                        confirmText: '한국어',
                                        cancelText: 'English'
                                    });
                                }
                            })}
                        </BlurView>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('support') || 'Support'}</Text>
                        <BlurView intensity={40} tint="light" style={styles.sectionCard}>
                            {renderSettingItem({
                                icon: Lock,
                                label: t('privacy') || 'Privacy',
                                onPress: () => Linking.openURL('https://food-coach-mu.vercel.app/privacy')
                            })}
                            <View style={styles.divider} />
                            {renderSettingItem({
                                icon: Info,
                                label: 'Version',
                                value: '1.2.5 (Premium)',
                                showArrow: false
                            })}
                        </BlurView>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <LogOut size={20} color={theme.colors.danger} />
                        <Text style={styles.logoutText}>{t('logout') || 'Logout'}</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>

            <HealthSyncModal
                visible={syncModalVisible}
                onClose={() => setSyncModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text.primary },
    settingsBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.glass.border },
    profileHero: { margin: 24, marginTop: 0, padding: 32, borderRadius: 40, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.background.secondary, justifyContent: 'center', alignItems: 'center' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, padding: 8, borderRadius: 20, borderWidth: 3, borderColor: theme.colors.background.primary },
    uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    profileName: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 4 },
    profileEmail: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 20 },
    editProfileBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.colors.glass.border },
    editProfileText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 },
    statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
    statBox: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    statLabel: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary },
    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 8 },
    sectionCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    settingLeft: { flexDirection: 'row', alignItems: 'center' },
    settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
    settingSubValue: { fontSize: 11, color: theme.colors.text.muted, marginTop: 1, fontWeight: '600' },
    settingRight: { flexDirection: 'row', alignItems: 'center' },
    settingValue: { color: theme.colors.text.primary, fontSize: 14 },
    divider: { height: 1, backgroundColor: theme.colors.glass.border, marginLeft: 68 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 40, gap: 8, paddingVertical: 16 },
    logoutText: { color: theme.colors.danger, fontWeight: 'bold', fontSize: 16 },
    poweredBy: { fontSize: 12, color: theme.colors.text.muted, textAlign: 'center', marginTop: 20, marginBottom: 40 }
});
