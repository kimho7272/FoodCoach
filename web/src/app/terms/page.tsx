'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../hooks/useLanguage';

export default function TermsPage() {
    const { language, changeLanguage, isLoaded } = useLanguage();

    const content = {
        en: {
            title: 'Terms of Service',
            back: '← Back to Home',
            lastUpdated: 'February 22, 2026',
            sections: [
                {
                    title: '1. Agreement to Terms',
                    text: 'By accessing or using FoodCoach, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.'
                },
                {
                    title: '2. Use of Service',
                    text: 'FoodCoach provides AI-based nutritional coaching. The information provided is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.'
                },
                {
                    title: '3. User Accounts',
                    text: 'When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password.'
                },
                {
                    title: '4. Content and Analysis',
                    text: 'You retain rights to any photos or data you upload. However, by using the App, you grant us permission to process this data to provide our services and improve our AI models.'
                },
                {
                    title: '5. Limitation of Liability',
                    text: 'FoodCoach shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.'
                },
                {
                    title: '6. Termination',
                    text: 'We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms.'
                },
                {
                    title: '7. Contact Information',
                    text: 'If you have any questions about these Terms, please contact us at:',
                    email: 'foodcoach.dev@gmail.com'
                }
            ]
        },
        ko: {
            title: '서비스 이용약관',
            back: '← 홈으로 돌아가기',
            lastUpdated: '2026년 2월 22일',
            sections: [
                {
                    title: '1. 약관 동의',
                    text: 'FoodCoach를 이용함으로써 귀하는 본 이용약관에 동의하게 됩니다. 약관의 내용에 동의하지 않으시면 서비스를 이용하실 수 없습니다.'
                },
                {
                    title: '2. 서비스 이용',
                    text: 'FoodCoach는 AI 기반 영양 코칭을 제공합니다. 제공되는 정보는 교육적 목적으로만 사용되며, 전문적인 의료 조언, 진단 또는 치료를 대신할 수 없습니다.'
                },
                {
                    title: '3. 사용자 계정',
                    text: '계정을 생성할 때 정확하고 완전한 정보를 제공해야 합니다. 귀하는 자신의 계정 및 비밀번호의 기밀을 유지할 책임이 있습니다.'
                },
                {
                    title: '4. 콘텐츠 및 분석',
                    text: '귀하는 귀하가 업로드한 사진이나 데이터에 대한 권리를 보유합니다. 다만, 앱을 이용함으로써 귀하는 당사가 서비스를 제공하고 AI 모델을 개선하기 위해 이 데이터를 처리하는 것을 허용하게 됩니다.'
                },
                {
                    title: '5. 책임의 한계',
                    text: 'FoodCoach는 서비스 이용으로 인해 발생하는 간접적, 부수적, 특별 또는 징벌적 손해에 대해 책임을 지지 않습니다.'
                },
                {
                    title: '6. 서비스 중단',
                    text: '당사는 약관 위반을 포함하여 어떠한 이유로든 예고 없이 즉시 귀하의 계정을 해지하거나 일시 중지할 수 있습니다.'
                },
                {
                    title: '7. 연락처 정보',
                    text: '본 약관에 대해 궁금한 점이 있으시면 다음 이메일로 문의해 주십시오:',
                    email: 'foodcoach.dev@gmail.com'
                }
            ]
        }
    };

    const t = content[language];

    if (!isLoaded) return <div style={{ minHeight: '100vh', backgroundColor: '#0F172A' }} />;

    return (
        <main className="animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t.back}</Link>
                    <div className="glass" style={{ display: 'flex', borderRadius: '12px', padding: '4px' }}>
                        <button
                            onClick={() => changeLanguage('en')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: language === 'en' ? 'var(--primary)' : 'transparent',
                                color: language === 'en' ? 'white' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => changeLanguage('ko')}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: language === 'ko' ? 'var(--primary)' : 'transparent',
                                color: language === 'ko' ? 'white' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            KO
                        </button>
                    </div>
                </div>

                <h1 style={{ fontSize: '3rem', marginBottom: '3rem' }}>{t.title}</h1>

                <div className="glass" style={{ padding: '3rem', lineHeight: 1.8 }}>
                    <p><strong>Last Updated:</strong> {t.lastUpdated}</p>

                    {t.sections.map((section, idx) => (
                        <div key={idx}>
                            <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>{section.title}</h2>
                            <p>{section.text}</p>
                            {section.email && (
                                <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--primary)' }}>Email: {section.email}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
