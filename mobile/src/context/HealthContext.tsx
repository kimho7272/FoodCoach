import React, { createContext, useContext, useState, useEffect } from 'react';
import { healthService, HealthData } from '../services/health_service';

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
        // ideally we check persisted state here, for now we can check healthService status
        // or just init empty
        const currentStatus = healthService.getStatus();
        if (currentStatus.isConnected) {
            refreshData();
        }
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Assuming Samsung as default for now based on previous context
            // In real app, store provider in state
            const data = await healthService.fetchData('samsung');
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
