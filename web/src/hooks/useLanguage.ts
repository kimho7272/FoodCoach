'use client';

import { useState, useEffect } from 'react';
import { Language } from '../lib/web_translations';

export function useLanguage() {
    const [language, setLanguage] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 1. Check persistence
        const savedLang = localStorage.getItem('foodcoach_web_lang') as Language;

        if (savedLang && (savedLang === 'en' || savedLang === 'ko')) {
            setLanguage(savedLang);
        } else {
            // 2. Detect browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('ko')) {
                setLanguage('ko');
            } else {
                setLanguage('en');
            }
        }
        setIsLoaded(true);
    }, []);

    const changeLanguage = (newLang: Language) => {
        setLanguage(newLang);
        localStorage.setItem('foodcoach_web_lang', newLang);
    };

    return { language, changeLanguage, isLoaded };
}
