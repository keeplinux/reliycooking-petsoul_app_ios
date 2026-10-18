#!/bin/sh
set -eu
: "${IOS_DEVELOPMENT_TEAM:?Set IOS_DEVELOPMENT_TEAM to your Apple Developer Team ID}"
IOS_EXPORT_METHOD=${IOS_EXPORT_METHOD:-release-testing}
case "$IOS_EXPORT_METHOD" in release-testing|debugging|app-store-connect) ;; *) echo 'Unsupported IOS_EXPORT_METHOD' >&2; exit 1;; esac
if ! security find-identity -v -p codesigning | grep -q '"Apple\|"iPhone'; then
  echo 'No valid Apple signing identity. Configure your developer account and certificate in Xcode first.' >&2
  exit 1
fi
npm run sync
npm run verify:parity
mkdir -p .build/release
python3 - "$IOS_DEVELOPMENT_TEAM" "$IOS_EXPORT_METHOD" <<'PY'
import plistlib,sys
from pathlib import Path
Path('.build/release/ExportOptions.plist').write_bytes(plistlib.dumps({
 'method':sys.argv[2], 'teamID':sys.argv[1], 'signingStyle':'automatic',
 'stripSwiftSymbols':True, 'thinning':'<none>'
}))
PY
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath .build/release/SignedApp.xcarchive \
  -derivedDataPath .build/release/DerivedData DEVELOPMENT_TEAM="$IOS_DEVELOPMENT_TEAM" \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration archive
xcodebuild -exportArchive -archivePath .build/release/SignedApp.xcarchive \
  -exportOptionsPlist .build/release/ExportOptions.plist -exportPath .build/release/export \
  -allowProvisioningUpdates
python3 - <<'PY'
import json,shutil
from pathlib import Path
version=json.loads(Path('package.json').read_text())['version']
ipas=list(Path('.build/release/export').glob('*.ipa'))
if len(ipas)!=1: raise SystemExit('Expected exactly one exported IPA')
target=Path('.build/release')/f'silifield-{version}-ios.ipa'
shutil.copy2(ipas[0],target)
print(f'Exported signed IPA: {target}')
PY
