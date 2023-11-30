export function Paddle(options) {

  this.position = [0, 0];
  
  this.width = 20;
  this.height = 100;

  this.speed = 0;

  addEventListener('keydown', (event) => {
    if (event.key === options.down) {
      this.speed = 10;
    } else if (event.key === options.up) {
      this.speed = -10;
    }
  });

  addEventListener('keyup', (event) => {
    if (event.key === options.down) {
      this.speed = 0;
    } else if (event.key === options.up) {
      this.speed = 0;
    }
  })
  
  this.update = () => {
    this.position[1] = this.position[1] + this.speed;
    if (this.position[1] < 0) { this.position[1] = 0; }
    if (this.position[1] + this.height > options.height) { this.position[1] = options.height - this.height; }

  }

  this.draw = () => {
    options.ctx.fillRect(this.position[0], this.position[1], this.width, this.height);
  }

}