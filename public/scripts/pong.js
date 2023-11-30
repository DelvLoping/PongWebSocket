import { Paddle } from "./paddle.js";
import { Ball } from "./ball.js";
import { Text } from "./text.js";



export function Pong(canvas, socket) {

  console.log("Welcome to PONG!");

  const ctx = canvas.getContext("2d");

  let text = undefined;
  let ball = undefined;

  let gameState = undefined;
  // Left paddle
  function sendPaddleMove(direction) {
    let move = null
    if (direction == "ArrowDown") {
      move = 'down';
    } else if (direction == "ArrowUp") {
      move = 'up';
    }
    socket.emit("move-paddle", move);
  }
  //3652
  const paddleLeft = new Paddle({
    ctx,
    down: "s",
    up: "z",
    height: canvas.height,
    sendPaddleMove
  }, socket);
  paddleLeft.position[0] = 0;

  // Right paddle
  const paddleRight = new Paddle({
    ctx,
    down: "ArrowDown",
    up: "ArrowUp",
    height: canvas.height,
    sendPaddleMove
  }, socket);
  paddleRight.position[0] = 580;


  // The ball
  function createBall() {
    ball = new Ball({
      ctx,
      width: canvas.width,
      height: canvas.height,
      leftPaddle: paddleLeft,
      rightPaddle: paddleRight,
      onEscape: (result) => {

        if (ball) {
          ball = undefined;
          text = new Text({ ctx, text: "Gagnant: " + (result.winner === 'left' ? 'Gauche' : 'Droit') });
          text.position = [
            canvas.width / 2.0,
            canvas.height / 2.0
          ]
          endGame();
        }

      }
    }, socket);
    ball.position = [canvas.width / 2.0, canvas.height / 2.0];

  }


  function endGame() {
    setTimeout(
      () => {
        text = undefined;
        createBall();
      },
      3000
    )
  }

  // The animation loop
  function loop() {

    // First update the position of all the objects
    if (gameState) {
      // console.log(gameState.players);
      // console.log(Object.values(gameState.players)[0]);
      let player0 = Object.values(gameState.players)[0];
      let player1 = Object.values(gameState.players)[1];
      if (player0) {
        paddleLeft.update(player0);
      }
      if (player1) {

        paddleRight.update(player1);
      }
      // console.log(ball)
      if (ball) { ball.update(gameState.ball); }
      if (text) { text.update(gameState.text); }

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all the objects
      paddleLeft.draw();
      paddleRight.draw();

      if (ball) { ball.draw(); }
      if (text) { text.draw(); }
    }
    // Program the next animation frame

  }

  createBall();

  // Start the game


  socket.on('update-game-state', (data) => {
    if (data.gameState) {
      gameState = data.gameState;
      if (gameState.players && Object.values(gameState.players??[])?.length == 2) {


        let player1Score = document.getElementById("player1Score");
        let player2Score = document.getElementById("player2Score");
        let id1 = Object.keys(gameState.players)[0]
        let id2 = Object.keys(gameState.players)[1]
console.log(player1Score,player2Score,id1,id2)
        if (parseInt(player1Score.textContent) != gameState.players[id1].score) {
          player1Score.textContent = gameState.players[id1].score
        }
        if (parseInt(player2Score.textContent) != gameState.players[id2].score) {
          player2Score.textContent = gameState.players[id2].score
        }
      }
      console.log("gameState", gameState);
      requestAnimationFrame(loop)
    }
  }
  );

  socket.on('end', (data) => {
    if (data.gameState) {
      let winner = document.getElementById("winner");
      winner.classList.remove('d-none');
      winner.textContent=gameState.winner
    }}
    );
}

export default Pong;