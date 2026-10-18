import fs from 'node:fs';
import assert from 'node:assert/strict';
import Ajv from 'ajv';

const root = new URL('../protocol/water-device/v1/', import.meta.url);
const validate = new Ajv({ allErrors: true }).compile(JSON.parse(fs.readFileSync(new URL('message.schema.json', root))));
const examples = {};
for (const file of fs.readdirSync(new URL('examples/', root))) {
  const message = JSON.parse(fs.readFileSync(new URL(`examples/${file}`, root)));
  assert(validate(message), `${file}: ${JSON.stringify(validate.errors)}`);
  examples[message.kind] = message;
}
function invalid(name, change, kind = 'telemetry') {
  const message = structuredClone(examples[kind]);
  change(message);
  assert.equal(validate(message), false, `${name} should fail`);
}
invalid('unknown reading cannot be zero', m => { m.payload.temperature.water.value = 0; });
invalid('valid reading requires value', m => { m.payload.temperature.water.quality = 'ok'; });
invalid('unknown level cannot be invented', m => { m.payload.water.clean.percent = 50; });
invalid('percent range', m => { Object.assign(m.payload.water.clean, {mode:'continuous', quality:'ok', percent:101}); });
invalid('binary sensor cannot report percent', m => { Object.assign(m.payload.water.clean, {mode:'binary', quality:'ok', percent:50}); });
invalid('brightness range', m => { m.payload.rgb.brightness = 101; });
invalid('negative capacity', m => { m.payload.storage.freeBytes = -1; });
invalid('missing tank', m => { delete m.payload.water.tray; });
invalid('wrong version', m => { m.schemaVersion = '2.0'; });
invalid('bad timestamp', m => { m.ts = 'yesterday'; });
invalid('unsupported command name', m => { m.payload.name = 'storage.format'; }, 'command');
console.log(`Water protocol: ${Object.keys(examples).length} examples and 11 invalid cases passed.`);
