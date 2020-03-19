module.exports = class MessageCenter {
  constructor () {
    this.cacheSize = 1024;
    this.ed = 0;
    this.rd = 0;
    this.cache = Buffer.alloc(this.cacheSize);
    this.eventListeners = {
      data: [],
    };

    setInterval(() => this.decode(), 16);
  }

  /**
   * 当前已用空间
   */
  get currentDataSize () {
    if (this.ed < this.rd) {
      return this.cacheSize + this.ed - this.rd;
    }
    return this.ed - this.rd;
  }

  /**
   * @param {Buffer} b package
   */
  push (b) {
    const dataLength = b.length; // 需要push的包长度
    const leftSize = this.cacheSize - this.currentDataSize; // 剩余缓存空间
    if (dataLength < leftSize) {
      // 剩余空间还足够
      if (this.ed + dataLength > this.cacheSize) {
        // 直接放在尾部会把cache撑爆
        const nextEd = dataLength - (this.cacheSize - this.ed);
        this.cache.fill(b, this.ed, this.cacheSize);
        this.cache.fill(b.slice(this.cacheSize - this.ed), 0, nextEd);
        this.ed = nextEd;
      } else {
        // 直接放在尾部
        this.cache.fill(b, this.ed, this.ed + dataLength);
        this.ed = this.ed + dataLength;
      }
    } else {
      // 剩余空间不够，需要扩容
      const nextCacheSize = 2 * this.cacheSize;
      const nextCache = Buffer.alloc(nextCacheSize);
      const nextRd = 0;
      const nextEd = this.currentDataSize;

      if (this.ed > this.rd) {
        this.cache.copy(nextCache, 0, this.rd, this.ed);
      } else {
        this.cache.copy(nextCache, 0, this.rd, this.cacheSize);
        this.cache.copy(nextCache, this.cacheSize - this.rd, 0, this.ed);
      }

      this.cache = nextCache;
      this.cacheSize = nextCacheSize;
      this.rd = nextRd;
      this.ed = nextEd;
      this.push(b);
    }
  }

  decode () {
    if (this.currentDataSize < 4) { return; }

    let packageSize = 0;
    if (this.currentDataSize - this.rd < 4) {
      const headBuffer = Buffer.concat([
        this.cache.subarray(this.rd),
        this.cache.subarray(0, 4),
      ]);
      packageSize = headBuffer.readInt32BE(0);
    } else {
      packageSize = this.cache.readInt32BE(this.rd);
    }

    if (this.currentDataSize < packageSize) { return; }

    const pack = Buffer.alloc(packageSize);

    if (this.rd + packageSize > this.cacheSize) {
      const nextRd = packageSize - (this.cacheSize - this.rd);
      this.cache.copy(pack, 0, this.rd, this.cacheSize);
      this.cache.copy(pack, this.cacheSize - this.rd, 0, nextRd);
      this.rd = nextRd;
    } else {
      this.cache.copy(pack, 0, this.rd, this.rd + packageSize);
      this.rd += packageSize;
    }

    this.eventListeners.data.forEach((listener) => listener(pack.slice(4)));
  }

  on (event, listener) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }
};
