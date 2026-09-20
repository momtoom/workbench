/**
 * The Inspector used to be the one write path that never checked a value
 * against the contract its story declared.
 *
 * Agent writes go through the authoring MCP, which reports
 * WB-AUTH-COMPONENT-PROP-OPTION / -TYPE when an authored value falls outside a
 * component's story contract. The in-app Inspector had no equivalent, which is
 * how `size="xs"` reached a page whose Icon declares `size` as a number and
 * rendered 0x0. These cases mirror the authoring core's rules.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findWorkbenchStoryControl,
  findWorkbenchStoryControlViolation,
} from '../../src/workbench-stories/storyControlContract';
import {
  isWorkbenchCsfRuntimeDependencyChangePath,
} from '../../src/workbench-stories/sourceStoryMetadata';
import type { WorkbenchStoryControl } from '../../src/workbench-stories/storyTypes';

const SIZE_CONTROL: WorkbenchStoryControl = {
  key: 'size', label: 'Size', max: 64, min: 8, step: 1, type: 'number',
};
const POSITION_CONTROL: WorkbenchStoryControl = {
  key: 'position', label: 'Position', options: ['inline-start', 'inline-end', 'none'], type: 'select',
};
const DECORATIVE_CONTROL: WorkbenchStoryControl = {
  key: 'decorative', label: 'Decorative', type: 'boolean',
};
const TITLE_CONTROL: WorkbenchStoryControl = {
  key: 'title', label: 'Title', type: 'text',
};

test('the reported case: a t-shirt string on a numeric control is reported', () => {
  const violation = findWorkbenchStoryControlViolation(SIZE_CONTROL, 'xs');
  assert.ok(violation, 'size="xs" should be reported against a number control');
  assert.doesNotMatch(violation, /\bSize\b/, 'the field already carries the prop label');
  assert.match(violation, /Declared as a number/);
});

test('values inside the declared contract are silent', () => {
  assert.equal(findWorkbenchStoryControlViolation(SIZE_CONTROL, 28), null);
  assert.equal(findWorkbenchStoryControlViolation(POSITION_CONTROL, 'none'), null);
  assert.equal(findWorkbenchStoryControlViolation(DECORATIVE_CONTROL, true), null);
});

test('a numeric control reports values outside its declared range', () => {
  assert.match(String(findWorkbenchStoryControlViolation(SIZE_CONTROL, 4)), /outside that range/);
  assert.match(String(findWorkbenchStoryControlViolation(SIZE_CONTROL, 999)), /outside that range/);
});

test('a select reports a value the story never declared', () => {
  const violation = findWorkbenchStoryControlViolation(POSITION_CONTROL, 'sticky');
  assert.ok(violation);
  assert.match(violation, /"inline-start", "inline-end", "none"/);
});

test('a boolean control reports a non-boolean', () => {
  assert.match(String(findWorkbenchStoryControlViolation(DECORATIVE_CONTROL, 'yes')), /Declared as a boolean/);
});

test('free-text controls and cleared values stay silent', () => {
  // A text control declares no value space, and clearing a prop is not a
  // contract question -- reporting either would be noise on every keystroke.
  assert.equal(findWorkbenchStoryControlViolation(TITLE_CONTROL, 'anything at all'), null);
  assert.equal(findWorkbenchStoryControlViolation(SIZE_CONTROL, ''), null);
  assert.equal(findWorkbenchStoryControlViolation(SIZE_CONTROL, undefined), null);
  assert.equal(findWorkbenchStoryControlViolation(undefined, 'xs'), null);
});

test('an empty option list is not treated as a closed contract', () => {
  const control: WorkbenchStoryControl = { key: 'variant', label: 'Variant', options: [], type: 'select' };
  assert.equal(findWorkbenchStoryControlViolation(control, 'anything'), null);
});

test('controls are matched by prop key', () => {
  const controls = [SIZE_CONTROL, POSITION_CONTROL];
  assert.equal(findWorkbenchStoryControl(controls, 'position'), POSITION_CONTROL);
  assert.equal(findWorkbenchStoryControl(controls, 'strokeWidth'), undefined);
  assert.equal(findWorkbenchStoryControl(undefined, 'size'), undefined);
});

test('dependency completion identifies CSF metadata retry events', () => {
  assert.equal(isWorkbenchCsfRuntimeDependencyChangePath('.workbench/dependency-install.json'), true);
  assert.equal(isWorkbenchCsfRuntimeDependencyChangePath('/.workbench/dependency-install.json'), true);
  assert.equal(isWorkbenchCsfRuntimeDependencyChangePath('package.json'), true);
  assert.equal(isWorkbenchCsfRuntimeDependencyChangePath('src/components/Button.stories.tsx'), false);
});
