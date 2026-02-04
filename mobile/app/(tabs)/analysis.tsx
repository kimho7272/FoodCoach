import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, RotateCcw, Check, X, Flame, Zap, BarChart2 } from 'lucide-react-native';
import { analyzeMealImage, AnalysisResult } from '../../src/api/vision_api';

export default function AnalysisScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<{ uri: string, base64: string } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const cameraRef = useRef<any>(null);

    if (!permission) {
        return (
            <View className="flex-1 bg-[#0f172a] justify-center items-center">
                <ActivityIndicator color="#10b981" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-[#0f172a] justify-center items-center p-6">
                <Text className="text-white text-center mb-6 text-lg">Grant access to your camera to identify your meals</Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-[#10b981] px-8 py-3 rounded-full shadow-lg shadow-emerald-900"
                >
                    <Text className="text-white font-bold">Enable Camera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const options = { quality: 0.5, base64: true };
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
        <View className="flex-1 bg-[#0f172a]">
            {!photo ? (
                <CameraView
                    ref={cameraRef}
                    className="flex-1"
                    facing="back"
                >
                    <View className="flex-1 justify-between p-8">
                        <View className="flex-row justify-center mt-4">
                            <View className="bg-white/20 px-4 py-2 rounded-full border border-white/20">
                                <Text className="text-white font-bold">Scan Meal</Text>
                            </View>
                        </View>

                        <View className="items-center pb-10">
                            <TouchableOpacity
                                onPress={takePicture}
                                className="w-20 h-20 bg-white/20 rounded-full border-4 border-white items-center justify-center"
                            >
                                <View className="w-16 h-16 bg-white rounded-full" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            ) : (
                <View className="flex-1">
                    <Image source={{ uri: photo.uri }} className="flex-1" />

                    {analyzing && (
                        <View className="absolute inset-0 bg-black/70 justify-center items-center">
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text className="text-white mt-6 font-bold text-lg tracking-wider">AI ANALYZING MEAL...</Text>
                        </View>
                    )}

                    {result ? (
                        <View className="absolute bottom-0 left-0 right-0 bg-[#1e293b] p-8 rounded-t-[40] border-t border-white/10">
                            <View className="flex-row justify-between items-start mb-6">
                                <View>
                                    <View className="bg-emerald-500/10 px-2 py-1 rounded-md self-start mb-1">
                                        <Text className="text-[#10b981] font-bold text-[10px] uppercase">{result.category} Detected</Text>
                                    </View>
                                    <Text className="text-white text-3xl font-bold">{result.food_name}</Text>
                                </View>
                                <View className="bg-[#10b981] px-4 py-2 rounded-2xl shadow-lg">
                                    <Text className="text-white font-bold text-lg">{result.score}%</Text>
                                    <Text className="text-white/70 text-[8px] text-center font-bold">CONFIDENCE</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mb-8">
                                <View className="flex-1 bg-slate-800/50 p-4 rounded-3xl border border-white/5">
                                    <Flame size={20} color="#f59e0b" />
                                    <Text className="text-white font-bold text-xl mt-2">{result.calories}</Text>
                                    <Text className="text-slate-400 text-[10px]">kcal</Text>
                                </View>
                                <View className="flex-1 bg-slate-800/50 p-4 rounded-3xl border border-white/5">
                                    <Zap size={20} color="#10b981" />
                                    <Text className="text-white font-bold text-xl mt-2">{result.macros.protein}</Text>
                                    <Text className="text-slate-400 text-[10px]">Protein</Text>
                                </View>
                                <View className="flex-1 bg-slate-800/50 p-4 rounded-3xl border border-white/5">
                                    <BarChart2 size={20} color="#6366f1" />
                                    <Text className="text-white font-bold text-xl mt-2">{result.macros.carbs}</Text>
                                    <Text className="text-slate-400 text-[10px]">Carbs</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    onPress={reset}
                                    className="flex-1 bg-slate-800 h-14 rounded-2xl items-center justify-center border border-white/10"
                                >
                                    <Text className="text-white font-bold">Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => Alert.alert("Success", "Meal logged to your dashboard!")}
                                    className="flex-1 bg-[#10b981] h-14 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/20"
                                >
                                    <Text className="text-white font-bold text-lg">Log This Meal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        !analyzing && (
                            <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-10">
                                <TouchableOpacity
                                    onPress={reset}
                                    className="w-16 h-16 bg-white/10 rounded-full items-center justify-center border border-white/20 backdrop-blur-md"
                                >
                                    <X color="white" size={32} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleAnalyze}
                                    className="w-20 h-20 bg-[#10b981] rounded-full items-center justify-center shadow-2xl shadow-emerald-500"
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
