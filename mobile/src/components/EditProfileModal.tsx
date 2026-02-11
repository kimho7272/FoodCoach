import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal, TextInput, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Save } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { updateProfile } from '../lib/auth_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onProfileUpdated?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, onProfileUpdated }) => {
    const { t, language } = useTranslation();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editNickname, setEditNickname] = useState('');
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
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                setUserProfile(profile);
                setEditName(profile.full_name || '');
                setEditNickname(profile.nickname || '');
                const h = profile.height || 170;
                const w = profile.weight || 70;
                const kc = profile.target_calories || 2000;
                setHeightVal(h);
                setWeightVal(w);
                setKcalVal(kc);
                // If it's the exact recommendation, we might not set isManual? 
                // But let's assume if it came from DB, we just show it.
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
        if (visible) {
            fetchProfile();
            loadSettings();
        }
    }, [visible]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const finalHeight = heightUnit === 'ft' ? Math.round((feet * 12 + inches) * 2.54) : heightVal;
            const finalWeight = weightUnit === 'lb' ? Math.round(weightVal * 0.453592) : weightVal;

            const { success } = await updateProfile(user.id, {
                nickname: editNickname,
                height: finalHeight,
                weight: finalWeight,
                target_calories: kcalVal
            });

            if (success) {
                onProfileUpdated?.();
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('editProfile')}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
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
                        </ScrollView>
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalBlur: { width: width * 0.9, borderRadius: 32, overflow: 'hidden' },
    modalContent: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '700', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
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
});
