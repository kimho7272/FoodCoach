import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, TextInput, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Save, Edit2, X } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';
import { useTranslation } from '../src/lib/i18n';
import { updateProfile } from '../src/lib/auth_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
    const router = useRouter();
    const { t, language } = useTranslation();
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

    // Phone Change States
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [changeOtp, setChangeOtp] = useState('');
    const [isChangeOtpSent, setIsChangeOtpSent] = useState(false);
    const [changingPhone, setChangingPhone] = useState(false);
    const [countryCode, setCountryCode] = useState('+1'); // Default to +1 as per user request
    const [verifyingChange, setVerifyingChange] = useState(false);

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
                const h = profile.height || 170;
                const w = profile.weight || 70;
                const kc = profile.target_calories || 2000;
                setHeightVal(h);
                setWeightVal(w);
                setKcalVal(kc);
                setIsManualKcal(true);
            }
        }
    };

    const recommendKcal = () => {
        const h = heightUnit === 'ft' ? Math.round((feet * 12 + inches) * 2.54) : heightVal;
        const w = weightUnit === 'lb' ? Math.round(weightVal * 0.453592) : weightVal;
        const recommended = Math.round(w * 30 / 50) * 50;
        setKcalVal(recommended);
        setIsManualKcal(false);
    };

    useEffect(() => {
        fetchProfile();
        loadSettings();
    }, []);

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
                Alert.alert(t('success'), t('profileUpdated'), [
                    { text: "OK", onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleFormatNewPhone = (text: string) => {
        // Simple formatter logic (Generic)
        let cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (countryCode === '+82') {
            if (cleaned.length > 3 && cleaned.length <= 7) {
                formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
            } else if (cleaned.length > 7) {
                formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
            }
        } else if (countryCode === '+1') {
            if (cleaned.length > 3 && cleaned.length <= 6) {
                formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
            } else if (cleaned.length > 6) {
                formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
            }
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
            if (countryCode === '+82' && finalPhone.startsWith('0')) {
                finalPhone = finalPhone.substring(1);
            }
            const fullPhone = `${countryCode}${finalPhone}`;

            // updateUser with phone triggers OTP sent to the NEW phone
            const { data, error } = await supabase.auth.updateUser({ phone: fullPhone });
            if (error) throw error;

            setIsChangeOtpSent(true);
            Alert.alert(t('success'), t('otpSent'));
        } catch (e: any) {
            console.error(e);
            Alert.alert("Error", e.message || "Failed to send verification code.");
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
            if (countryCode === '+82' && finalPhone.startsWith('0')) {
                finalPhone = finalPhone.substring(1);
            }
            const fullPhone = `${countryCode}${finalPhone}`;

            const { error } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: changeOtp,
                type: 'phone_change'
            });
            if (error) throw error;

            // Update success
            setEditPhone(newPhone); // Update UI
            // Update profile table as well (auth user phone is updated by verifyOtp)
            await (supabase as any).from('profiles').update({ phone: cleanPhone }).eq('id', (await supabase.auth.getUser()).data.user?.id);

            setShowPhoneModal(false);
            setNewPhone('');
            setChangeOtp('');
            setIsChangeOtpSent(false);
            Alert.alert(t('success'), t('phoneUpdated'));
        } catch (e: any) {
            console.error(e);
            Alert.alert("Verification Failed", e.message || "Invalid code.");
        } finally {
            setVerifyingChange(false);
        }
    };

    useEffect(() => {
        if (changeOtp.length === 6 && isChangeOtpSent) {
            handleVerifyChangeOtp();
        }
    }, [changeOtp]);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('editProfile')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('fullName')}</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                editable={false}
                                placeholder={language === 'Korean' ? "이름" : "Full Name"}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('nickname')}</Text>
                            <TextInput
                                style={styles.input}
                                value={editNickname}
                                onChangeText={setEditNickname}
                                placeholder={language === 'Korean' ? "닉네임을 입력하세요" : "Enter your nickname"}
                                placeholderTextColor="#64748b"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TextInput
                                    style={[styles.input, { flex: 1, color: '#94a3b8', backgroundColor: '#e2e8f0' }]}
                                    value={editPhone}
                                    editable={false}
                                />
                                <TouchableOpacity onPress={() => setShowPhoneModal(true)} style={styles.iconBtn}>
                                    <Edit2 size={16} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('gender')}</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => setEditGender('Male')}
                                    style={[styles.genderBtn, editGender === 'Male' && styles.genderBtnActive]}
                                >
                                    <Text style={[styles.genderBtnText, editGender === 'Male' && styles.genderBtnTextActive]}>{t('male')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setEditGender('Female')}
                                    style={[styles.genderBtn, editGender === 'Female' && styles.genderBtnActive]}
                                >
                                    <Text style={[styles.genderBtnText, editGender === 'Female' && styles.genderBtnTextActive]}>{t('female')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{t('height')}</Text>
                                <View style={styles.unitToggleRowInline}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (heightUnit === 'ft') {
                                                setHeightUnit('cm');
                                                const totalIn = feet * 12 + inches;
                                                setHeightVal(Math.round(totalIn * 2.54));
                                            }
                                        }}
                                        style={[styles.unitBtnSmall, heightUnit === 'cm' && styles.unitBtnActive]}
                                    >
                                        <Text style={[styles.unitBtnTextSmall, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (heightUnit === 'cm') {
                                                setHeightUnit('ft');
                                                const totalIn = heightVal / 2.54;
                                                setFeet(Math.floor(totalIn / 12));
                                                setInches(Math.round(totalIn % 12));
                                            }
                                        }}
                                        style={[styles.unitBtnSmall, heightUnit === 'ft' && styles.unitBtnActive]}
                                    >
                                        <Text style={[styles.unitBtnTextSmall, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft/in</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {heightUnit === 'cm' ? (
                                <View style={styles.adjustmentRow}>
                                    <TouchableOpacity onPress={() => setHeightVal(h => Math.max(1, h - 1))} style={styles.adjustBtn}><Text style={styles.adjustBtnText}>-</Text></TouchableOpacity>
                                    <Text style={styles.adjustValue}>{heightVal} cm</Text>
                                    <TouchableOpacity onPress={() => setHeightVal(h => h + 1)} style={styles.adjustBtn}><Text style={styles.adjustBtnText}>+</Text></TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.ftInContainer}>
                                    <View style={styles.ftInBlock}>
                                        <Text style={styles.ftInValue}>{feet} ft</Text>
                                        <View style={styles.miniBtnRow}>
                                            <TouchableOpacity onPress={() => setFeet(f => Math.max(1, f - 1))} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                            <TouchableOpacity onPress={() => setFeet(f => f + 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.ftInBlock}>
                                        <Text style={styles.ftInValue}>{inches} in</Text>
                                        <View style={styles.miniBtnRow}>
                                            <TouchableOpacity onPress={() => setInches(i => Math.max(0, i - 1))} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                            <TouchableOpacity onPress={() => setInches(i => i >= 11 ? 0 : i + 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{language === 'Korean' ? '체중' : 'WEIGHT'}</Text>
                                <View style={styles.unitToggleRowInline}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (weightUnit === 'lb') {
                                                setWeightUnit('kg');
                                                setWeightVal(Math.round(weightVal * 0.453592));
                                            }
                                        }}
                                        style={[styles.unitBtnSmall, weightUnit === 'kg' && styles.unitBtnActive]}
                                    >
                                        <Text style={[styles.unitBtnTextSmall, weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (weightUnit === 'kg') {
                                                setWeightUnit('lb');
                                                setWeightVal(Math.round(weightVal * 2.20462));
                                            }
                                        }}
                                        style={[styles.unitBtnSmall, weightUnit === 'lb' && styles.unitBtnActive]}
                                    >
                                        <Text style={[styles.unitBtnTextSmall, weightUnit === 'lb' && styles.unitBtnTextActive]}>lb</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.weightCenterRow}>
                                <Text style={styles.adjustValue}>{weightVal} {weightUnit}</Text>
                            </View>
                            <View style={styles.weightBtnRow}>
                                {[-5, -1, 1, 5].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => setWeightVal(w => w + val)}
                                        style={styles.stepBtn}
                                    >
                                        <Text style={styles.stepBtnTxt}>{val > 0 ? `+` : ''}{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>{t('dailyCalorieGoal')}</Text>
                                <TouchableOpacity
                                    onPress={recommendKcal}
                                    style={[styles.unitBtnSmall, !isManualKcal && styles.unitBtnActive]}
                                >
                                    <Text style={[styles.unitBtnTextSmall, !isManualKcal && styles.unitBtnTextActive]}>✨ {t('recommended')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.weightCenterRow}>
                                <Text style={styles.adjustValue}>{kcalVal} kcal</Text>
                            </View>
                            <View style={styles.weightBtnRow}>
                                {[-100, -50, 50, 100].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => {
                                            setKcalVal(k => k + val);
                                            setIsManualKcal(true);
                                        }}
                                        style={styles.stepBtn}
                                    >
                                        <Text style={styles.stepBtnTxt}>{val > 0 ? `+` : ''}{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                            onPress={handleUpdateProfile}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Save size={20} color="#fff" />
                                    <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Phone Change Modal */}
            <Modal visible={showPhoneModal} animationType="slide" transparent>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isChangeOtpSent ? t('verifyCode') : t('changePhone')}</Text>
                            <TouchableOpacity onPress={() => setShowPhoneModal(false)} style={{ padding: 4 }}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {!isChangeOtpSent ? (
                            <>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                                    <TextInput
                                        style={[styles.input, { width: 60, textAlign: 'center', paddingHorizontal: 0 }]}
                                        value={countryCode}
                                        editable={false}
                                    />
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder={countryCode === '+1' ? "(201) 555-0123" : "010-0000-0000"}
                                        placeholderTextColor="#94a3b8"
                                        value={newPhone}
                                        onChangeText={handleFormatNewPhone}
                                        keyboardType="phone-pad"
                                        autoFocus
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.saveBtn, { marginTop: 0 }, (!newPhone || changingPhone) && { opacity: 0.7 }]}
                                    onPress={handleSendChangeOtp}
                                    disabled={!newPhone || changingPhone}
                                >
                                    {changingPhone ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('sendCode')}</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={{ textAlign: 'center', marginBottom: 20, color: '#64748b' }}>
                                    {t('otpSentDesc') || `Verification code sent to ${newPhone}`}
                                </Text>
                                <TextInput
                                    style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8, paddingVertical: 4, marginBottom: 20 }]}
                                    placeholder="000000"
                                    value={changeOtp}
                                    onChangeText={setChangeOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                    textContentType="oneTimeCode"
                                />
                                <TouchableOpacity
                                    style={[styles.saveBtn, { marginTop: 0 }, (changeOtp.length < 6 || verifyingChange) && { opacity: 0.7 }]}
                                    onPress={handleVerifyChangeOtp}
                                    disabled={changeOtp.length < 6 || verifyingChange}
                                >
                                    {verifyingChange ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('verifyCode')}</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    scrollContent: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 2, paddingHorizontal: 16, fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },

    saveBtn: { backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 4, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    unitToggleRowInline: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
    unitBtnSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    unitBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    unitBtnTextSmall: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
    unitBtnTextActive: { color: '#0f172a' },
    adjustmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    adjustBtn: { paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    adjustBtnText: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
    adjustValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    weightCenterRow: { alignItems: 'center', marginBottom: 16 },
    ftInContainer: { flexDirection: 'row', gap: 12 },
    ftInBlock: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    ftInValue: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
    miniBtnRow: { flexDirection: 'row', gap: 8 },
    miniBtn: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    weightBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stepBtn: { flex: 1, paddingVertical: 4, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    stepBtnTxt: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
    iconBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    genderBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    genderBtnActive: { backgroundColor: '#fff', borderColor: '#6366f1', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    genderBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    genderBtnTextActive: { color: '#6366f1' },
});
