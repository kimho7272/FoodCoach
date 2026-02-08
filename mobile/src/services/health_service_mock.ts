import { Platform } from 'react-native';

export type HealthData = {
    steps: number;
    caloriesBurned: number; // Active energy
    sleepMinutes: number;
    lastSynced: Date | null;
    isConnected: boolean;
};

// Simulated Health Service
// In a production environment with native builds, you would replace this 
// with 'react-native-health' (iOS) and 'react-native-health-connect' (Android).

class HealthService {
    private mockData: HealthData = {
        steps: 0,
        caloriesBurned: 0,
        sleepMinutes: 0,
        lastSynced: null,
        isConnected: false,
    };

    // Simulate connection delay
    async connect(provider: 'apple' | 'samsung' | 'google'): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.mockData.isConnected = true;
                this.mockData.lastSynced = new Date();
                resolve(true);
            }, 2000); // 2 second fake connection time
        });
    }

    async disconnect(): Promise<void> {
        this.mockData.isConnected = false;
        this.mockData.lastSynced = null;
        this.mockData.steps = 0;
        this.mockData.caloriesBurned = 0;
        this.mockData.sleepMinutes = 0;
    }

    // Simulate fetching data from the device/watch
    async fetchData(provider: 'apple' | 'samsung' | 'google'): Promise<HealthData> {
        if (!this.mockData.isConnected) {
            throw new Error("Health Kit not connected");
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate realistic "Galaxy Watch" or "Apple Watch" numbers
                this.mockData.steps = Math.floor(Math.random() * (12000 - 5000) + 5000); // 5k - 12k steps
                this.mockData.caloriesBurned = Math.floor(Math.random() * (800 - 300) + 300); // 300 - 800 kcal
                this.mockData.sleepMinutes = Math.floor(Math.random() * (480 - 360) + 360); // 6h - 8h sleep
                this.mockData.lastSynced = new Date();

                resolve({ ...this.mockData });
            }, 1500);
        });
    }

    getStatus(): HealthData {
        return { ...this.mockData };
    }
}

export const healthService = new HealthService();
