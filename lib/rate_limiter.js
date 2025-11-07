const {Window} = require('./window');
const {NullStore} = require('./null_store');

// window with twenty three-second buckets
export const DefaultConfig = () => ({
  name: 'request-rate-per-minute-max10',
  max: 10,
  window: {
    unit: 'second',         // unit of time ()
    size: 20,               // number of buckets in window
    width: 3,               // 1 is implied when not specified
  },
  store: NullStore,         // store to handle persistence
});

class RateLimiter {
  constructor(config = DefaultConfig()) {
    ({name: this.name, max: this.max, store: this.store, window: this.windowConfig} = config);
  }

  static async load(config) {
    try {
      const state = await config.store.get(config.name);
      const rateLimiter = new RateLimiter(config);
      rateLimiter.set(state);
    }
    catch (err) {
      throw new Error(`Failed to load rate-limit window ${config.name}`, {cause: err});
    }
  }

  // should update the buckets according to configuration
  // returns true if update successful
  async update(value, timestamp) {
    try {      
      this.window = this.window || Window.fromConfig(this.windowConfig);
      if (this.max < this.window.valueOf() + value)
        return false;
      
      this.window.update(value, timestamp);
      await store.set(this.name, this.window.toObject());
      return true;
    }
    catch (err) {
      throw new Error(`Failed to update rate-limit window ${this.name}`, {cause: err});
    }
  }

  set(state) {
    this.window = new Window(state);
  }

  valueOf() {
    return this.window.valueOf();
  }
};

module.exports = {
  RateLimiter,
};
