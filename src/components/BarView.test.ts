import { mount } from '@vue/test-utils';
import BarView from './BarView.vue';
import { savedNotesArrayMock } from '../../test/sample-music/sample-component-data';
import type { SavedBars } from '../types';
import { trackEvent } from '../utils/analytics';
vi.mock('../utils/analytics', () => ({ trackEvent: vi.fn() }));
const data = { userKey: 'C', appStep: 1 as const };
const canvasEvent = { clientX: 40, clientY: 337 };

it('draws the staves and middle-C ledger and note on hover', async () => {
  const wrapper = mount(BarView, { props: { userData: data } });
  const ctx = wrapper.get('canvas').element.getContext('2d')!;
  expect(ctx.lineTo).toHaveBeenCalledWith(800, 300);
  await wrapper.get('canvas').trigger('mousemove', canvasEvent);
  expect(ctx.moveTo).toHaveBeenCalledWith(4, 340);
  expect(ctx.lineTo).toHaveBeenCalledWith(76, 340);
  expect(ctx.fill).toHaveBeenCalled();
  expect(ctx.moveTo).toHaveBeenCalledWith(64, 340);
  expect(ctx.lineTo).toHaveBeenCalledWith(64, 232);
});

it('plots immediately on click and emits start only once', async () => {
  const wrapper = mount(BarView, { props: { userData: data } });
  await wrapper.get('canvas').trigger('click', canvasEvent);
  await wrapper.get('canvas').trigger('click', { clientX: 200, clientY: 337 });
  const updates = wrapper.emitted('update')!;
  const saved = (updates.at(-1)![0] as { savedNotesArr: SavedBars }).savedNotesArr;
  expect(saved['1']).toHaveLength(2);
  expect(saved['1'][0].closestStave.note).toEqual({ C: 0 });
  expect(trackEvent).toHaveBeenCalledExactlyOnceWith('converter_started');
});

it('preserves the existing sample tab output and suppresses duplicate completions', async () => {
  const wrapper = mount(BarView, { props: { userData: { ...data, savedNotesArr: savedNotesArrayMock as unknown as SavedBars } } });
  expect(wrapper.find('#tab-table').exists()).toBe(false);
  await wrapper.get('#build-table-btn').trigger('click');
  expect(wrapper.findAll('#tab-table span').map(line => line.text())).toEqual([
    '---------------------------------------------------0------------',
    '-----------------------------------1---------------1------------',
    '-------------------2-------------------------------2------------',
    '---3------------------------------------------------------------',
    '----------------------------------------------------------------',
    '----------------------------------------------------------------',
  ]);
  await wrapper.get('#build-table-btn').trigger('click');
  expect(trackEvent).toHaveBeenCalledExactlyOnceWith('conversion_completed');
});

it('does not report a completion for empty input or a failed conversion', async () => {
  const empty = mount(BarView, { props: { userData: data } });
  await empty.get('#build-table-btn').trigger('click');
  expect(empty.get('[role="alert"]').text()).toContain('at least one');
  const failed = mount(BarView, { props: { userData: { ...data, savedNotesArr: savedNotesArrayMock as unknown as SavedBars } } });
  await failed.get('#fret-min').setValue(99);
  await failed.get('#fret-max').setValue(100);
  await failed.get('#build-table-btn').trigger('click');
  expect(failed.get('[role="alert"]').text()).toContain('out of bounds');
  expect(trackEvent).not.toHaveBeenCalled();
});

it('uses eighth-note grid snapping and sharp/flat overrides', async () => {
  const wrapper = mount(BarView, { props: { userData: data } });
  await wrapper.findAll('.time-grid-toggle-btn')[3].trigger('click');
  await wrapper.get('#add-sharp-btn').trigger('click');
  await wrapper.get('canvas').trigger('click', { clientX: 120, clientY: 337 });
  const saved = (wrapper.emitted('update')![0][0] as { savedNotesArr: SavedBars }).savedNotesArr['1'][0];
  expect(saved.closestBeatX).toBe(120);
  expect(saved.activeNoteLength).toBe(8);
  expect(saved.accidentalOverride).toBe('sharp');
  await wrapper.get('#add-flat-btn').trigger('click');
  expect(wrapper.get('#add-flat-btn').attributes('aria-pressed')).toBe('true');
  await wrapper.get('#add-flat-btn').trigger('click');
  expect(wrapper.get('#add-flat-btn').attributes('aria-pressed')).toBe('false');
});

it('navigates bars, clears saved notes and emits reset', async () => {
  const wrapper = mount(BarView, { props: { userData: data } });
  expect(wrapper.get('#decrement-bar').attributes('disabled')).toBeDefined();
  await wrapper.get('#increment-bar').trigger('click');
  await wrapper.get('canvas').trigger('click', canvasEvent);
  const clear = wrapper.findAll('button').find(button => button.text() === 'Clear bar')!;
  await clear.trigger('click');
  const saved = (wrapper.emitted('update')!.at(-1)![0] as { savedNotesArr: SavedBars }).savedNotesArr;
  expect(saved['2']).toEqual([]);
  await wrapper.get('#decrement-bar').trigger('click');
  expect(wrapper.get('#decrement-bar').attributes('disabled')).toBeDefined();
  await wrapper.get('#reset-app-btn').trigger('click');
  expect(wrapper.emitted('reset')).toHaveLength(1);
});
