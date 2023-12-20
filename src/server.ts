// Import des modules nécessaires
import express, { Application, Request, Response } from "express";
var cors = require('cors')
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";

// Définition de la structure pour l'état du jeu
interface GameState {
  ball: { x: number; y: number; speedX: number; speedY: number };
  players: { [socketId: string]: { x: number; y: number, score: number } };
  running: boolean;
  height: number;
  width: number;
  speed: number;
  winner?: string;
  winCondition: number;

}
export const ballVal = { x: 300, y: 200, speedX: 3, speedY: 3 }
export const gameVal: GameState = {
  ball: { ...ballVal },
  players: {},
  running: false,
  height: 600,
  width: 400,
  speed: 10,
  winCondition: 5
};
// Classe du serveur
export class PongServer {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private gameState: GameState = { ...gameVal }

  private readonly DEFAULT_PORT = 5151;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();
    this.app.use(cors({origin: '*'}));
    this.httpServer = createServer(this.app);
    this.io = socketIO(this.httpServer);

    this.configureApp();
    this.configureRoutes();
    this.handleSocketConnection();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private configureRoutes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.sendFile("index.html");
    });
  }

  private handleSocketConnection(): void {
    this.io.on("connection", socket => {
      // Nouvel utilisateur connecté
      console.log("Je rentre");
      
      socket.on("start-game", () => {
        //console.log()
        if (Object.keys(this.gameState.players)?.length == 2) {
          this.gameState.running = !this.gameState.running;
        }

        // Envoi de l'état initial du jeu à l'utilisateur



        // Ajout d'un nouvel utilisateur à l'état du jeu
        if (!this.gameState.players[socket.id]) {
          let x = 0
          if (Object.keys(this.gameState.players)?.length == 1) {
            x = 580
          }
          this.gameState.players[socket.id] = { x: x, y: 0, score: 0 }
        }; // Ajoutez une logique appropriée pour positionner les raquettes initiales
        // Émission des informations mises à jour à tous les clients
        // socket.emit("update-game-state", { gameState: this.gameState });
        console.log(this.gameState);
        
        this.broadcastToAll("update-game-state", { gameState: this.gameState });

      });


      // Gestion des commandes du joueur
      socket.on("move-paddle", (direction: string) => {
        // Logique de mise à jour de la position de la raquette
        this.updatePaddlePosition(socket.id, direction);

        // Émission des informations mises à jour à tous les clients
        //this.broadcastToAll("update-game-state", { gameState: this.gameState });
      });

      // Gestion de la déconnexion d'un utilisateur
      socket.on("disconnect", () => {
        delete this.gameState.players[socket.id];
        this.gameState = { ...gameVal }

        // Émission des informations mises à jour à tous les clients
        this.broadcastToAll("update-game-state", { gameState: this.gameState });
      });
    });

    // Logique de mise à jour du jeu (boucle de jeu)
    const loop = setInterval(() => {
      // Logique de mise à jour du jeu (position de la balle, etc.)

      // Émission des informations mises à jour à tous les clients
      if (this.gameState.running && Object.keys(this.gameState.players)?.length == 2) {
        this.updateGameState();
        this.broadcastToAll("update-game-state", { gameState: this.gameState });
        //console.log(this.gameState)
      }
      if (this.gameState.winner) {
        this.broadcastToAll("end", { gameState: this.gameState });
        clearInterval(loop);
      }
    }, 16); // Environ 60 FPS
  }

  private resetRound() {
    this.gameState.ball = { ...ballVal }
  }

  private broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
  private updatePaddlePosition(socketId: string, direction: string): void {
    const player = this.gameState.players[socketId];
    // Assurez-vous que le joueur existe dans l'état du jeu
    if (player) {
      // Définissez la vitesse de déplacement de la raquette

      // Mettez à jour la position de la raquette en fonction de la direction
      switch (direction) {
        case "up":
          player.y -= this.gameState.speed;
          break;
        case "down":
          player.y += this.gameState.speed;
          break;
        // Ajoutez d'autres cas si nécessaire
      }
      if (player.y >= this.gameState.height) {
        player.y = this.gameState.height
      } else if (player.y <= 0) {
        player.y = 0
      }

      // Limitez la position de la raquette pour éviter qu'elle ne sorte du terrain de jeu
      //const maxY = 100; // Ajustez la valeur selon la hauteur de votre terrain de jeu
      //const minY = 0; // Ajustez la valeur selon la hauteur de votre terrain de jeu

      //player.y = Math.max(minY, Math.min(maxY, player.y));
    }
  }

  private endGame(playerId) {
    this.gameState.winner = playerId;
  }
  private updateGameState(): void {
    for (const playerId in this.gameState.players) {
      const player = this.gameState.players[playerId];
      if (player.score >= this.gameState.winCondition) {
        this.endGame(playerId)
      }
    }

    // Mettez à jour la position de la balle en fonction de sa vitesse
    this.gameState.ball.x += this.gameState.ball.speedX;
    this.gameState.ball.y += this.gameState.ball.speedY;

    // Gestion des collisions avec les bords du terrain de jeu
    const maxX = this.gameState.height; // Ajustez la valeur selon la largeur de votre terrain de jeu
    const minX = 0; // Ajustez la valeur selon la largeur de votre terrain de jeu
    const maxY = this.gameState.width; // Ajustez la valeur selon la hauteur de votre terrain de jeu
    const minY = 0; // Ajustez la valeur selon la hauteur de votre terrain de jeu
    const collisionThreshold = 5; // Ajustez la valeur du seuil de collision

    // Utilisez une fonction pour gérer la réflexion de la balle en cas de collision
    const reflectBall = (reflectionAxis: 'x' | 'y') => {
      this.gameState.ball[`speed${reflectionAxis.toUpperCase()}`] *= -1;
    };

    // Gestion des collisions avec les bords du terrain de jeu
    if (this.gameState.ball.x > maxX - collisionThreshold || this.gameState.ball.x < minX + collisionThreshold) {
      // Inverser la direction horizontale en cas de collision avec les bords gauche ou droit
      // this.gameState.ball.x = Math.max(minX + collisionThreshold, Math.min(this.gameState.ball.x, maxX - collisionThreshold));
      // reflectBall('x');
      let id: string | null = null;
      if (this.gameState.ball.x > maxX - collisionThreshold) {
        id = Object.keys(this.gameState.players)[0]
      } else if (this.gameState.ball.x < minX + collisionThreshold) {
        id = Object.keys(this.gameState.players)[1]

      }
      if (id) {
        this.gameState.players[id].score += 1;
      }
      this.resetRound();
      return;
    }

    if (this.gameState.ball.y > maxY - collisionThreshold || this.gameState.ball.y < minY + collisionThreshold) {
      // Inverser la direction verticale en cas de collision avec les bords supérieur ou inférieur
      this.gameState.ball.y = Math.max(minY + collisionThreshold, Math.min(this.gameState.ball.y, maxY - collisionThreshold));
      reflectBall('y');
    }

    // Gestion des collisions avec les raquettes
    for (const playerId in this.gameState.players) {
      const player = this.gameState.players[playerId];
      const paddleWidth = 20; // Ajustez la valeur selon la largeur de vos raquettes
      const paddleHeight = 100; // Ajustez la valeur selon la hauteur de vos raquettes

      // Check for collision with the left and right sides of the paddle
      if (
        this.gameState.ball.x + collisionThreshold > player.x &&
        this.gameState.ball.x - collisionThreshold < player.x + paddleWidth &&
        this.gameState.ball.y > player.y &&
        this.gameState.ball.y < player.y + paddleHeight
      ) {
        // Inverser la direction horizontale en cas de collision avec une raquette
        reflectBall('x');
      }

      // Check for collision with the top and bottom sides of the paddle
      if (
        this.gameState.ball.y + collisionThreshold > player.y &&
        this.gameState.ball.y - collisionThreshold < player.y + paddleHeight &&
        this.gameState.ball.x > player.x &&
        this.gameState.ball.x < player.x + paddleWidth
      ) {
        // Inverser la direction verticale en cas de collision avec une raquette
        reflectBall('y');
      }
    }
  }


}

