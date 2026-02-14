const {isNumber} = require('lodash/fp');
const {Window} = require('./window');
const {NullStore} = require('./null_store');

// window with twenty three-second buckets
const DefaultConfig = () => ({
  name: 'request-rate-per-minute-max10',
  max: 10,
  window: {
    unit: 'second',         // unit of time ('second', 'minute', 'hour', 'day', 'week', 'month', 'year')
    size: 20,               // number of time slices
    width: 3,               // width of slice 
  },
  store: NullStore,         // store to handle persistence
});

class RateLimiter {
  constructor(config = DefaultConfig()) {
    ({name: this.name, max: this.max, store: this.store, window: this.windowConfig} = config);
    if (!this.name)
      throw new TypeError('name must be specified and be unique');
    if (!isNumber(this.max) || this.max <= 0)
      throw new TypeError('max must be a positive number');
    if (!this.store)
      throw new TypeError('store must be specified');
    if (!this.windowConfig)
      throw new TypeError('window configuration must be specified');
  }

  static async load(config) {
    if (!config.name)
      throw new TypeError('name must be specified and be unique');
    if (!config.store)
      throw new TypeError('store must be specified');

    try {
      const state = await config.store.get(config.name);
      return new RateLimiter(config).set(state);
    }
    catch (err) {
      throw new Error(`Failed to load rate-limit window ${config.name}`, {cause: err});
    }
  }

  // should update the buckets according to configuration.
  // returns true if update successful
  async update(value, timestamp) {
    if (!isNumber(value) || value <= 0)
      throw new TypeError('value must be a positive number');
    
    try {
      this.window = this.window || Window.fromConfig(this.windowConfig);
      if (this.max < this.valueOf() + value)
        return false;
      
      this.window.update(value, timestamp);
      await this.store.set(this.name, this.window.toObject());
      return true;
    }
    catch (err) {
      throw new Error(`Failed to update rate-limit window ${this.name}`, {cause: err});
    }
  }

  // should update the buckets according to configuration.
  // only updates the time and recalculates window's buckets
  async updateTime(timestamp) {
    let _timestamp = timestamp;
    if (timestamp instanceof Date)
      _timestamp = DateTime.fromJSDate(timestamp);
    if (isString(timestamp))
      _timestamp = DateTime.fromISO(timestamp);
    if (!_timestamp.isValid)
      throw new TypeError('timestamp must be valid DateTime, Date or ISO string');

    try {
      this.window = this.window || Window.fromConfig(this.windowConfig);
      this.window.recalculate(_timestamp);
      await this.store.set(this.name, this.window.toObject());
    }
    catch (err) {
      throw new Error(`Failed to update rate-limit window ${this.name}`, {cause: err});
    }
  }

  set(state) {
    if (this.window) return this;
    this.window = state ? new Window(state) : Window.fromConfig(this.windowConfig);
    return this;
  }

  valueOf() {
    return this.window?.valueOf();
  }
};

module.exports = {
  RateLimiter,
};
