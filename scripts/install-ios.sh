#!/bin/sh
set -eu
: "${IOS_DEVELOPMENT_TEAM:?Set IOS_DEVELOPMENT_TEAM to your Apple Developer Team ID}"
: "${IOS_DEVICE_ID:?Set IOS_DEVICE_ID to the connected iPhone identifier}"
npm run sync
npm run verify:parity
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination "platform=iOS,id=$IOS_DEVICE_ID" -derivedDataPath .build/device \
  DEVELOPMENT_TEAM="$IOS_DEVELOPMENT_TEAM" -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration build
app=.build/device/Build/Products/Debug-iphoneos/App.app
codesign --verify --deep --strict "$app"
xcrun devicectl device install app --device "$IOS_DEVICE_ID" "$app"
xcrun devicectl device process launch --device "$IOS_DEVICE_ID" com.pawlink.petwater
