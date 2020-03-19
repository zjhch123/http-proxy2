class BB {
  /**
   * @param {string} b package
   */
  constructor (b) {
    this.content = Buffer.from(b);
  }

  get length () {
    return this.content ? this.content.length : 0;
  }

  /**
   * @param {string} b buffer
   */
  encode (b) {
    this.content = Buffer.from(b);
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
