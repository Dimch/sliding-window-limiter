const {DateTime} = require('luxon');
const {cloneDeep} = require('lodash/fp');
const {RateLimiter} = require('../lib/rate_limiter');
const {Window} = require('../lib/window');
const {NullStore} = require('../lib/null_store');

const MockStoreFactory = () => {
  let internalValue = {
    timeSlices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    updated: '2025-01-01T00:00:00',
    unit: 'second',
    width: 3,
  }
  return ({
    get: jest.fn(name => name !== 'ip-req-per-minute-max10-u00001' ? null : cloneDeep(internalValue)),
    set: jest.fn((name, value) => (internalValue = cloneDeep(value))),
  });
};

const MockStore = MockStoreFactory();

const ErrorStore = ({
  get: jest.fn().mockRejectedValue(new Error('network error')),
  set: jest.fn().mockRejectedValue(new Error('network error')),
});

const DefaultOptions = () => ({
  name: 'ip-req-per-minute-max10-u00001',
  max: 10,
  window: {
    unit: 'second',
    size: 20,
    width: 3,
  },
  store: MockStore,
});

describe('RateLimiter', () => {

  describe('#constructor', () => {
    test('should correctly initialize RateLimiter', () => {
      const lim = new RateLimiter(DefaultOptions());
      expect(lim.windowConfig).toStrictEqual({unit: 'second', size: 20, width: 3});
      expect(lim.max).toBe(10);
      expect(lim.name).toBe('ip-req-per-minute-max10-u00001');
      expect(lim.store).toBe(MockStore);
      expect(lim.window).toBeFalsy();
    });

    test('should throw error if one of properties is invalid', () => {
      let fn = () => new RateLimiter({});
      expect(fn).toThrow('name must be specified and be unique');
      fn = () => new RateLimiter({name: 'ip-hour-0001', max: 0});
      expect(fn).toThrow('max must be a positive number');
      fn = () => new RateLimiter({name: 'ip-hour-0001', max: 20});
      expect(fn).toThrow('store must be specified');
      fn = () => new RateLimiter({name: 'ip-hour-0001', max: 20, store: NullStore});
      expect(fn).toThrow('window configuration must be specified');
    });
  });

  describe('#load', () => {
    test('should correctly initialize RateLimiter and load Window state', async () => {
      const lim = await RateLimiter.load(DefaultOptions());
      expect(lim.name).toBe('ip-req-per-minute-max10-u00001');
      expect(lim.max).toBe(10);
      expect(lim.store).toBe(MockStore);
      expect(MockStore.get).toHaveBeenCalledTimes(1);
      expect(MockStore.get.mock.calls[0][0]).toBe(DefaultOptions().name);
      expect(lim.window).toStrictEqual(new Window({
        timeSlices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        updated: '2025-01-01T00:00:00.000+02:00',
        unit: 'second',
        width: 3,
      }));
    });

    test('should throw error if one of properties is invalid', async () => {
      let fn = () => RateLimiter.load({});
      await expect(fn()).rejects.toThrow('name must be specified and be unique');
      fn = () => RateLimiter.load({name: 'ip-hour-0001'});
      await expect(fn()).rejects.toThrow('store must be specified');
    });

    test('should throw an error if failed to load state', async () => {
      const fn = () => RateLimiter.load({...DefaultOptions(), store: ErrorStore});
      await expect(fn()).rejects.toThrow('Failed to load rate-limit window ip-req-per-minute-max10-u00001');
    });
  });

  describe('#set', () => {
    test('should not reset existing window state', async () => {
      const lim = await RateLimiter.load(DefaultOptions());
      expect(lim.valueOf()).toBe(0);
      lim.set({
        timeSlices: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        updated: '2025-01-01T00:00:00',
        unit: 'second',
        width: 3,
      });
      expect(lim.valueOf()).toBe(0);
    });
    
    test('should set provided set', () => {
      const lim = new RateLimiter(DefaultOptions());
      expect(lim.valueOf()).toBe(undefined);
      lim.set({
        timeSlices: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        updated: '2025-01-01T00:00:00',
        unit: 'second',
        width: 3,
      });
      expect(lim.valueOf()).toBe(1);
    });
    
    test('should set default set if state is empty', async () => {
      const lim = await RateLimiter.load({...DefaultOptions(), store: NullStore});
      expect(lim.valueOf()).toBe(0);
      expect(lim.window.timeSlices).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(lim.window.unit).toBe(lim.windowConfig.unit);
      expect(lim.window.width).toBe(lim.windowConfig.width);
    });
  });

  describe('#update', () => {
    test('should should throw error if one of arguments is invalid', async () => {
      const lim = new RateLimiter(DefaultOptions());
      let fn = () => lim.update(0);
      await expect(fn()).rejects.toThrow('value must be a positive number');
      fn = () => lim.update(1);
      await expect(fn()).rejects.toThrow('timestamp must be specified');
    });
    
    test('should return false if getting over max threshold', async () => {
      const lim = new RateLimiter(DefaultOptions());
      const fn = () => lim.update(40, '2025-01-01T00:00:30Z');
      await expect(fn()).resolves.toBe(false);
    });
    
    test('should return true if window state is updated', async () => {
      const lim = new RateLimiter(DefaultOptions());
      const fn = () => lim.update(10, '2025-01-01T00:00:30Z');
      await expect(fn()).resolves.toBe(true);
      expect(lim.valueOf()).toBe(10);
    });
    
    test('should throw an error if failed to update store', async () => {
      const lim = new RateLimiter({...DefaultOptions(), store: ErrorStore});
      const fn = () => lim.update(1, '2025-01-01T00:00:00Z');
      await expect(fn()).rejects.toThrow('Failed to update rate-limit window ip-req-per-minute-max10-u00001');
    });
  });
});
