import Status from './status.js'

function eekwall(arr1: any[], arr2: any[]) {
  return arr1.length === arr2.length &&
    arr1.every((e, i) => e === arr2[i])
}

abstract class Nonogram {
  listeners: [string, EventListener][] = []
  m: number = 0
  n: number = 0
  grid: Status[][] = []
  hints: {
    row: LineOfHints[]
    column: LineOfHints[]
  } = { row: [], column: [] }

  constructor() { }

  initListeners() {
    this.listeners = []
  }
  removeNonPositiveHints() {
    function removeNonPositiveElement(array: number[], j: number, self: number[][]) {
      self[j] = array.filter(v => v > 0)
    }
    this.hints.row.forEach(removeNonPositiveElement)
    this.hints.column.forEach(removeNonPositiveElement)
  }
  static getSingleLine(grid : Status[][], direction: Direction, i: number): Status[] {
    const m = grid.length;
    const n = grid.length ? grid[0].length : 0;
    const g: number[] = []
    if (direction === 'row') {
      for (let j = 0; j < n; j += 1) {
        g[j] = grid[i][j]
      }
    } else if (direction === 'column') {
      for (let j = 0; j < m; j += 1) {
        g[j] = grid[j][i]
      }
    }
    return g
  }
  static calculateHints(grid : Status[][], direction: Direction, i: number, throwErrorOnEmptyCell: boolean = true) {
    const hints: number[] = []
    const line = Nonogram.getSingleLine(grid, direction, i)
    line.reduce((lastIsFilled : boolean, cell : Status) => {
      if (cell === Status.FILLED) {
        hints.push(lastIsFilled ? <number>hints.pop() + 1 : 1)
      } else if (throwErrorOnEmptyCell && cell !== Status.EMPTY) {
        throw new Error
      }
      return cell === Status.FILLED
    }, false)
    return hints
  }
  isLineCorrect(direction: Direction, i: number) {
    try {
      return eekwall(Nonogram.calculateHints(this.grid, direction, i, false), this.hints[direction][i])
    } catch (e) {
      return false
    }
  }
}

export default Nonogram
