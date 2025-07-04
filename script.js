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
    gameRef: null,
    playerName: 'Player',
    playerAvatar: 'ninja',
    opponentName: 'Opponent',
    opponentAvatar: 'astronaut'
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
const playerNameInput = document.getElementById('playerName');
const avatarOptions = document.querySelectorAll('.avatar-option');
const playerXAvatar = document.getElementById('playerXAvatar');
const playerOAvatar = document.getElementById('playerOAvatar');
const playerXName = document.getElementById('playerXName');
const playerOName = document.getElementById('playerOName');
const onlinePlayerXAvatar = document.getElementById('onlinePlayerXAvatar');
const onlinePlayerOAvatar = document.getElementById('onlinePlayerOAvatar');
const onlinePlayerXName = document.getElementById('onlinePlayerXName');
const onlinePlayerOName = document.getElementById('onlinePlayerOName');

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
  updatePlayerDisplay();
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
    
    // Remove winner class from all cells
    cell.classList.remove('winner-cell');
  });
  
  // Highlight winning cells if game is over
  if (gameState.gameOver) {
    const winner = checkWinner();
    if (winner && winner !== 'draw') {
      const winPattern = getWinningPattern();
      if (winPattern) {
        winPattern.forEach(index => {
          cells[index].classList.add('winner-cell');
        });
      }
    }
  }
}

// Update game status text
function updateGameStatus() {
  if (gameState.gameOver) {
    const winner = checkWinner();
    if (winner) {
      gameStatusElement.textContent = `${winner === 'X' ? gameState.online.playerXName || 'Player X' : gameState.online.playerOName || 'Player O'} WINS!`;
    } else {
      gameStatusElement.textContent = "IT'S A DRAW!";
    }
  } else {
    gameStatusElement.textContent = `${gameState.currentPlayer === 'X' ? gameState.online.playerXName || 'Player X' : gameState.online.playerOName || 'Player O'}'s TURN`;
  }
  
  roundCountElement.textContent = `ROUND ${gameState.round}/${gameState.maxRounds}`;
  scoreXElement.textContent = gameState.scores.X;
  scoreOElement.textContent = gameState.scores.O;
  
  // Update online status
  if (gameState.gameMode === 'online') {
    onlineStatusElement.classList.remove('d-none');
    if (gameState.online.opponentJoined) {
      onlineStatusElement.textContent = `PLAYING AS ${gameState.online.playerSymbol}`;
    } else {
      onlineStatusElement.textContent = "WAITING FOR OPPONENT...";
    }
  } else {
    onlineStatusElement.classList.add('d-none');
  }
}

// Update player display
function updatePlayerDisplay() {
  if (gameState.gameMode === 'online') {
    playerXName.textContent = gameState.online.isHost ? gameState.online.playerName : gameState.online.opponentName;
    playerOName.textContent = gameState.online.isHost ? gameState.online.opponentName : gameState.online.playerName;
    
    // Set avatars
    const xAvatar = gameState.online.isHost ? gameState.online.playerAvatar : gameState.online.opponentAvatar;
    const oAvatar = gameState.online.isHost ? gameState.online.opponentAvatar : gameState.online.playerAvatar;
    
    playerXAvatar.innerHTML = `<i class="fas fa-user-${xAvatar}"></i>`;
    playerOAvatar.innerHTML = `<i class="fas fa-user-${oAvatar}"></i>`;
    
    // Update online modal display
    onlinePlayerXName.textContent = gameState.online.playerXName || 'Player X';
    onlinePlayerOName.textContent = gameState.online.opponentJoined ? (gameState.online.playerOName || 'Player O') : 'Waiting...';
    
    onlinePlayerXAvatar.innerHTML = `<i class="fas fa-user-${gameState.online.playerAvatar}"></i>`;
    if (gameState.online.opponentJoined) {
      onlinePlayerOAvatar.innerHTML = `<i class="fas fa-user-${gameState.online.opponentAvatar}"></i>`;
    }
  } else {
    playerXName.textContent = 'Player X';
    playerOName.textContent = 'Player O';
    playerXAvatar.innerHTML = '<i class="fas fa-user-ninja"></i>';
    playerOAvatar.innerHTML = '<i class="fas fa-user-astronaut"></i>';
  }
}

// Check for a winner and return the winning pattern
function getWinningPattern() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
      return pattern;
    }
  }

  return null;
}

// Check for a winner
function checkWinner() {
  return getWinningPattern() ? gameState.board[getWinningPattern()[0]] : 
         gameState.board.includes('') ? null : 'draw';
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
  
  const winnerCelebration = document.getElementById('winnerCelebration');
  const drawCelebration = document.getElementById('drawCelebration');
  
  if (winner !== 'draw') {
    document.getElementById('gameOverTitle').textContent = 'BATTLE RESULTS';
    document.getElementById('gameOverMessage').textContent = `${winner === 'X' ? gameState.online.playerXName || 'PLAYER X' : gameState.online.playerOName || 'PLAYER O'} WINS!`;
    document.getElementById('roundWinnerMessage').textContent = `ROUND ${gameState.round} VICTORY`;
    
    // Set winner avatar
    const winnerAvatar = document.getElementById('winnerAvatar');
    if (winner === 'X') {
      winnerAvatar.innerHTML = `<i class="fas fa-user-${gameState.online.isHost ? gameState.online.playerAvatar : gameState.online.opponentAvatar}"></i>`;
    } else {
      winnerAvatar.innerHTML = `<i class="fas fa-user-${gameState.online.isHost ? gameState.online.opponentAvatar : gameState.online.playerAvatar}"></i>`;
    }
    
    winnerCelebration.classList.remove('d-none');
    drawCelebration.classList.add('d-none');
  } else {
    document.getElementById('gameOverTitle').textContent = 'BATTLE RESULTS';
    document.getElementById('roundWinnerMessage').textContent = `ROUND ${gameState.round} ENDED IN A DRAW`;
    winnerCelebration.classList.add('d-none');
    drawCelebration.classList.remove('d-none');
  }
  
  // Check if game is completely over (3 wins)
  if (gameState.scores.X >= 3 || gameState.scores.O >= 3 || gameState.round >= gameState.maxRounds) {
    const gameWinner = gameState.scores.X > gameState.scores.O ? 'X' : 
                      gameState.scores.O > gameState.scores.X ? 'O' : 'draw';
    
    if (gameWinner !== 'draw') {
      const championMessage = document.getElementById('gameWinnerMessage');
      championMessage.classList.remove('d-none');
      document.getElementById('championName').textContent = gameWinner === 'X' ? 
        (gameState.online.playerXName || 'PLAYER X') : 
        (gameState.online.playerOName || 'PLAYER O');
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
  // Get player name and avatar
  const playerName = playerNameInput.value.trim() || 'Player';
  const selectedAvatar = document.querySelector('.avatar-option.selected').getAttribute('data-avatar');
  
  // Generate a random game ID
  const gameId = generateGameId();
  
  // Update game state
  gameState.online = {
    gameId,
    playerSymbol: 'X',
    opponentJoined: false,
    isHost: true,
    playerName,
    playerAvatar: selectedAvatar,
    opponentName: 'Opponent',
    opponentAvatar: 'astronaut',
    playerXName: playerName,
    playerOName: 'Waiting...',
    gameRef: database.ref(`games/${gameId}`)
  };
  
  gameState.gameMode = 'online';
  updatePlayerDisplay();
  
  // Create game in Firebase
  gameState.online.gameRef.set({
    board: gameState.board,
    currentPlayer: 'X',
    playerX: true,
    playerO: false,
    scores: gameState.scores,
    round: gameState.round,
    playerXName: playerName,
    playerXAvatar: selectedAvatar,
    playerOName: '',
    playerOAvatar: '',
    lastUpdated: Date.now()
  }).then(() => {
    console.log('Game created successfully');
    
    // Set up listener for game changes
    setupGameListener();
    
    // Show online game modal
    const gameLink = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    onlineLinkInput.value = gameLink;
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.remove('d-none');
    onlineGameInfoSection.classList.add('d-none');
    onlineGameModal.show();
    
    // Update UI
    gameModeBtn.textContent = 'ONLINE';
    gameModeBtn.innerHTML = '<i class="fas fa-globe"></i> ONLINE';
    updateGameStatus();
  }).catch((error) => {
    console.error('Error creating game:', error);
    alert('Failed to create online game. Please try again.');
  });
}

function joinOnlineGame(gameId) {
  console.log('Attempting to join game:', gameId);
  
  // Get player name and avatar
  const playerName = playerNameInput.value.trim() || 'Player';
  const selectedAvatar = document.querySelector('.avatar-option.selected').getAttribute('data-avatar');
  
  // Update game state
  gameState.online = {
    gameId,
    playerSymbol: 'O',
    opponentJoined: true,
    isHost: false,
    playerName,
    playerAvatar: selectedAvatar,
    gameRef: database.ref(`games/${gameId}`)
  };
  
  gameState.gameMode = 'online';
  
  // First check if game exists and has space
  gameState.online.gameRef.once('value').then((snapshot) => {
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
    
    // Update opponent info
    gameState.online.opponentName = game.playerXName || 'Player X';
    gameState.online.opponentAvatar = game.playerXAvatar || 'ninja';
    gameState.online.playerXName = game.playerXName;
    gameState.online.playerOName = playerName;
    
    updatePlayerDisplay();
    
    // Update game to mark player O as joined
    return gameState.online.gameRef.update({ 
      playerO: true,
      playerOName: playerName,
      playerOAvatar: selectedAvatar,
      lastUpdated: Date.now()
    });
  }).then(() => {
    console.log('Successfully joined game as player O');
    
    // Set up listener for game changes
    setupGameListener();
    
    // Show online game info
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.add('d-none');
    onlineGameInfoSection.classList.remove('d-none');
    onlineGameModal.show();
    
    // Update UI
    gameModeBtn.textContent = 'ONLINE';
    gameModeBtn.innerHTML = '<i class="fas fa-globe"></i> ONLINE';
    updateGameStatus();
  }).catch((error) => {
    console.error('Error joining game:', error);
    alert('Failed to join game. Please try again.');
    window.location.href = window.location.href.split('?')[0];
  });
}

function setupGameListener() {
  gameState.online.gameRef.on('value', snapshot => {
    const onlineGame = snapshot.val();
    if (!onlineGame) return;
    
    console.log('Game update received:', onlineGame);
    
    // Update opponent info if we're the host
    if (gameState.online.isHost && onlineGame.playerO) {
      gameState.online.opponentName = onlineGame.playerOName || 'Player O';
      gameState.online.opponentAvatar = onlineGame.playerOAvatar || 'astronaut';
      gameState.online.playerOName = onlineGame.playerOName;
      
      if (!gameState.online.opponentJoined) {
        gameState.online.opponentJoined = true;
        document.getElementById('onlineSetup').classList.add('d-none');
        document.getElementById('onlineGameInfo').classList.remove('d-none');
        document.querySelector('.player-status').textContent = 'READY';
      }
    }
    
    // Update game state from Firebase
    gameState.board = [...onlineGame.board];
    gameState.currentPlayer = onlineGame.currentPlayer;
    gameState.scores = { ...onlineGame.scores };
    gameState.round = onlineGame.round;
    gameState.gameOver = false;
    
    updateBoard();
    updateGameStatus();
    updatePlayerDisplay();
    
    // Check for winner
    const winner = checkWinner();
    if (winner) {
      handleGameOver(winner);
    }
  });
}

function updateOnlineGame() {
  if (!gameState.online.gameRef) return;
  
  const updateData = {
    board: gameState.board,
    currentPlayer: gameState.currentPlayer,
    scores: gameState.scores,
    round: gameState.round,
    lastUpdated: Date.now()
  };
  
  // If we're the host, also update player names
  if (gameState.online.isHost) {
    updateData.playerXName = gameState.online.playerName;
    updateData.playerXAvatar = gameState.online.playerAvatar;
  } else {
    updateData.playerOName = gameState.online.playerName;
    updateData.playerOAvatar = gameState.online.playerAvatar;
  }
  
  gameState.online.gameRef.update(updateData).catch((error) => {
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
    // Show online setup modal
    onlineGameModal.show();
    
    database.ref(`games/${gameId}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        const game = snapshot.val();
        if (!game.playerO) {
          // Game exists and has space, ready to join
          document.getElementById('onlineSetup').classList.remove('d-none');
          document.getElementById('onlineGameInfo').classList.add('d-none');
        } else {
          alert('This game already has two players.');
          window.location.href = window.location.pathname;
        }
      } else {
        alert('Game not found.');
        window.location.href = window.location.pathname;
      }
    });
  }
}

// Event listeners
function setupEventListeners() {
  // Cell clicks
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });
  
  // New game button
  newGameBtn.addEventListener('click', () => {
    if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
      resetGame();
    } else {
      startNewRound();
    }
  });
  
  // Game mode button
  gameModeBtn.addEventListener('click', () => {
    gameModeModal.show();
  });
  
  // Online game button
  onlineGameBtn.addEventListener('click', () => {
    if (gameState.gameMode === 'online') {
      onlineGameModal.show();
    } else {
      // Show player name and avatar selection
      playerNameInput.value = '';
      document.querySelector('.avatar-option').classList.add('selected');
      document.querySelectorAll('.avatar-option:not(:first-child)').forEach(opt => {
        opt.classList.remove('selected');
      });
      onlineGameModal.show();
    }
  });
  
  // Mode selection
  modeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      gameState.gameMode = e.currentTarget.getAttribute('data-mode');
      gameModeBtn.textContent = e.currentTarget.querySelector('.mode-title').textContent;
      gameModeBtn.innerHTML = `<i class="fas ${e.currentTarget.querySelector('.mode-icon i').className.split(' ')[1]}"></i> ${e.currentTarget.querySelector('.mode-title').textContent.toUpperCase()}`;
      
      if (gameState.gameMode === 'ai') {
        aiDifficultySection.classList.remove('d-none');
      } else {
        aiDifficultySection.classList.add('d-none');
      }
      
      resetGame();
      gameModeModal.hide();
    });
  });
  
  // Difficulty selection
  difficultyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      e.currentTarget.classList.add('active');
      gameState.aiDifficulty = e.currentTarget.getAttribute('data-difficulty');
    });
  });
  
  // Avatar selection
  avatarOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      avatarOptions.forEach(opt => opt.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
    });
  });
  
  // Copy link button
  copyLinkBtn.addEventListener('click', () => {
    onlineLinkInput.select();
    document.execCommand('copy');
    copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> COPIED!';
    setTimeout(() => {
      copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> COPY';
    }, 2000);
  });
  
  // Game over modal close
  gameOverModal._element.addEventListener('hidden.bs.modal', () => {
    if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
      resetGame();
    } else {
      startNewRound();
    }
  });
}

// Initialize the game
function init() {
  initGame();
  setupEventListeners();
  checkUrlForGame();
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
