export class Tape {
  private readonly blank: string;
  private before: string[];
  private after: string[];

  constructor(blank: string, input: string | { before: string[]; after: string[] }) {
    this.blank = blank;

    if (typeof input === "object") {
      this.before = [...input.before];
      this.after = [...input.after];
      return;
    }

    this.before = [];

    if (!input) {
      this.after = [blank];
      return;
    }

    const symbols = [...input];
    this.after = symbols.reverse();
  }

  clone(): Tape {
    return new Tape(this.blank, { before: this.before, after: this.after });
  }

  read(): string {
    return this.after[this.after.length - 1];
  }

  write(symbol: string): void {
    this.after[this.after.length - 1] = symbol;
  }

  headRight(): void {
    this.before.push(this.after.pop() ?? this.blank);
    if (this.after.length === 0) {
      this.after.push(this.blank);
    }
  }

  headLeft(): void {
    if (this.before.length === 0) {
      this.before.push(this.blank);
    }
    this.after.push(this.before.pop() ?? this.blank);
  }

  readOffset(offset: number): string {
    if (offset >= 0) {
      const idx = this.after.length - 1 - offset;
      return idx >= 0 ? this.after[idx] : this.blank;
    }

    const idx = this.before.length + offset;
    return idx >= 0 ? this.before[idx] : this.blank;
  }

  readRange(start: number, end: number): string[] {
    const out: string[] = [];
    for (let i = start; i <= end; i += 1) {
      out.push(this.readOffset(i));
    }
    return out;
  }
}
