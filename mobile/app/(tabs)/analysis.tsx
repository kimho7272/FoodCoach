import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, RotateCcw, Check, X, Flame, Zap, BarChart2 } from 'lucide-react-native';
import { analyzeMealImage, AnalysisResult } from '../../src/api/vision_api';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function AnalysisScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<{ uri: string, base64: string } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const cameraRef = useRef<any>(null);

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
            const data = await analyzeMealImage(photo.base64);
            setResult(data);
        } catch (error) {
            Alert.alert("Analysis Failed", "Could not identify the food. Please try again with a clearer photo.");
        } finally {
            setAnalyzing(false);
        }
    };

    const reset = () => {
        setPhoto(null);
        setResult(null);
    };

    return (
        <View style={styles.container}>
            {!photo ? (
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                >
                    <View style={styles.cameraOverlay}>
                        <View style={styles.cameraHeader}>
                            <View style={styles.scanBadge}>
                                <Text style={styles.scanBadgeText}>Scan Meal</Text>
                            </View>
                        </View>

                        <View style={styles.shutterContainer}>
                            <TouchableOpacity
                                onPress={takePicture}
                                style={styles.shutterBtn}
                            >
                                <View style={styles.shutterInner} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            ) : (
                <View style={styles.fullScreen}>
                    <Image source={{ uri: photo.uri }} style={styles.fullScreen} />

                    {analyzing && (
                        <View style={styles.analyzingOverlay}>
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text style={styles.analyzingText}>AI ANALYZING MEAL...</Text>
                        </View>
                    )}

                    {result ? (
                        <View style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <View>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryBadgeText}>{result.category} Detected</Text>
                                    </View>
                                    <Text style={styles.foodName}>{result.food_name}</Text>
                                </View>
                                <View style={styles.scoreBadge}>
                                    <Text style={styles.scoreValue}>{result.score}%</Text>
                                    <Text style={styles.scoreLabel}>CONFIDENCE</Text>
                                </View>
                            </View>

                            <View style={styles.macroRow}>
                                <View style={styles.macroItem}>
                                    <Flame size={20} color="#f59e0b" />
                                    <Text style={styles.macroValueText}>{result.calories}</Text>
                                    <Text style={styles.macroUnit}>kcal</Text>
                                </View>
                                <View style={styles.macroItem}>
                                    <Zap size={20} color="#10b981" />
                                    <Text style={styles.macroValueText}>{result.macros.protein}</Text>
                                    <Text style={styles.macroUnit}>Protein</Text>
                                </View>
                                <View style={styles.macroItem}>
                                    <BarChart2 size={20} color="#6366f1" />
                                    <Text style={styles.macroValueText}>{result.macros.carbs}</Text>
                                    <Text style={styles.macroUnit}>Carbs</Text>
                                </View>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    onPress={reset}
                                    style={styles.discardBtn}
                                >
                                    <Text style={styles.discardBtnText}>Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => Alert.alert("Success", "Meal logged to your dashboard!")}
                                    style={styles.logBtn}
                                >
                                    <Text style={styles.logBtnText}>Log This Meal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        !analyzing && (
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
    cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 32 },
    cameraHeader: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    scanBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    scanBadgeText: { color: 'white', fontWeight: 'bold' },
    shutterContainer: { alignItems: 'center', marginBottom: 40 },
    shutterBtn: { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 40, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 64, height: 64, backgroundColor: 'white', borderRadius: 32 },
    fullScreen: { flex: 1 },
    analyzingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    analyzingText: { color: 'white', marginTop: 24, fontWeight: 'bold', fontSize: 18, letterSpacing: 1.5 },
    resultCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1e293b', padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
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
    confirmBtn: { width: 80, height: 80, backgroundColor: '#10b981', borderRadius: 40, alignItems: 'center', justifyContent: 'center' }
});
