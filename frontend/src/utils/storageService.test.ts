/* eslint-disable no-undef */
import { StorageService } from './storageService';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getItem returns fallback when item is absent', () => {
    const value = StorageService.getItem('non_existent_key', 'fallback_value');
    expect(value).toBe('fallback_value');
  });

  test('setItem and getItem correctly store and retrieve typed objects', () => {
    const testObj = { readinessScore: 85, visits: 3 };
    const success = StorageService.setItem('test_key', testObj);
    expect(success).toBe(true);

    const retrieved = StorageService.getItem('test_key', { readinessScore: 0, visits: 0 });
    expect(retrieved).toEqual(testObj);
  });

  test('removeItem removes item from storage', () => {
    StorageService.setItem('temp_key', 'temp_value');
    expect(StorageService.getItem('temp_key', null)).toBe('temp_value');

    StorageService.removeItem('temp_key');
    expect(StorageService.getItem('temp_key', null)).toBeNull();
  });
});
