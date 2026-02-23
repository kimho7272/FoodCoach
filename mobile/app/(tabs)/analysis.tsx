import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Dimensions, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { analyzeMealImage, AnalysisResult } from '../../src/api/vision_api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../../src/lib/supabase';
import { uploadMealImage, saveMealLog, getPlaceNameByAddress } from '../../src/lib/meal_service';
import { useAlert } from '../../src/context/AlertContext';

import { useHealth } from '../../src/context/HealthContext';
import { locationService } from '../../src/services/location_service';
import { Camera as CameraIcon, RotateCcw, Check, X, Flame, Zap, BarChart2, MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function AnalysisScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showAlert } = useAlert();
    const { healthData } = useHealth(); // Get Health Data
    const [permission, requestPermission] = useCameraPermissions();

    // Initialize photo from params if available to avoid flicker
    const [photo, setPhoto] = useState<{ uri: string, base64: string } | null>(
        params.imageUri && params.imageBase64
            ? { uri: params.imageUri as string, base64: params.imageBase64 as string }
            : null
    );

    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const cameraRef = useRef<any>(null);
    const [selectedMealType, setSelectedMealType] = useState<AnalysisResult['category']>('Snack');
    const [logging, setLogging] = useState(false);
    const [location, setLocation] = useState<{ name: string | null, address: string | null, lat: number, lng: number } | null>(null);
    const [viewMode, setViewMode] = useState<'total' | 'recommended'>('recommended');
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [tempLocationName, setTempLocationName] = useState('');

    useEffect(() => {
        // If we have params but analysis hasn't started
        if (params.imageUri && params.imageBase64 && !result && !analyzing) {
            analyzeDirectly(params.imageBase64 as string);
            // Also fetch location for gallery uploads (assuming current location)
            fetchLocation();
        }
    }, [params.imageUri, params.imageBase64]);

    const fetchLocation = async () => {
        const loc = await locationService.getCurrentLocation();
        if (loc) {
            const place = await locationService.getPlaceName(loc.latitude, loc.longitude);
            let finalName = place.name;

            // Check if user has a previously saved name for this address
            if (place.address) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: savedName } = await getPlaceNameByAddress(user.id, place.address);
                        if (savedName) finalName = savedName;
                    }
                } catch (e) {
                    console.log("Failed to fetch historical place name", e);
                }
            }

            setLocation({ ...place, name: finalName, lat: loc.latitude, lng: loc.longitude });
        }
    };

    const analyzeDirectly = async (base64: string) => {
        setAnalyzing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let userProfile: any = undefined;
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('gender, height, weight, target_calories').eq('id', user.id).single();
                if (profile) {
                    const p = profile as any;
                    userProfile = {
                        gender: p.gender,
                        height: p.height,
                        weight: p.weight,
                        target_calories: p.target_calories
                    };
                }
            }

            // Inject Health Context if available
            if (healthData && healthData.isConnected && typeof healthData.readinessScore === 'number') {
                if (!userProfile) userProfile = {};
                userProfile.healthContext = {
                    readinessScore: healthData.readinessScore,
                    steps: healthData.steps,
                    sleepMinutes: healthData.sleepMinutes
                };
            }

            // Resolve Location if missing (e.g. initial load)
            let locContext = location;
            if (!locContext) {
                try {
                    const loc = await locationService.getCurrentLocation();
                    if (loc) {
                        const place = await locationService.getPlaceName(loc.latitude, loc.longitude);
                        let finalName = place.name;

                        // Check history
                        if (place.address && user) {
                            const { data: savedName } = await getPlaceNameByAddress(user.id, place.address);
                            if (savedName) finalName = savedName;
                        }

                        locContext = { ...place, name: finalName, lat: loc.latitude, lng: loc.longitude };
                        setLocation(locContext);
                    }
                } catch (e) {
                    console.log("Location fetch failed during analysis init", e);
                }
            }

            // Prepare location for API
            const apiLocation = locContext ? {
                lat: locContext.lat,
                lng: locContext.lng,
                name: locContext.name,
                address: locContext.address
            } : undefined;

            const data = await analyzeMealImage(base64, userProfile, apiLocation);

            // If AI identified a restaurant name, override/set the location name
            if (data.restaurant_name) {
                if (locContext) {
                    setLocation({ ...locContext, name: data.restaurant_name });
                } else {
                    // Fallback if location services were off but AI found a name (e.g. from logo)
                    setLocation({ lat: 0, lng: 0, address: null, name: data.restaurant_name });
                }
            }

            setResult(data);
            setSelectedMealType(data.category);
        } catch (error) {
            console.error('Analysis Error:', error);
            showAlert({
                title: "Analysis Failed",
                message: "Could not identify the food. Please try again with a clearer photo.",
                type: 'error'
            });
        } finally {
            setAnalyzing(false);
        }
    };

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
            // Fetch location immediately after taking photo
            fetchLocation();
        }
    };

    const handleAnalyze = async () => {
        if (!photo?.base64) return;
        await analyzeDirectly(photo.base64);
    };

    const handleLogMeal = async () => {
        if (!result || !photo) return;
        setLogging(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Final attempt to get location if still missing
            let finalLocation = location;
            if (!finalLocation) {
                try {
                    const loc = await locationService.getCurrentLocation();
                    if (loc) {
                        const place = await locationService.getPlaceName(loc.latitude, loc.longitude);
                        finalLocation = { ...place, lat: loc.latitude, lng: loc.longitude };
                        setLocation(finalLocation);
                    }
                } catch (e) {
                    console.log("Final location fetch failed", e);
                }
            }

            // 1. Upload image (optional but recommended)
            const imageUrl = await uploadMealImage(user.id, photo.base64);

            // 2. Save log
            const selectedNutrition = result[viewMode];
            const { error } = await saveMealLog({
                user_id: user.id,
                food_name: result.food_name,
                calories: selectedNutrition.calories,
                protein: selectedNutrition.macros.protein,
                fat: selectedNutrition.macros.fat,
                carbs: selectedNutrition.macros.carbs,
                meal_type: selectedMealType,
                image_url: imageUrl || undefined,
                health_score: result.health_score,
                description: result.description,
                location_lat: finalLocation?.lat,
                location_lng: finalLocation?.lng,
                place_name: finalLocation?.name,
                address: finalLocation?.address
            });

            if (error) throw error;

            showAlert({
                title: "Success",
                message: "Meal logged to your dashboard!",
                type: 'success'
            });
            reset();
            router.push('/(tabs)');
        } catch (error: any) {
            console.error(error);
            showAlert({
                title: "Logging Failed",
                message: error.message || "Failed to save meal log.",
                type: 'error'
            });
        } finally {
            setLogging(false);
        }
    };

    const reset = () => {
        setPhoto(null);
        setResult(null);
        setLocation(null);
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
                        <BlurView intensity={20} tint="dark" style={styles.analyzingOverlay}>
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color="#10b981" />
                                <View style={styles.analyzingTextWrapper}>
                                    <Text style={styles.analyzingText}>
                                        {logging ? 'SAVING DATA...' : 'AI ANALYZING MEAL...'}
                                    </Text>
                                    {!logging && <Text style={styles.analyzingSubText}>Identifying nutrients & portion size</Text>}
                                </View>
                            </View>
                        </BlurView>
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
                                            {isEditingLocation ? (
                                                <TextInput
                                                    style={styles.locationInput}
                                                    value={tempLocationName}
                                                    onChangeText={setTempLocationName}
                                                    onBlur={() => {
                                                        if (location) setLocation({ ...location, name: tempLocationName });
                                                        else setLocation({ lat: 0, lng: 0, address: null, name: tempLocationName });
                                                        setIsEditingLocation(false);
                                                    }}
                                                    onSubmitEditing={() => {
                                                        if (location) setLocation({ ...location, name: tempLocationName });
                                                        else setLocation({ lat: 0, lng: 0, address: null, name: tempLocationName });
                                                        setIsEditingLocation(false);
                                                    }}
                                                    autoFocus
                                                    placeholder="Restaurant or Place Name"
                                                    placeholderTextColor="#94a3b8"
                                                />
                                            ) : (
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, opacity: 0.8 }}
                                                    onPress={() => {
                                                        setIsEditingLocation(true);
                                                        setTempLocationName(location?.name || location?.address || '');
                                                    }}
                                                >
                                                    <MapPin size={12} color="#94a3b8" />
                                                    <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }} numberOfLines={1}>
                                                        {location?.name || location?.address || 'Tap to add location'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
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

                                    {/* Portion Toggle */}
                                    <View style={{ flexDirection: 'row', backgroundColor: '#334155', borderRadius: 12, padding: 4, marginBottom: 20 }}>
                                        <TouchableOpacity
                                            onPress={() => setViewMode('total')}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 8,
                                                backgroundColor: viewMode === 'total' ? '#0f172a' : 'transparent',
                                                borderRadius: 8,
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ color: viewMode === 'total' ? '#fff' : '#94a3b8', fontWeight: 'bold', fontSize: 13 }}>Total (Full)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setViewMode('recommended')}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 8,
                                                backgroundColor: viewMode === 'recommended' ? '#0f172a' : 'transparent',
                                                borderRadius: 8,
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ color: viewMode === 'recommended' ? '#fff' : '#94a3b8', fontWeight: 'bold', fontSize: 13 }}>Recommended</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {viewMode === 'recommended' && result.recommended?.reason && (
                                        <View style={{ marginBottom: 16, backgroundColor: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 12 }}>
                                            <Text style={{ color: '#10b981', fontSize: 12 }}>💡 {result.recommended.reason}</Text>
                                        </View>
                                    )}

                                    <View style={styles.macroRow}>
                                        <View style={styles.macroItem}>
                                            <Flame size={16} color="#f59e0b" />
                                            <Text style={styles.macroValueText}>{result[viewMode].calories}</Text>
                                            <Text style={styles.macroUnit}>kcal</Text>
                                        </View>
                                        <View style={styles.macroItem}>
                                            <Zap size={16} color="#10b981" />
                                            <Text style={styles.macroValueText}>{result[viewMode].macros.protein}</Text>
                                            <Text style={styles.macroUnit}>Prot</Text>
                                        </View>
                                        <View style={styles.macroItem}>
                                            <BarChart2 size={16} color="#6366f1" />
                                            <Text style={styles.macroValueText}>{result[viewMode].macros.carbs}</Text>
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
    analyzingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    loaderContainer: { backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    analyzingTextWrapper: { alignItems: 'center', marginTop: 24 },
    analyzingText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1.5, textAlign: 'center' },
    analyzingSubText: { color: '#94a3b8', fontSize: 12, marginTop: 8, fontWeight: '500' },
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
    mealTypeTextActive: { color: '#10b981' },
    locationInput: { fontSize: 12, color: 'white', borderBottomWidth: 1, borderBottomColor: '#10b981', padding: 0, marginTop: 4, width: '100%' }
});
