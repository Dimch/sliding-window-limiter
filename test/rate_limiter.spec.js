const {DateTime} = require('luxon');
const {RateLimiter} = require('../lib/rate_limiter');
const {NullStore} = require('../lib/null_store');

describe('RateLimiter', () => {

  describe('#constructor', () => {
    it('should correctly initialize RateLimiter', () => {
      const lim = new RateLimiter();
      expect(lim.windowConfig).toStrictEqual({unit: 'second', size: 20, width: 3});
      expect(lim.max).toBe(10);
      expect(lim.store).toBe(NullStore);
    });

    it('should throw error if one of properties is invalid', () => {
      const lim = new RateLimiter();

    });
  });

  describe('#load', () => {
    it('should correctly initialize RateLimiter and load Window state', async () => {
      // const lim = await RateLimiter.load({name: 'test', store: NullStore});
  
    });

    it('should throw error if one of properties is invalid', () => {
      const lim = new RateLimiter();

    });
  });

  describe('#update', () => {
    it('should set first bucket to 50, and set lastUpdate to 2014-01-01T14:04:09Z', () => {
      const time = moment('2014-01-01T14:04:09Z');
      cap.update(time, 50);
      cap.buckets.length.should.equal(12);
      cap.buckets.should.eql([50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      cap.getCap(time).should.equal(50);
      assert(cap.lastUpdate.isSame(moment('2014-01-01T14:04:09Z')), 'lastUpdate should be 2014-01-01T14:04:09Z');
    });

    it('should set first bucket to 50, second to 50, and set lastUpdate to 2014-01-01T14:05:09Z', () => {
      const time = moment('2014-01-01T14:05:08Z');
      cap.update(time, 50);
      cap.buckets.length.should.equal(12);
      cap.buckets.should.eql([50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      cap.getCap(time).should.equal(100);
      assert(cap.lastUpdate.isSame(moment('2014-01-01T14:05:08Z')), 'lastUpdate should be 2014-01-01T14:05:08Z');
    });
  });
});
