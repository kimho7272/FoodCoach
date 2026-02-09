import { Platform } from 'react-native';

export type HealthData = {
    steps: number;
    caloriesBurned: number; // Active energy
    sleepMinutes: number;
    sleepStages?: {
        awake: number;
        light: number;
        deep: number;
        rem: number;
    };
    weight?: number;
    bodyFat?: number;
    exerciseSessions?: {
        type: string;
        duration: number; // minutes
        calories: number;
        date: Date;
    }[];
    lastSynced: Date | null;
    isConnected: boolean;
    readinessScore?: number; // 0-100 score based on Sleep + Activity
};

// Lazy load to prevent crashes in Expo Go or non-Android environments
let healthConnect: any;
let AppleHealthKit: any;

try {
    if (Platform.OS === 'android') {
        try {
            healthConnect = require('react-native-health-connect');
        } catch (innerError) {
            console.log("Health Connect package not linked (running in Expo Go?)");
        }
    } else if (Platform.OS === 'ios') {
        try {
            AppleHealthKit = require('react-native-health').default;
        } catch (innerError) {
            console.log("Apple HealthKit package not linked (running in Expo Go?)");
        }
    }
} catch (e) {
    console.log("Health Native module not found.");
}

class HealthService {
    private mockData: HealthData = {
        steps: 0,
        caloriesBurned: 0,
        sleepMinutes: 0,
        lastSynced: null,
        isConnected: false,
    };

    private isRealConnection = false;

    async connect(provider: 'apple' | 'samsung' | 'google'): Promise<boolean> {
        // Android Implementation (Samsung Health / Health Connect)
        if (Platform.OS === 'android' && (provider === 'samsung' || provider === 'google')) {
            // ... existing Android implementation ...
            if (healthConnect) {
                // ... (abbreviated for this replacement, assuming we keep existing blocks) ...
                try {
                    const { initialize, requestPermission } = healthConnect;
                    let isInitialized = false;
                    try {
                        isInitialized = await initialize();
                    } catch (initErr) {
                        console.log("Health Connect initialize check (Mock Mode on Expo Go):", initErr);
                    }

                    const permissions = [
                        { accessType: 'read', recordType: 'Steps' },
                        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
                        { accessType: 'read', recordType: 'SleepSession' },
                        { accessType: 'read', recordType: 'Weight' },
                        { accessType: 'read', recordType: 'ExerciseSession' },
                    ];

                    let granted = false;
                    try {
                        granted = await requestPermission(permissions);
                    } catch (permErr) {
                        // ... existing catch ...
                        throw permErr;
                    }

                    if (granted) {
                        this.isRealConnection = true;
                        this.mockData.isConnected = true;
                        this.mockData.lastSynced = new Date();
                        return true;
                    }
                } catch (e) {
                    console.log("Health Connect native module not available (Mock Mode):", e);
                }
            } else {
                console.log("Health Connect module not available, using mock.");
            }
        }

        // iOS Implementation (Apple HealthKit)
        if (Platform.OS === 'ios' && provider === 'apple') {
            if (AppleHealthKit) {
                try {
                    const permissions = {
                        permissions: {
                            read: [
                                AppleHealthKit.Constants.Permissions.StepCount,
                                AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
                                AppleHealthKit.Constants.Permissions.SleepAnalysis,
                                AppleHealthKit.Constants.Permissions.Weight,
                                AppleHealthKit.Constants.Permissions.Workout,
                            ],
                        },
                    };

                    return new Promise((resolve) => {
                        AppleHealthKit.initHealthKit(permissions, (error: string, results: boolean) => {
                            if (error) {
                                console.log('[ERROR] Cannot grant permissions:', error);
                                resolve(false);
                                return;
                            }
                            // Apple HealthKit init success just means prompts were shown (or already granted)
                            this.isRealConnection = true;
                            this.mockData.isConnected = true;
                            this.mockData.lastSynced = new Date();
                            resolve(true);
                        });
                    });
                } catch (e) {
                    console.log("Apple HealthKit init error:", e);
                }
            } else {
                console.log("Apple HealthKit module not available (Expo Go?), using mock.");
            }
        }

        // Mock Implementation for Fallback
        return new Promise((resolve) => {
            setTimeout(() => {
                this.mockData.isConnected = true;
                this.mockData.lastSynced = new Date();
                resolve(true);
            }, 2000);
        });
    }

    async disconnect(): Promise<void> {
        this.mockData.isConnected = false;
        this.mockData.lastSynced = null;
        this.mockData.steps = 0;
        this.mockData.caloriesBurned = 0;
        this.mockData.sleepMinutes = 0;
        this.isRealConnection = false;
    }

    async fetchData(provider: 'apple' | 'samsung' | 'google'): Promise<HealthData> {
        if (!this.mockData.isConnected) {
            throw new Error("Health Kit/Connect not connected");
        }

        // Android Fetch (Health Connect)
        if (this.isRealConnection && Platform.OS === 'android') {
            // ... existing Android fetch logic ...
            try {
                const { readRecords } = healthConnect;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const timeRangeFilter = {
                    operator: 'between',
                    startTime: today.toISOString(),
                    endTime: tomorrow.toISOString(),
                };

                const stepsRecords = await readRecords('Steps', { timeRangeFilter });
                const totalSteps = stepsRecords.reduce((sum: number, record: any) => sum + record.count, 0);

                const caloriesRecords = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
                const totalCalories = caloriesRecords.reduce((sum: number, record: any) => sum + record.energy.inKilocalories, 0);

                const sleepRecords = await readRecords('SleepSession', { timeRangeFilter });
                let totalSleepMinutes = 0;
                let sleepStages = { awake: 0, light: 0, deep: 0, rem: 0 };
                sleepRecords.forEach((record: any) => {
                    const start = new Date(record.startTime).getTime();
                    const end = new Date(record.endTime).getTime();
                    totalSleepMinutes += (end - start) / (1000 * 60);
                    if (record.stages) {
                        record.stages.forEach((stage: any) => {
                            const stageDur = (new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / (1000 * 60);
                            if (stage.stage === 1) sleepStages.awake += stageDur;
                            if (stage.stage === 2) sleepStages.light += stageDur;
                            if (stage.stage === 4) sleepStages.deep += stageDur;
                            if (stage.stage === 5) sleepStages.rem += stageDur;
                        });
                    }
                });

                const weightRecords = await readRecords('Weight', {
                    timeRangeFilter: { operator: 'before', endTime: new Date().toISOString() },
                    limit: 1
                });
                const weight = weightRecords.length > 0 ? weightRecords[0].weight.inKilograms : undefined;

                const exerciseRecords = await readRecords('ExerciseSession', { timeRangeFilter });
                const exerciseSessions = exerciseRecords.map((record: any) => ({
                    type: record.exerciseType || 'Unknown',
                    duration: (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / (1000 * 60),
                    calories: 0,
                    date: new Date(record.startTime)
                }));

                this.mockData.steps = Math.floor(totalSteps);
                this.mockData.caloriesBurned = Math.floor(totalCalories);
                this.mockData.sleepMinutes = Math.floor(totalSleepMinutes);
                this.mockData.sleepStages = sleepStages;
                this.mockData.weight = weight;
                this.mockData.exerciseSessions = exerciseSessions;
                this.mockData.exerciseSessions = exerciseSessions;
                this.mockData.lastSynced = new Date();
                this.mockData.readinessScore = this.calculateReadiness(this.mockData.sleepMinutes, this.mockData.steps);
                return { ...this.mockData };

            } catch (e) {
                console.error("Failed to read Health Connect data:", e);
            }
        }

        // iOS Fetch (Apple HealthKit)
        if (this.isRealConnection && Platform.OS === 'ios' && AppleHealthKit) {
            return new Promise((resolve) => {
                const today = new Date();
                const options = {
                    date: today.toISOString(),
                    includeManuallyAdded: true,
                };

                // 1. Steps
                AppleHealthKit.getStepCount(options, (err: string, results: any) => {
                    if (!err && results) this.mockData.steps = Math.round(results.value);

                    // 2. Active Energy
                    AppleHealthKit.getActiveEnergyBurned(options, (err: string, results: any) => {
                        if (!err && results && results.length > 0) {
                            // Correctly sum up samples if specific type returned, but library usually returns total or samples
                            // getActiveEnergyBurned usually returns array of samples for the day
                            const total = results.reduce((acc: number, curr: any) => acc + curr.value, 0);
                            this.mockData.caloriesBurned = Math.round(total);
                        }

                        // 3. Sleep
                        AppleHealthKit.getSleepSamples(options, (err: string, results: any[]) => {
                            if (!err && results) {
                                // Simple duration logic for now
                                let totalMins = 0;
                                results.forEach(sample => {
                                    // Calculate overlapping or total duration
                                    const start = new Date(sample.startDate).getTime();
                                    const end = new Date(sample.endDate).getTime();
                                    totalMins += (end - start) / (1000 * 60);
                                });
                                this.mockData.sleepMinutes = Math.round(totalMins);
                            }

                            this.mockData.lastSynced = new Date();
                            this.mockData.readinessScore = this.calculateReadiness(this.mockData.sleepMinutes, this.mockData.steps);
                            resolve({ ...this.mockData });
                        });
                    });
                });
            });
        }

        // Mock Data Generation
        return new Promise((resolve) => {
            setTimeout(() => {
                this.mockData.steps = Math.floor(Math.random() * (12000 - 5000) + 5000);
                this.mockData.caloriesBurned = Math.floor(Math.random() * (800 - 300) + 300);
                this.mockData.sleepMinutes = Math.floor(Math.random() * (480 - 360) + 360);
                this.mockData.sleepStages = {
                    awake: 30,
                    light: 240,
                    deep: 90,
                    rem: 120
                };
                this.mockData.weight = 72.5;
                this.mockData.exerciseSessions = [
                    { type: 'Running', duration: 30, calories: 350, date: new Date() }
                ];
                this.mockData.lastSynced = new Date();
                this.mockData.readinessScore = this.calculateReadiness(this.mockData.sleepMinutes, this.mockData.steps);
                resolve({ ...this.mockData });
            }, 1000);
        });
    }

    private calculateReadiness(sleepMinutes: number, steps: number): number {
        // Simple Algorithm:
        // Sleep (60%): Goal 7-9 hours (420-540 mins). < 6 hours penalizes heavily.
        // Activity (40%): Steps > 5000 is baseline.

        let sleepScore = 0;
        if (sleepMinutes >= 420) sleepScore = 100;
        else if (sleepMinutes >= 360) sleepScore = 80;
        else if (sleepMinutes >= 300) sleepScore = 60;
        else sleepScore = 40;

        let stepScore = 0;
        if (steps >= 10000) stepScore = 100;
        else if (steps >= 7000) stepScore = 80;
        else if (steps >= 5000) stepScore = 60;
        else stepScore = 40;

        // Weighted Average: 60% Sleep, 40% Steps
        return Math.round((sleepScore * 0.6) + (stepScore * 0.4));
    }

    getStatus(): HealthData {
        return { ...this.mockData };
    }
}

export const healthService = new HealthService();
