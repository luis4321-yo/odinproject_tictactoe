const Gameboard = (() => {
  const board = ["", "", "", "", "", "", "", "", ""];

  const getBoard = () => [...board];

  const placeMarker = (index, marker) => {
    if (!Number.isInteger(index) || index < 0 || index >= board.length) {
      return false;
    }

    if (board[index] !== "" || !["X", "O"].includes(marker)) {
      return false;
    }

    board[index] = marker;
    return true;
  };

  const resetBoard = () => {
    board.fill("");
  };

  return { getBoard, placeMarker, resetBoard };
})();



const Player = (name, marker) => {
  return {
    name,
    marker
  };
};



const GameController = (() => {
  const winningCombinations = [
    [0, 1, 2], 
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  let players = [];
  let activePlayerIndex = 0;
  let gameIsOver = true;
  let result = null;

  const getActivePlayer = () => players[activePlayerIndex];
  const getPlayers = () => [...players];
  const getResult = () => result;
  const isGameOver = () => gameIsOver;

  const startGame = (playerOneName, playerTwoName) => {
    const nameOne = playerOneName.trim() || "Player 1";
    const nameTwo = playerTwoName.trim() || "Player 2";

    players = [
      Player(nameOne, "X"),
      Player(nameTwo, "O")
    ];

    activePlayerIndex = 0;
    gameIsOver = false;
    result = null;
    Gameboard.resetBoard();

    return getGameState();
  };

  const checkWinner = (board) => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;

      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { marker: board[a], combination };
      }
    }

    return null;
  };

  const playRound = (index) => {
    if (gameIsOver || players.length === 0) {
      return { validMove: false, ...getGameState() };
    }

    const activePlayer = getActivePlayer();
    const moveWasPlaced = Gameboard.placeMarker(index, activePlayer.marker);

    // Invalid moves do not change the turn.
    if (!moveWasPlaced) {
      return { validMove: false, ...getGameState() };
    }

    const board = Gameboard.getBoard();
    const winningMove = checkWinner(board);

    if (winningMove) {
      gameIsOver = true;
      result = {
        type: "win",
        winner: activePlayer,
        winningCombination: winningMove.combination
      };
    } else if (board.every((square) => square !== "")) {
      gameIsOver = true;
      result = { type: "tie" };
    } else {
      activePlayerIndex = (activePlayerIndex + 1) % players.length;
    }

    return { validMove: true, ...getGameState() };
  };

  const getGameState = () => ({
    board: Gameboard.getBoard(),
    players: getPlayers(),
    activePlayer: players.length ? getActivePlayer() : null,
    gameIsOver,
    result
  });

  const restartGame = () => {
    if (players.length === 0) return getGameState();

    Gameboard.resetBoard();
    activePlayerIndex = 0;
    gameIsOver = false;
    result = null;

    return getGameState();
  };

  return {
    startGame,
    playRound,
    restartGame,
    getGameState,
    getActivePlayer,
    getResult,
    isGameOver
  };
})();


const DisplayController = (() => {
  const form = document.querySelector("#player-form");
  const playerOneInput = document.querySelector("#player-one");
  const playerTwoInput = document.querySelector("#player-two");
  const startButton = document.querySelector("#start-button");
  const restartButton = document.querySelector("#restart-button");
  const cells = [...document.querySelectorAll(".cell")];

  const statusLabel = document.querySelector("#status-label");
  const statusMessage = document.querySelector("#status-message");

  const playerOneName = document.querySelector("#player-one-name");
  const playerTwoName = document.querySelector("#player-two-name");
  const playerOneCard = document.querySelector("#player-one-card");
  const playerTwoCard = document.querySelector("#player-two-card");

  const renderBoard = (board, winningCombination = []) => {
    cells.forEach((cell, index) => {
      const marker = board[index];

      cell.textContent = marker;
      cell.classList.toggle("mark-x", marker === "X");
      cell.classList.toggle("mark-o", marker === "O");
      cell.classList.toggle("winning-cell", winningCombination.includes(index));
      cell.disabled = marker !== "" || GameController.isGameOver();
      cell.setAttribute(
        "aria-label",
        marker ? `Square ${index + 1}: ${marker}` : `Square ${index + 1}: empty`
      );
    });
  };

  const renderPlayers = (players, activePlayer) => {
    if (players.length === 0) return;

    playerOneName.textContent = players[0].name;
    playerTwoName.textContent = players[1].name;

    playerOneCard.classList.toggle("active", activePlayer?.marker === "X");
    playerTwoCard.classList.toggle("active", activePlayer?.marker === "O");
  };

  const renderStatus = (state) => {
    const { activePlayer, gameIsOver, result } = state;

    if (result?.type === "win") {
      statusLabel.textContent = "GAME OVER";
      statusMessage.textContent = `${result.winner.name} wins!`;
    } else if (result?.type === "tie") {
      statusLabel.textContent = "GAME OVER";
      statusMessage.textContent = "It's a tie!";
    } else if (!gameIsOver && activePlayer) {
      statusLabel.textContent = "CURRENT TURN";
      statusMessage.textContent = `${activePlayer.name}'s turn (${activePlayer.marker})`;
    } else {
      statusLabel.textContent = "READY TO PLAY";
      statusMessage.textContent = "Enter your names and start";
    }
  };

  const render = (state) => {
    const winningCombination = state.result?.winningCombination || [];
    renderBoard(state.board, winningCombination);
    renderPlayers(state.players, state.activePlayer);
    renderStatus(state);
  };

  const handleCellClick = (event) => {
    const index = Number(event.currentTarget.dataset.index);
    const state = GameController.playRound(index);

    if (state.validMove) {
      render(state);
    }
  };

  const handleStart = (event) => {
    event.preventDefault();

    const state = GameController.startGame(
      playerOneInput.value,
      playerTwoInput.value
    );

    render(state);
    startButton.textContent = "New game";
  };

  const handleRestart = () => {
    const state = GameController.restartGame();
    render(state);
  };

  const bindEvents = () => {
    cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
    form.addEventListener("submit", handleStart);
    restartButton.addEventListener("click", handleRestart);
  };

  const init = () => {
    bindEvents();
    render(GameController.getGameState());
  };

  return { init };
})();


DisplayController.init();