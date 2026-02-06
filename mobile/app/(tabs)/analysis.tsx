import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, RotateCcw, Check, X, Flame, Zap, BarChart2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { analyzeMealImage, AnalysisResult } from '../../src/api/vision_api';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { uploadMealImage, saveMealLog } from '../../src/lib/meal_service';

const { width, height } = Dimensions.get('window');

export default function AnalysisScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<{ uri: string, base64: string } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const cameraRef = useRef<any>(null);
    const [selectedMealType, setSelectedMealType] = useState<AnalysisResult['category']>('Snack');
    const [logging, setLogging] = useState(false);

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#10b981" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Grant access to your camera to identify your meals</Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={styles.enableBtn}
                >
                    <Text style={styles.enableBtnText}>Enable Camera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const options = { quality: 0.5, base64: true, shutterSound: false };
            const data = await cameraRef.current.takePictureAsync(options);
            setPhoto({ uri: data.uri, base64: data.base64 });
        }
    };

    const handleAnalyze = async () => {
        if (!photo?.base64) return;
        setAnalyzing(true);
        try {
            // Fetch user profile for height/weight context
            const { data: { user } } = await supabase.auth.getUser();
            let userProfile = undefined;
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('height, weight')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    userProfile = {
                        height: profile.height,
                        weight: profile.weight
                    };
                }
            }

            const data = await analyzeMealImage(photo.base64, userProfile);
            setResult(data);
            setSelectedMealType(data.category);
        } catch (error) {
            console.error('Analysis Error:', error);
            Alert.alert("Analysis Failed", "Could not identify the food. Please try again with a clearer photo.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleLogMeal = async () => {
        if (!result || !photo) return;
        setLogging(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // 1. Upload image (optional but recommended)
            const imageUrl = await uploadMealImage(user.id, photo.base64);

            // 2. Save log
            const { error } = await saveMealLog({
                user_id: user.id,
                food_name: result.food_name,
                calories: result.calories,
                protein: result.macros.protein,
                fat: result.macros.fat,
                carbs: result.macros.carbs,
                meal_type: selectedMealType,
                image_url: imageUrl || undefined,
                health_score: result.health_score,
                description: result.description
            });

            if (error) throw error;

            Alert.alert("Success", "Meal logged to your dashboard!");
            reset();
            router.push('/(tabs)');
        } catch (error: any) {
            console.error(error);
            Alert.alert("Logging Failed", error.message || "Failed to save meal log.");
        } finally {
            setLogging(false);
        }
    };

    const reset = () => {
        setPhoto(null);
        setResult(null);
    };

    const mealTypes: AnalysisResult['category'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    return (
        <View style={styles.container}>
            {!photo ? (
                <View style={styles.container}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                    />
                    <View style={styles.cameraOverlay}>
                        <SafeAreaView>
                            <View style={styles.cameraHeader}>
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)')}
                                    style={styles.closeBtn}
                                >
                                    <X size={24} color="white" />
                                </TouchableOpacity>
                                <View style={styles.scanBadge}>
                                    <Text style={styles.scanBadgeText}>Scan Meal</Text>
                                </View>
                                <View style={{ width: 44 }} />
                            </View>
                        </SafeAreaView>

                        <View style={styles.shutterContainer}>
                            <TouchableOpacity
                                onPress={takePicture}
                                style={styles.shutterBtn}
                            >
                                <View style={styles.shutterInner} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.fullScreen}>
                    <Image source={{ uri: photo.uri }} style={styles.fullScreen} />

                    {(analyzing || logging) && (
                        <View style={styles.analyzingOverlay}>
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text style={styles.analyzingText}>
                                {logging ? 'SAVING DATA...' : 'AI ANALYZING MEAL...'}
                            </Text>
                        </View>
                    )}

                    {result && !logging ? (
                        <View style={styles.resultCard}>
                            {!result.is_food ? (
                                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                    <View style={[styles.categoryBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                        <Text style={[styles.categoryBadgeText, { color: '#ef4444' }]}>Not Food Detected</Text>
                                    </View>
                                    <Text style={[styles.foodName, { textAlign: 'center' }]}>Wait, that's not food!</Text>
                                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
                                        {result.description || "The AI thinks this might not be something you can eat. Please try scanning a meal instead."}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={reset}
                                        style={[styles.discardBtn, { width: '100%', marginTop: 24 }]}
                                    >
                                        <Text style={styles.discardBtnText}>Try Again</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.resultHeader}>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.categoryBadge}>
                                                <Text style={styles.categoryBadgeText}>AI Suggested: {result.category}</Text>
                                            </View>
                                            <Text style={styles.foodName} numberOfLines={1}>{result.food_name}</Text>
                                            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{result.description}</Text>
                                        </View>
                                        <View style={[styles.scoreBadge, { backgroundColor: result.health_score >= 7 ? '#10b981' : (result.health_score >= 4 ? '#f59e0b' : '#ef4444') }]}>
                                            <Text style={styles.scoreValue}>{result.health_score}/10</Text>
                                            <Text style={styles.scoreLabel}>HEALTH</Text>
                                        </View>
                                    </View>

                                    <View style={styles.mealTypeSelector}>
                                        {mealTypes.map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setSelectedMealType(type)}
                                                style={[
                                                    styles.mealTypeBtn,
                                                    selectedMealType === type && styles.mealTypeBtnActive
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.mealTypeText,
                                                    selectedMealType === type && styles.mealTypeTextActive
                                                ]}>{type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.macroRow}>
                                        <View style={styles.macroItem}>
                                            <Flame size={16} color="#f59e0b" />
                                            <Text style={styles.macroValueText}>{result.calories}</Text>
                                            <Text style={styles.macroUnit}>kcal</Text>
                                        </View>
                                        <View style={styles.macroItem}>
                                            <Zap size={16} color="#10b981" />
                                            <Text style={styles.macroValueText}>{result.macros.protein}</Text>
                                            <Text style={styles.macroUnit}>Prot</Text>
                                        </View>
                                        <View style={styles.macroItem}>
                                            <BarChart2 size={16} color="#6366f1" />
                                            <Text style={styles.macroValueText}>{result.macros.carbs}</Text>
                                            <Text style={styles.macroUnit}>Carb</Text>
                                        </View>
                                    </View>

                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            onPress={reset}
                                            style={styles.discardBtn}
                                            disabled={logging}
                                        >
                                            <Text style={styles.discardBtnText}>Discard</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleLogMeal}
                                            style={styles.logBtn}
                                            disabled={logging}
                                        >
                                            <Text style={styles.logBtnText}>Log {selectedMealType}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    ) : (
                        !analyzing && !logging && (
                            <View style={styles.confirmRow}>
                                <TouchableOpacity
                                    onPress={reset}
                                    style={styles.cancelBtn}
                                >
                                    <X color="white" size={32} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleAnalyze}
                                    style={styles.confirmBtn}
                                >
                                    <Check color="white" size={32} />
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
    permissionContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 24 },
    permissionText: { color: 'white', textAlign: 'center', marginBottom: 24, fontSize: 18 },
    enableBtn: { backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30 },
    enableBtnText: { color: 'white', fontWeight: 'bold' },
    camera: { flex: 1 },
    cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 32 },
    cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    scanBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    scanBadgeText: { color: 'white', fontWeight: 'bold' },
    shutterContainer: { alignItems: 'center', marginBottom: 40 },
    shutterBtn: { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 40, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 64, height: 64, backgroundColor: 'white', borderRadius: 32 },
    fullScreen: { flex: 1 },
    analyzingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    analyzingText: { color: 'white', marginTop: 24, fontWeight: 'bold', fontSize: 18, letterSpacing: 1.5 },
    resultCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1e293b', padding: 32, paddingBottom: Platform.OS === 'ios' ? 44 : 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    categoryBadge: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
    categoryBadgeText: { color: '#10b981', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' },
    foodName: { color: 'white', fontSize: 30, fontWeight: 'bold' },
    scoreBadge: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
    scoreValue: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    scoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 8, textAlign: 'center', fontWeight: 'bold' },
    macroRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    macroItem: { flex: 1, backgroundColor: 'rgba(30,41,59,0.5)', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    macroValueText: { color: 'white', fontWeight: 'bold', fontSize: 20, marginTop: 8 },
    macroUnit: { color: '#64748b', fontSize: 10 },
    actionRow: { flexDirection: 'row', gap: 16 },
    discardBtn: { flex: 1, backgroundColor: '#334155', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    discardBtnText: { color: 'white', fontWeight: 'bold' },
    logBtn: { flex: 1, backgroundColor: '#10b981', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    logBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    confirmRow: { position: 'absolute', bottom: 48, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 40 },
    cancelBtn: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    confirmBtn: { width: 80, height: 80, backgroundColor: '#10b981', borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    mealTypeSelector: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
    mealTypeBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    mealTypeBtnActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10b981' },
    mealTypeText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
    mealTypeTextActive: { color: '#10b981' }
});
