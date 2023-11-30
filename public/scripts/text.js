export function Text(options) {

  this.position = [250, 200]

  this.update = () => {
    
  }

  this.draw = () => {
    options.ctx.textAlign = "center";
    options.ctx.font = "30px Arial";
    options.ctx.fillText(options.text, this.position[0], this.position[1]);

  }
} 