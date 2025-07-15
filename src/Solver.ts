import Nonogram from "./Nonogram.js";
import Status from "./status.js";
import Worker from "web-worker";

import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class Solver extends Nonogram {
  worker: Worker;

  delay: number;
  handleSuccess: (time: number, iterations: number, solved: boolean) => void;
  handleError: (e: Error) => void;
  isBusy: boolean = false;
  isError: boolean = false;
  scanner?: {
    direction: Direction;
    i: number;
  };

  constructor(row: number[][], column: number[][], { delay = 50, onSuccess = () => {}, onError = () => {} } = {}) {
    super();

	const workerpath = path.join(`file://` + __dirname, "worker.js");
	this.worker = new Worker(fileURLToPath(workerpath));

    this.delay = delay;
    this.handleSuccess = onSuccess;
    this.handleError = onError;

    this.hints = {
      row: row.slice(),
      column: column.slice(),
    };
    this.removeNonPositiveHints();
    this.m = this.hints.row.length;
    this.n = this.hints.column.length;
    this.grid = new Array(this.m);
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n).fill(Status.UNSET);
    }

    // this.print()
  }

  initListeners() {}

  private refresh() {
    this.grid = new Array(this.m);
    for (let i = 0; i < this.m; i += 1) {
      this.grid[i] = new Array(this.n).fill(Status.UNSET);
    }
    this.hints.row.forEach((r) => {
      r.isCorrect = false;
      r.unchanged = false;
    });
    this.hints.column.forEach((c) => {
      c.isCorrect = false;
      c.unchanged = false;
    });
    this.solve();
  }
  solve() {
    if (this.isBusy) return;

    // this.print()
    this.isBusy = true;
    const startTime = Date.now();
    this.worker.onmessage = ({ data }: { data: SolverMessage }) => {
      this.scanner = data.scanner;
      this.grid = data.grid;
      this.hints = data.hints;
      if (data.type !== "update") {
        this.isBusy = false;
        if (data.type === "error") {
          this.isError = true;
          const { direction, i } = <Scanner>this.scanner;
          this.handleError(new Error(`Bad hints at ${direction} ${i + 1}`));
        } else if (data.type === "finish") {
          this.isError = false;
          const solved = this.grid.every((line) =>
            line.every((cell) => cell !== Status.UNSET)
          );
          this.handleSuccess(Date.now() - startTime, data.iterations!, solved);
        }
      }
      // this.print()
    };
    this.worker.postMessage({
      delay: this.delay,
      grid: this.grid,
      hints: this.hints,
    });
  }
}
