import { mount } from '@vue/test-utils';
import App from './App.vue';

it('initializes the default key and updates it as the user types', async () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem');
  const wrapper = mount(App);
  expect(spy).toHaveBeenCalledWith('userData');
  expect(wrapper.get('#userKeyInput').element).toHaveProperty('value', 'C');
  await wrapper.get('#userKeyInput').setValue('d#');
  expect(wrapper.get('#active-key').text()).toBe('D#');
});

it('starts, remembers the converter after a reload, and resets', async () => {
  const wrapper = mount(App);
  await wrapper.get('form').trigger('submit');
  expect(wrapper.find('canvas').exists()).toBe(true);
  expect(JSON.parse(localStorage.getItem('userData')!).appStep).toBe(1);
  const reloaded = mount(App);
  expect(reloaded.find('canvas').exists()).toBe(true);
  await reloaded.get('#reset-app-btn').trigger('click');
  expect(reloaded.find('#userKeyInput').exists()).toBe(true);
  expect(JSON.parse(localStorage.getItem('userData')!)).toEqual({ appStep: 0, userKey: 'C' });
});

it('rejects an unsupported key without breaking the app', async () => {
  const wrapper = mount(App);
  await wrapper.get('#userKeyInput').setValue('invalid');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.get('[role="alert"]').text()).toContain('supported key');
  expect(wrapper.find('canvas').exists()).toBe(false);
});
