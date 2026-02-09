import { Tabs, usePathname } from 'expo-router';
import { Home, Camera, User, BarChart2, Heart, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { View, Platform, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../src/lib/i18n';

export default function TabLayout() {
    const pathname = usePathname();
    const isAnalysisScreen = pathname === '/analysis';
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 24,
                    left: 20,
                    right: 20,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: 'rgba(30, 41, 59, 0.75)',
                    borderTopWidth: 0,
                    elevation: 10,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
                    paddingTop: 12,
                    overflow: 'visible', // Allow button to pop out
                    display: isAnalysisScreen ? 'none' : 'flex',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                tabBarBackground: () => (
                    <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
                ),
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: '#64748b',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: 'bold',
                    marginBottom: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('home'),
                    tabBarIcon: ({ color }) => <View style={{ marginTop: -4 }}><Home size={22} color={color} /></View>,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: t('stats'),
                    tabBarIcon: ({ color }) => <View style={{ marginTop: -4 }}><BarChart2 size={22} color={color} /></View>,
                }}
            />
            <Tabs.Screen
                name="analysis"
                options={{
                    title: 'Analyze',
                    tabBarIcon: ({ color }) => (
                        <View style={{
                            width: 56,
                            height: 56,
                            backgroundColor: '#10b981',
                            borderRadius: 28,
                            justifyContent: 'center',
                            alignItems: 'center',
                            top: -12,
                            shadowColor: '#10b981',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            elevation: 8,
                        }}>
                            <Camera size={26} color="white" />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="friends"
                options={{
                    title: t('friends') || 'Friends',
                    tabBarIcon: ({ color }) => <View style={{ marginTop: -4 }}><Users size={22} color={color} /></View>,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('profile'),
                    tabBarIcon: ({ color }) => <View style={{ marginTop: -4 }}><User size={22} color={color} /></View>,
                }}
            />
        </Tabs>
    );
}
