'use strict';

// Battery & Electrical: the pure health logic. No SDK, vehicle or capture needed:
//   node kit/tools/test_battery.js

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { assess, chargeFromVoltage, state, sohClass } = require(path.join(ROOT, 'apps/dimon_battery/health'));

let failed = 0;
const check = (name, fn) => {
    try { fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message.split('\n')[0]); }
};
const near = (a, b, tol, what) => assert(Math.abs(a - b) <= tol, what + ': ' + a + ' (want ' + b + ' +-' + tol + ')');

check('chargeFromVoltage follows the table and clamps', () => {
    assert.strictEqual(chargeFromVoltage(13.0), 100, 'above the top clamps to 100');
    assert.strictEqual(chargeFromVoltage(12.8), 100);
    assert.strictEqual(chargeFromVoltage(12.6), 90);
    near(chargeFromVoltage(12.7), 95, 1, '12.7 V interpolates to ~95%');
    assert.strictEqual(chargeFromVoltage(12.2), 55);
    assert.strictEqual(chargeFromVoltage(10.5), 0, 'below the bottom clamps to 0');
    assert.strictEqual(chargeFromVoltage(null), null);
    assert.strictEqual(chargeFromVoltage(NaN), null);
});

check('state reads the IBS current sign', () => {
    assert.strictEqual(state(30), 'charging');
    assert.strictEqual(state(-20), 'discharging');
    assert.strictEqual(state(0.3), 'resting');
    assert.strictEqual(state(null), 'unknown');
});

check('sohClass thresholds', () => {
    assert.strictEqual(sohClass(95), 'good');
    assert.strictEqual(sohClass(80), 'good');
    assert.strictEqual(sohClass(79), 'fair');
    assert.strictEqual(sohClass(60), 'fair');
    assert.strictEqual(sohClass(59), 'poor');
    assert.strictEqual(sohClass(null), 'unknown');
});

check('a healthy charging battery is good with no warnings', () => {
    const a = assess({ voltage: 14.2, current: 30, soc: 85, soh: 90, temp: 28 });
    assert.strictEqual(a.state, 'charging');
    assert.strictEqual(a.verdict, 'good');
    assert.strictEqual(a.charge, 85);
    assert.strictEqual(a.sohClass, 'good');
    assert.deepStrictEqual(a.warnings, []);
});

check('a healthy battery at rest estimates charge from voltage', () => {
    const a = assess({ voltage: 12.7, current: 0.2, soc: null, soh: 88, temp: 22 });
    assert.strictEqual(a.state, 'resting');
    near(a.restCharge, 95, 1, 'rest charge');
    assert.strictEqual(a.charge, a.restCharge, 'charge falls back to the resting estimate');
    assert.strictEqual(a.verdict, 'good');
});

check('low voltage and low charge at rest warn and read aging', () => {
    const a = assess({ voltage: 12.0, current: 0, soc: 40, soh: 85, temp: 10 });
    assert.strictEqual(a.state, 'resting');
    assert(a.warnings.some((w) => /resting voltage/i.test(w)), 'low resting voltage warned');
    assert(a.warnings.some((w) => /under 50/i.test(w)), 'low SOC warned');
    assert.strictEqual(a.verdict, 'aging');
});

check('low state of health is weak', () => {
    const a = assess({ voltage: 12.5, current: 0, soc: 80, soh: 55, temp: 20 });
    assert.strictEqual(a.sohClass, 'poor');
    assert.strictEqual(a.verdict, 'weak');
    assert(a.warnings.some((w) => /health low/i.test(w)), 'health warning');
});

check('a big draw with the engine off warns', () => {
    const a = assess({ voltage: 12.1, current: -50, soc: 70, soh: 85, temp: 20 });
    assert.strictEqual(a.state, 'discharging');
    assert(a.warnings.some((w) => /discharge/i.test(w)), 'high discharge warned');
});

check('no data is handled', () => {
    const a = assess({});
    assert.strictEqual(a.state, 'unknown');
    assert.strictEqual(a.sohClass, 'unknown');
    assert.strictEqual(a.charge, null);
});

if (failed) { console.log('\n' + failed + ' test(s) failed'); process.exit(1); }
console.log('\nall battery tests passed');
