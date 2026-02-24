'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../hooks/useLanguage';

export default function PrivacyPage() {
    const { language, changeLanguage, isLoaded } = useLanguage();

    const content = {
        en: {
            title: 'Privacy Policy',
            back: '← Back to Home',
            effectiveDate: 'Februrary 11, 2026',
            sections: [
                {
                    title: '1. Introduction',
                    text: 'Welcome to FoodCoach ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.'
                },
                {
                    title: '2. Collection of Your Information',
                    text: 'We may collect information about you in a variety of ways. The information we may collect via the App includes:',
                    list: [
                        { label: 'Personal Data', value: 'Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register with the App.' },
                        { label: 'Health Data', value: 'Information regarding your health, fitness, and nutrition, including but not limited to dietary intake, calories consumed, and exercise data.' },
                        { label: 'Device Data', value: 'Information such as your mobile device ID, model, and manufacturer, and location data if permitted.' },
                        { label: 'Photos and Media', value: 'Meal photos uploaded for analysis are processed solely for identifying food items and nutritional content.' }
                    ]
                },
                {
                    title: '3. Use of Your Information',
                    text: 'We use information collected about you via the App to:',
                    items: [
                        'Create and manage your account.',
                        'Generate a personal profile to personalize your experience.',
                        'Analyze dietary intake and provide nutritional feedback.',
                        'Monitor usage and trends to improve the App.',
                        'Notify you of updates and request feedback.'
                    ]
                },
                {
                    title: '4. Disclosure of Your Information',
                    text: 'We may share information we have collected about you in certain situations, such as by law or with third-party service providers (e.g., Supabase, Gemini) that perform services for us. **However, mobile phone numbers, SMS opt-in data, and text messaging originator consent will not be shared or sold with third parties or affiliates for marketing or promotional purposes.**'
                },
                {
                    title: '5. Security of Your Information',
                    text: 'We use administrative, technical, and physical security measures to help protect your personal information. However, no security measures are perfect or impenetrable.'
                },
                {
                    title: '6. Policy for Children',
                    text: 'We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us.'
                },
                {
                    title: '7. Contact Us',
                    text: 'If you have questions or comments about this Privacy Policy, please contact us at:',
                    email: 'foodcoach.dev@gmail.com'
                }
            ]
        },
        ko: {
            title: '개인정보 처리방침',
            back: '← 홈으로 돌아가기',
            effectiveDate: '2026년 2월 11일',
            sections: [
                {
                    title: '1. 개요',
                    text: 'FoodCoach("당사", "우리")에 오신 것을 환영합니다. 당사는 귀하의 개인정보를 보호하고 모바일 애플리케이션("앱")에서 긍정적인 경험을 하실 수 있도록 최선을 다하고 있습니다. 본 개인정보 처리방침은 귀하가 당사 앱을 사용할 때 당사가 귀하의 정보를 수집, 사용, 공개 및 보호하는 방법을 설명합니다. 본 방침을 주의 깊게 읽어주시기 바랍니다. 본 방침의 내용에 동의하지 않으시면 서비스 이용을 중단해 주십시오.'
                },
                {
                    title: '2. 정보의 수집',
                    text: '당사는 다양한 방법으로 귀하에 관한 정보를 수집할 수 있습니다. 수집되는 정보는 다음과 같습니다:',
                    list: [
                        { label: '개인 데이터', value: '이름, 이메일 주소 등 앱 가입 시 귀하가 자발적으로 제공하는 개인 식별 정보입니다.' },
                        { label: '건강 데이터', value: '식단 섭취량, 섭취 칼로리, 운동 데이터 등 귀하의 건강 및 영양과 관련된 정보입니다.' },
                        { label: '기기 데이터', value: '모바일 기기 ID, 모델, 제조사 정보 및 허용된 경우의 위치 정보입니다.' },
                        { label: '사진 및 미디어', value: '이미지 분석을 위해 업로드된 식사 사진은 음식 식별 및 영양 분석 목적으로만 사용됩니다.' }
                    ]
                },
                {
                    title: '3. 정보의 이용',
                    text: '수집된 정보는 다음의 목적을 위해 사용됩니다:',
                    items: [
                        '계정 생성 및 관리',
                        '맞춤형 경험 제공을 위한 개인 프로필 생성',
                        '식단 분석 및 영양 피드백 제공',
                        '앱 개선을 위한 사용 패턴 및 트렌드 분석',
                        '업데이트 공지 및 피드백 요청'
                    ]
                },
                {
                    title: '4. 정보의 공개',
                    text: '당사는 법률 준수 또는 서비스 제공을 위한 제3자 서비스 제공업체(예: Supabase, Gemini 등)에게 필요한 범위 내에서 정보를 공유할 수 있습니다. **단, 사용자의 휴대폰 번호, SMS 수신 동의 정보는 마케팅이나 홍보 목적으로 제3자 또는 계열사와 공유하거나 판매되지 않습니다.**'
                },
                {
                    title: '5. 정보의 보안',
                    text: '당사는 귀하의 정보를 보호하기 위해 관리적, 기술적, 물리적 보안 조치를 사용합니다. 그러나 어떠한 보안 조치도 완벽할 수는 없음을 알려드립니다.'
                },
                {
                    title: '6. 아동 정책',
                    text: '당사는 만 13세 미만의 아동으로부터 고의로 정보를 수집하지 않습니다. 만약 아동의 정보가 수집된 사실을 알게 되시면 당사에 연락해 주십시오.'
                },
                {
                    title: '7. 문의처',
                    text: '본 방침에 대한 질문이나 의견이 있으시면 다음 이메일로 연락해 주십시오:',
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
                    <p><strong>Effective Date:</strong> {t.effectiveDate}</p>

                    {t.sections.map((section, idx) => (
                        <div key={idx}>
                            <h2 style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>{section.title}</h2>
                            <p>{section.text}</p>
                            {section.list && (
                                <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                                    {section.list.map((item, i) => (
                                        <li key={i}><strong>{item.label}:</strong> {item.value}</li>
                                    ))}
                                </ul>
                            )}
                            {section.items && (
                                <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                                    {section.items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}
                            {section.email && (
                                <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--primary)' }}>Contact: Ho Kim ({section.email})</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
