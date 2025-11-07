const {isNumber, isString, min, rangeStep, slice, sum} = require('lodash/fp');
const {DateTime} = require('luxon');

// window with twenty three-second timeSlices
const DefaultWindow = () => ({
  timeSlices: [],
  updated: DateTime.now(),
  unit: 'second',
  width: 3,
});

const zeroes = rangeStep(0, 0);
const mod = (a, b) => ((a % b) + b) % b;
const validUnit = unit => ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'].includes(unit);

class Window {
  constructor(data = DefaultWindow()) {
    ({timeSlices: this.timeSlices, updated: this.updated, unit: this.unit, width: this.width} = data);
    if (!this.unit || !validUnit(this.unit))
      throw new TypeError("unit must be one of 'second', 'minute', 'hour', 'day', 'week', 'month', 'year'")
    if (isString(this.updated))
      this.updated = DateTime.fromISO(this.updated);
    if (!this.updated.isValid) throw new TypeError('updated must be luxon DateTime');
  }

  static fromConfig(config) {
    if (!isNumber(config.size) || config.size <= 0)
      throw new TypeError('config.size must be a positive number');
    return new Window({
      timeSlices: zeroes(config.size),
      updated: DateTime.now(),
      unit: config.unit,
      width: config.width,
    });
  }

  update(value, timestamp = DateTime.now()) {
    if (!isNumber(value))
      throw new TypeError('value must be a number');
    if (value < 0)
      throw new TypeError('value must be a positive number');
    
    let _timestamp = timestamp;
    if (timestamp instanceof Date)
      _timestamp = DateTime.fromJSDate(timestamp);
    if (isString(timestamp))
      _timestamp = DateTime.fromISO(timestamp);
    if (!_timestamp.isValid)
      throw new TypeError('timestamp must be valid DateTime, Date or ISO string');

    this.recalculate(_timestamp);
    this.timeSlices[0] += value;
    this.updated = _timestamp;
  }

  slicesBetween(now, start) {
    let count = now.diff(start, this.unit).get(this.unit);
    if (this.width) {
      count = count < this.width ? 0 : Math.floor(count / this.width);
    }
    return count;
  }

  start() {
    let time = this.updated;
    if (this.width) {
      const val = time.get(this.unit);
      time = time.set({[this.unit]: val - (mod(val, this.width))});
    }
    return time.startOf(this.unit);
  }

  recalculate(timestamp) {
    const slicesCount = this.slicesBetween(timestamp, this.start());
    if (slicesCount > 0) {
      const invalidSlices = min([slicesCount, this.timeSlices.length]);
      this.timeSlices = [
        ...zeroes(invalidSlices),
        ...slice(0, -invalidSlices)(this.timeSlices),
      ];
    }
  }

  valueOf() {
    return sum(this.timeSlices);
  }

  toObject() {
    return {
      timeSlices: this.timeSlices,
      updated: this.updated.toISO(),
      unit: this.unit,
      width: this.width,
    };
  }
}

module.exports = {
  DefaultWindow,
  Window,
};
