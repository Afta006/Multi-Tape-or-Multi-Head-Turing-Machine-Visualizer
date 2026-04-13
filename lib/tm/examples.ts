export interface ExampleProgram {
  id: string;
  title: string;
  tapes: number;
  blank: string;
  startState: string;
  inputs: string[];
  rules: string;
}

export const examplePrograms: ExampleProgram[] = [
  {
    id: "binary-increment",
    title: "1-Tape Binary Increment",
    tapes: 1,
    blank: "B",
    startState: "q0",
    inputs: ["10111"],
    rules: `
# Add 1 to a binary number written on the tape (LSB on the right).
# Scan to the rightmost bit, then propagate the carry leftward.
#
# q0  – scan right to find the end
# q1  – propagate carry leftward
# qf  – done

q0,0 -> q0,0,r
q0,1 -> q0,1,r
q0,B -> q1,B,l

q1,1 -> q1,0,l
q1,0 -> qf,1,s
q1,B -> qf,1,s
`.trim(),
  },
  {
    id: "1-tape-palindrome",
    title: "1-Tape Binary Palindrome Checker",
    tapes: 1,
    blank: "B",
    startState: "q0",
    inputs: ["10101"],
    rules: `
# Symbols:
# X = marked 0
# Y = marked 1

# q0 – find leftmost unmarked symbol
q0,X -> q0,X,r
q0,Y -> q0,Y,r

q0,0 -> q1,X,r
q0,1 -> q2,Y,r
q0,B -> qa,B,s 

# q1 – move right to end (for 0)
q1,0 -> q1,0,r
q1,1 -> q1,1,r
q1,X -> q1,X,r
q1,Y -> q1,Y,r
q1,B -> q3,B,l

# q2 – move right to end (for 1)
q2,0 -> q2,0,r
q2,1 -> q2,1,r
q2,X -> q2,X,r
q2,Y -> q2,Y,r
q2,B -> q4,B,l

# q3 – check matching 0
q3,X -> q3,X,l
q3,Y -> q3,Y,l
q3,0 -> q5,X,l
q3,1 -> qr,1,s
q3,B -> qa,B,s  

# q4 – check matching 1
q4,X -> q4,X,l
q4,Y -> q4,Y,l
q4,1 -> q5,Y,l
q4,0 -> qr,0,s
q4,B -> qa,B,s

# q5 – return to left start
q5,0 -> q5,0,l
q5,1 -> q5,1,l
q5,X -> q5,X,l
q5,Y -> q5,Y,l
q5,B -> q0,B,r
`.trim(),
  },
  {
    id: "1-tape-0n-1n",
    title: "1-Tape 0^n1^n Recognizer",
    tapes: 1,
    blank: "B",
    startState: "q0",
    inputs: ["000111"],
    rules: `
# Change '0's to 'X's
# Move right to find the first '1', change it to 'Y', 
# If no '1' is found, reject.
# Move left to return to the leftmost '0' and repeat untill all '0's are marked.
# Make sure to reject if we find a '1' before all '0's are marked.

# q0 – find leftmost unmarked 0
q0,X -> q0,X,r
q0,Y -> q0,Y,r

q0,0 -> q1,X,r
q0,1 -> qr,1,s   
q0,B -> q4,B,l     

# q1 – move right to find a 1
q1,0 -> q1,0,r
q1,X -> q1,X,r
q1,Y -> q1,Y,r
q1,1 -> q2,Y,l
q1,B -> qr,B,s    

# q2 – move left back to start
q2,0 -> q2,0,l
q2,1 -> q2,1,l
q2,X -> q2,X,l
q2,Y -> q2,Y,l
q2,B -> q0,B,r

# q4 – ensure only Y remains
q4,Y -> q4,Y,l
q4,X -> q4,X,l
q4,0 -> qr,0,s
q4,1 -> qr,1,s
q4,B -> qa,B,s
    `.trim(),
  },
  {
  id: "2-tape-copy",
  title: "2-Tape Copy String",
  tapes: 2,
  blank: "B",
  startState: "q0",
  inputs: ["10101"],
  rules: `
# Copy from Tape1 to Tape2

q0,0B -> q0,00,rr
q0,1B -> q0,11,rr
q0,BB -> qa,BB,ss
`.trim(),
},
{
  id: "2-tape-reverse",
  title: "2-Tape Reverse String",
  tapes: 2,
  blank: "B",
  startState: "q0",
  inputs: ["1011"],
  rules: `
# Step 1: Copy
q0,0B -> q0,00,rr
q0,1B -> q0,11,rr
q0,BB -> q1,BB,ls

# Step 2: Move Tape1 to start
q1,0B -> q1,0B,ls
q1,1B -> q1,1B,ls
q1,BB -> q3,BB,rl

# Step 3: Write reverse on Tape1
q3,10 -> q3,00,rl
q3,00 -> q3,00,rl
q3,01 -> q3,11,rl
q3,11 -> q3,11,rl
q3,BB -> qa,BB,ss
`.trim(),
},
{
  id: "3-tape-binary-add",
  title: "3-Tape Binary Addition",
  tapes: 3,
  blank: "B",
  startState: "q0",
  inputs: ["1001", "0101", ""],
  rules: `
# Binary Addition (Multi-Tape) - O(n)

# Step 1: Move all heads to right end
q0,00B -> q0,00B,rrr
q0,01B -> q0,01B,rrr
q0,10B -> q0,10B,rrr
q0,11B -> q0,11B,rrr
q0,0BB -> q0,0BB,rsr
q0,1BB -> q0,1BB,rsr
q0,B0B -> q0,B0B,srs
q0,B1B -> q0,B1B,srs

# Step 2: When all hit blank, move back one step to start addition
q0,BBB -> q1,BBB,lll

# step 3: Add bits with carry = 0
q1,00B -> q1,000,lll
q1,01B -> q1,011,lll
q1,10B -> q1,101,lll
q1,11B -> q2,110,lll

# Step 4: Add with carry = 1
q2,00B -> q1,001,lll
q2,01B -> q2,010,lll
q2,10B -> q2,100,lll
q2,11B -> q2,111,lll

# Step 5: Handle blanks (one tape shorter) with carry = 0
q1,BB0 -> q1,BB0,lll
q1,B0B -> q1,B00,lls
q1,0BB -> q1,000,lss

# Step 6: Handle blanks with carry = 1
q2,BB0 -> q1,BB1,lll
q2,B0B -> q1,B01,lls
q2,0BB -> q1,001,lss
q2,BB1 -> q2,BB0,lll
q2,B1B -> q2,B10,lls
q2,1BB -> q2,100,lss

# Finalization
q1,BBB -> qa,BBB,sss
q2,BBB -> qa,BB1,sss
`.trim(),
}
];