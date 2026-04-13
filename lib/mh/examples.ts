export const multiHeadExamples = [
  {
    id: "palindrome",
    title: "Palindrome Check",
    description: "Check if a string reads the same forwards and backwards",
    heads: 2,
    blank: "B",
    startState: "q0",
    input: "abcba",
    headStartPositions: [0, -1],
    rules: `# 2-Head Turing Machine: Palindrome Checker
# Head 1 starts at position 0 (left end)
# Head 2 starts at position 4 (right end)
# They move towards center: H1 moves Right, H2 moves Left

q0,aa -> q0,aa,rl
q0,bb -> q0,bb,rl
q0,cc -> q0,cc,rl
q0,BB -> qa,BB,ss
`,
  },
  {
  id: "binary-equal",
  title: "Binary Equality Check",
  description: "Check if two binary strings separated by # are equal",
  heads: 2,
  blank: "B",
  startState: "q0",
  input: "101#101",
  headStartPositions: [0, 4],
  rules: `# Head1 -> left string, Head2 -> right string

q0,11 -> q0,11,rr
q0,00 -> q0,00,rr
q0,## -> qa,##,ss

# mismatch
q0,10 -> qr,10,ss
q0,01 -> qr,01,ss
`
},
{
  "id": "substring",
  "title": "Substring Match",
  "description": "Check if pattern (right side) exists in text (left side)",
  "heads": 2,
  "blank": "B",
  "startState": "q0",
  "input": "aababb#abb",
  "headStartPositions": [0, 7],
  "rules": `
# --- Q0: START MATCH ATTEMPT ---
# Mark the current text position with X (for a) or Y (for b) and advance
q0,aa -> q2,Xa,rr
q0,bb -> q2,Yb,rr

# Immediate mismatch on the first character
q0,ab -> q1,Xb,ss
q0,ba -> q1,Ya,ss

# If Head 1 hits the '#' separator without fully matching the pattern, qr
q0,#a -> qr,#a,ss
q0,#b -> qr,#b,ss

# --- q1: IMMEDIATE RECOVERY ---
# Restore the marker and advance Head 1 (Head 2 stays at pattern start)
q1,Xb -> q0,ab,rs
q1,Ya -> q0,ba,rs

# --- q2: CONTINUE COMPARING ---
# Characters match, keep moving both heads right
q2,aa -> q2,aa,rr
q2,bb -> q2,bb,rr

# SUCCESS: Head 2 reached the blank space (end of pattern)",
q2,aB -> qa,aB,ss
q2,bB -> qa,bB,ss
q2,#B -> qa,#B,ss

# MISMATCH: Partial match failed, begin rewinding Head 1",
q2,ab -> q3,ab,ls
q2,ba -> q3,ba,ls
q2,#a -> q3,#a,ls
q2,#b -> q3,#b,ls

# --- q3: REWIND TEXT HEAD ---
# Move Head 1 left until it finds the X or Y marker
q3,aa -> q3,aa,ls
q3,ab -> q3,ab,ls
q3,ba -> q3,ba,ls
q3,bb -> q3,bb,ls

# Marker found! Restore original char, step Head 1 right, switch to Head 2 rewind
q3,Xa -> q4,aa,rs
q3,Xb -> q4,ab,rs
q3,Ya -> q4,ba,rs
q3,Yb -> q4,bb,rs

# --- q4: REWIND PATTERN HEAD ---
# Move Head 2 left until it finds the '#' separator
q4,aa -> q4,aa,sl
q4,ab -> q4,ab,sl
q4,ba -> q4,ba,sl
q4,bb -> q4,bb,sl

# Found the '#' separator. Step Head 2 right to pattern start and resume q0",
q4,a# -> q0,a#,sr
q4,b# -> q0,b#,sr
  `.trim()
},
{
  id: "reverse-match",
  title: "Reverse Match",
  description: "Check if right side is reverse of left side",
  heads: 2,
  blank: "B",
  startState: "q0",
  input: "abc#cba",
  headStartPositions: [0, -1],
  rules: `# Compare outward vs inward

q0,aa -> q0,aa,rl
q0,bb -> q0,bb,rl
q0,cc -> q0,cc,rl

q0,## -> qa,##,ss

q0,ab -> qr,ab,ss
`.trim()
},
{
  "id": "binary-addition",
  "title": "Binary Addition",
  "description": "Adds two binary numbers separated by # and outputs the sum",
  "heads": 2,
  "blank": "B",
  "startState": "q0",
  "input": "01101#1011",
  "headStartPositions": [0, 6],
  "rules":`
# --- Move both heads to the end of their respective numbers ---
q0,00 -> q0,00,rr
q0,01 -> q0,01,rr
q0,10 -> q0,10,rr
q0,11 -> q0,11,rr
q0,#B -> q1,#B,ll
q0,0B -> q0,0B,rs
q0,1B -> q0,1B,rs

# --- State: No Carry ---
q1,00 -> q1,00,ll
q1,01 -> q1,11,ll
q1,10 -> q1,10,ll
q1,11 -> q2,01,ll

# --- State: With Carry (1) ---
q2,00 -> q1,10,ll
q2,01 -> q2,01,ll
q2,10 -> q2,00,ll
q2,11 -> q2,11,ll

# --- Handling unequal lengths or finishing ---
q1,B# -> halt,B#,ss
q2,B# -> q3,1#,ss
q3,1# -> halt,1#,ss
    `.trim()
}
];
