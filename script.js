// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAldVMomODBNAHFLPUnHTMmrBvFhh5VRLw",
  authDomain: "tictactoe-tuhin.firebaseapp.com",
  databaseURL: "https://tictactoe-tuhin-default-rtdb.firebaseio.com",
  projectId: "tictactoe-tuhin",
  storageBucket: "tictactoe-tuhin.firebasestorage.app",
  messagingSenderId: "650216057490",
  appId: "1:650216057490:web:894c54f37b2edb0219944b",
  measurementId: "G-H24QBZ9T34"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Game state
let gameState = {
  board: ['', '', '', '', '', '', '', '', ''],
  currentPlayer: 'X',
  gameMode: 'friend',
  aiDifficulty: 'hard',
  scores: { X: 0, O: 0 },
  round: 1,
  maxRounds: 5,
  gameOver: false,
  online: {
    gameId: null,
    playerSymbol: null,
    opponentJoined: false,
    isHost: false,
    gameRef: null
  }
};

// DOM elements
const cells = document.querySelectorAll('.cell');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');
const roundCountElement = document.getElementById('roundCount');
const gameStatusElement = document.getElementById('gameStatus');
const onlineStatusElement = document.getElementById('onlineStatus');
const newGameBtn = document.getElementById('newGameBtn');
const gameModeBtn = document.getElementById('gameModeBtn');
const onlineGameBtn = document.getElementById('onlineGameBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const aiDifficultySection = document.getElementById('aiDifficulty');
const onlineLinkInput = document.getElementById('onlineLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const onlinePlayerSymbolElement = document.getElementById('onlinePlayerSymbol');
const onlineGameIdElement = document.getElementById('onlineGameId');
const onlineSetupSection = document.getElementById('onlineSetup');
const onlineGameInfoSection = document.getElementById('onlineGameInfo');

// Modals
const gameModeModal = new bootstrap.Modal(document.getElementById('gameModeModal'));
const onlineGameModal = new bootstrap.Modal(document.getElementById('onlineGameModal'));
const gameOverModal = new bootstrap.Modal(document.getElementById('gameOverModal'));

// Initialize the game
function initGame() {
  gameState.board = ['', '', '', '', '', '', '', '', ''];
  gameState.currentPlayer = 'X';
  gameState.gameOver = false;
  updateBoard();
  updateGameStatus();
}

// Update the board UI
function updateBoard() {
  cells.forEach((cell, index) => {
    cell.textContent = gameState.board[index];
    cell.className = 'cell';
    if (gameState.board[index] === 'X') {
      cell.classList.add('x');
    } else if (gameState.board[index] === 'O') {
      cell.classList.add('o');
    }
  });
}

// Update game status text
function updateGameStatus() {
  if (gameState.gameOver) {
    const winner = checkWinner();
    if (winner) {
      gameStatusElement.textContent = `Player ${winner} wins!`;
    } else {
      gameStatusElement.textContent = "It's a draw!";
    }
  } else {
    gameStatusElement.textContent = `Player ${gameState.currentPlayer}'s turn`;
  }
  
  roundCountElement.textContent = `${gameState.round}/${gameState.maxRounds}`;
  scoreXElement.textContent = gameState.scores.X;
  scoreOElement.textContent = gameState.scores.O;
  
  // Update online status
  if (gameState.gameMode === 'online') {
    onlineStatusElement.classList.remove('d-none');
    if (gameState.online.opponentJoined) {
      onlineStatusElement.textContent = `Playing as ${gameState.online.playerSymbol}`;
    } else {
      onlineStatusElement.textContent = "Waiting for opponent...";
    }
  } else {
    onlineStatusElement.classList.add('d-none');
  }
}

// Check for a winner
function checkWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
      return gameState.board[a];
    }
  }

  return gameState.board.includes('') ? null : 'draw';
}

// Handle cell click
function handleCellClick(e) {
  if (gameState.gameOver) return;
  
  const index = parseInt(e.target.getAttribute('data-index'));
  
  // Check if cell is empty
  if (gameState.board[index] !== '') return;
  
  // For online games, only allow moves for the current player
  if (gameState.gameMode === 'online') {
    if (gameState.currentPlayer !== gameState.online.playerSymbol) {
      console.log("Not your turn!");
      return;
    }
    if (!gameState.online.opponentJoined) {
      console.log("Waiting for opponent to join...");
      return;
    }
  }
  
  // Make the move
  gameState.board[index] = gameState.currentPlayer;
  updateBoard();
  
  // For online games, update the server
  if (gameState.gameMode === 'online') {
    updateOnlineGame();
  }
  
  // Check for winner
  const winner = checkWinner();
  if (winner) {
    handleGameOver(winner);
  } else {
    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateGameStatus();
    
    // AI move if in AI mode and it's AI's turn
    if (gameState.gameMode === 'ai' && gameState.currentPlayer === 'O' && !gameState.gameOver) {
      setTimeout(makeAIMove, 500);
    }
  }
}

// Handle game over
function handleGameOver(winner) {
  gameState.gameOver = true;
  updateGameStatus();
  
  // Update scores if there's a winner
  if (winner !== 'draw') {
    gameState.scores[winner]++;
  }
  
  // Show game over modal
  document.getElementById('finalScoreX').textContent = gameState.scores.X;
  document.getElementById('finalScoreO').textContent = gameState.scores.O;
  
  if (winner !== 'draw') {
    document.getElementById('gameOverTitle').textContent = 'Round Over';
    document.getElementById('gameOverMessage').textContent = `Player ${winner} wins this round!`;
    document.getElementById('roundWinnerMessage').textContent = `Player ${winner} wins round ${gameState.round}`;
  } else {
    document.getElementById('gameOverTitle').textContent = 'Round Over';
    document.getElementById('gameOverMessage').textContent = "It's a draw!";
    document.getElementById('roundWinnerMessage').textContent = `Round ${gameState.round} ended in a draw`;
  }
  
  // Check if game is completely over (3 wins)
  if (gameState.scores.X >= 3 || gameState.scores.O >= 3 || gameState.round >= gameState.maxRounds) {
    const gameWinner = gameState.scores.X > gameState.scores.O ? 'X' : 
                      gameState.scores.O > gameState.scores.X ? 'O' : 'draw';
    
    if (gameWinner !== 'draw') {
      document.getElementById('gameWinnerMessage').textContent = `Player ${gameWinner} wins the game!`;
      document.getElementById('gameWinnerMessage').classList.remove('d-none');
    } else {
      document.getElementById('gameWinnerMessage').textContent = `Game ended in a draw!`;
      document.getElementById('gameWinnerMessage').classList.remove('d-none');
    }
  } else {
    document.getElementById('gameWinnerMessage').classList.add('d-none');
  }
  
  gameOverModal.show();
}

// Start a new round
function startNewRound() {
  gameState.round++;
  initGame();
  
  // For online games, update the server
  if (gameState.gameMode === 'online' && gameState.online.gameId) {
    updateOnlineGame();
  }
}

// Reset the entire game
function resetGame() {
  gameState.scores = { X: 0, O: 0 };
  gameState.round = 1;
  initGame();
  
  // For online games, update the server
  if (gameState.gameMode === 'online' && gameState.online.gameId) {
    updateOnlineGame();
  }
}

// AI move logic
function makeAIMove() {
  if (gameState.gameOver) return;
  
  let move;
  const emptyCells = gameState.board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
  
  switch (gameState.aiDifficulty) {
    case 'easy':
      if (Math.random() < 0.5) {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      } else {
        move = findWinningMove('O') || findWinningMove('X') || emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      break;
    case 'medium':
      if (Math.random() < 0.75) {
        move = findWinningMove('O') || findWinningMove('X') || emptyCells[Math.floor(Math.random() * emptyCells.length)];
      } else {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      break;
    case 'hard':
      move = findBestMove();
      break;
    default:
      move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }
  
  if (move !== undefined) {
    gameState.board[move] = 'O';
    updateBoard();
    
    const winner = checkWinner();
    if (winner) {
      handleGameOver(winner);
    } else {
      gameState.currentPlayer = 'X';
      updateGameStatus();
    }
  }
}

// Find a winning move for the given player
function findWinningMove(player) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if ((gameState.board[a] === player && gameState.board[b] === player && gameState.board[c] === '') ||
        (gameState.board[a] === player && gameState.board[c] === player && gameState.board[b] === '') ||
        (gameState.board[b] === player && gameState.board[c] === player && gameState.board[a] === '')) {
      return gameState.board[a] === '' ? a : (gameState.board[b] === '' ? b : c);
    }
  }
  return null;
}

// Minimax algorithm for hard AI
function findBestMove() {
  let bestScore = -Infinity;
  let bestMove;
  
  for (let i = 0; i < 9; i++) {
    if (gameState.board[i] === '') {
      gameState.board[i] = 'O';
      const score = minimax(gameState.board, 0, false);
      gameState.board[i] = '';
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  
  return bestMove;
}

function minimax(board, depth, isMaximizing) {
  const winner = checkWinner();
  
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (winner === 'draw') return 0;
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        const score = minimax(board, depth + 1, false);
        board[i] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        const score = minimax(board, depth + 1, true);
        board[i] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// Online game functions
function startOnlineGame() {
  // Generate a random game ID
  const gameId = generateGameId();
  gameState.online.gameId = gameId;
  gameState.online.playerSymbol = 'X';
  gameState.online.opponentJoined = false;
  gameState.online.isHost = true;
  gameState.gameMode = 'online';
  
  // Create game in Firebase
  const gameRef = database.ref(`games/${gameId}`);
  gameState.online.gameRef = gameRef;
  
  gameRef.set({
    board: gameState.board,
    currentPlayer: 'X',
    playerX: true,
    playerO: false,
    scores: gameState.scores,
    round: gameState.round,
    lastUpdated: Date.now()
  }).then(() => {
    console.log('Game created successfully');
    
    // Set up listener for game changes
    gameRef.on('value', (snapshot) => {
      const onlineGame = snapshot.val();
      if (!onlineGame) return;
      
      console.log('Game update received:', onlineGame);
      
      // Check if opponent joined
      if (!gameState.online.opponentJoined && onlineGame.playerO) {
        gameState.online.opponentJoined = true;
        onlineSetupSection.classList.add('d-none');
        onlineGameInfoSection.classList.remove('d-none');
      }
      
      // Update game state
      gameState.board = [...onlineGame.board];
      gameState.currentPlayer = onlineGame.currentPlayer;
      gameState.scores = { ...onlineGame.scores };
      gameState.round = onlineGame.round;
      gameState.gameOver = false;
      
      updateBoard();
      updateGameStatus();
      
      // Check for winner
      const winner = checkWinner();
      if (winner) {
        handleGameOver(winner);
      }
    });
    
    // Show online game modal
    const gameLink = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    onlineLinkInput.value = gameLink;
    onlinePlayerSymbolElement.textContent = 'X';
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.remove('d-none');
    onlineGameInfoSection.classList.add('d-none');
    onlineGameModal.show();
    
    // Update UI
    gameModeBtn.textContent = 'Online Game';
    updateGameStatus();
  }).catch((error) => {
    console.error('Error creating game:', error);
    alert('Failed to create online game. Please try again.');
  });
}

function joinOnlineGame(gameId) {
  console.log('Attempting to join game:', gameId);
  gameState.online.gameId = gameId;
  gameState.online.playerSymbol = 'O';
  gameState.online.opponentJoined = true;
  gameState.online.isHost = false;
  gameState.gameMode = 'online';
  
  const gameRef = database.ref(`games/${gameId}`);
  gameState.online.gameRef = gameRef;
  
  // First check if game exists and has space
  gameRef.once('value').then((snapshot) => {
    const game = snapshot.val();
    if (!game) {
      alert('Game not found');
      window.location.href = window.location.href.split('?')[0];
      return;
    }
    
    if (game.playerO) {
      alert('Game is full');
      window.location.href = window.location.href.split('?')[0];
      return;
    }
    
    // Update game to mark player O as joined
    return gameRef.update({ 
      playerO: true,
      lastUpdated: Date.now()
    });
  }).then(() => {
    console.log('Successfully joined game as player O');
    
    // Set up listener for game changes
    gameRef.on('value', (snapshot) => {
      const onlineGame = snapshot.val();
      if (!onlineGame) return;
      
      console.log('Game update received:', onlineGame);
      
      // Update game state
      gameState.board = [...onlineGame.board];
      gameState.currentPlayer = onlineGame.currentPlayer;
      gameState.scores = { ...onlineGame.scores };
      gameState.round = onlineGame.round;
      gameState.gameOver = false;
      
      updateBoard();
      updateGameStatus();
      
      // Check for winner
      const winner = checkWinner();
      if (winner) {
        handleGameOver(winner);
      }
    });
    
    // Show online game info
    onlinePlayerSymbolElement.textContent = 'O';
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.add('d-none');
    onlineGameInfoSection.classList.remove('d-none');
    onlineGameModal.show();
    
    // Update UI
    gameModeBtn.textContent = 'Online Game';
    updateGameStatus();
  }).catch((error) => {
    console.error('Error joining game:', error);
    alert('Failed to join game. Please try again.');
    window.location.href = window.location.href.split('?')[0];
  });
}

function updateOnlineGame() {
  if (!gameState.online.gameRef) return;
  
  gameState.online.gameRef.update({
    board: gameState.board,
    currentPlayer: gameState.currentPlayer,
    scores: gameState.scores,
    round: gameState.round,
    lastUpdated: Date.now()
  }).catch((error) => {
    console.error('Error updating game:', error);
  });
}

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Check URL for game ID to join
function checkUrlForGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game');
  
  if (gameId && !gameState.online.gameId) {
    database.ref(`games/${gameId}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        const game = snapshot.val();
        if (!game.playerO) {
          joinOnlineGame(gameId);
        } else {
          alert('This game already has two players.');
          window.location.href = window.location.href.split('?')[0];
        }
      } else {
        alert('Game not found.');
        window.location.href = window.location.href.split('?')[0];
      }
    });
  }
}

// Event handlers
function handleNewGame() {
  if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
    resetGame();
  } else {
    startNewRound();
  }
}

function handleOnlineButton() {
  if (gameState.gameMode === 'online') {
    onlineGameModal.show();
  } else {
    startOnlineGame();
  }
}

function handleModeSelection(e) {
  gameState.gameMode = e.target.getAttribute('data-mode');
  gameModeBtn.textContent = e.target.textContent;
  
  if (gameState.gameMode === 'ai') {
    aiDifficultySection.classList.remove('d-none');
  } else {
    aiDifficultySection.classList.add('d-none');
  }
  
  resetGame();
  gameModeModal.hide();
}

function handleDifficultySelection(e) {
  difficultyButtons.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  gameState.aiDifficulty = e.target.getAttribute('data-difficulty');
}

function copyGameLink() {
  onlineLinkInput.select();
  document.execCommand('copy');
  copyLinkBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyLinkBtn.textContent = 'Copy';
  }, 2000);
}

function handleModalClose() {
  if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
    resetGame();
  } else {
    startNewRound();
  }
}

// Initialize the game
initGame();
checkUrlForGame();
