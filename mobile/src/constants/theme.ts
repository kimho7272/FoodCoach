export const theme = {
    colors: {
        // Backgrounds
        background: {
            primary: '#0F172A', // Deep Navy
            secondary: '#1E293B', // Slate 800
            overlay: 'rgba(15, 23, 42, 0.8)', // Dark Overlay
        },
        // Accents
        primary: '#10B981', // Emerald 500
        secondary: '#6366F1', // Indigo 500
        accent: '#F59E0B', // Amber 500
        danger: '#EF4444', // Red 500

        // Text
        text: {
            primary: '#F8FAFC', // Slate 50
            secondary: '#CBD5E1', // Slate 300 (Higher contrast)
            muted: '#94A3B8', // Slate 400 (Readable on dark)
            inverse: '#0F172A', // Deep Navy (for light cards)
        },

        // Glassmorphism
        glass: {
            card: 'rgba(30, 41, 59, 0.7)', // Dark Glass
            border: 'rgba(255, 255, 255, 0.1)', // Subtle Border
            highlight: 'rgba(255, 255, 255, 0.05)', // Shine
        },

        // Gradients
        gradients: {
            background: ['#0F172A', '#1E1B4B', '#312E81'], // Deep Navy -> Midnight
            primary: ['#10B981', '#34D399'], // Emerald -> Light Emerald
            secondary: ['#6366F1', '#818CF8'], // Indigo -> Light Indigo
        }
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        round: 9999,
    },
    typography: {
        header: {
            fontFamily: 'System', // Replace with custom font if added later
            fontWeight: '900',
            letterSpacing: -0.5,
        },
        body: {
            fontFamily: 'System',
            fontWeight: '400',
            letterSpacing: 0,
        },
        label: {
            fontFamily: 'System',
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
        }
    }
};
