var nonogram = (function (exports) {
'use strict';

// codepen.io/guide
var $ = {
    greyVeryLight: '#ccc',
    grey: '#555',
    greyVeryDark: '#111',
    blue: '#0ebeff',
    green: '#47cf73',
    violet: '#ae63e4',
    yellow: '#fcd000',
    red: '#ff3c41',
};

const Status = {
    EMPTY: 0,
    FILLED: 1,
    UNSET: 2,
    TEMP_FILLED: 3,
    TEMP_EMPTY: 4,
    INCONSTANT: 5,
};

function eekwall(arr1, arr2) {
    return arr1.length === arr2.length &&
        arr1.every((e, i) => e === arr2[i]);
}
class Nonogram {
    constructor() {
        this.theme = {
            filledColor: $.grey,
            unsetColor: $.greyVeryLight,
            correctColor: $.green,
            wrongColor: $.red,
            meshColor: $.yellow,
            isMeshed: false,
            isBoldMeshOnly: false,
            isMeshOnTop: false,
            boldMeshGap: 5,
        };
    }
    initCanvas(canvas) {
        let _canvas = canvas instanceof HTMLCanvasElement ? canvas : document.getElementById(canvas);
        if (!(_canvas instanceof HTMLCanvasElement)) {
            _canvas = document.createElement('canvas');
        }
        this.canvas = _canvas;
        if (this.canvas.nonogram) {
            this.canvas.nonogram.listeners.forEach(([type, listener]) => {
                this.canvas.removeEventListener(type, listener);
            });
        }
        this.canvas.nonogram = this;
        this.canvas.width = this.theme.width || this.canvas.clientWidth;
        this.canvas.height = this.canvas.width * (this.m + 1) / (this.n + 1);
        this.ctx = this.canvas.getContext('2d') || new CanvasRenderingContext2D();
        this.initListeners();
        this.listeners.forEach(([type, listener]) => {
            this.canvas.addEventListener(type, listener);
        });
        this.canvas.oncontextmenu = (e) => { e.preventDefault(); };
    }
    initListeners() {
        this.listeners = [];
    }
    removeNonPositiveHints() {
        function removeNonPositiveElement(array, j, self) {
            self[j] = array.filter(v => v > 0);
        }
        this.hints.row.forEach(removeNonPositiveElement);
        this.hints.column.forEach(removeNonPositiveElement);
    }
    getSingleLine(direction, i) {
        const g = [];
        if (direction === 'row') {
            for (let j = 0; j < this.n; j += 1) {
                g[j] = this.grid[i][j];
            }
        }
        else if (direction === 'column') {
            for (let j = 0; j < this.m; j += 1) {
                g[j] = this.grid[j][i];
            }
        }
        return g;
    }
    calculateHints(direction, i) {
        const hints = [];
        const line = this.getSingleLine(direction, i);
        line.reduce((lastIsFilled, cell) => {
            if (cell === Status.FILLED) {
                hints.push(lastIsFilled ? hints.pop() + 1 : 1);
            }
            else if (cell !== Status.EMPTY) {
                throw new Error;
            }
            return cell === Status.FILLED;
        }, false);
        return hints;
    }
    isLineCorrect(direction, i) {
        try {
            return eekwall(this.calculateHints(direction, i), this.hints[direction][i]);
        }
        catch (e) {
            return false;
        }
    }
    getLocation(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const w23 = w * 2 / 3;
        const h23 = h * 2 / 3;
        const d = w23 / (this.n + 1);
        if (x < 0 || x >= w || y < 0 || y >= h) {
            return 'outside';
        }
        if (x >= 0 && x <= w23 && y >= 0 && y < h23) {
            if (d / 2 <= x && x < w23 - d / 2 && d / 2 <= y && y < h23 - d / 2) {
                return 'grid';
            }
            return 'limbo';
        }
        if (w23 <= x && x < w && h23 <= y && y < h) {
            return 'controller';
        }
        return 'hints';
    }
    print() {
        this.printGrid();
        this.printHints();
        this.printController();
    }
    printGrid() {
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const d = w * 2 / 3 / (this.n + 1);
        ctx.clearRect(-1, -1, w * 2 / 3 + 1, h * 2 / 3 + 1);
        if (this.theme.isMeshed && !this.theme.isMeshOnTop) {
            this.printMesh();
        }
        ctx.save();
        ctx.translate(d / 2, d / 2);
        for (let i = 0; i < this.m; i += 1) {
            for (let j = 0; j < this.n; j += 1) {
                ctx.save();
                ctx.translate(d * j, d * i);
                this.printCell(this.grid[i][j]);
                ctx.restore();
            }
        }
        ctx.restore();
        if (this.theme.isMeshed && this.theme.isMeshOnTop) {
            this.printMesh();
        }
    }
    printCell(status) {
        const { ctx } = this;
        const d = this.canvas.width * 2 / 3 / (this.n + 1);
        switch (status) {
            case Status.UNSET:
                ctx.fillStyle = this.theme.unsetColor;
                ctx.fillRect(d * 0.05, d * 0.05, d * 0.9, d * 0.9);
                break;
            case Status.FILLED:
                ctx.fillStyle = this.theme.filledColor;
                ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1);
                break;
        }
    }
    printMesh() {
        const { ctx } = this;
        const d = this.canvas.width * 2 / 3 / (this.n + 1);
        ctx.save();
        ctx.translate(d / 2, d / 2);
        ctx.beginPath();
        for (let i = 1; i < this.m; i += 1) {
            if (!this.theme.isBoldMeshOnly) {
                ctx.moveTo(0, i * d);
                ctx.lineTo(this.n * d, i * d);
            }
            if (i % this.theme.boldMeshGap === 0) {
                ctx.moveTo(0, i * d);
                ctx.lineTo(this.n * d, i * d);
                if (!this.theme.isBoldMeshOnly) {
                    ctx.moveTo(0, i * d - 1);
                    ctx.lineTo(this.n * d, i * d - 1);
                    ctx.moveTo(0, i * d + 1);
                    ctx.lineTo(this.n * d, i * d + 1);
                }
            }
        }
        for (let j = 1; j < this.n; j += 1) {
            if (!this.theme.isBoldMeshOnly) {
                ctx.moveTo(j * d, 0);
                ctx.lineTo(j * d, this.m * d);
            }
            if (j % this.theme.boldMeshGap === 0) {
                ctx.moveTo(j * d, 0);
                ctx.lineTo(j * d, this.m * d);
                if (!this.theme.isBoldMeshOnly) {
                    ctx.moveTo(j * d - 1, 0);
                    ctx.lineTo(j * d - 1, this.m * d);
                    ctx.moveTo(j * d + 1, 0);
                    ctx.lineTo(j * d + 1, this.m * d);
                }
            }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.theme.meshColor;
        ctx.stroke();
        ctx.restore();
    }
    printHints() {
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const d = w * 2 / 3 / (this.n + 1);
        ctx.clearRect(w * 2 / 3 - 1, -1, w * 3 + 1, h * 2 / 3 + 1);
        ctx.clearRect(-1, h * 2 / 3 - 1, w * 2 / 3 + 1, h / 3 + 1);
        ctx.save();
        ctx.translate(d / 2, d / 2);
        for (let i = 0; i < this.m; i += 1) {
            for (let j = 0; j < this.hints.row[i].length; j += 1) {
                this.printSingleHint('row', i, j);
            }
            if (this.hints.row[i].length === 0) {
                this.printSingleHint('row', i, 0);
            }
        }
        for (let j = 0; j < this.n; j += 1) {
            for (let i = 0; i < this.hints.column[j].length; i += 1) {
                this.printSingleHint('column', j, i);
            }
            if (this.hints.column[j].length === 0) {
                this.printSingleHint('column', j, 0);
            }
        }
        ctx.restore();
    }
    printSingleHint(direction, i, j) {
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const d = w * 2 / 3 / (this.n + 1);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${d}pt "Courier New", Inconsolata, Consolas, monospace`;
        const line = this.hints[direction][i];
        ctx.fillStyle = line.isCorrect ? this.theme.correctColor : this.theme.wrongColor;
        ctx.globalAlpha = (!line.isCorrect && line.unchanged) ? 0.5 : 1;
        if (direction === 'row') {
            ctx.fillText(`${this.hints.row[i][j] || 0}`, w * 2 / 3 + d * j, d * (i + 0.5), d * 0.8);
        }
        else if (direction === 'column') {
            ctx.fillText(`${this.hints.column[i][j] || 0}`, d * (i + 0.5), h * 2 / 3 + d * j, d * 0.8);
        }
    }
}

var TARGET = typeof Symbol === 'undefined' ? '__target' : Symbol();
var SCRIPT_TYPE = 'application/javascript';
var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
var URL = window.URL || window.webkitURL;
var Worker = window.Worker;

/**
 * Returns a wrapper around Web Worker code that is constructible.
 *
 * @function shimWorker
 *
 * @param { String }    filename    The name of the file
 * @param { Function }  fn          Function wrapping the code of the worker
 */
function shimWorker (filename, fn) {
    return function ShimWorker (forceFallback) {
        var o = this;

        if (!fn) {
            return new Worker(filename);
        }
        else if (Worker && !forceFallback) {
            // Convert the function's inner code to a string to construct the worker
            var source = `${ fn }`.replace(/^function.+?{/, '').slice(0, -1),
                objURL = createSourceObject(source);

            this[TARGET] = new Worker(objURL);
            URL.revokeObjectURL(objURL);
            return this[TARGET];
        }
        else {
            var selfShim = {
                    postMessage: m => {
                        if (o.onmessage) {
                            setTimeout(() => o.onmessage({ data: m, target: selfShim }));
                        }
                    }
                };

            fn.call(selfShim);
            this.postMessage = m => {
                setTimeout(() => selfShim.onmessage({ data: m, target: o }));
            };
            this.isThisThread = true;
        }
    };
}

// Test Worker capabilities
if (Worker) {
    var testWorker,
        objURL = createSourceObject('self.onmessage = function () {}'),
        testArray = new Uint8Array(1);

    try {
        // No workers via blobs in Edge 12 and IE 11 and lower :(
        if (/(?:Trident|Edge)\/(?:[567]|12)/i.test(navigator.userAgent)) {
            throw new Error('Not available');
        }
        testWorker = new Worker(objURL);

        // Native browser on some Samsung devices throws for transferables, let's detect it
        testWorker.postMessage(testArray, [testArray.buffer]);
    }
    catch (e) {
        Worker = null;
    }
    finally {
        URL.revokeObjectURL(objURL);
        if (testWorker) {
            testWorker.terminate();
        }
    }
}

function createSourceObject(str) {
    try {
        return URL.createObjectURL(new Blob([str], { type: SCRIPT_TYPE }));
    }
    catch (e) {
        var blob = new BlobBuilder();
        blob.append(str);
        return URL.createObjectURL(blob.getBlob(type));
    }
}

var SolverWorker = new shimWorker("./worker.ts", function (window, document) {
    const WorkerStatus = {
        EMPTY: 0,
        FILLED: 1,
        UNSET: 2,
        TEMP_FILLED: 3,
        TEMP_EMPTY: 4,
        INCONSTANT: 5,
    };
    const cellValueMap = new Map();
    cellValueMap.set(WorkerStatus.TEMP_FILLED, WorkerStatus.FILLED);
    cellValueMap.set(WorkerStatus.TEMP_EMPTY, WorkerStatus.EMPTY);
    cellValueMap.set(WorkerStatus.INCONSTANT, WorkerStatus.UNSET);
    function eekwall(arr1, arr2) {
        return arr1.length === arr2.length &&
            arr1.every((e, i) => e === arr2[i]);
    }
    class Solver {
        constructor(data) {
            this.scan = () => {
                this.iterations += 1;
                if (!this.updateScanner())
                    return;
                if (this.delay) {
                    this.message = {
                        type: 'update',
                        grid: this.grid,
                        scanner: this.scanner,
                        hints: this.hints,
                    };
                    postMessage(this.message);
                }
                this.isError = true;
                const { direction, i } = this.scanner;
                this.currentHints = this.hints[direction][i];
                this.currentHints.unchanged = true;
                this.currentLine = this.getSingleLine(direction, i);
                const finished = this.currentLine.every(cell => cell !== WorkerStatus.UNSET);
                if (!finished) {
                    this.solveSingleLine();
                    this.setBackToGrid(this.currentLine);
                }
                if (this.isLineCorrect(direction, i)) {
                    this.hints[direction][i].isCorrect = true;
                    this.isError = false;
                }
                if (this.isError) {
                    this.message = {
                        type: 'error',
                        grid: this.grid,
                        scanner: this.scanner,
                        hints: this.hints,
                    };
                    postMessage(this.message);
                    return;
                }
                if (this.delay) {
                    setTimeout(this.scan, this.delay);
                }
                else {
                    this.scan();
                }
            };
            this.hints = data.hints;
            this.delay = data.delay;
            this.grid = data.grid;
            this.iterations = 0;
            this.scanner = {
                direction: 'row',
                i: -1,
            };
            this.possibleBlanks = {
                row: [],
                column: [],
            };
            this.scan();
        }
        getSingleLine(direction, i) {
            const g = [];
            const m = this.grid.length;
            const n = this.grid.length && this.grid[0].length;
            if (direction === 'row') {
                for (let j = 0; j < n; j += 1) {
                    g[j] = this.grid[i][j];
                }
            }
            else if (direction === 'column') {
                for (let j = 0; j < m; j += 1) {
                    g[j] = this.grid[j][i];
                }
            }
            return g;
        }
        calculateHints(direction, i) {
            const hints = [];
            const line = this.getSingleLine(direction, i);
            line.reduce((lastIsFilled, cell) => {
                if (cell === WorkerStatus.FILLED) {
                    hints.push(lastIsFilled ? hints.pop() + 1 : 1);
                }
                else if (cell !== WorkerStatus.EMPTY) {
                    throw new Error;
                }
                return cell === WorkerStatus.FILLED;
            }, false);
            return hints;
        }
        isLineCorrect(direction, i) {
            try {
                return eekwall(this.calculateHints(direction, i), this.hints[direction][i]);
            }
            catch (e) {
                return false;
            }
        }
        updateScanner() {
            let line;
            do {
                this.isError = false;
                this.scanner.i += 1;
                if (this.hints[this.scanner.direction][this.scanner.i] === undefined) {
                    this.scanner.direction = (this.scanner.direction === 'row') ? 'column' : 'row';
                    this.scanner.i = 0;
                }
                line = this.hints[this.scanner.direction][this.scanner.i];
                if (this.hints.row.every(row => !!row.unchanged) &&
                    this.hints.column.every(col => !!col.unchanged)) {
                    this.message = {
                        type: 'finish',
                        grid: this.grid,
                        hints: this.hints,
                        iterations: this.iterations,
                    };
                    postMessage(this.message);
                    return false;
                }
            } while (line.isCorrect || line.unchanged);
            return true;
        }
        setBackToGrid(line) {
            const { direction, i } = this.scanner;
            if (direction === 'row') {
                line.forEach((cell, j) => {
                    if (cellValueMap.has(cell)) {
                        if (this.grid[i][j] !== cellValueMap.get(cell)) {
                            this.grid[i][j] = cellValueMap.get(cell);
                            this.hints.column[j].unchanged = false;
                        }
                    }
                });
            }
            else if (direction === 'column') {
                line.forEach((cell, j) => {
                    if (cellValueMap.has(cell)) {
                        if (this.grid[j][i] !== cellValueMap.get(cell)) {
                            this.grid[j][i] = cellValueMap.get(cell);
                            this.hints.row[j].unchanged = false;
                        }
                    }
                });
            }
        }
        solveSingleLine() {
            this.isError = true;
            const { direction, i } = this.scanner;
            if (this.possibleBlanks[direction][i] === undefined) {
                this.possibleBlanks[direction][i] = [];
                this.findAll(this.currentLine.length);
            }
            this.merge();
        }
        // This method finds all possible starting positions of empty series of cells, for a given line & hints
        findAll(max, array = [], index = 0) {
            if (index === this.currentHints.length) {
                // Those "blanks" array match the "currentHints" array.
                // They indicate the shift (blanks count) from the last series of filled cells (or start of line)
                // before starting the corresponding series of filled cells from "currentHints".
                const blanks = array.slice(0, this.currentHints.length); // makes a copy, because "array" will continue to be modified during findAll recursion
                const { direction, i } = this.scanner;
                this.possibleBlanks[direction][i].push(blanks);
            }
            // Min gap between filled cells is 1, so we start at 1,
            // except for first series of the line where we start at the grid border
            for (let i = index ? 1 : 0; i <= max; i += 1) {
                array[index] = i;
                const newMax = max - i - this.currentHints[index];
                if (newMax >= 0) {
                    this.findAll(newMax, array, index + 1);
                }
            }
        }
        merge() {
            const { direction, i } = this.scanner;
            const possibleBlanks = this.possibleBlanks[direction][i];
            possibleBlanks.forEach((blanks, p) => {
                const line = [];
                for (let i = 0; i < this.currentHints.length; i += 1) {
                    line.push(...new Array(blanks[i]).fill(WorkerStatus.TEMP_EMPTY));
                    line.push(...new Array(this.currentHints[i]).fill(WorkerStatus.TEMP_FILLED));
                }
                line.push(...new Array(this.currentLine.length - line.length).fill(WorkerStatus.TEMP_EMPTY));
                const improper = line.some((cell, i) => (cell === WorkerStatus.TEMP_EMPTY && this.currentLine[i] === WorkerStatus.FILLED) ||
                    (cell === WorkerStatus.TEMP_FILLED && this.currentLine[i] === WorkerStatus.EMPTY));
                if (improper) {
                    delete possibleBlanks[p];
                    return;
                }
                this.isError = false;
                line.forEach((cell, i) => {
                    if (cell === WorkerStatus.TEMP_FILLED) {
                        if (this.currentLine[i] === WorkerStatus.TEMP_EMPTY) {
                            this.currentLine[i] = WorkerStatus.INCONSTANT;
                        }
                        else if (this.currentLine[i] === WorkerStatus.UNSET) {
                            this.currentLine[i] = WorkerStatus.TEMP_FILLED;
                        }
                    }
                    else if (cell === WorkerStatus.TEMP_EMPTY) {
                        if (this.currentLine[i] === WorkerStatus.TEMP_FILLED) {
                            this.currentLine[i] = WorkerStatus.INCONSTANT;
                        }
                        else if (this.currentLine[i] === WorkerStatus.UNSET) {
                            this.currentLine[i] = WorkerStatus.TEMP_EMPTY;
                        }
                    }
                });
            });
            this.possibleBlanks[direction][i] = possibleBlanks.filter(e => e);
        }
    }
    onmessage = ({ data }) => {
        new Solver(data);
    };
});

class Solver extends Nonogram {
    constructor(row, column, canvas, { theme = {}, delay = 50, onSuccess = () => { }, onError = () => { }, } = {}) {
        super();
        this.worker = new SolverWorker();
        this.click = (e) => {
            if (this.isBusy)
                return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const d = rect.width * 2 / 3 / (this.n + 1);
            const location = this.getLocation(x, y);
            if (location === 'grid') {
                if (this.isError)
                    return;
                const i = Math.floor(y / d - 0.5);
                const j = Math.floor(x / d - 0.5);
                if (this.grid[i][j] === Status.UNSET) {
                    this.grid[i][j] = Status.FILLED;
                    this.hints.row[i].unchanged = false;
                    this.hints.column[j].unchanged = false;
                    this.solve();
                }
            }
            else if (location === 'controller') {
                this.refresh();
            }
        };
        this.theme.filledColor = $.green;
        this.theme.correctColor = $.green;
        this.theme.wrongColor = $.yellow;
        Object.assign(this.theme, theme);
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
        this.initCanvas(canvas);
        this.print();
    }
    initListeners() {
        this.listeners = [
            ['click', this.click],
        ];
    }
    refresh() {
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
        if (this.isBusy)
            return;
        this.print();
        this.isBusy = true;
        this.startTime = Date.now();
        this.worker.onmessage = ({ data }) => {
            if (this.canvas.nonogram !== this) {
                this.worker.terminate();
                return;
            }
            this.scanner = data.scanner;
            this.grid = data.grid;
            this.hints = data.hints;
            if (data.type !== 'update') {
                this.isBusy = false;
                if (data.type === 'error') {
                    this.isError = true;
                    const { direction, i } = this.scanner;
                    this.handleError(new Error(`Bad hints at ${direction} ${i + 1}`));
                }
                else if (data.type === 'finish') {
                    this.isError = false;
                    this.handleSuccess(Date.now() - this.startTime, data.iterations);
                }
            }
            this.print();
        };
        this.worker.postMessage({
            delay: this.delay,
            grid: this.grid,
            hints: this.hints,
        });
    }
    print() {
        this.printGrid();
        this.printHints();
        this.printScanner();
        this.printController();
    }
    printController() {
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const controllerSize = Math.min(w, h) / 4;
        const filledColor = this.theme.filledColor;
        function getCycle() {
            const cycle = document.createElement('canvas');
            const borderWidth = controllerSize / 10;
            cycle.width = controllerSize;
            cycle.height = controllerSize;
            const c = cycle.getContext('2d') || new CanvasRenderingContext2D();
            c.translate(controllerSize / 2, controllerSize / 2);
            c.rotate(Math.PI);
            c.arc(0, 0, controllerSize / 2 - borderWidth / 2, Math.PI / 2, Math.PI / 3.9);
            c.lineWidth = borderWidth;
            c.strokeStyle = filledColor;
            c.stroke();
            c.beginPath();
            c.moveTo((controllerSize / 2 + borderWidth) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
            c.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2);
            c.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
            c.closePath();
            c.fillStyle = filledColor;
            c.fill();
            return cycle;
        }
        ctx.clearRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
        if (this.isBusy)
            return;
        ctx.save();
        ctx.translate(w * 0.7, h * 0.7);
        ctx.drawImage(getCycle(), 0, 0);
        ctx.restore();
    }
    printScanner() {
        if (!this.scanner)
            return;
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const d = w * 2 / 3 / (this.n + 1);
        ctx.save();
        ctx.translate(d / 2, d / 2);
        ctx.fillStyle = this.isError ? this.theme.wrongColor : this.theme.correctColor;
        ctx.globalAlpha = 0.5;
        if (this.scanner.direction === 'row') {
            ctx.fillRect(0, d * this.scanner.i, w, d);
        }
        else if (this.scanner.direction === 'column') {
            ctx.fillRect(d * this.scanner.i, 0, d, h);
        }
        ctx.restore();
    }
}

class Editor extends Nonogram {
    constructor(m, n, canvas, { theme = {}, grid = [], threshold = 0.5, onHintChange = () => { }, } = {}) {
        super();
        this.mousedown = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const d = rect.width * 2 / 3 / (this.n + 1);
            const location = this.getLocation(x, y);
            if (location === 'controller') {
                this.refresh();
            }
            else if (location === 'grid') {
                this.draw.firstI = Math.floor(y / d - 0.5);
                this.draw.firstJ = Math.floor(x / d - 0.5);
                const cell = this.grid[this.draw.firstI][this.draw.firstJ];
                this.draw.brush = (cell === Status.FILLED) ? Status.EMPTY : Status.FILLED;
                this.isPressed = true;
                this.paintCell(this.draw.firstI, this.draw.firstJ);
                this.draw.lastI = this.draw.firstI;
                this.draw.lastJ = this.draw.firstJ;
            }
        };
        this.mousemove = (e) => {
            if (this.isPressed) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const d = rect.width * 2 / 3 / (this.n + 1);
                if (this.getLocation(x, y) === 'grid') {
                    const i = Math.floor(y / d - 0.5);
                    const j = Math.floor(x / d - 0.5);
                    if (i !== this.draw.lastI || j !== this.draw.lastJ) {
                        if (this.draw.direction === undefined) {
                            if (i === this.draw.firstI) {
                                this.draw.direction = 'row';
                            }
                            else if (j === this.draw.firstJ) {
                                this.draw.direction = 'column';
                            }
                        }
                        if ((this.draw.direction === 'row' && i === this.draw.firstI) ||
                            (this.draw.direction === 'column' && j === this.draw.firstJ)) {
                            this.paintCell(i, j);
                            this.draw.lastI = i;
                            this.draw.lastJ = j;
                        }
                    }
                }
            }
        };
        this.brushUp = () => {
            delete this.isPressed;
            this.draw = {};
        };
        this.theme.filledColor = $.violet;
        this.theme.correctColor = $.violet;
        Object.assign(this.theme, theme);
        this.threshold = threshold;
        this.handleHintChange = onHintChange;
        this.m = m;
        this.n = n;
        this.grid = new Array(this.m);
        for (let i = 0; i < this.m; i += 1) {
            this.grid[i] = new Array(this.n);
            for (let j = 0; j < this.n; j += 1) {
                if (grid.length) {
                    this.grid[i][j] = (grid[i] && grid[i][j]) ? Status.FILLED : Status.EMPTY;
                }
                else {
                    this.grid[i][j] = (Math.random() < this.threshold) ? Status.FILLED : Status.EMPTY;
                }
            }
        }
        this.hints = {
            row: new Array(m),
            column: new Array(n),
        };
        for (let i = 0; i < this.m; i += 1) {
            this.hints.row[i] = this.calculateHints('row', i);
            this.hints.row[i].isCorrect = true;
        }
        for (let j = 0; j < this.n; j += 1) {
            this.hints.column[j] = this.calculateHints('column', j);
            this.hints.column[j].isCorrect = true;
        }
        this.initCanvas(canvas);
        this.draw = {};
        this.print();
        this.handleHintChange(this.hints.row, this.hints.column);
    }
    initListeners() {
        this.listeners = [
            ['mousedown', this.mousedown],
            ['mousemove', this.mousemove],
            ['mouseup', this.brushUp],
            ['mouseleave', this.brushUp],
        ];
    }
    paintCell(i, j) {
        this.grid[i][j] = this.draw.brush;
        this.hints.row[i] = this.calculateHints('row', i);
        this.hints.row[i].isCorrect = true;
        this.hints.column[j] = this.calculateHints('column', j);
        this.hints.column[j].isCorrect = true;
        this.print();
        this.handleHintChange(this.hints.row, this.hints.column);
    }
    refresh() {
        for (let i = 0; i < this.m; i += 1) {
            for (let j = 0; j < this.n; j += 1) {
                this.grid[i][j] = (Math.random() < this.threshold) ? Status.FILLED : Status.EMPTY;
            }
        }
        for (let i = 0; i < this.m; i += 1) {
            this.hints.row[i] = this.calculateHints('row', i);
            this.hints.row[i].isCorrect = true;
        }
        for (let j = 0; j < this.n; j += 1) {
            this.hints.column[j] = this.calculateHints('column', j);
            this.hints.column[j].isCorrect = true;
        }
        this.print();
        this.handleHintChange(this.hints.row, this.hints.column);
    }
    printController() {
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const controllerSize = Math.min(w, h) / 4;
        const filledColor = this.theme.filledColor;
        function getCycle() {
            const cycle = document.createElement('canvas');
            const borderWidth = controllerSize / 10;
            cycle.width = controllerSize;
            cycle.height = controllerSize;
            const c = cycle.getContext('2d') || new CanvasRenderingContext2D();
            c.translate(controllerSize / 2, controllerSize / 2);
            c.arc(0, 0, controllerSize / 2 - borderWidth / 2, Math.PI / 2, Math.PI / 3.9);
            c.lineWidth = borderWidth;
            c.strokeStyle = filledColor;
            c.stroke();
            c.beginPath();
            c.moveTo((controllerSize / 2 + borderWidth) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
            c.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2);
            c.lineTo((controllerSize / 2 - borderWidth * 2) * Math.SQRT1_2, (controllerSize / 2 + borderWidth) * Math.SQRT1_2);
            c.closePath();
            c.fillStyle = filledColor;
            c.fill();
            return cycle;
        }
        ctx.clearRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
        ctx.save();
        ctx.translate(w * 0.7, h * 0.7);
        ctx.drawImage(getCycle(), 0, 0);
        ctx.restore();
    }
}

class Game extends Nonogram {
    constructor(row, column, canvas, { theme = {}, onSuccess = () => { }, onAnimationEnd = () => { }, } = {}) {
        super();
        this.mousedown = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const d = rect.width * 2 / 3 / (this.n + 1);
            const location = this.getLocation(x, y);
            if (location === 'controller') {
                this.switchBrush();
            }
            else if (location === 'grid') {
                this.draw.firstI = Math.floor(y / d - 0.5);
                this.draw.firstJ = Math.floor(x / d - 0.5);
                this.draw.inverted = e.button === 2;
                const cell = this.grid[this.draw.firstI][this.draw.firstJ];
                let brush = this.brush;
                if (this.draw.inverted) {
                    brush = this.brush === Status.FILLED ? Status.EMPTY : Status.FILLED;
                }
                if (cell === Status.UNSET || brush === cell) {
                    this.draw.mode = (brush === cell) ? 'empty' : 'filling';
                    this.isPressed = true;
                    this.switchCell(this.draw.firstI, this.draw.firstJ);
                }
                this.draw.lastI = this.draw.firstI;
                this.draw.lastJ = this.draw.firstJ;
            }
        };
        this.mousemove = (e) => {
            if (this.isPressed) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const d = rect.width * 2 / 3 / (this.n + 1);
                if (this.getLocation(x, y) === 'grid') {
                    const i = Math.floor(y / d - 0.5);
                    const j = Math.floor(x / d - 0.5);
                    if (i !== this.draw.lastI || j !== this.draw.lastJ) {
                        if (this.draw.direction === undefined) {
                            if (i === this.draw.firstI) {
                                this.draw.direction = 'row';
                            }
                            else if (j === this.draw.firstJ) {
                                this.draw.direction = 'column';
                            }
                        }
                        if ((this.draw.direction === 'row' && i === this.draw.firstI) ||
                            (this.draw.direction === 'column' && j === this.draw.firstJ)) {
                            this.switchCell(i, j);
                            this.draw.lastI = i;
                            this.draw.lastJ = j;
                        }
                    }
                }
            }
        };
        this.brushUp = () => {
            delete this.isPressed;
            this.draw = {};
        };
        this.theme.filledColor = $.blue;
        this.theme.wrongColor = $.grey;
        this.theme.isMeshed = true;
        Object.assign(this.theme, theme);
        this.handleSuccess = onSuccess;
        this.handleAnimationEnd = onAnimationEnd;
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
        this.hints.row.forEach((r, i) => { r.isCorrect = this.isLineCorrect('row', i); });
        this.hints.column.forEach((c, j) => { c.isCorrect = this.isLineCorrect('column', j); });
        this.initCanvas(canvas);
        this.brush = Status.FILLED;
        this.draw = {};
        this.startTime = Date.now();
        this.print();
    }
    calculateHints(direction, i) {
        const hints = [];
        const line = this.getSingleLine(direction, i);
        line.reduce((lastIsFilled, cell) => {
            if (cell === Status.FILLED) {
                hints.push(lastIsFilled ? hints.pop() + 1 : 1);
            }
            return cell === Status.FILLED;
        }, false);
        return hints;
    }
    initListeners() {
        this.listeners = [
            ['mousedown', this.mousedown],
            ['mousemove', this.mousemove],
            ['mouseup', this.brushUp],
            ['mouseleave', this.brushUp],
        ];
    }
    switchBrush() {
        this.brush = (this.brush === Status.EMPTY) ? Status.FILLED : Status.EMPTY;
        this.printController();
    }
    switchCell(i, j) {
        let brush = this.brush;
        if (this.draw.inverted) {
            brush = this.brush === Status.FILLED ? Status.EMPTY : Status.FILLED;
        }
        if (brush === Status.FILLED && this.grid[i][j] !== Status.EMPTY) {
            this.grid[i][j] = (this.draw.mode === 'filling') ? Status.FILLED : Status.UNSET;
            this.hints.row[i].isCorrect = this.isLineCorrect('row', i);
            this.hints.column[j].isCorrect = this.isLineCorrect('column', j);
            this.print();
            const correct = this.hints.row.every(singleRow => !!singleRow.isCorrect) &&
                this.hints.column.every(singleCol => !!singleCol.isCorrect);
            if (correct) {
                this.succeed();
            }
        }
        else if (brush === Status.EMPTY && this.grid[i][j] !== Status.FILLED) {
            this.grid[i][j] = (this.draw.mode === 'filling') ? Status.EMPTY : Status.UNSET;
            this.print();
        }
    }
    printCell(status) {
        const { ctx } = this;
        const d = this.canvas.width * 2 / 3 / (this.n + 1);
        switch (status) {
            case Status.FILLED:
                ctx.fillStyle = this.theme.filledColor;
                ctx.fillRect(-d * 0.05, -d * 0.05, d * 1.1, d * 1.1);
                break;
            case Status.EMPTY:
                ctx.strokeStyle = $.red;
                ctx.lineWidth = d / 15;
                ctx.beginPath();
                ctx.moveTo(d * 0.3, d * 0.3);
                ctx.lineTo(d * 0.7, d * 0.7);
                ctx.moveTo(d * 0.3, d * 0.7);
                ctx.lineTo(d * 0.7, d * 0.3);
                ctx.stroke();
                break;
        }
    }
    printController() {
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const controllerSize = Math.min(w, h) / 4;
        const outerSize = controllerSize * 3 / 4;
        const offset = controllerSize / 4;
        const borderWidth = controllerSize / 20;
        const innerSize = outerSize - 2 * borderWidth;
        function printFillingBrush() {
            ctx.save();
            ctx.translate(offset, 0);
            ctx.fillStyle = this.theme.meshColor;
            ctx.fillRect(0, 0, outerSize, outerSize);
            ctx.fillStyle = this.theme.filledColor;
            ctx.fillRect(borderWidth, borderWidth, innerSize, innerSize);
            ctx.restore();
        }
        function printEmptyBrush() {
            ctx.save();
            ctx.translate(0, offset);
            ctx.fillStyle = this.theme.meshColor;
            ctx.fillRect(0, 0, outerSize, outerSize);
            ctx.clearRect(borderWidth, borderWidth, innerSize, innerSize);
            ctx.strokeStyle = $.red;
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.moveTo(outerSize * 0.3, outerSize * 0.3);
            ctx.lineTo(outerSize * 0.7, outerSize * 0.7);
            ctx.moveTo(outerSize * 0.3, outerSize * 0.7);
            ctx.lineTo(outerSize * 0.7, outerSize * 0.3);
            ctx.stroke();
            ctx.restore();
        }
        ctx.clearRect(w * 2 / 3 - 1, h * 2 / 3 - 1, w / 3 + 1, h / 3 + 1);
        ctx.save();
        ctx.translate(w * 0.7, h * 0.7);
        if (this.brush === Status.FILLED) {
            printEmptyBrush.call(this);
            printFillingBrush.call(this);
        }
        else if (this.brush === Status.EMPTY) {
            printFillingBrush.call(this);
            printEmptyBrush.call(this);
        }
        ctx.restore();
    }
    succeed() {
        this.handleSuccess(Date.now() - this.startTime);
        this.listeners.forEach(([type, listener]) => {
            this.canvas.removeEventListener(type, listener);
        });
        const { ctx } = this;
        const { width: w, height: h } = this.canvas;
        const controllerSize = Math.min(w, h) / 4;
        const background = ctx.getImageData(0, 0, w, h);
        function getTick() {
            const size = controllerSize * 2;
            const borderWidth = size / 10;
            const tick = document.createElement('canvas');
            tick.width = size;
            tick.height = size;
            const c = tick.getContext('2d') || new CanvasRenderingContext2D();
            c.translate(size / 3, size * 5 / 6);
            c.rotate(-Math.PI / 4);
            c.fillStyle = $.green;
            c.fillRect(0, 0, borderWidth, -size * Math.SQRT2 / 3);
            c.fillRect(0, 0, size * Math.SQRT2 * 2 / 3, -borderWidth);
            return tick;
        }
        const tick = getTick();
        let t = 0;
        function f(_) {
            return 1 + Math.pow(_ - 1, 3);
        }
        const fadeTickIn = () => {
            ctx.putImageData(background, 0, 0);
            t += 0.03;
            ctx.globalAlpha = f(t);
            ctx.clearRect(w * 2 / 3, h * 2 / 3, w / 3, h / 3);
            ctx.drawImage(tick, w * 0.7 - (1 - f(t)) * controllerSize / 2, h * 0.7 - (1 - f(t)) * controllerSize / 2, (2 - f(t)) * controllerSize, (2 - f(t)) * controllerSize);
            if (t <= 1) {
                requestAnimationFrame(fadeTickIn);
            }
            else {
                this.handleAnimationEnd();
            }
        };
        fadeTickIn();
    }
}

exports.Solver = Solver;
exports.Editor = Editor;
exports.Game = Game;

return exports;

}({}));
