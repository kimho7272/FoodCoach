# FoodCoach Mobile Architecture Walkthrough

## 1. Unified Backend Strategy
To support both the existing web app and the new Android/iOS apps, we are moving to a **Headless API** architecture.

### Authentication: Supabase Auth
- **Why**: NextAuth is optimized for SSR/Web. Supabase Auth provides a unified session management system that works flawlessly on Mobile (Deep Links) and Web.
- **Action**: Replace `next-auth` with `@supabase/supabase-js`.

### Data Layer: Centralized Postgres
- **Current**: local scripts/DB.
- **Target**: Supabase Postgres with Row Level Security (RLS). This allows the mobile app to sync data in real-time.

## 2. Shared Business Logic (The AI Layer)
All AI processing (Gemini Vision) is moved to a shared API layer to ensure consistency between platforms.

```typescript
// Proposed API Route (e.g., /api/analyze)
export async function POST(req: Request) {
  const { imageBase64 } = await req.json();
  // 1. Send to Gemini Vision API
  // 2. Cross-reference with Nutritionix/USDA
  // 3. Return structured JSON
}
```

## 3. Mobile Performance & Aesthetics
The mobile app is built with **Expo + NativeWind** for a high-performance, premium feel.

- **Proactive Notifications**: We use `expo-notifications` to trigger interactions even when the app is closed.
- **Vision Integration**: Native camera API for sub-second capture/analyze flow.
- **Glassmorphism UI**: Using semi-transparent cards and blurred backgrounds to match modern mobile design trends.

## 4. Implementation Status
- [x] **Project Scaffolding**: Expo project initialized in `/mobile`.
- [x] **Routing**: Expo Router (file-based) configured.
- [x] **UI Framework**: NativeWind (Tailwind) & Lucide Icons integrated.
- [x] **Core Screens**: 
    - `Home`: Dashboard with Health Score.
    - `Analysis`: Camera-first AI vision screen.
    - `Stats`: Weekly macro tracking.
    - `Profile`: User settings and notifications.
- [ ] **Auth Porting**: (Next Step) Bridge or migrate NextAuth to Supabase.
- [ ] **Push Notifications**: Configure Expo Push Service keys.

## 5. How to Run
1. `cd mobile`
2. `npm install`
3. `npx expo start`
