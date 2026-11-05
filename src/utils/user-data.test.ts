import { retrieveUserData, writeToUserData } from './user-data';
import { savedNotesArrayMock } from '../../test/sample-music/sample-component-data';

it('preserves existing saved bars in both historical storage shapes', () => {
  for (const bars of [{ savedNotesArr: savedNotesArrayMock }, savedNotesArrayMock]) {
    localStorage.setItem('userData', JSON.stringify({ appStep: 1, userKey: 'D', ...bars }));
    expect(retrieveUserData()).toEqual({ appStep: 1, userKey: 'D', savedNotesArr: savedNotesArrayMock });
  }
});
it('recovers from corrupted and unavailable storage', () => {
  localStorage.setItem('userData', '{invalid');
  expect(retrieveUserData()).toEqual({ appStep: 0, userKey: 'C' });
  const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  expect(retrieveUserData()).toEqual({ appStep: 0, userKey: 'C' });
  read.mockRestore();
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
  expect(() => writeToUserData({ appStep: 0, userKey: 'C' })).not.toThrow();
  write.mockRestore();
});
