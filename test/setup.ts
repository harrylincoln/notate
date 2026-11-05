import { afterEach, beforeEach, vi } from 'vitest';
import { enableAutoUnmount } from '@vue/test-utils';
enableAutoUnmount(afterEach);
const context = {
  clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
  ellipse: vi.fn(), fill: vi.fn(), closePath: vi.fn(), bezierCurveTo: vi.fn(),
};
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => context });
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
