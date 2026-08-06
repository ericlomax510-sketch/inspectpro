# InspectPro — Local Development Guide (iOS & Android)

> **Goal:** Build and run InspectPro on a real iOS or Android device (or simulator/emulator) straight from your Mac, then produce a signed release artifact for store submission.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Build Web Assets](#3-build-web-assets)
4. [Add Native Platforms](#4-add-native-platforms)
5. [Install Capacitor Plugins & Sync](#5-install-capacitor-plugins--sync)
6. [iOS Development Setup](#6-ios-development-setup)
7. [Android Development Setup](#7-android-development-setup)
8. [Release Configuration](#8-release-configuration)
9. [Testing Checklist](#9-testing-checklist)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Required on All Machines

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 18 LTS or newer | https://nodejs.org |
| npm | 9+ (ships with Node 18) | bundled |
| Git | any recent | https://git-scm.com |

Check your versions:

```bash
node -v     # should print v18.x.x or higher
npm -v      # should print 9.x.x or higher
git --version
```

---

### iOS Prerequisites (macOS only)

| Tool | Minimum Version | Install |
|------|----------------|---------|
| macOS | Ventura (13) or newer | System Update |
| Xcode | 14+ | Mac App Store |
| Xcode Command Line Tools | matches Xcode | `xcode-select --install` |
| CocoaPods | 1.11+ | `sudo gem install cocoapods` |
| Apple Developer Account | any (free for device testing, paid for distribution) | https://developer.apple.com |

```bash
# Verify Xcode CLI tools
xcode-select -p          # should print /Applications/Xcode.app/Contents/Developer

# Verify CocoaPods
pod --version            # should print 1.11.x or higher
```

---

### Android Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Android Studio | Electric Eel or newer | https://developer.android.com/studio |
| JDK | 17 (bundled in Android Studio) | ships with Android Studio |
| Android SDK | API 33 (Android 13) | via Android Studio SDK Manager |
| Android Build Tools | 33.0.x | via Android Studio SDK Manager |

After installing Android Studio, open **SDK Manager** (`Tools → SDK Manager`) and install:
- Android SDK Platform 33
- Android SDK Build-Tools 33.0.x
- Android Emulator
- Intel x86 Emulator Accelerator (HAXM) — Intel Macs only

Set your `ANDROID_HOME` environment variable:

```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

```bash
# Reload your shell, then verify
source ~/.zshrc
adb --version
```

---

## 2. Clone & Install

```bash
# Clone the repo (use your fork URL if applicable)
git clone https://github.com/ericlomax510-sketch/inspectpro.git
cd inspectpro

# Install all JavaScript dependencies (Capacitor CLI, Core, plugins)
npm install
```

---

## 3. Build Web Assets

Capacitor wraps your web app. Before adding native platforms you need to build the web files into the `www/` folder.

```bash
npm run build:web
```

This runs `node scripts/build-www.js` which copies your HTML, JS, and CSS files into `www/`. Verify the folder was created:

```bash
ls www/        # should show index.html, app.js, style.css, etc.
```

> **Note:** Run `npm run build:web` any time you change your web source files before re-syncing to the native projects.

---

## 4. Add Native Platforms

> **First-time only.** Skip this step if the `ios/` or `android/` folders already exist.

```bash
# iOS (macOS only)
npm run add:ios

# Android (any OS)
npm run add:android
```

These commands run `npx cap add ios` and `npx cap add android`, which scaffold the full native project structures inside `ios/` and `android/`.

---

## 5. Install Capacitor Plugins & Sync

```bash
# Install camera, filesystem, geolocation, splash-screen, status-bar and sync
npm run install:plugins
```

This is equivalent to:

```bash
npm install @capacitor/camera @capacitor/filesystem @capacitor/splash-screen \
            @capacitor/status-bar @capacitor/geolocation
npx cap sync
```

After the initial install, any time you change web files **or** install a new plugin, run:

```bash
npm run cap:sync
```

This copies web assets into both native projects **and** updates native plugin bindings.

---

## 6. iOS Development Setup

### 6.1 Open in Xcode

```bash
npm run cap:open:ios
# or directly:
npx cap open ios
```

This opens `ios/App/App.xcodeproj` in Xcode.

---

### 6.2 Configure Team Signing

1. In Xcode, select the **App** project in the left navigator.
2. Select the **App** target (not the project).
3. Click the **Signing & Capabilities** tab.
4. Under **Signing**, set:
   - **Automatically manage signing** → ✅ checked
   - **Team** → select your Apple Developer account
   - **Bundle Identifier** → `com.ericlomax510.inspectpro`

> If you don't have a paid Apple Developer account, Xcode will sign for free (7-day expiry, device testing only).

---

### 6.3 Add Permission Descriptions to Info.plist

Xcode will reject or crash the app without these strings. In Xcode:

1. Open `ios/App/App/Info.plist`
2. Right-click → **Open As → Source Code**
3. Paste the following inside the top-level `<dict>`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture vehicle photos for inspection reports.</string>

<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record walk-around videos for inspections.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to attach or save inspection photos.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app saves inspection photos to your photo library.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses your location to tag inspection reports with the vehicle's service location.</string>
```

These strings match the templates in `templates/Info.plist.template`.

---

### 6.4 Run on Simulator

1. In Xcode, pick a simulator from the device drop-down (e.g., **iPhone 15**).
2. Press **⌘R** (or click the ▶ button).

> **Tip:** The camera does not work in the simulator. Use a real device to test camera/video.

---

### 6.5 Run on a Physical iPhone

1. Connect your iPhone via USB.
2. Trust the computer on the device prompt.
3. Select your device from the drop-down in Xcode.
4. Press **⌘R**.

On first run, go to **Settings → General → VPN & Device Management** on your iPhone and trust your developer certificate.

---

### 6.6 Test Permissions on iOS

| Permission | How to Trigger | Expected Behaviour |
|---|---|---|
| Camera | Tap "Add Photo" in inspection | System dialog asking for camera access |
| Microphone | Start video recording | System dialog asking for microphone access |
| Photo Library | Save captured photo | System dialog asking for library access |
| Location | Open location field | System dialog asking for location access |

To reset permissions for testing:

```bash
# Reset all permissions for the app on simulator
xcrun simctl privacy booted reset all com.ericlomax510.inspectpro
```

---

## 7. Android Development Setup

### 7.1 Open in Android Studio

```bash
npm run cap:open:android
# or directly:
npx cap open android
```

This opens the `android/` folder as a project in Android Studio. Wait for the **Gradle sync** to finish (progress bar at the bottom).

---

### 7.2 Configure SDK Paths

If Android Studio shows "SDK not found":

1. Go to **File → Project Structure → SDK Location**.
2. Set **Android SDK Location** (usually `~/Library/Android/sdk` on Mac, `C:\Users\<you>\AppData\Local\Android\Sdk` on Windows).

---

### 7.3 Add Permissions to AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add inside the `<manifest>` tag, **before** `<application>`:

```xml
<!-- Camera and microphone for inspections -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- File access (Android 9 and below) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Internet (usually already present) -->
<uses-permission android:name="android.permission.INTERNET" />
```

These match the templates in `templates/AndroidManifest.template`.

---

### 7.4 Set SDK Versions

Open `android/app/build.gradle` and confirm (or adjust) these values:

```gradle
android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "com.ericlomax510.inspectpro"
        minSdkVersion 22       // Android 5.1 — covers ~99% of devices
        targetSdkVersion 33    // Android 13
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

### 7.5 Run on Emulator

1. In Android Studio, open **Device Manager** (right toolbar).
2. Create a new device: **Pixel 6**, API 33, x86_64.
3. Click ▶ to start the emulator.
4. Press **⇧F10** or click **Run** to install and launch the app.

---

### 7.6 Run on a Physical Android Device

1. On your Android phone: **Settings → About Phone → tap "Build number" 7 times** to enable developer mode.
2. Go to **Settings → Developer Options → USB Debugging** → enable it.
3. Connect via USB and accept the "Allow USB debugging" prompt.
4. Your device should appear in Android Studio's device drop-down.
5. Click **Run**.

---

### 7.7 Test Permissions on Android

| Permission | How to Trigger | Expected Behaviour |
|---|---|---|
| Camera | Tap "Add Photo" | Runtime permission dialog |
| Microphone | Start video | Runtime permission dialog |
| Storage (≤ Android 12) | Save file | Runtime permission dialog |
| Location | Open location field | Runtime permission dialog |

To reset permissions via adb:

```bash
adb shell pm reset-permissions com.ericlomax510.inspectpro
```

---

## 8. Release Configuration

### 8.1 Version Numbering Strategy

Edit these two files before each release:

| File | Field | Purpose |
|------|-------|---------|
| `package.json` | `"version"` | Human-readable version shown in stores (e.g. `"1.2.0"`) |
| `android/app/build.gradle` | `versionName` | Store display version |
| `android/app/build.gradle` | `versionCode` | Integer — increment by 1 each upload |
| Xcode → App target → General | **Version** | Store display version (e.g. `1.2.0`) |
| Xcode → App target → General | **Build** | Integer or string — increment each upload |

**Recommended convention:**
- `versionName` / Version: `MAJOR.MINOR.PATCH` (e.g. `1.0.0`)
- `versionCode` / Build: Increment monotonically (1, 2, 3 …)

---

### 8.2 iOS: Create Distribution Certificate & Provisioning Profile

> Requires a paid Apple Developer Program membership ($99/year).

1. Log in to [developer.apple.com](https://developer.apple.com) → **Certificates, IDs & Profiles**.
2. **Create an App ID:**
   - Identifiers → **+** → App IDs → App
   - Bundle ID: `com.ericlomax510.inspectpro`
   - Capabilities: enable **Push Notifications** if needed
3. **Create a Distribution Certificate:**
   - Certificates → **+** → Apple Distribution
   - Follow the prompts to create a CSR using Keychain Access
4. **Create a Provisioning Profile:**
   - Profiles → **+** → App Store Connect
   - Select your App ID and Distribution Certificate
   - Download and double-click to install in Xcode
5. In Xcode → **Signing & Capabilities**:
   - Uncheck "Automatically manage signing" (for distribution)
   - Select your provisioning profile

---

### 8.3 iOS: Archive & Upload to App Store

```
Xcode menu → Product → Archive
```

After archiving:
1. **Distribute App** → **App Store Connect** → **Upload**
2. Wait ~15 minutes for processing in [App Store Connect](https://appstoreconnect.apple.com)
3. Add the build to a TestFlight group or submit for review

---

### 8.4 Android: Generate Release Keystore

> Do this **once** and keep the keystore file safe — losing it means you can never update your app.

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias inspectpro \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- Keystore password (save this!)
- Key alias password (can be same as keystore password)
- Name, org, city, country

Store `release.keystore` somewhere **outside** the repo (e.g. `~/.android/release.keystore`). Add it to `.gitignore`:

```
release.keystore
*.jks
```

---

### 8.5 Android: Configure Gradle Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("STORE_PASSWORD") ?: "your_store_password"
            keyAlias System.getenv("KEY_ALIAS") ?: "inspectpro"
            keyPassword System.getenv("KEY_PASSWORD") ?: "your_key_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

> **Security tip:** Use environment variables or a `keystore.properties` file (added to `.gitignore`) instead of hardcoding passwords.

---

### 8.6 Android: Build Signed AAB

```bash
cd android
./gradlew bundleRelease
```

The output file is at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload this `.aab` to the [Google Play Console](https://play.google.com/console).

---

## 9. Testing Checklist

Run through this checklist on a **real physical device** before submitting to any app store.

### Authentication
- [ ] Tech login with valid credentials succeeds
- [ ] Customer login with valid credentials succeeds
- [ ] Invalid credentials show error messages
- [ ] Logout clears session and returns to login screen

### Camera & Media
- [ ] Camera permission dialog appears on first use
- [ ] Photo capture works and preview shows in inspection form
- [ ] Video recording starts and stops correctly
- [ ] Microphone permission requested during video recording
- [ ] Photos/videos save to the inspection report

### PDF Generation
- [ ] Inspection report generates a PDF
- [ ] PDF contains all entered data (photos, notes, VIN, etc.)
- [ ] PDF can be shared or downloaded

### Stripe Payments
- [ ] Payment screen loads without errors
- [ ] Test card `4242 4242 4242 4242` processes successfully
- [ ] Declined card shows appropriate error
- [ ] Receipt/confirmation screen appears after successful payment

### Geolocation
- [ ] Location permission dialog appears on first use
- [ ] Location is attached to inspection report when available
- [ ] App works gracefully when location is denied

### Data Persistence
- [ ] Data persists after backgrounding and returning to the app
- [ ] Data persists after closing and reopening the app
- [ ] No data loss on network interruption

### General
- [ ] App launches without crashes on a clean install
- [ ] No JavaScript console errors visible via Safari/Chrome DevTools
- [ ] Splash screen and app icon display correctly
- [ ] Status bar is visible and readable on light/dark backgrounds

---

## 10. Troubleshooting

### "No devices available" in Xcode
- Make sure your iPhone is unlocked.
- Unplug and replug the USB cable.
- In Xcode: **Window → Devices and Simulators** — check if device is listed.
- Try: `sudo xcode-select --switch /Applications/Xcode.app`

### CocoaPods errors on `cap sync`
```bash
cd ios/App
pod repo update
pod install
```

If it still fails:
```bash
sudo gem install cocoapods --pre
pod deintegrate
pod install
```

### `JAVA_HOME` not found (Android)
Android Studio ships with a bundled JDK. Point to it:

```bash
# macOS — adjust the version number to match your installation
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

### Gradle sync fails in Android Studio
1. **File → Invalidate Caches → Invalidate and Restart**
2. If that fails: delete `.gradle` cache and retry:
   ```bash
   rm -rf ~/.gradle/caches
   ```
3. Check your Android SDK path is set correctly (**File → Project Structure → SDK Location**).

### Camera returns blank / black screen on device
- Make sure all `NSCameraUsageDescription` / `CAMERA` permissions are in place (see sections 6.3 and 7.3).
- On Android: check that `@capacitor/camera` is listed in `android/app/src/main/AndroidManifest.xml` provider entries (Capacitor adds these automatically during `cap sync`).
- Run `npm run cap:sync` again after any plugin changes.

### Permission denied after previously granting
- iOS: **Settings → Privacy → [Permission Type]** → find InspectPro → toggle back on.
- Android: **Settings → Apps → InspectPro → Permissions** → grant the required permissions.
- To reset during development (simulator/emulator):
  ```bash
  # iOS Simulator
  xcrun simctl privacy booted reset all com.ericlomax510.inspectpro
  # Android Emulator
  adb shell pm reset-permissions com.ericlomax510.inspectpro
  ```

### App crashes immediately on launch
1. Check the Xcode console for the crash log.
2. Common causes:
   - Missing permission key in `Info.plist` — iOS will crash silently if you access camera/location without the usage description.
   - Capacitor web runtime can't find `www/index.html` — run `npm run build:web && npm run cap:sync` again.

### Signing certificate issues (iOS)
- Error "No signing certificate found": Re-download your certificate from developer.apple.com and double-click to install.
- Provisioning profile mismatch: Delete all provisioning profiles in Xcode (**Preferences → Accounts → Manage Certificates**) and refresh.
- If using "Automatically manage signing", ensure your Apple ID is added in **Xcode → Preferences → Accounts**.

### App rejected by App Store — missing privacy policy
- Host a privacy policy at a public URL (e.g. your Vercel deployment: `https://your-app.vercel.app/privacy`).
- Add the URL in App Store Connect under **App Information → Privacy Policy URL**.
- See the companion privacy policy files in this repository for a template.

---

## Quick Reference — Most Used Commands

```bash
# Full workflow from scratch
npm install
npm run build:web
npm run add:ios          # first time only, macOS
npm run add:android      # first time only
npm run install:plugins  # first time only
npm run cap:sync

# Day-to-day: after changing web files
npm run build:web
npm run cap:sync

# Open native IDEs
npm run cap:open:ios
npm run cap:open:android

# Build signed Android AAB for release
cd android && ./gradlew bundleRelease
```

---

*For CI/CD setup (GitHub Actions for automated builds), see the `.github/workflows/` templates and the notes in `README-capacitor.md`.*
