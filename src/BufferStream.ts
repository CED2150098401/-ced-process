export class BufferStream extends Array<Buffer> {
  public toConcatenated() {
    return Buffer.concat(this);
  }
  public toString(): string {
    return this.toConcatenated().toString();
  }
  public [Symbol.toStringTag](): string {
    return this.toString();
  }
  public get isEmpty(): boolean {
    return this.length === 0;
  }
  public empty(): void {
    this.length = 0;
  }
}
