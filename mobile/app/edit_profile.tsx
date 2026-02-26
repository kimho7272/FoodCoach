import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, TextInput, ActivityIndicator, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Save, Edit2, X, ChevronRight, User } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';
import { useTranslation } from '../src/lib/i18n';
import { updateProfile } from '../src/lib/auth_service';
import { useAlert } from '../src/context/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { theme } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const { showAlert } = useAlert();
    const [editName, setEditName] = useState('');
    const [editNickname, setEditNickname] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editGender, setEditGender] = useState<'Male' | 'Female' | null>(null);
    const [heightVal, setHeightVal] = useState(170);
    const [weightVal, setWeightVal] = useState(70);
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
    const [feet, setFeet] = useState(5);
    const [inches, setInches] = useState(7);
    const [kcalVal, setKcalVal] = useState(2000);
    const [isManualKcal, setIsManualKcal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [changeOtp, setChangeOtp] = useState('');
    const [isChangeOtpSent, setIsChangeOtpSent] = useState(false);
    const [changingPhone, setChangingPhone] = useState(false);
    const [countryCode, setCountryCode] = useState('+1');
    const [verifyingChange, setVerifyingChange] = useState(false);

    useEffect(() => {
        fetchProfile();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const haptics = await AsyncStorage.getItem('haptics_enabled');
            if (haptics !== null) setHapticsEnabled(JSON.parse(haptics));
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const triggerHaptic = (type: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
        if (hapticsEnabled) {
            Haptics.impactAsync(type);
        }
    };

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                setEditName(profile.full_name || '');
                setEditNickname(profile.nickname || '');
                setEditPhone(profile.phone || '');
                setEditGender((profile.gender as 'Male' | 'Female') || null);
                setHeightVal(profile.height || 170);
                setWeightVal(profile.weight || 70);
                setKcalVal(profile.target_calories || 2000);
                setIsManualKcal(true);
            }
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const finalHeight = heightUnit === 'ft' ? Math.round((feet * 12 + inches) * 2.54) : heightVal;
            const finalWeight = weightUnit === 'lb' ? Math.round(weightVal * 0.453592) : weightVal;
            const cleanPhone = editPhone.replace(/[\s\-\(\)]/g, '');

            const { success } = await updateProfile(user.id, {
                nickname: editNickname,
                phone: cleanPhone,
                gender: editGender,
                height: finalHeight,
                weight: finalWeight,
                target_calories: kcalVal
            });

            if (success) {
                showAlert({ title: t('success'), message: t('profileUpdated'), type: 'success', onConfirm: () => router.back() });
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: "Error", message: "Failed to update profile.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const recommendKcal = () => {
        const h = heightUnit === 'ft' ? Math.round((feet * 12 + inches) * 2.54) : heightVal;
        const w = weightUnit === 'lb' ? Math.round(weightVal * 0.453592) : weightVal;
        const recommended = Math.round(w * 30 / 50) * 50;
        setKcalVal(recommended);
        setIsManualKcal(false);
        triggerHaptic();
    };

    const handleFormatNewPhone = (text: string) => {
        let cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (countryCode === '+82') {
            if (cleaned.length > 3 && cleaned.length <= 7) formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
            else if (cleaned.length > 7) formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
        } else {
            if (cleaned.length > 3 && cleaned.length <= 6) formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
            else if (cleaned.length > 6) formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
        setNewPhone(formatted);
    };

    const handleSendChangeOtp = async () => {
        if (!newPhone) return;
        setChangingPhone(true);
        triggerHaptic();
        try {
            const cleanPhone = newPhone.replace(/\D/g, '');
            let finalPhone = cleanPhone;
            if (countryCode === '+82' && finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
            const fullPhone = `${countryCode}${finalPhone}`;

            const { error } = await supabase.auth.updateUser({ phone: fullPhone });
            if (error) throw error;

            setIsChangeOtpSent(true);
            showAlert({ title: t('success'), message: t('otpSent'), type: 'success' });
        } catch (e: any) {
            showAlert({ title: "Error", message: e.message || "Failed to send code.", type: 'error' });
        } finally {
            setChangingPhone(false);
        }
    };

    const handleVerifyChangeOtp = async () => {
        if (!changeOtp || changeOtp.length < 6) return;
        setVerifyingChange(true);
        triggerHaptic();
        try {
            const cleanPhone = newPhone.replace(/\D/g, '');
            let finalPhone = cleanPhone;
            if (countryCode === '+82' && finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
            const fullPhone = `${countryCode}${finalPhone}`;

            const { error } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: changeOtp,
                type: 'phone_change'
            });
            if (error) throw error;

            setEditPhone(fullPhone);
            await (supabase as any).from('profiles').update({ phone: fullPhone }).eq('id', (await supabase.auth.getUser()).data.user?.id);

            setShowPhoneModal(false);
            setNewPhone('');
            setChangeOtp('');
            setIsChangeOtpSent(false);
            showAlert({ title: t('success'), message: t('phoneUpdated'), type: 'success' });
        } catch (e: any) {
            showAlert({ title: "Verification Failed", message: e.message || "Invalid code.", type: 'error' });
        } finally {
            setVerifyingChange(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <ArrowLeft size={24} color={theme.colors.text.primary} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('editProfile')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <BlurView intensity={40} tint="light" style={styles.formCard}>
                        {/* Basic Info */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('fullName')}</Text>
                            <View style={styles.disabledInput}>
                                <Text style={styles.disabledText}>{editName || t('loading')}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('nickname')}</Text>
                            <TextInput
                                style={styles.input}
                                value={editNickname}
                                onChangeText={setEditNickname}
                                placeholder={t('enterNickname') || "Enter nickname"}
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
                            <View style={styles.phoneRow}>
                                <View style={[styles.disabledInput, { flex: 1 }]}>
                                    <Text style={styles.disabledText}>{editPhone}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowPhoneModal(true)} style={styles.editBtn}>
                                    <Edit2 size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Physical Info */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('physicalProfile')}</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{t('gender')}</Text>
                            </View>
                            <View style={styles.toggleRow}>
                                {(['Male', 'Female'] as const).map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => { setEditGender(g); triggerHaptic(); }}
                                        style={[styles.toggleBtn, editGender === g && styles.toggleBtnActive]}
                                    >
                                        <Text style={[styles.toggleBtnText, editGender === g && styles.toggleBtnTextActive]}>{t(g.toLowerCase() as any)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{t('height')}</Text>
                                <View style={styles.unitTabs}>
                                    {(['cm', 'ft'] as const).map(u => (
                                        <TouchableOpacity
                                            key={u}
                                            onPress={() => {
                                                if (heightUnit !== u) {
                                                    setHeightUnit(u);
                                                    triggerHaptic();
                                                    if (u === 'ft') {
                                                        const totalIn = heightVal / 2.54;
                                                        setFeet(Math.floor(totalIn / 12));
                                                        setInches(Math.round(totalIn % 12));
                                                    } else {
                                                        const totalIn = feet * 12 + inches;
                                                        setHeightVal(Math.round(totalIn * 2.54));
                                                    }
                                                }
                                            }}
                                            style={[styles.unitTab, heightUnit === u && styles.unitTabActive]}
                                        >
                                            <Text style={[styles.unitTabText, heightUnit === u && styles.unitTabTextActive]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.adjustWrapper}>
                                {heightUnit === 'cm' ? (
                                    <View style={styles.adjustRow}>
                                        <Text style={styles.adjustValue}>{heightVal} <Text style={styles.adjustUnit}>cm</Text></Text>
                                        <View style={styles.adjustButtons}>
                                            <TouchableOpacity onPress={() => setHeightVal(h => Math.max(100, h - 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                            <TouchableOpacity onPress={() => setHeightVal(h => Math.min(250, h + 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.dualAdjustRow}>
                                        <View style={styles.halfAdjust}>
                                            <Text style={styles.adjustValue}>{feet} <Text style={styles.adjustUnit}>ft</Text></Text>
                                            <View style={styles.miniAdjustButtons}>
                                                <TouchableOpacity onPress={() => setFeet(f => Math.max(3, f - 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                                <TouchableOpacity onPress={() => setFeet(f => Math.min(8, f + 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={styles.halfAdjust}>
                                            <Text style={styles.adjustValue}>{inches} <Text style={styles.adjustUnit}>in</Text></Text>
                                            <View style={styles.miniAdjustButtons}>
                                                <TouchableOpacity onPress={() => setInches(i => Math.max(0, i - 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                                <TouchableOpacity onPress={() => setInches(i => (i >= 11 ? 0 : i + 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{t('weight')}</Text>
                                <View style={styles.unitTabs}>
                                    {(['kg', 'lb'] as const).map(u => (
                                        <TouchableOpacity
                                            key={u}
                                            onPress={() => {
                                                if (weightUnit !== u) {
                                                    setWeightUnit(u);
                                                    triggerHaptic();
                                                    if (u === 'lb') setWeightVal(Math.round(weightVal * 2.20462));
                                                    else setWeightVal(Math.round(weightVal * 0.453592));
                                                }
                                            }}
                                            style={[styles.unitTab, weightUnit === u && styles.unitTabActive]}
                                        >
                                            <Text style={[styles.unitTabText, weightUnit === u && styles.unitTabTextActive]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View style={styles.adjustRow}>
                                <Text style={styles.adjustValue}>{weightVal} <Text style={styles.adjustUnit}>{weightUnit}</Text></Text>
                                <View style={styles.adjustButtons}>
                                    <TouchableOpacity onPress={() => setWeightVal(w => Math.max(20, w - 1))} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setWeightVal(w => w + 1)} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{t('dailyCalorieGoal')}</Text>
                                <TouchableOpacity onPress={recommendKcal} style={styles.aiRecommendBtn}>
                                    <Text style={styles.aiRecommendText}>✨ {t('aiRecommend')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.adjustRow}>
                                <Text style={styles.adjustValue}>{kcalVal} <Text style={styles.adjustUnit}>kcal</Text></Text>
                                <View style={styles.adjustButtons}>
                                    <TouchableOpacity onPress={() => { setKcalVal(k => Math.max(500, k - 50)); setIsManualKcal(true); }} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setKcalVal(k => k + 50); setIsManualKcal(true); }} style={styles.miniAdjustBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                            onPress={handleUpdateProfile}
                            disabled={saving}
                        >
                            <LinearGradient
                                colors={theme.colors.gradients.primary as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveGradient}
                            >
                                {saving ? (
                                    <ActivityIndicator color={theme.colors.text.inverse} />
                                ) : (
                                    <>
                                        <Save size={20} color={theme.colors.text.inverse} />
                                        <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Phone Change Modal */}
            <Modal visible={showPhoneModal} animationType="fade" transparent>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPhoneModal(false)} />
                </BlurView>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isChangeOtpSent ? t('verifyCode') : t('changePhone')}</Text>
                            <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                                <X size={24} color={theme.colors.text.muted} />
                            </TouchableOpacity>
                        </View>

                        {!isChangeOtpSent ? (
                            <View>
                                <View style={styles.phoneInputRow}>
                                    <View style={styles.countryBtn}>
                                        <Text style={styles.countryText}>{countryCode}</Text>
                                    </View>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="(201) 555-0123"
                                        placeholderTextColor={theme.colors.text.muted}
                                        value={newPhone}
                                        onChangeText={handleFormatNewPhone}
                                        keyboardType="phone-pad"
                                        autoFocus
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.modalActionBtn, !newPhone && { opacity: 0.5 }]}
                                    onPress={handleSendChangeOtp}
                                    disabled={!newPhone || changingPhone}
                                >
                                    {changingPhone ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalActionText}>{t('sendCode')}</Text>}
                                </TouchableOpacity>
                                <Text style={styles.smsDisclaimer}>{t('smsDisclaimer')}</Text>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.otpSentDesc}>
                                    {t('otpSentDesc') || `Verification code sent to ${newPhone}`}
                                </Text>
                                <TextInput
                                    style={styles.otpInput}
                                    placeholder="000000"
                                    placeholderTextColor={theme.colors.text.muted}
                                    value={changeOtp}
                                    onChangeText={setChangeOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                />
                                <TouchableOpacity
                                    style={[styles.modalActionBtn, changeOtp.length < 6 && { opacity: 0.5 }]}
                                    onPress={handleVerifyChangeOtp}
                                    disabled={changeOtp.length < 6 || verifyingChange}
                                >
                                    {verifyingChange ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalActionText}>{t('verifyCode')}</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </BlurView>
                </View>
            </Modal >
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backButton: {},
    iconBlur: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    scrollContent: { padding: 24, paddingTop: 12 },
    formCard: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    sectionHeader: { marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.text.secondary, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.glass.border },
    disabledInput: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    disabledText: { fontSize: 16, color: theme.colors.text.secondary },
    phoneRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    editBtn: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    divider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: 8, marginBottom: 24 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    toggleRow: { flexDirection: 'row', gap: 12 },
    toggleBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: theme.colors.glass.border },
    toggleBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: theme.colors.primary },
    toggleBtnText: { fontSize: 15, fontWeight: '600', color: theme.colors.text.secondary },
    toggleBtnTextActive: { color: theme.colors.primary },
    unitTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 2 },
    unitTab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    unitTabActive: { backgroundColor: theme.colors.background.secondary },
    unitTabText: { fontSize: 12, fontWeight: '800', color: theme.colors.text.secondary },
    unitTabTextActive: { color: theme.colors.text.primary },
    adjustWrapper: { marginBottom: 4 },
    adjustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.glass.border },
    dualAdjustRow: { flexDirection: 'row', gap: 12 },
    halfAdjust: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.glass.border },
    adjustValue: { fontSize: 22, fontWeight: '900', color: theme.colors.text.primary },
    adjustUnit: { fontSize: 14, color: theme.colors.text.secondary, fontWeight: '600' },
    adjustButtons: { flexDirection: 'row', gap: 8 },
    miniAdjustButtons: { flexDirection: 'column', gap: 4 },
    miniAdjustBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    miniBtnText: { fontSize: 20, color: theme.colors.primary, fontWeight: '600' },
    aiRecommendBtn: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)' },
    aiRecommendText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },
    saveBtn: { marginTop: 12, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    saveGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 12 },
    saveBtnText: { color: theme.colors.text.inverse, fontSize: 18, fontWeight: '800' },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
    modalContent: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    phoneInputRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    countryBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    countryText: { color: theme.colors.text.primary, fontWeight: '700' },
    modalInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontSize: 18, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.glass.border },
    modalActionBtn: { backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    modalActionText: { color: theme.colors.text.inverse, fontWeight: '800', fontSize: 16 },
    otpSentDesc: { textAlign: 'center', color: theme.colors.text.secondary, marginBottom: 20, fontSize: 14 },
    otpInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 16, textAlign: 'center', fontSize: 28, letterSpacing: 8, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: 20 },
    smsDisclaimer: {
        fontSize: 10,
        color: theme.colors.text.muted,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 14,
        paddingHorizontal: 4,
    },
});
