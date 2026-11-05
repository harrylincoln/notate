import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete window.gtag;
  delete window.dataLayer;
  delete window['ga-disable-G-JT1NTG52R1'];
  document.querySelectorAll('[data-notes-analytics]').forEach(script => script.remove());
});

it('initializes the existing property once and sends only one automatic pageview config', async () => {
  const { initializeAnalytics, trackEvent } = await import('./analytics');
  initializeAnalytics();
  initializeAnalytics();
  const queue = window.dataLayer!.map(item => Array.from(item as ArrayLike<unknown>));
  expect(queue.filter(item => item[0] === 'config')).toEqual([
    ['config', 'G-JT1NTG52R1', { page_location: window.location.origin + window.location.pathname }],
  ]);
  expect(document.querySelectorAll('[data-notes-analytics]')).toHaveLength(1);
  trackEvent('converter_started');
  const event = Array.from(window.dataLayer!.at(-1) as ArrayLike<unknown>);
  expect(event).toEqual(['event', 'converter_started']);
});

it('respects the existing Google opt-out flag before initialization and before each event', async () => {
  const { initializeAnalytics, trackEvent } = await import('./analytics');
  window['ga-disable-G-JT1NTG52R1'] = true;
  initializeAnalytics();
  expect(window.gtag).toBeUndefined();
  delete window['ga-disable-G-JT1NTG52R1'];
  initializeAnalytics();
  const length = window.dataLayer!.length;
  window['ga-disable-G-JT1NTG52R1'] = true;
  trackEvent('conversion_completed');
  expect(window.dataLayer).toHaveLength(length);
});

it('contains analytics errors and sends no events before initialization', async () => {
  const { initializeAnalytics, trackEvent } = await import('./analytics');
  trackEvent('conversion_completed');
  expect(window.dataLayer).toBeUndefined();
  window.gtag = () => { throw new Error('Tracking blocked'); };
  expect(initializeAnalytics).not.toThrow();
  expect(() => trackEvent('conversion_completed')).not.toThrow();
});
