export class BufferStream extends Array<Buffer> {
  public toString(): string {
    return Buffer.concat(this).toString();
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
