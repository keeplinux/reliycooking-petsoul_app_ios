#!/bin/sh
set -eu
# The shared app must be built first; use npm run build:ios.
xcrun simctl install booted .build/ios/Build/Products/Debug-iphonesimulator/App.app
xcodegen generate --spec tests/ios/project.yml
xcodebuild -project tests/ios/ParityTests.xcodeproj -scheme ParityUITests \
  -destination "platform=iOS Simulator,name=${IOS_SIMULATOR_NAME:-iPhone 17 Pro}" \
  -derivedDataPath .build/ios-tests CODE_SIGNING_ALLOWED=NO test
