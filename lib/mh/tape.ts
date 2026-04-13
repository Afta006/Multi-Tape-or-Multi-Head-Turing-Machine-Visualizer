export class MultiHeadTape {
  private readonly blank: string;
  private tape: string[];
  private headPositions: number[]; // Position of each head on the tape

  constructor(blank: string, input: string, heads: number, startPositions?: number[]) {
    this.blank = blank;
    // Initialize tape with input
    if (!input) {
      this.tape = [blank];
    } else {
      this.tape = input.split("");
    }
    // Initialize head positions: use provided positions or default to 0
    // Supports negative indices (Python-style): -1 = last, -2 = second-to-last, etc.
    if (startPositions && startPositions.length === heads) {
      this.headPositions = startPositions.map(pos => {
        if (pos < 0) {
          return this.tape.length + pos;
        }
        return pos;
      });
    } else {
      this.headPositions = Array(heads).fill(0);
    }
  }

  clone(): MultiHeadTape {
    const cloned = new MultiHeadTape(this.blank, this.tape.join(""), this.headPositions.length);
    // Restore the actual tape content and head positions from current state
    (cloned as any).tape = [...this.tape];
    (cloned as any).headPositions = [...this.headPositions];
    return cloned;
  }

  /**
   * Read symbol under head at given index
   */
  readHead(headIndex: number): string {
    const pos = this.headPositions[headIndex];
    if (pos < 0 || pos >= this.tape.length) {
      return this.blank;
    }
    return this.tape[pos]!;
  }

  /**
   * Read symbols under all heads
   */
  readAllHeads(): string[] {
    return this.headPositions.map((_, idx) => this.readHead(idx));
  }

  /**
   * Write symbol under head at given index
   */
  writeHead(headIndex: number, symbol: string): void {
    const pos = this.headPositions[headIndex];
    // Expand tape if necessary
    while (pos >= this.tape.length) {
      this.tape.push(this.blank);
    }
    if (pos >= 0) {
      this.tape[pos] = symbol;
    }
  }

  /**
   * Move head left
   */
  moveHeadLeft(headIndex: number): void {
    this.headPositions[headIndex]--;
    // Expand tape on the left if necessary by padding
    if (this.headPositions[headIndex] < 0) {
      // Tape expands implicitly with blank symbols
    }
  }

  /**
   * Move head right
   */
  moveHeadRight(headIndex: number): void {
    this.headPositions[headIndex]++;
    // Expand tape on the right if necessary
    while (this.headPositions[headIndex] >= this.tape.length) {
      this.tape.push(this.blank);
    }
  }

  /**
   * Stay (no move)
   */
  moveHeadStay(headIndex: number): void {
    // Do nothing
  }

  /**
   * Get head positions
   */
  getHeadPositions(): number[] {
    return [...this.headPositions];
  }

  /**
   * Get full tape content with head positions marked
   */
  getTapeWithHeads(): { tape: string; headPositions: number[] } {
    // Ensure tape has reasonable bounds
    let minPos = Math.min(0, ...this.headPositions);
    let maxPos = Math.max(this.tape.length - 1, ...this.headPositions);

    const visibleTape = this.tape.slice(Math.max(0, minPos), maxPos + 1);
    const adjustedHeadPositions = this.headPositions.map(pos => pos - Math.max(0, minPos));

    return {
      tape: visibleTape.join(""),
      headPositions: adjustedHeadPositions,
    };
  }

  /**
   * Get symbol at any position (for visualization)
   */
  getSymbolAt(position: number): string {
    if (position < 0 || position >= this.tape.length) {
      return this.blank;
    }
    return this.tape[position]!;
  }

  /**
   * Get range of symbols for display
   */
  readRange(startPos: number, endPos: number): string[] {
    const out: string[] = [];
    for (let i = startPos; i <= endPos; i++) {
      out.push(this.getSymbolAt(i));
    }
    return out;
  }
}
