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
const onlineLinkInput = document.getElementById('onlineLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const playerNameInput = document.getElementById('playerName');
const avatarOptions = document.querySelectorAll('.avatar-option');

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
  });
}

// Update game status
function updateGameStatus() {
  if (gameState.gameOver) {
    const winner = checkWinner();
    gameStatusElement.textContent = winner ? 
      `${winner === 'X' ? gameState.online.playerXName || 'Player X' : gameState.online.playerOName || 'Player O'} WINS!` : 
      "IT'S A DRAW!";
  } else {
    gameStatusElement.textContent = `${gameState.currentPlayer === 'X' ? gameState.online.playerXName || 'Player X' : gameState.online.playerOName || 'Player O'}'s TURN`;
  }
  
  roundCountElement.textContent = `ROUND ${gameState.round}/${gameState.maxRounds}`;
  scoreXElement.textContent = gameState.scores.X;
  scoreOElement.textContent = gameState.scores.O;
  
  if (gameState.gameMode === 'online') {
    onlineStatusElement.classList.remove('d-none');
    onlineStatusElement.textContent = gameState.online.opponentJoined ? 
      `PLAYING AS ${gameState.online.playerSymbol}` : 
      "WAITING FOR OPPONENT...";
  } else {
    onlineStatusElement.classList.add('d-none');
  }
}

// Update player display
function updatePlayerDisplay() {
  const playerXAvatar = document.getElementById('playerXAvatar');
  const playerOAvatar = document.getElementById('playerOAvatar');
  const playerXName = document.getElementById('playerXName');
  const playerOName = document.getElementById('playerOName');
  
  if (gameState.gameMode === 'online') {
    playerXName.textContent = gameState.online.isHost ? gameState.online.playerName : gameState.online.opponentName;
    playerOName.textContent = gameState.online.isHost ? gameState.online.opponentName : gameState.online.playerName;
    
    const xAvatar = gameState.online.isHost ? gameState.online.playerAvatar : gameState.online.opponentAvatar;
    const oAvatar = gameState.online.isHost ? gameState.online.opponentAvatar : gameState.online.playerAvatar;
    
    playerXAvatar.innerHTML = `<i class="fas fa-user-${xAvatar}"></i>`;
    playerOAvatar.innerHTML = `<i class="fas fa-user-${oAvatar}"></i>`;
  } else {
    playerXName.textContent = 'Player X';
    playerOName.textContent = 'Player O';
    playerXAvatar.innerHTML = '<i class="fas fa-user-ninja"></i>';
    playerOAvatar.innerHTML = '<i class="fas fa-user-astronaut"></i>';
  }
}

// Check for winner
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

// Handle cell click
function handleCellClick(e) {
  if (gameState.gameOver) return;
  
  const index = parseInt(e.target.getAttribute('data-index'));
  if (gameState.board[index] !== '') return;
  
  if (gameState.gameMode === 'online') {
    if (gameState.currentPlayer !== gameState.online.playerSymbol) return;
    if (!gameState.online.opponentJoined) return;
  }
  
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

// Handle game over
function handleGameOver(winner) {
  gameState.gameOver = true;
  if (winner !== 'draw') gameState.scores[winner]++;
  updateGameStatus();
  
  document.getElementById('finalScoreX').textContent = gameState.scores.X;
  document.getElementById('finalScoreO').textContent = gameState.scores.O;
  
  const winnerCelebration = document.getElementById('winnerCelebration');
  const drawCelebration = document.getElementById('drawCelebration');
  
  if (winner !== 'draw') {
    document.getElementById('gameOverMessage').textContent = 
      `${winner === 'X' ? gameState.online.playerXName || 'PLAYER X' : gameState.online.playerOName || 'PLAYER O'} WINS!`;
    document.getElementById('roundWinnerMessage').textContent = `ROUND ${gameState.round} VICTORY`;
    
    const winnerAvatar = document.getElementById('winnerAvatar');
    winnerAvatar.innerHTML = `<i class="fas fa-user-${winner === 'X' ? 
      (gameState.online.isHost ? gameState.online.playerAvatar : gameState.online.opponentAvatar) : 
      (gameState.online.isHost ? gameState.online.opponentAvatar : gameState.online.playerAvatar)}"></i>`;
    
    winnerCelebration.classList.remove('d-none');
    drawCelebration.classList.add('d-none');
  } else {
    document.getElementById('roundWinnerMessage').textContent = `ROUND ${gameState.round} ENDED IN A DRAW`;
    winnerCelebration.classList.add('d-none');
    drawCelebration.classList.remove('d-none');
  }
  
  gameOverModal.show();
}

// Online game functions
function startOnlineGame() {
  const playerName = playerNameInput.value.trim() || 'Player';
  const selectedAvatar = document.querySelector('.avatar-option.selected').getAttribute('data-avatar');
  const gameId = generateGameId();
  
  // FIXED LINK GENERATION
  const gameLink = `${window.location.href.split('?')[0]}?game=${gameId}`;
  
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
    onlineLinkInput.value = gameLink;
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.remove('d-none');
    onlineGameInfoSection.classList.add('d-none');
    onlineGameModal.show();
    
    gameModeBtn.innerHTML = '<i class="fas fa-globe"></i> ONLINE';
    updateGameStatus();
    
    setupGameListener();
  }).catch((error) => {
    console.error('Error creating game:', error);
    alert('Failed to create online game. Please try again.');
  });
}

function joinOnlineGame(gameId) {
  const playerName = playerNameInput.value.trim() || 'Player';
  const selectedAvatar = document.querySelector('.avatar-option.selected').getAttribute('data-avatar');
  
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
  
  gameState.online.gameRef.once('value').then((snapshot) => {
    const game = snapshot.val();
    if (!game) throw new Error('Game not found');
    if (game.playerO) throw new Error('Game is full');
    
    gameState.online.opponentName = game.playerXName || 'Player X';
    gameState.online.opponentAvatar = game.playerXAvatar || 'ninja';
    gameState.online.playerXName = game.playerXName;
    gameState.online.playerOName = playerName;
    
    updatePlayerDisplay();
    
    return gameState.online.gameRef.update({ 
      playerO: true,
      playerOName: playerName,
      playerOAvatar: selectedAvatar,
      lastUpdated: Date.now()
    });
  }).then(() => {
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.add('d-none');
    onlineGameInfoSection.classList.remove('d-none');
    onlineGameModal.show();
    
    gameModeBtn.innerHTML = '<i class="fas fa-globe"></i> ONLINE';
    updateGameStatus();
    
    setupGameListener();
  }).catch((error) => {
    console.error('Error joining game:', error);
    alert(error.message || 'Failed to join game');
    window.location.href = window.location.pathname;
  });
}

function setupGameListener() {
  gameState.online.gameRef.on('value', snapshot => {
    const onlineGame = snapshot.val();
    if (!onlineGame) return;
    
    if (gameState.online.isHost && onlineGame.playerO) {
      gameState.online.opponentName = onlineGame.playerOName || 'Player O';
      gameState.online.opponentAvatar = onlineGame.playerOAvatar || 'astronaut';
      gameState.online.playerOName = onlineGame.playerOName;
      
      if (!gameState.online.opponentJoined) {
        gameState.online.opponentJoined = true;
        document.getElementById('onlineSetup').classList.add('d-none');
        document.getElementById('onlineGameInfo').classList.remove('d-none');
      }
    }
    
    gameState.board = [...onlineGame.board];
    gameState.currentPlayer = onlineGame.currentPlayer;
    gameState.scores = { ...onlineGame.scores };
    gameState.round = onlineGame.round;
    gameState.gameOver = false;
    
    updateBoard();
    updateGameStatus();
    updatePlayerDisplay();
    
    const winner = checkWinner();
    if (winner) handleGameOver(winner);
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
  
  if (gameState.online.isHost) {
    updateData.playerXName = gameState.online.playerName;
    updateData.playerXAvatar = gameState.online.playerAvatar;
  } else {
    updateData.playerOName = gameState.online.playerName;
    updateData.playerOAvatar = gameState.online.playerAvatar;
  }
  
  gameState.online.gameRef.update(updateData).catch(console.error);
}

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkUrlForGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('game');
  
  if (gameId && !gameState.online.gameId) {
    onlineGameModal.show();
    
    database.ref(`games/${gameId}`).once('value').then((snapshot) => {
      if (snapshot.exists() && !snapshot.val().playerO) {
        document.getElementById('onlineSetup').classList.remove('d-none');
        document.getElementById('onlineGameInfo').classList.add('d-none');
      } else {
        alert(snapshot.exists() ? 'Game is full' : 'Game not found');
        window.location.href = window.location.pathname;
      }
    });
  }
}

// Initialize the game
function init() {
  initGame();
  
  // Event listeners
  cells.forEach(cell => cell.addEventListener('click', handleCellClick));
  
  newGameBtn.addEventListener('click', () => {
    if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
      resetGame();
    } else {
      startNewRound();
    }
  });
  
  gameModeBtn.addEventListener('click', () => gameModeModal.show());
  
  onlineGameBtn.addEventListener('click', () => {
    if (gameState.gameMode === 'online') {
      onlineGameModal.show();
    } else {
      playerNameInput.value = '';
      document.querySelector('.avatar-option').classList.add('selected');
      onlineGameModal.show();
    }
  });
  
  copyLinkBtn.addEventListener('click', () => {
    onlineLinkInput.select();
    document.execCommand('copy');
    copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> COPIED!';
    setTimeout(() => {
      copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> COPY';
    }, 2000);
  });
  
  gameOverModal._element.addEventListener('hidden.bs.modal', () => {
    if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
      resetGame();
    } else {
      startNewRound();
    }
  });
  
  checkUrlForGame();
}

document.addEventListener('DOMContentLoaded', init);
