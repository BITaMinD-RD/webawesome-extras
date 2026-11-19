import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { problemsOf } from '../../vendor/Vendor.js';
import { COPIES, ROOT } from '../vendor.mjs';

for (const copy of COPIES) {
  test(`js/${copy.out} is the generated copy: every file is the one in its manifest and none is missing or extra`, () => {
    assert.deepEqual(problemsOf(join(ROOT, copy.out), copy.own), [], `js/${copy.out} is not edited by hand: change ${copy.repo}/${copy.path} and generate it again with js/tools/vendor.mjs`);
  });
}
