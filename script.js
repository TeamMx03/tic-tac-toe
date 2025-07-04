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

// DOM elements and event listeners setup
document.addEventListener('DOMContentLoaded', function() {
  initGame();
  setupEventListeners();
  checkUrlForGame();
});

function initGame() {
  gameState.board = ['', '', '', '', '', '', '', '', ''];
  gameState.currentPlayer = 'X';
  gameState.gameOver = false;
  updateBoard();
  updateGameStatus();
}

function setupEventListeners() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  document.getElementById('newGameBtn').addEventListener('click', handleNewGame);
  document.getElementById('gameModeBtn').addEventListener('click', () => gameModeModal.show());
  document.getElementById('onlineGameBtn').addEventListener('click', handleOnlineButton);

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', handleModeSelection);
  });

  document.querySelectorAll('.difficulty-btn').forEach(button => {
    button.addEventListener('click', handleDifficultySelection);
  });

  document.getElementById('copyLinkBtn').addEventListener('click', copyGameLink);
  
  gameOverModal._element.addEventListener('hidden.bs.modal', handleModalClose);
}

// Online game functions
function startOnlineGame() {
  const gameId = generateGameId();
  gameState.online = {
    gameId,
    playerSymbol: 'X',
    opponentJoined: false,
    isHost: true,
    gameRef: database.ref(`games/${gameId}`)
  };

  gameState.gameMode = 'online';
  updateUIForOnlineGame();

  gameState.online.gameRef.set({
    board: gameState.board,
    currentPlayer: 'X',
    playerX: true,
    playerO: false,
    scores: gameState.scores,
    round: gameState.round,
    lastUpdated: Date.now()
  }).then(() => {
    setupGameListener();
    showOnlineLink(gameId);
  }).catch(error => {
    console.error("Error creating game:", error);
    alert("Failed to create online game. Please try again.");
  });
}

function joinOnlineGame(gameId) {
  gameState.online = {
    gameId,
    playerSymbol: 'O',
    opponentJoined: true,
    isHost: false,
    gameRef: database.ref(`games/${gameId}`)
  };

  gameState.gameMode = 'online';
  updateUIForOnlineGame();

  gameState.online.gameRef.update({
    playerO: true,
    lastUpdated: Date.now()
  }).then(() => {
    setupGameListener();
    showOnlineInfo(gameId);
  }).catch(error => {
    console.error("Error joining game:", error);
    alert("Failed to join game. Please try again.");
  });
}

function setupGameListener() {
  gameState.online.gameRef.on('value', snapshot => {
    const onlineGame = snapshot.val();
    if (!onlineGame) return;

    // Update game state from Firebase
    gameState.board = [...onlineGame.board];
    gameState.currentPlayer = onlineGame.currentPlayer;
    gameState.scores = { ...onlineGame.scores };
    gameState.round = onlineGame.round;
    gameState.gameOver = false;

    // Check if opponent joined
    if (!gameState.online.opponentJoined && onlineGame.playerO) {
      gameState.online.opponentJoined = true;
      document.getElementById('onlineSetup').classList.add('d-none');
      document.getElementById('onlineGameInfo').classList.remove('d-none');
      document.getElementById('onlineStatus').textContent = "Opponent connected!";
    }

    updateBoard();
    updateGameStatus();

    const winner = checkWinner();
    if (winner) {
      handleGameOver(winner);
    }
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
  }).catch(error => {
    console.error("Error updating game:", error);
  });
}

// Game logic functions
function handleCellClick(e) {
  if (gameState.gameOver) return;
  
  const index = parseInt(e.target.getAttribute('data-index'));
  if (gameState.board[index] !== '') return;
  
  // Online game validations
  if (gameState.gameMode === 'online') {
    if (gameState.currentPlayer !== gameState.online.playerSymbol) {
      console.log("Not your turn!");
      return;
    }
    if (!gameState.online.opponentJoined) {
      console.log("Waiting for opponent...");
      return;
    }
  }
  
  // Make move
  gameState.board[index] = gameState.currentPlayer;
  updateBoard();
  
  if (gameState.gameMode === 'online') {
    updateOnlineGame();
  }
  
  const winner = checkWinner();
  if (winner) {
    handleGameOver(winner);
  } else {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateGameStatus();
    
    if (gameState.gameMode === 'ai' && gameState.currentPlayer === 'O') {
      setTimeout(makeAIMove, 500);
    }
  }
}

function checkWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
      return gameState.board[a];
    }
  }

  return gameState.board.includes('') ? null : 'draw';
}

// UI update functions
function updateBoard() {
  document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.textContent = gameState.board[index];
    cell.className = 'cell';
    if (gameState.board[index] === 'X') cell.classList.add('x');
    if (gameState.board[index] === 'O') cell.classList.add('o');
  });
}

function updateGameStatus() {
  const statusElement = document.getElementById('gameStatus');
  const onlineStatusElement = document.getElementById('onlineStatus');
  
  if (gameState.gameOver) {
    const winner = checkWinner();
    statusElement.textContent = winner ? `Player ${winner} wins!` : "It's a draw!";
  } else {
    statusElement.textContent = `Player ${gameState.currentPlayer}'s turn`;
  }

  document.getElementById('scoreX').textContent = gameState.scores.X;
  document.getElementById('scoreO').textContent = gameState.scores.O;
  document.getElementById('roundCount').textContent = `${gameState.round}/${gameState.maxRounds}`;

  if (gameState.gameMode === 'online') {
    onlineStatusElement.classList.remove('d-none');
    onlineStatusElement.textContent = gameState.online.opponentJoined 
      ? `Playing as ${gameState.online.playerSymbol}` 
      : "Waiting for opponent...";
  } else {
    onlineStatusElement.classList.add('d-none');
  }
}

// Helper functions
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkUrlForGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game');
  
  if (gameId && !gameState.online.gameId) {
    database.ref(`games/${gameId}`).once('value').then(snapshot => {
      if (snapshot.exists() && !snapshot.val().playerO) {
        joinOnlineGame(gameId);
      } else {
        alert("Game not found or already full");
        window.location.href = window.location.pathname;
      }
    });
  }
}

// Rest of the functions (handleNewGame, handleOnlineButton, handleModeSelection, etc.)
// ... [previous implementations remain the same] ...

// Event listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));

newGameBtn.addEventListener('click', () => {
  if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
    resetGame();
  } else {
    startNewRound();
  }
});

gameModeBtn.addEventListener('click', () => {
  gameModeModal.show();
});

onlineGameBtn.addEventListener('click', () => {
  if (gameState.gameMode === 'online') {
    onlineGameModal.show();
  } else {
    startOnlineGame();
  }
});

modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    gameState.gameMode = button.getAttribute('data-mode');
    gameModeBtn.textContent = button.textContent;
    
    if (gameState.gameMode === 'ai') {
      aiDifficultySection.classList.remove('d-none');
    } else {
      aiDifficultySection.classList.add('d-none');
    }
    
    resetGame();
    gameModeModal.hide();
  });
});

difficultyButtons.forEach(button => {
  button.addEventListener('click', () => {
    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    gameState.aiDifficulty = button.getAttribute('data-difficulty');
  });
});

copyLinkBtn.addEventListener('click', () => {
  onlineLinkInput.select();
  document.execCommand('copy');
  copyLinkBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyLinkBtn.textContent = 'Copy';
  }, 2000);
});

gameOverModal._element.addEventListener('hidden.bs.modal', () => {
  if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
    resetGame();
  } else {
    startNewRound();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initGame();
  checkUrlForGame();
});

// Also check when page is shown (for browser back button cases)
window.addEventListener('pageshow', checkUrlForGame);
