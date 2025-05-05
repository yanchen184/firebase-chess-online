/**
 * 1A2B (Numbers Game) utilities
 * This game is also known as "Bulls and Cows" in some regions
 */

/**
 * Generates a random 4-digit number with unique digits for the 1A2B game
 * @returns {string} A 4-digit string with unique digits
 */
export const generateNumberFor1A2B = () => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const result = [];
  
  // Ensure first digit is not 0
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  result.push(firstDigit);
  digits.splice(digits.indexOf(firstDigit), 1);
  
  // Get remaining 3 digits
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result.push(digits[randomIndex]);
    digits.splice(randomIndex, 1);
  }
  
  return result.join('');
};

/**
 * Analyze a guess against the target number
 * @param {string} guess - The 4-digit guess
 * @param {string} target - The 4-digit target number
 * @returns {Object} The analysis result with a (correct digit and position) and b (correct digit but wrong position)
 */
export const analyzeGuess = (guess, target) => {
  if (guess.length !== 4 || target.length !== 4) {
    throw new Error('Both guess and target must be 4 digits');
  }
  
  let a = 0; // Correct digit and position
  let b = 0; // Correct digit but wrong position
  
  // Check for As
  for (let i = 0; i < 4; i++) {
    if (guess[i] === target[i]) {
      a++;
    }
  }
  
  // Count total matches (both correct position and wrong position)
  const guessDigits = guess.split('');
  const targetDigits = target.split('');
  let totalMatches = 0;
  
  for (const digit of guessDigits) {
    const index = targetDigits.indexOf(digit);
    if (index !== -1) {
      totalMatches++;
      targetDigits[index] = 'X'; // Mark as counted
    }
  }
  
  // Bs are total matches minus As
  b = totalMatches - a;
  
  return { a, b };
};

/**
 * Validates a guess
 * @param {string} guess - The guess to validate
 * @returns {boolean} Whether the guess is valid (4 digits, all unique)
 */
export const isValidGuess = (guess) => {
  if (!/^\d{4}$/.test(guess)) {
    return false; // Not 4 digits
  }
  
  // Check for unique digits
  return new Set(guess).size === 4;
};

/**
 * Generates a hint based on remaining guesses and history
 * @param {Array} guessHistory - Previous guesses with their results
 * @param {string} target - The target number
 * @returns {string} A hint for the player
 */
export const generateHint = (guessHistory, target) => {
  if (!guessHistory || guessHistory.length === 0) {
    return '猜一個4位數字，每個數字都不相同';
  }
  
  // For the first few guesses, just give encouragement
  if (guessHistory.length < 3) {
    return '繼續加油！';
  }
  
  // Check if player is close (has at least one 'A')
  const hasA = guessHistory.some(guess => guess.a > 0);
  
  if (!hasA) {
    return '目前還沒有猜對任何位置，嘗試一些新的數字組合';
  }
  
  // Find the highest A count so far
  const maxA = Math.max(...guessHistory.map(guess => guess.a));
  
  if (maxA >= 2) {
    return `你已經猜對了${maxA}個數字的位置，專注在其他數字`;
  }
  
  // Check if any digits from 0-9 haven't been tried yet
  const triedDigits = new Set();
  guessHistory.forEach(g => g.guess.split('').forEach(d => triedDigits.add(d)));
  
  if (triedDigits.size < 10) {
    // Find digits that haven't been tried
    const untried = [];
    for (let i = 0; i <= 9; i++) {
      if (!triedDigits.has(i.toString())) {
        untried.push(i);
      }
    }
    
    return `你還沒試過的數字: ${untried.join(', ')}`;
  }
  
  return '分析你之前的猜測，尋找數字之間的連接';
};

/**
 * Formats the guess result for display
 * @param {string} guess - The guess
 * @param {number} a - Number of correct digits in correct positions
 * @param {number} b - Number of correct digits in wrong positions
 * @returns {string} Formatted result
 */
export const formatGuessResult = (guess, a, b) => {
  return `${guess}: ${a}A${b}B`;
};

/**
 * Calculates the score based on number of guesses used
 * @param {number} guessesUsed - Number of guesses used
 * @param {number} maxGuesses - Maximum number of guesses allowed
 * @returns {number} Score (100 for perfect game, less for more guesses)
 */
export const calculateScore = (guessesUsed, maxGuesses) => {
  if (guessesUsed === 1) {
    return 100; // Perfect score for guessing on first try
  }
  
  // Score decreases as more guesses are used
  return Math.max(0, Math.floor(100 - (100 * (guessesUsed - 1)) / maxGuesses));
};