# Firebase Cloud Messaging - Mobile App Integration Guide

This guide covers setting up push notifications in your React Native mobile app for both **iOS** and **Android**.

---

## 📱 Prerequisites

- React Native project (TiptopApp)
- Firebase project created at https://console.firebase.google.com/
- Firebase service account configured in backend

---

## Step 1: Install Required Packages

```bash
cd /home/naitik2408/Contribution/TiptopApp

# Install React Native Firebase
npm install @react-native-firebase/app @react-native-firebase/messaging

# For iOS only - install pods
cd ios && pod install && cd ..
```

---

## Step 2: Configure Firebase for Android

### 2.1 Download `google-services.json`

1. Go to Firebase Console → Project Settings
2. Select your Android app (or add one if not exists)
3. Download `google-services.json`
4. Place it in: `/TiptopApp/android/app/google-services.json`

### 2.2 Update Android Files

**File: `/TiptopApp/android/build.gradle`**

```gradle
buildscript {
    dependencies {
        // ... other dependencies
        classpath('com.google.gms:google-services:4.4.0')  // Add this line
    }
}
```

**File: `/TiptopApp/android/app/build.gradle`**

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // Add this line at the top

android {
    // ... existing config
}

dependencies {
    // ... existing dependencies
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

**File: `/TiptopApp/android/app/src/main/AndroidManifest.xml`**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Add these permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application>
        <!-- ... existing config -->
        
        <!-- Add Firebase Messaging Service -->
        <service
            android:name=".MessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
        
        <!-- Default notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="orders" />
            
    </application>
</manifest>
```

---

## Step 3: Configure Firebase for iOS

### 3.1 Download `GoogleService-Info.plist`

1. Go to Firebase Console → Project Settings
2. Select your iOS app (or add one if not exists)
3. Download `GoogleService-Info.plist`
4. Open Xcode: `open ios/TiptopApp.xcworkspace`
5. Drag `GoogleService-Info.plist` into the project (under TiptopApp folder)
6. Ensure "Copy items if needed" is checked

### 3.2 Update iOS Files

**File: `/TiptopApp/ios/Podfile`**

```ruby
platform :ios, '13.0'

target 'TiptopApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )

  # Add Firebase pods
  pod 'Firebase/Messaging'

  post_install do |installer|
    # ... existing post_install config
  end
end
```

Run: `cd ios && pod install && cd ..`

### 3.3 Enable Push Notifications Capability

1. Open Xcode: `open ios/TiptopApp.xcworkspace`
2. Select your project target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Push Notifications**
6. Add **Background Modes** → Check "Remote notifications"

### 3.4 Upload APNs Certificate to Firebase

1. Create APNs key at https://developer.apple.com/account/resources/authkeys/list
2. Download the `.p8` file
3. Go to Firebase Console → Project Settings → Cloud Messaging
4. Upload APNs Authentication Key

---

## Step 4: Implement FCM in React Native

### 4.1 Create Notification Service

**File: `/TiptopApp/src/services/notification.service.ts`**

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import axios from 'axios';
import { API_URL } from '../api/client';

class NotificationService {
  private fcmToken: string | null = null;

  /**
   * Initialize notification service and request permissions
   */
  async initialize() {
    try {
      // Request permission (iOS only)
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('❌ Push notification permission denied');
          return false;
        }
      }

      // Request permission (Android 13+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Android notification permission denied');
          return false;
        }
      }

      // Get FCM token
      await this.getFCMToken();

      // Listen for token refresh
      messaging().onTokenRefresh(token => {
        console.log('📱 FCM Token refreshed');
        this.fcmToken = token;
        this.registerTokenWithBackend(token);
      });

      // Set up notification handlers
      this.setupNotificationHandlers();

      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Get FCM device token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('📱 FCM Token:', token);
      this.fcmToken = token;
      return token;
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerTokenWithBackend(token?: string) {
    try {
      const fcmToken = token || this.fcmToken;
      if (!fcmToken) {
        console.warn('⚠️  No FCM token available to register');
        return false;
      }

      const response = await axios.post(
        `${API_URL}/auth/device-token`,
        {
          token: fcmToken,
          platform: Platform.OS as 'ios' | 'android',
          deviceId: Platform.OS === 'ios' 
            ? await messaging().getAPNSToken() 
            : null,
        }
      );

      console.log('✅ Device token registered with backend');
      return true;
    } catch (error) {
      console.error('❌ Failed to register token with backend:', error);
      return false;
    }
  }

  /**
   * Remove device token from backend
   */
  async removeTokenFromBackend() {
    try {
      if (!this.fcmToken) return false;

      await axios.delete(`${API_URL}/auth/device-token`, {
        data: { token: this.fcmToken },
      });

      console.log('✅ Device token removed from backend');
      return true;
    } catch (error) {
      console.error('❌ Failed to remove token from backend:', error);
      return false;
    }
  }

  /**
   * Set up notification handlers
   */
  setupNotificationHandlers() {
    // Handle notifications when app is in foreground
    messaging().onMessage(async remoteMessage => {
      console.log('📬 Notification received (foreground):', remoteMessage);
      
      // Show local notification or update UI
      this.handleNotification(remoteMessage);
    });

    // Handle notification when app is opened from background/quit state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📬 Notification opened app from background:', remoteMessage);
      
      // Navigate to specific screen based on notification data
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app was opened from a notification (killed state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📬 Notification opened app from killed state:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });

    // Handle background messages (optional - for data-only messages)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📬 Background notification received:', remoteMessage);
    });
  }

  /**
   * Handle incoming notification
   */
  handleNotification(remoteMessage: any) {
    const { notification, data } = remoteMessage;
    
    console.log('Notification Title:', notification?.title);
    console.log('Notification Body:', notification?.body);
    console.log('Notification Data:', data);

    // You can show a local notification or update app state here
    // For example, update order status in context/Redux
  }

  /**
   * Handle notification press
   */
  handleNotificationPress(remoteMessage: any) {
    const { data } = remoteMessage;
    
    console.log('User tapped notification with data:', data);

    // Navigate based on notification type
    if (data?.type === 'NEW_ORDER' || data?.type === 'ORDER_STATUS_UPDATE') {
      // Navigate to order details screen
      // navigation.navigate('OrderDetails', { orderId: data.orderId });
    }
  }

  /**
   * Check if notification permission is granted
   */
  async hasPermission(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
}

export default new NotificationService();
```

### 4.2 Initialize in App Entry Point

**File: `/TiptopApp/App.tsx`** or your main entry file:

```typescript
import React, { useEffect } from 'react';
import notificationService from './src/services/notification.service';
import { AuthProvider } from './src/contexts/AuthContext';

function App() {
  useEffect(() => {
    // Initialize notifications
    const initNotifications = async () => {
      const initialized = await notificationService.initialize();
      
      if (initialized) {
        // Register token with backend after user logs in
        // You might want to do this in your login success handler
        await notificationService.registerTokenWithBackend();
      }
    };

    initNotifications();
  }, []);

  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}

export default App;
```

### 4.3 Register Token After Login

**Update your login/auth context to register token:**

```typescript
// In AuthContext or after successful login
import notificationService from '../services/notification.service';

async function handleLoginSuccess() {
  // After successful login
  await notificationService.registerTokenWithBackend();
}

async function handleLogout() {
  // Before logout
  await notificationService.removeTokenFromBackend();
}
```

---

## Step 5: Test Push Notifications

### Test from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token (from app logs)
6. Send

### Test from Backend (Order Creation)

1. Create a new order in your app
2. Check backend logs for: `Sending push notification to X device(s)`
3. Notification should appear on your device

---

## 🔧 Troubleshooting

### Android Issues

**Problem**: Notifications not received
- ✅ Check `google-services.json` is in correct location
- ✅ Verify `google-services` plugin is applied
- ✅ Rebuild app: `cd android && ./gradlew clean && cd .. && npx react-native run-android`
- ✅ Check Firebase Console → Cloud Messaging for errors

**Problem**: App crashes on startup
- ✅ Check all Firebase dependencies are compatible versions
- ✅ Clear build: `cd android && ./gradlew clean`

### iOS Issues

**Problem**: Notifications not received
- ✅ Verify `GoogleService-Info.plist` is added to Xcode project
- ✅ Check Push Notifications capability is enabled
- ✅ Verify APNs key is uploaded to Firebase
- ✅ Test on real device (push notifications don't work on simulator)

**Problem**: Build errors
- ✅ Run `cd ios && pod install`
- ✅ Clean build folder in Xcode: Product → Clean Build Folder
- ✅ Rebuild: `npx react-native run-ios`

---

## 📊 Monitoring

### Check Backend Logs (Render)

```
✅ Order notification sent successfully. FCM Response: projects/xxx/messages/xxx
```

### Check Mobile App Logs

```
📱 FCM Token: ey...
✅ Notification service initialized
✅ Device token registered with backend
📬 Notification received (foreground): {...}
```

---

## 🎯 Next Steps

1. ✅ Set up Firebase project
2. ✅ Add Firebase config files to mobile app
3. ✅ Install dependencies
4. ✅ Implement notification service
5. ✅ Register token after login
6. ✅ Test notifications
7. 🔄 Customize notification handling
8. 🔄 Add notification navigation
9. 🔄 Style notification UI

---

## 📚 Resources

- React Native Firebase Docs: https://rnfirebase.io/
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Android Setup: https://rnfirebase.io/messaging/usage#android---manifest
- iOS Setup: https://rnfirebase.io/messaging/usage#ios---requesting-permissions
