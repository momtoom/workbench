/**
 * A story's `argTypes[key].description` (the Storybook field) is what the
 * Inspector shows on a prop label, so a designer reads the component's own
 * sentence instead of guessing from a name. The prop registry overlay that
 * relabels and regroups controls must carry it through, and may replace it
 * the way it replaces a label.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyWorkbenchPropRegistry,
  setWorkbenchPropRegistryOverride,
} from '../../src/workbench-stories/propRegistry';
import type { WorkbenchStoryControl } from '../../src/workbench-stories/storyTypes';

const TONE_CONTROL: WorkbenchStoryControl = {
  description: 'Visual style variant.',
  key: 'tone',
  label: 'Tone',
  options: ['neutral', 'info'],
  type: 'select',
};
const WIDTH_CONTROL: WorkbenchStoryControl = { key: 'width', label: 'Width', type: 'text' };

test('a story description survives the prop registry overlay', () => {
  setWorkbenchPropRegistryOverride({
    schemaVersion: 1,
    groups: {},
    components: { Widget: { props: { tone: { label: 'Colour' } } } },
  });
  try {
    const [tone, width] = applyWorkbenchPropRegistry([TONE_CONTROL, WIDTH_CONTROL], { name: 'Widget' });
    assert.equal(tone.label, 'Colour');
    assert.equal(tone.description, 'Visual style variant.');
    assert.equal(width.description, undefined);
  } finally {
    setWorkbenchPropRegistryOverride(null);
  }
});

test('the prop registry can replace a description like it replaces a label', () => {
  setWorkbenchPropRegistryOverride({
    schemaVersion: 1,
    groups: {},
    components: { Widget: { props: { tone: { description: 'Sets the badge colour family.' }, width: { description: 'CSS width.' } } } },
  });
  try {
    const [tone, width] = applyWorkbenchPropRegistry([TONE_CONTROL, WIDTH_CONTROL], { name: 'Widget' });
    assert.equal(tone.description, 'Sets the badge colour family.');
    assert.equal(width.description, 'CSS width.');
  } finally {
    setWorkbenchPropRegistryOverride(null);
  }
});

test('a blank registry description does not erase the story sentence', () => {
  setWorkbenchPropRegistryOverride({
    schemaVersion: 1,
    groups: {},
    components: { Widget: { props: { tone: { description: '   ' } } } },
  });
  try {
    const [tone] = applyWorkbenchPropRegistry([TONE_CONTROL], { name: 'Widget' });
    assert.equal(tone.description, 'Visual style variant.');
  } finally {
    setWorkbenchPropRegistryOverride(null);
  }
});
