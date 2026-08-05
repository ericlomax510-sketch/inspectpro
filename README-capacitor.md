# Capacitor helper README

This file documents how to build, test, and publish the InspectPro app using Capacitor (branch: capacitor-setup).

Summary of what's included in this branch:
- capacitor.config.json (appId: com.ericlomax510.inspectpro)
- package.json with Capacitor deps + helper scripts
- scripts/build-www.js — copies web files into `www/`
- templates/Info.plist.template — iOS permission entries to add in Xcode if your app uses camera/microphone/photo library
- templates/AndroidManifest.template — Android permission entries to add in AndroidManifest.xml if your app needs camera/audio/storage
- GitHub Actions workflows (Android & iOS) templates to build signed artifacts in CI (require secrets)

Important additions made in this branch:
- No default admin account is seeded by the app (for security).
- Payment keys and booking endpoint are now read from runtime configuration (window.INSPECTPRO_CONFIG) instead of hardcoded values.
- Added .env.example and docs/CONFIG.md describing how to provide runtime config and secrets in CI.
- Added a privacy-policy.md template to the repo — you must host and reference a privacy policy URL when submitting to stores.

Quick local workflow (full):

1) Clone and checkout the branch
   git fetch origin
   git checkout pr-2-additions

2) Install Node deps
   npm install

3) Build the web assets into `www/`
   npm run build:web

4) (Optional) Install common Capacitor plugins and sync
   npm run install:plugins
   # This will install camera, filesystem, splash-screen, status-bar, geolocation and run npx cap sync

5) Add native platforms (first time only)
   npm run add:android
   npm run add:ios    # macOS only

6) Copy/sync web assets into native projects
   npm run cap:sync

7) Open native IDEs
   npm run cap:open:android  # Android Studio
   npm run cap:open:ios      # Xcode (macOS only)

8) Build & sign release binaries (in the native IDE or via CLI)

Android (recommended AAB):
- Generate or reuse a keystore:
  keytool -genkey -v -keystore release.keystore -alias inspectpro -keyalg RSA -keysize 2048 -validity 10000
- Configure signing in Android Studio (Project -> app -> Build Types -> signingConfigs) or edit android/app/build.gradle
- Build a signed AAB via Android Studio: Build -> Generate Signed Bundle/APK -> Android App Bundle
- Or use Gradle in CI/local: ./gradlew bundleRelease (from android/ directory) after configuring signing

iOS (macOS only):
- In Xcode set the Bundle Identifier to com.ericlomax510.inspectpro and your Team
- Ensure Info.plist contains permission keys (see templates/Info.plist.template)
- Product -> Archive -> Upload to App Store Connect

Store requirements & notes:
- Privacy policy URL required on both stores — a template is included in privacy-policy.md; host it on your website and add the URL in store consoles
- App icon and screenshots for required device sizes
- Short & long descriptions, support URL/email
- Data/Privacy declarations in consoles — ensure these match your privacy policy and actual data usage
- Apple: follow in-app purchase rules (digital goods must use StoreKit)

Configuration & secrets
- This repo no longer embeds payment keys or endpoints in source. Provide runtime configuration via a small script in index.html that sets window.INSPECTPRO_CONFIG, or inject during your CI build. See docs/CONFIG.md and .env.example for guidance.

CI tips:
- The workflows in .github/workflows are templates; they need repository secrets for signing artifacts (keystore, passwords, Apple credentials).
- For Android, set KEYS_STORE (base64), KEY_ALIAS, KEY_PASSWORD, STORE_PASSWORD, and configure the gradle signing step to write the keystore file in a step, then configure Gradle signing or use environment variables.
- For iOS, use fastlane or use secrets for Apple ID / app-specific passwords / provisioning profiles or use GitHub's App Store Connect integration.

If you want, I can help you configure the CI with your secrets or walk you through the store submission steps (Google Play Console or App Store Connect) interactively.
