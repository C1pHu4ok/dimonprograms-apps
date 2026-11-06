'use strict';

// Track Mode: the LapTimer logic on a hand-driven clock. No SDK, vehicle or capture needed:
//   node kit/tools/test_track_mode.js

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { LapTimer } = require(path.join(ROOT, 'apps/dimon_track_mode/lap'));

let failed = 0;
const check = (name, fn) => {
    try { fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message.split('\n')[0]); }
};
const near = (a, b, tol, what) => assert(Math.abs(a - b) <= tol, what + ': ' + a + ' (want ' + b + ' +-' + tol + ')');

check('the first lap() starts timing and records nothing', () => {
    const tm = new LapTimer({});
    assert.strictEqual(tm.running, false);
    assert.strictEqual(tm.elapsed(5000), 0);
    const r = tm.lap(1000);
    assert.strictEqual(r, null, 'no lap recorded on the start press');
    assert.strictEqual(tm.running, true);
    assert.strictEqual(tm.laps.length, 0);
    near(tm.elapsed(3000), 2, 1e-9, 'elapsed after start');
});

check('sectors close within a lap and sum to the lap time', () => {
    const events = [];
    const tm = new LapTimer({ onLap: (lap, d) => events.push([lap.time, d]) });
    const t = 1000;
    tm.lap(t);                         // start
    tm.feed(t, 100); tm.feed(t + 1000, 200);
    tm.sector(t + 10000);              // S1 = 10
    tm.sector(t + 20000);              // S2 = 10
    const lap1 = tm.lap(t + 30000);    // S3 = 10, lap = 30
    near(lap1.time, 30, 1e-6, 'lap 1 time');
    assert.deepStrictEqual(lap1.sectors.map((s) => Math.round(s)), [10, 10, 10], 'lap 1 sectors');
    assert.strictEqual(lap1.n, 1);
    assert.strictEqual(lap1.delta, null, 'first lap has no delta');
    near(lap1.maxSpeed, 200, 1e-6, 'max speed');
    near(lap1.avgSpeed, 150, 1e-6, 'avg speed');
    assert.strictEqual(events.length, 1, 'onLap fired once');
});

check('a faster lap becomes the best and reports a negative delta', () => {
    const tm = new LapTimer({});
    const t = 1000;
    tm.lap(t);
    tm.sector(t + 10000); tm.sector(t + 20000);
    tm.lap(t + 30000);                 // lap 1: 30 s, sectors 10/10/10
    // lap 2: sectors 9 / 11 / 8 = 28 s
    tm.sector(t + 30000 + 9000);
    tm.sector(t + 30000 + 20000);
    const lap2 = tm.lap(t + 30000 + 28000);
    near(lap2.time, 28, 1e-6, 'lap 2 time');
    assert.deepStrictEqual(lap2.sectors.map((s) => Math.round(s)), [9, 11, 8], 'lap 2 sectors');
    near(lap2.delta, -2, 1e-6, 'delta to previous best');
    assert.strictEqual(tm.best.n, 2, 'lap 2 is the best');
    assert.strictEqual(tm.laps.length, 2);
    assert.strictEqual(tm.laps[0].n, 2, 'newest lap first');
});

check('best sectors and the theoretical best come from the fastest of each', () => {
    const tm = new LapTimer({});
    const t = 0;
    tm.lap(t);
    tm.sector(t + 10000); tm.sector(t + 20000); tm.lap(t + 30000);       // 10/10/10
    tm.sector(t + 30000 + 9000); tm.sector(t + 30000 + 20000); tm.lap(t + 30000 + 28000); // 9/11/8
    assert.deepStrictEqual(tm.bestSectors.map((s) => Math.round(s)), [9, 10, 8], 'best sector per index');
    near(tm.optimal(), 27, 1e-6, 'optimal = 9 + 10 + 8');
    assert(tm.optimal() < tm.best.time, 'optimal is faster than the best actual lap');
});

check('optimal is null until every sector index has a best', () => {
    const tm = new LapTimer({});
    assert.strictEqual(tm.optimal(), null, 'no laps yet');
    const t = 0;
    tm.lap(t);
    tm.sector(t + 10000);              // only S1 closed so far
    tm.lap(t + 25000);                 // lap with 2 sectors (10, 15)
    assert.strictEqual(tm.bestSectors.length, 2);
    near(tm.optimal(), 25, 1e-6, 'optimal over the two sectors it has');
});

check('reset clears everything', () => {
    const tm = new LapTimer({});
    tm.lap(0); tm.sector(10000); tm.lap(30000);
    assert(tm.laps.length === 1 && tm.best);
    tm.reset();
    assert.strictEqual(tm.laps.length, 0);
    assert.strictEqual(tm.best, null);
    assert.strictEqual(tm.bestSectors.length, 0);
    assert.strictEqual(tm.lapCount, 0);
    assert.strictEqual(tm.running, false);
});

check('feeding bad speed values is ignored', () => {
    const tm = new LapTimer({});
    tm.lap(0);
    tm.feed(1000, NaN); tm.feed(1000, null); tm.feed(1000, undefined); tm.feed(1000, 120);
    const lap = tm.lap(10000);
    near(lap.maxSpeed, 120, 1e-6, 'only the valid sample counts');
});

if (failed) { console.log('\n' + failed + ' test(s) failed'); process.exit(1); }
console.log('\nall track_mode tests passed');
