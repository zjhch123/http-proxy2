class BB {
  /**
   * @param {Buffer} b package
   */
  constructor (b = null) {
    this.length = b ? b.length : 0;
    this.content = b;
  }

  /**
   * @param {Buffer} b buffer
   */
  encode (b) {
    this.length = b.length;
    this.content = b;
  }

  toBuffer () {
    const head = Buffer.alloc(4);
    head.writeInt32BE(this.length + 4, 0);
    const buffer = Buffer.concat([head, this.content]);

    return buffer;
  }

  static pack (b) {
    return new BB(b);
  }
}

module.exports = BB;
