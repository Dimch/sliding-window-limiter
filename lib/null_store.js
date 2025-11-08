class Store {
  get(key) { return null; }
  set(key, value) { }
};

module.exports = {
  Store,
  NullStore: new Store(),
};
