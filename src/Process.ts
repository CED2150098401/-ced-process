import { ChildProcess, spawn } from "child_process";
import { Readable } from "stream";

import { BufferStream } from "./BufferStream";

export abstract class Process<SpawnArguments extends readonly unknown[]> {
  protected abstract readonly command: string;
  protected _process?: ChildProcess;
  public readonly stdout = new BufferStream();
  public readonly stderr = new BufferStream();

  private set process(process: ChildProcess | undefined) {
    if (this._process !== undefined) {
      this._process.stdout?.unpipe();
      this._process.stderr?.unpipe();
      if (!this._process.killed) this.kill(0);
      this.stdout.empty();
      this.stderr.empty();
    }
    if (process !== undefined) {
      this._process = process;
      if (this._process.stdout !== null)
        this._process.stdout.on("data", (chunk) => this.stdout.push(chunk));
      if (this._process.stderr !== null)
        this._process.stderr.on("data", (chunk) => this.stderr.push(chunk));
    }
  }

  public get isAlive() {
    return (
      this._process !== undefined &&
      !this._process.killed &&
      this._process.connected
    );
  }

  /**
   * 프로세스 spawn 시 사용할 인자 목록을 반환하는 함수.
   * @param args Process.spawn 함수로부터 전달되는 인자 목록.
   */
  protected abstract getArguments(...args: SpawnArguments): readonly string[];
  /**
   * 프로세스를 만든다.
   * @param args spawn 시 사용할 인자 목록을 얻기 위한 인자 목록.
   */
  public spawn(...args: SpawnArguments): void {
    this.process = spawn(this.command, this.getArguments(...args));
  }
  /**
   * 이 프로세스의 stdin에 Buffer 또는 Readable Stream을 쓴다.
   * @param data Buffer 또는 Readable Stream.
   */
  public write(data: Buffer | Readable, options?: { end?: boolean }): void {
    if (this._process === undefined || this._process.stdin === null) return;
    if (data instanceof Buffer) data = Readable.from(data);
    data.pipe(this._process.stdin, options);
  }
  /**
   * 이 프로세스가 종료되면 fulfill되는 Promise를 반환한다.
   * @returns Promise.
   */
  public wait(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._process === undefined) return resolve();
      this._process.on("exit", () => {
        if (this.stderr.isEmpty) resolve();
        else reject(new Error(this.stderr.toString()));
      });
    });
  }
  /**
   * 이 프로세스를 강제 종료한다.
   * @param code 상태 코드.
   */
  public kill(code: number = 0): void {
    if (this._process === undefined) return;
    this._process.kill(code);
  }
}
