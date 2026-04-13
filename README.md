# Multi-Head Turing Machine Simulator

![Turingkit Screnshot](https://res.cloudinary.com/dqvwf3z2c/image/upload/v1774680953/734shots_so_nu3im0.png)
<br>

<div align="center">

  <a href="https://turingkit.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-turingkit.vercel.app-blue?style=flat-square" alt="Live Site" />
  </a>
</div>
<br>

An interactive web app for building and simulating multi-tape / multi-head Turing Machines.

You can:

- Define machines with a compact rule format.
- Run, pause, reset, and single-step execution.
- Visualize the state graph and active transition.
- Import and export machine rules.
- Start from built-in examples (1-tape, 2-tape, and 3-tape programs).

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Create production build
- `npm run start` - Run production server
- `npm run lint` - Run ESLint

## Machine Rule Format

Write one transition per line:

```text
state,read -> next,write,moves
```

Example (1 tape):

```text
q0,1 -> q0,1,r
q0,_ -> qa,_,s
```

Example (2 tapes):

```text
q0,0_ -> q0,00,rr
q0,__ -> qa,__,ss
```

### Notes

- `moves` must contain one symbol per tape.
- Valid moves are `l`, `r`, `s` (left, right, stay).
- Comment lines beginning with `#` or `//` are ignored.

## Keyboard Shortcuts

- `Space` - Step one transition
- `Ctrl + P` - Run/Pause
- `Ctrl + R` - Reset machine
- `Ctrl + F` - Toggle full-screen graph

## Project Structure

- `app/` - Main app shell and global styles
- `components/` - UI components (inputs, buttons, docs, nav, footer)
- `lib/tm/` - Turing machine core logic (parser, machine runtime, graph derivation, examples)

## Import / Export

- Import accepts plain text rule files (`.txt`, `.rules`).
- Export writes a text file containing machine metadata and rule lines.

## License

No license file is currently defined in this repository.
