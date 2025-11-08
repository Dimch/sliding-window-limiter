# sliding-window-limiter

A JavaScript implementation of the Sliding Window rate limiting algorithm.

## Features

- Sliding window rate limiting with configurable window size, unit, and slice width
- Pluggable persistence store (in-memory by default)
- Written in modern JavaScript, using [lodash](https://lodash.com/) and [luxon](https://moment.github.io/luxon/)
- Thoroughly tested with Jest

## Installation

```sh
npm install sliding-window-limiter
```

## Usage

```js
const { RateLimiter } = require('sliding-window-limiter');

const limiter = new RateLimiter({
  name: 'api-rate-limit',
  max: 100,                 // max requests per window
  window: {
    unit: 'minute',         // time unit for window
    size: 10,               // number of slices in window
    width: 1,               // width of each slice
  },
  store: customStore,       // optional: provide your own store
});

// To check and update the rate limit:
const allowed = await limiter.update(1, new Date());
if (!allowed) {
  // Rate limit exceeded
}
```

## API

### `RateLimiter`

#### Constructor

```js
new RateLimiter(config)
```

- `config.name` (string): Unique name for the limiter
- `config.max` (number): Maximum allowed value in the window
- `config.window` (object): Window configuration
  - `unit` (string): Time unit (`second`, `minute`, `hour`, etc.)
  - `size` (number): Number of slices in the window
  - `width` (number): Width of each slice
- `config.store` (object): Store for persistence (must implement `get` and `set`)

#### Methods

- `static async RateLimiter.load(config)`: Loads a limiter and its state from the store
- `async update(value, timestamp)`: Attempts to add `value` at `timestamp`. Returns `true` if allowed, `false` if limit exceeded.
- `set(state)`: Sets the internal window state
- `valueOf()`: Returns the current sum of the window

### `Window`

- Internal class for managing the sliding window logic

## Testing

Run all tests with:

```sh
npm test
```

## License

ISC

## Author

Dima Michaelov
```