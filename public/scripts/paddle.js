export function Paddle(options) {

  this.position = [0, 0];
  
  this.width = 20;
  this.height = 100;

  this.speed = 0;

  addEventListener('keydown', (event) => {
    //console.log(event.key);
      options.sendPaddleMove(event.key)
  });

 

  this.update = (gameState) => {
    //console.log(gameState);
    this.position[1] = gameState.y;
    this.position[0] = gameState.x;
  }

  this.draw = () => {
    options.ctx.fillRect(this.position[0], this.position[1], this.width, this.height);
  }

}