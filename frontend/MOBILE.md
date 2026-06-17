# Pipey Mobile App

The Pipey mobile app is built on **Capacitor** — this lets you use a single codebase for web, iOS, and Android.

## Requirements

### For iOS
- macOS with Xcode 15+
- iOS 14+ for testing
- Apple Developer Account for publishing

### For Android
- Android Studio (Arctic Fox+)
- Android SDK 24+ (Android 7.0+)
- JDK 17+

## Initial setup

```bash
# Install dependencies
cd frontend
npm install

# Initialize Capacitor (if not already done)
npx cap init Pipey ru.pipey.app

# Add platforms
npx cap add ios
npx cap add android
```

## Building

### For web (PWA)
```bash
npm run build
```

### For iOS
```bash
# Build and open in Xcode
npm run mobile:ios

# Or step by step:
BUILD_MODE=capacitor npm run build
npx cap sync ios
npx cap open ios
```

### For Android
```bash
# Build and open in Android Studio
npm run mobile:android

# Or step by step:
BUILD_MODE=capacitor npm run build
npx cap sync android
npx cap open android
```

## Configuring the API URL

For mobile apps, you need to specify the full URL of the API server.

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://api.pipey.ru
```

Or for development:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
```

⚠️ **Important**: For the iOS simulator, use your computer's IP, not `localhost`.

## iOS: Configuration in Xcode

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select a Team under Signing & Capabilities
3. Change the Bundle Identifier if needed
4. Add icons to Assets.xcassets

### iOS icons
Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 1024x1024 (App Store)
- 180x180, 167x167, 152x152, 120x120, etc.

## Android: Configuration in Android Studio

1. Open `android/` in Android Studio
2. Sync Gradle
3. Configure the signing config for the release build

### Android icons
Place icons in `android/app/src/main/res/`:
- mipmap-xxxhdpi (192x192)
- mipmap-xxhdpi (144x144)
- mipmap-xhdpi (96x96)
- mipmap-hdpi (72x72)
- mipmap-mdpi (48x48)

## Push notifications

### iOS (APNs)
1. Enable Push Notifications in Xcode capabilities
2. Create an APNs key in the Apple Developer Portal
3. Configure the server to send push notifications

### Android (FCM)
1. Create a project in the Firebase Console
2. Download `google-services.json`
3. Place it in `android/app/`

## Publishing

### App Store (iOS)
1. Archive in Xcode
2. Upload to App Store Connect
3. Fill in the app metadata
4. Submit for Review

### Google Play (Android)
1. Build → Generate Signed Bundle
2. Upload the AAB to the Google Play Console
3. Fill in the Store Listing
4. Release to the desired track

## Project structure

```
frontend/
├── capacitor.config.ts    # Capacitor config
├── ios/                   # iOS project (Xcode)
│   └── App/
├── android/               # Android project (Gradle)
│   └── app/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker
│   └── icons/             # App icons
└── app/                   # Next.js application
```

## Debugging

### iOS Simulator
```bash
npx cap run ios
```

### Android Emulator
```bash
npx cap run android
```

### Logs
```bash
# iOS
npx cap run ios --livereload

# Android
npx cap run android --livereload
```

## Common issues

### "Unable to load asset" on iOS
Make sure `webDir` in capacitor.config.ts points to the build folder.

### White screen on Android
Check that `androidScheme: 'https'` is set in the config.

### API not working
Check CORS on the server and that `NEXT_PUBLIC_API_URL` is correct.
