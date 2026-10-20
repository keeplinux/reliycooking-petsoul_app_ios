#!/usr/bin/env python3
"""Validate actual HAP contents against the shared Web manifest, without claiming signing."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('hap', nargs='?', default='harmony/entry/build/default/outputs/default/entry-default-unsigned.hap')
parser.add_argument('--require-release', action='store_true', help='Require a Release package with debugging disabled')
args = parser.parse_args()
path = Path(args.hap)
manifest = json.loads(Path('harmony/web-manifest.json').read_text())
with zipfile.ZipFile(path) as package:
    names = package.namelist()
    if len(names) != len(set(names)):
        raise SystemExit('Duplicate ZIP entries')
    if package.testzip() is not None:
        raise SystemExit('Invalid ZIP CRC')
    module = json.loads(package.read('module.json'))
    if module['app']['bundleName'] != 'com.pawlink.petwater':
        raise SystemExit('Unexpected bundle identity')
    if module['app']['versionName'] != manifest['version']:
        raise SystemExit('Version does not match Web manifest')
    if args.require_release and (module['app'].get('debug') is not False or module['app'].get('buildMode') != 'release'):
        raise SystemExit('Expected a Release package with debugging disabled')
    if not any(name.endswith('.abc') for name in names):
        raise SystemExit('Missing compiled ArkTS bytecode')
    prefix = 'resources/rawfile/public/'
    actual = {name[len(prefix):]: hashlib.sha256(package.read(name)).hexdigest()
              for name in names if name.startswith(prefix) and not name.endswith('/')}
    if actual != manifest['files']:
        raise SystemExit('Packaged Web resources differ from shared manifest')
print(f'PASS HAP: {len(actual)} shared Web resources match SHA-256; ArkTS bytecode, bundle, version and CRC verified.')
print(f'SHA-256: {hashlib.sha256(path.read_bytes()).hexdigest()}')
print('Signing, device compatibility, installation and native runtime are separate checks.')
