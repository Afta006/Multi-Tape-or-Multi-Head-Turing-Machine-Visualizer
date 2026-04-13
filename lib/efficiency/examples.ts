export interface EfficiencyExample {
  id: string;
  name: string;
  description: string;
  explanation: string;
  input: string;
  inputTape2?: string;
  singleTapeRules: string;
  multiTapeRules: string;
  multiHeadRules?: string;
  tapes: number;
  heads?: number;
  headStartPositions?: number[];
}

export const EFFICIENCY_EXAMPLES: EfficiencyExample[] = [
  {
    id: "palindrome",
    name: "Palindrome Checker",
    description: "Check if string is a palindrome: 10101",
    explanation: "Single-tape marks symbols and rescans repeatedly from both ends. Multi-tape reads forward and backward simultaneously in one pass, avoiding repeated full-tape traversals. Multi-head uses two heads from opposite ends converging toward center—same O(n) efficiency with simpler logic.",
    input: "10101",
    inputTape2: "",
    singleTapeRules: `# Palindrome Check (Single-Tape) - O(n²)
# Marks symbols as it compares from outside → inside
# Inefficient: requires many rescans of the entire tape

# q0 – find leftmost unmarked symbol
q0,X -> q0,X,r
q0,Y -> q0,Y,r
q0,0 -> q1,X,r
q0,1 -> q2,Y,r
q0,B -> qa,B,s

# q1 – scan right to end (for 0)
q1,0 -> q1,0,r
q1,1 -> q1,1,r
q1,X -> q1,X,r
q1,Y -> q1,Y,r
q1,B -> q3,B,l

# q2 – scan right to end (for 1)
q2,0 -> q2,0,r
q2,1 -> q2,1,r
q2,X -> q2,X,r
q2,Y -> q2,Y,r
q2,B -> q4,B,l

# q3 – check rightmost = leftmost (0)
q3,X -> q3,X,l
q3,Y -> q3,Y,l
q3,0 -> q5,X,l
q3,1 -> qr,1,s
q3,B -> qa,B,s

# q4 – check rightmost = leftmost (1)
q4,X -> q4,X,l
q4,Y -> q4,Y,l
q4,1 -> q5,Y,l
q4,0 -> qr,0,s
q4,B -> qa,B,s

# q5 – return to start
q5,0 -> q5,0,l
q5,1 -> q5,1,l
q5,X -> q5,X,l
q5,Y -> q5,Y,l
q5,B -> q0,B,r`,
    multiTapeRules: `# Palindrome Check (Multi-Tape) - O(n)
# Tape 1: Read forward
# Tape 2: Read backward (copy in reverse)
# Compare in parallel: one pass only!

# Step 1: Copy to Tape2 while moving right
q0,0B -> q0,00,rr
q0,1B -> q0,11,rr
q0,BB -> q1,BB,ll

# Step 2: Move Tape1 to start, Tape2 to end
q1,00 -> q1,00,ls
q1,10 -> q1,10,ls
q1,01 -> q1,01,ls
q1,11 -> q1,11,ls
q1,B0 -> q2,B0,rs
q1,B1 -> q2,B1,rs
q1,BB -> qa,BB,ss

# Step 3: Compare forward vs backward simultaneously
q2,00 -> q2,00,rl
q2,11 -> q2,11,rl
q2,BB -> qa,BB,ss
q2,01 -> qr,01,ss
q2,10 -> qr,10,ss
q2,0B -> qr,0B,ss
q2,1B -> qr,1B,ss
q2,B0 -> qr,B0,ss
q2,B1 -> qr,B1,ss`,
    multiHeadRules: `# Palindrome Check (Multi-Head) - O(n)
# Head 1 starts at left end (position 0)
# Head 2 starts at right end (position -1)
# They move toward center: H1 moves Right, H2 moves Left
# Compare symbols at each step

# q0 – Both heads read same symbol, continue moving toward center
q0,00 -> q0,00,rl
q0,11 -> q0,11,rl
q0,BB -> qa,BB,ss

# Reject if symbols don't match (not a palindrome)
q0,01 -> qr,01,ss
q0,10 -> qr,10,ss
q0,0B -> qr,0B,ss
q0,1B -> qr,1B,ss`,
    tapes: 2,
    heads: 2,
    headStartPositions: [0, -1],
  },
  {
    id: "binary-addition",
    name: "Binary Addition",
    description: "Add two 4-bit binary numbers: 1011 (11) + 0110 (6) = 10001 (17)",
    explanation: "Single-tape concatenates both numbers and requires repeated scanning to align and process digit pairs. Multi-tape (3 tapes) processes both numbers digit-by-digit in parallel with result accumulation—only O(n) passes instead of O(n²) rescans.",
    input: "0011",
    inputTape2: "0110",
    singleTapeRules: `# Binary Addition (Single-Tape) - O(n²)
# Input: two binary numbers separated by # (e.g., 1011#0110)
# Increment first number by 1, decrement second number by 1 until second is zero.

# q0 – scan right to find end of string
q0,0 -> q0,0,r
q0,1 -> q0,1,r
q0,# -> q0,#,r
q0,B -> q1,B,l

# q1 – Decrement the second number
# If 0, carry borrow to next bit. If 1, subtract and stop borrow.
q1,0 -> q1,1,l
q1,1 -> q2,0,l
q1,# -> q_done,#,r

# q2 – Move left past # to first number
q2,0 -> q2,0,l
q2,1 -> q2,1,l
q2,# -> q3,#,l

# q3 – Increment the first number (carry 1)
# If 1, becomes 0, pass carry left. If 0, becomes 1, stop carry.
q3,1 -> q3,0,l
q3,0 -> q4,1,r
q3,B -> q4,1,r

# q4 – Return to end of string to repeat
q4,0 -> q4,0,r
q4,1 -> q4,1,r
q4,# -> q4,#,r
q4,B -> q1,B,l
`,
    multiTapeRules: `# Binary Addition (Multi-Tape) - O(n)
# Tape 1: First number (1011)
# Tape 2: Second number (0110)
# Tape 3: Result (accumulate sum and carry)

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
q2,BBB -> qa,BB1,sss`,
    multiHeadRules: `
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
`,
    tapes: 3,
    heads: 2,
    headStartPositions: [0, 5],
  },
  {
    id: "substring-search",
    name: "Substring Search (Pattern Matching)",
    description: "Find if Tape 2 pattern exists in Tape 1: Text aababb, Pattern abb",
    explanation: "Single-tape must scan back-and-forth between text and pattern for every comparison. Multi-tape keeps the pattern fixed on Tape 2 and simply slides the text across it, finding the match in parallel without rewriting.",
    input: "aababb",
    inputTape2: "abb",
    singleTapeRules: `
# ── q0: advance window, skip old markers ────────────────────────────
q0,V -> q0,V,r
q0,W -> q0,W,r
q0,X -> q0,X,r
q0,Z -> q0,Z,r
q0,a -> q1,X,r       
q0,b -> q1,Z,r        
q0,# -> qr,#,s       

# ── q1: scan right to separator ─────────────────────────────────────
q1,a -> q1,a,r
q1,b -> q1,b,r
q1,V -> q1,V,r
q1,W -> q1,W,r
q1,P -> q1,P,r
q1,Q -> q1,Q,r
q1,# -> q2,#,r

# ── q2: read next pattern char ───────────────────────────────────────
q2,M -> q2,M,r
q2,N -> q2,N,r
q2,a -> q3a_l,M,l    
q2,b -> q3b_l,N,l    
q2,B -> qa,B,s        

# ── q3a_l: scan left all the way to window start ─────────────────────
# (looking to match an 'a' in text)
q3a_l,M -> q3a_l,M,l
q3a_l,N -> q3a_l,N,l
q3a_l,# -> q3a_l,#,l
q3a_l,a -> q3a_l,a,l  
q3a_l,b -> q3a_l,b,l
q3a_l,P -> q3a_l,P,l 
q3a_l,Q -> q3a_l,Q,l
q3a_l,V -> q3a_r,V,r  
q3a_l,W -> q3a_r,W,r
q3a_l,X -> q4,V,r     
q3a_l,Z -> q_fail,Z,r 

# ── q3a_r: scan right past matched chars, find first unmatched ───────
q3a_r,V -> q3a_r,V,r
q3a_r,W -> q3a_r,W,r
q3a_r,P -> q3a_r,P,r
q3a_r,Q -> q3a_r,Q,r
q3a_r,a -> q4,P,r   
q3a_r,b -> q_fail,b,r 
q3a_r,# -> q_fail,#,r 

# ── q3b_l: scan left all the way to window start ─────────────────────
# (looking to match a 'b' in text)
q3b_l,M -> q3b_l,M,l
q3b_l,N -> q3b_l,N,l
q3b_l,# -> q3b_l,#,l
q3b_l,a -> q3b_l,a,l
q3b_l,b -> q3b_l,b,l
q3b_l,P -> q3b_l,P,l
q3b_l,Q -> q3b_l,Q,l
q3b_l,V -> q3b_r,V,r
q3b_r,W -> q3b_r,W,r
q3b_l,X -> q_fail,X,r 
q3b_l,Z -> q4,W,r    

# ── q3b_r: scan right past matched chars, find first unmatched ───────
q3b_r,V -> q3b_r,V,r
q3b_r,P -> q3b_r,P,r
q3b_r,Q -> q3b_r,Q,r
q3b_r,b -> q4,Q,r    
q3b_r,a -> q_fail,a,r
q3b_r,# -> q_fail,#,r

# ── q4: scan right back to pattern ───────────────────────────────────
q4,V -> q4,V,r
q4,W -> q4,W,r
q4,P -> q4,P,r
q4,Q -> q4,Q,r
q4,a -> q4,a,r
q4,b -> q4,b,r
q4,# -> q2,#,r

# ── q_fail pass 1: scan right, restore M→a N→b ───────────────────────
q_fail,a -> q_fail,a,r
q_fail,b -> q_fail,b,r
q_fail,# -> q_fail,#,r
q_fail,M -> q_fail,a,r
q_fail,N -> q_fail,b,r
q_fail,B -> q_rl,B,l   

# ── q_rl (restore-left) pass 2: scan left, restore P→a Q→b ──────────
# stop at window start marker and hand off to q0
q_rl,a -> q_rl,a,l
q_rl,b -> q_rl,b,l
q_rl,# -> q_rl,#,l
q_rl,P -> q_rl,a,l     
q_rl,Q -> q_rl,b,l
q_rl,V -> q0,V,r       
q_rl,W -> q0,W,r
q_rl,X -> q0,X,r       
q_rl,Z -> q0,Z,r

# ── accept / reject ──────────────────────────────────────────────────
qa,B -> qa,D,s
qr,# -> qr,D,s`,
    multiTapeRules: `# Substring Search (Multi-Tape) - O(N)
# Tape 1: Text T
# Tape 2: Pattern P

# Keep pattern fixed on Tape 2.
# Slide Tape 1 head and compare simultaneously.

# q0 - Start comparison
q0,aa -> q0,aa,rr
q0,bb -> q0,bb,rr
q0,ab -> q1,ab,rl
q0,ba -> q1,ba,rl
q0,Ba -> qr,Ba,ss
q0,Bb -> qr,Bb,ss
q0,aB -> qa,Ba,ss
q0,bB -> qa,Bb,ss
q0,BB -> qa,BB,ss

# q1 - Mismatch found. Reset Tape 2 to start.
q1,aa -> q1,aa,sl
q1,ab -> q1,ab,sl
q1,ba -> q1,ba,sl
q1,bb -> q1,bb,sl
q1,aB -> q0,aB,sr
q1,bB -> q0,bB,sr`,
    multiHeadRules: `
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
`,
    tapes: 2,
    heads: 2,
    headStartPositions: [0, 7],
  },
];
