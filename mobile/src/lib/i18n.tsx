import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKeys } from './translations';

type Language = 'English' | 'Korean';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('English');

    useEffect(() => {
        const loadLanguage = async () => {
            const stored = await AsyncStorage.getItem('user_language');
            if (stored === 'Korean' || stored === 'English') {
                setLanguageState(stored as Language);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await AsyncStorage.setItem('user_language', lang);
    };

    const t = (key: TranslationKeys): string => {
        const currentTranslations = translations[language] as any;
        const fallbackTranslations = translations['English'] as any;
        return currentTranslations[key] || fallbackTranslations[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
