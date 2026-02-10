import React, { createContext, useContext, useState, useEffect } from 'react';
import { healthService, HealthData } from '../services/health_service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthContextType {
    healthData: HealthData | null;
    isLoading: boolean;
    refreshData: () => Promise<void>;
    connect: (provider: 'samsung' | 'google' | 'apple') => Promise<boolean>;
    disconnect: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load - Check if previously connected
    useEffect(() => {
        const restoreConnection = async () => {
            try {
                const savedProvider = await AsyncStorage.getItem('health_provider');
                if (savedProvider) {
                    // Automatically reconnect
                    console.log("Restoring health connection to:", savedProvider);
                    await connect(savedProvider as any);
                }
            } catch (e) {
                console.error("Failed to restore health connection", e);
            }
        };
        restoreConnection();
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Retrieve provider from storage to know which one to fetch from, 
            // or just rely on service state if it was restored.
            // For now, let's assume if we are connected, the service knows, 
            // but the service `fetchData` requires a provider argument in the interface?
            // Actually `healthService.fetchData` takes a provider arg. 
            // We should ideally store the current provider in state too.
            const savedProvider = await AsyncStorage.getItem('health_provider');
            const providerToUse = savedProvider as 'samsung' | 'google' | 'apple' || 'samsung'; // Default fallback

            const data = await healthService.fetchData(providerToUse);
            setHealthData(data);
        } catch (e) {
            console.error("Context: Failed to refresh health data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const connect = async (provider: 'samsung' | 'google' | 'apple') => {
        setIsLoading(true);
        try {
            const success = await healthService.connect(provider);
            if (success) {
                await AsyncStorage.setItem('health_provider', provider);
                await refreshData();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Context: Failed to connect", e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const disconnect = async () => {
        setIsLoading(true);
        try {
            await healthService.disconnect();
            await AsyncStorage.removeItem('health_provider');
            setHealthData(null);
        } catch (e) {
            console.error("Context: Failed to disconnect", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <HealthContext.Provider value={{ healthData, isLoading, refreshData, connect, disconnect }}>
            {children}
        </HealthContext.Provider>
    );
};

export const useHealth = () => {
    const context = useContext(HealthContext);
    if (context === undefined) {
        throw new Error('useHealth must be used within a HealthProvider');
    }
    return context;
};
