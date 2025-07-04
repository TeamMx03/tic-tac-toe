// Firebase configuration (replace with your own)
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Game state
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameMode: 'friend', // 'friend', 'ai', 'online'
    aiDifficulty: 'hard',
    scores: { X: 0, O: 0 },
    round: 1,
    maxRounds: 5,
    gameOver: false,
    online: {
        gameId: null,
        playerSymbol: null,
        opponentJoined: false
    }
};

// DOM elements
const cells = document.querySelectorAll('.cell');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');
const roundCountElement = document.getElementById('roundCount');
const gameStatusElement = document.getElementById('gameStatus');
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
        if (gameState.currentPlayer !== gameState.online.playerSymbol) return;
        if (!gameState.online.opponentJoined) return;
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
}

// Reset the entire game
function resetGame() {
    gameState.scores = { X: 0, O: 0 };
    gameState.round = 1;
    initGame();
}

// AI move logic
function makeAIMove() {
    if (gameState.gameOver) return;
    
    let move;
    const emptyCells = gameState.board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    
    switch (gameState.aiDifficulty) {
        case 'easy':
            // Random moves 50% of the time, otherwise make a winning move or block
            if (Math.random() < 0.5) {
                move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            } else {
                move = findWinningMove('O') || findWinningMove('X') || emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
            break;
        case 'medium':
            // Make winning moves or blocks 75% of the time
            if (Math.random() < 0.75) {
                move = findWinningMove('O') || findWinningMove('X') || emptyCells[Math.floor(Math.random() * emptyCells.length)];
            } else {
                move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
            break;
        case 'hard':
            // Always make the best possible move
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
        // Check if two cells are occupied by the player and the third is empty
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
    gameState.online.playerSymbol = 'X'; // First player is X
    gameState.online.opponentJoined = false;
    
    // Create game in Firebase
    const gameRef = database.ref(`games/${gameId}`);
    gameRef.set({
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        playerX: true,
        playerO: false,
        scores: { X: 0, O: 0 },
        round: 1
    });
    
    // Set up listener for game changes
    gameRef.on('value', (snapshot) => {
        const onlineGame = snapshot.val();
        if (onlineGame) {
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
        }
    });
    
    // Show online game modal
    onlineLinkInput.value = `${window.location.href.split('?')[0]}?game=${gameId}`;
    onlinePlayerSymbolElement.textContent = 'X';
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.remove('d-none');
    onlineGameInfoSection.classList.add('d-none');
    onlineGameModal.show();
}

function joinOnlineGame(gameId) {
    gameState.online.gameId = gameId;
    gameState.online.playerSymbol = 'O';
    gameState.online.opponentJoined = true;
    
    const gameRef = database.ref(`games/${gameId}`);
    
    // Update game to mark player O as joined
    gameRef.update({ playerO: true });
    
    // Set up listener for game changes
    gameRef.on('value', (snapshot) => {
        const onlineGame = snapshot.val();
        if (onlineGame) {
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
        }
    });
    
    // Show online game info
    onlinePlayerSymbolElement.textContent = 'O';
    onlineGameIdElement.textContent = gameId;
    onlineSetupSection.classList.add('d-none');
    onlineGameInfoSection.classList.remove('d-none');
    onlineGameModal.show();
}

function updateOnlineGame() {
    const gameRef = database.ref(`games/${gameState.online.gameId}`);
    
    gameRef.update({
        board: gameState.board,
        currentPlayer: gameState.currentPlayer,
        scores: gameState.scores,
        round: gameState.round
    });
}

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Check URL for game ID to join
function checkUrlForGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        // Check if game exists
        database.ref(`games/${gameId}`).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const game = snapshot.val();
                if (!game.playerO) {
                    joinOnlineGame(gameId);
                } else {
                    alert('This game already has two players.');
                }
            } else {
                alert('Game not found.');
            }
        });
    }
}

// Event listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));

newGameBtn.addEventListener('click', () => {
    if (gameState.round >= gameState.maxRounds || gameState.scores.X >= 3 || gameState.scores.O >= 3) {
        resetGame();
    } else {
        startNewRound();
    }
    
    // For online games, reset on server
    if (gameState.gameMode === 'online' && gameState.online.gameId) {
        updateOnlineGame();
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
initGame();
checkUrlForGame();