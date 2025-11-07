const {DateTime} = require('luxon');
const {isString} = require('lodash/fp');
const {Window} = require('../lib/window');

describe('Window', () => {

  describe('#constructor', () => {
    test('should initialize Window', () => {
      const win = new Window({timeSlices: [0, 0, 0, 0, 0], unit: 'minute', width: 2, updated: '2025-01-01T00:00:00Z'});
      expect(win.timeSlices).toHaveLength(5);
      expect(win.timeSlices).toStrictEqual([0, 0, 0, 0, 0]);
      expect(win.unit).toBe('minute');
      expect(win.width).toBe(2);
      expect(win.updated.toUTC().toISO()).toBe('2025-01-01T00:00:00.000Z');
    });

    test('should throw error if updated is invalid', () => {
      const fn = () => new Window({timeSlices: [0, 0, 0, 0, 0], unit: 'minute', width: 2, updated: 'abc'});
      expect(fn).toThrow(TypeError);
    });
  });

  describe('#fromConfig', () => {
    test('should initialize Window', () => {
      const win = Window.fromConfig({unit: 'minute', width: 2, size: 5});
      expect(win.timeSlices).toHaveLength(5);
      expect(win.timeSlices).toStrictEqual([0, 0, 0, 0, 0]);
      expect(win.unit).toBe('minute');
      expect(win.width).toBe(2);
      expect(DateTime.isDateTime(win.updated)).toBe(true);
    });
  });

  describe('#slicesBetween', () => {
    const win = Window.fromConfig({unit: 'minute', width: 2, size: 5});
    test('should return number of slices between timestamps', () => {
      const date0 = '2014-01-01T00:00:00Z';
      const date1 = '2014-01-01T00:01:00Z';
      const date2 = '2014-01-01T00:05:00Z';
      expect(win.slicesBetween(DateTime.fromISO(date0), DateTime.fromISO(date0))).toBe(0);
      expect(win.slicesBetween(DateTime.fromISO(date1), DateTime.fromISO(date0))).toBe(0);
      expect(win.slicesBetween(DateTime.fromISO(date2), DateTime.fromISO(date0))).toBe(2);
    });
  });

  describe('#valueOf', () => {
    const win = new Window({timeSlices: [0, 0, 0, 0, 0], unit: 'minute', width: 2, updated: '2025-01-01T00:00:00Z'});
    test('should return sum of values', () => {
      expect(win.valueOf()).toBe(0);
      win.update(1, '2025-01-01T00:01:00Z');
      expect(win.valueOf()).toBe(1);
    });
  });

  describe('#toObject', () => {
    const win = new Window({timeSlices: [0, 0, 0, 0, 0], unit: 'minute', width: 2, updated: '2025-01-01T00:00:00Z'});
    test('should return sum of values', () => {
      const obj = win.toObject();
      expect(obj.timeSlices).toEqual([0, 0, 0, 0, 0]);
      expect(obj.unit).toEqual('minute');
      expect(obj.width).toEqual(2);
      expect(isString(obj.updated)).toBe(true);
      win.update(1, '2025-01-01T00:01:00Z');
      expect(win.toObject().timeSlices).toEqual([1, 0, 0, 0, 0]);
    });
  });

  describe('#update()', () => {
    test('should throw error if invalid parameter', () => {
      const win = new Window({timeSlices: [0, 0, 0, 0, 0], unit: 'minute', width: 2, updated: '2025-01-01T00:00:00Z'});
      let fn = () => win.update('a');
      expect(fn).toThrow('value must be a number');
      fn = () => win.update(-1);
      expect(fn).toThrow('value must be a positive number');
      fn = () => win.update(1, '2025-01-02 00:00:00');
      expect(fn).toThrow('timestamp must be valid DateTime, Date or ISO string');
    });
  });
});
