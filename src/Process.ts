import { ChildProcess, spawn } from "child_process";
import { Readable } from "stream";

export abstract class Process<SpawnArguments extends readonly unknown[]> {
  protected abstract readonly command: string;
  protected _process?: ChildProcess;
  protected readonly _stdout: Buffer[] = [];
  protected readonly _stderr: Buffer[] = [];

  private set process(process: ChildProcess | undefined) {
    if (this._process !== undefined) {
      this._process.stdout?.unpipe();
      this._process.stderr?.unpipe();
      if (!this._process.killed) this.kill(0);
      this._stdout.length = 0;
      this._stderr.length = 0;
    }
    if (process !== undefined) {
      this._process = process;
      if (this._process.stdout !== null)
        this._process.stdout.on("data", (chunk) => this._stdout.push(chunk));
      if (this._process.stderr !== null)
        this._process.stderr.on("data", (chunk) => this._stderr.push(chunk));
    }
  }
  public get stdout() {
    return Buffer.concat(this._stdout);
  }
  public get stderr() {
    return Buffer.concat(this._stderr);
  }

  public get isAlive() {
    return this._process !== undefined && !this._process.killed;
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
  public write(data: Buffer | Readable): void {
    if (this._process === undefined || this._process.stdin === null) return;
    if (data instanceof Buffer) data = Readable.from(data);
    data.pipe(this._process.stdin);
  }
  /**
   * 이 프로세스가 종료되면 fulfill되는 Promise를 반환한다.
   * @returns Promise.
   */
  public wait(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._process === undefined) return resolve();
      this._process.on("exit", () => {
        if (this._stderr.length === 0) resolve();
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
