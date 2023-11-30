// Import des modules nécessaires
import express, { Application, Request, Response } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";

// Définition de la structure pour l'état du jeu
interface GameState {
  ball: { x: number; y: number; speedX: number; speedY: number };
  players: { [socketId: string]: { x: number; y: number } };
  running: boolean;
}

// Classe du serveur
export class PongServer {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private gameState: GameState = {
    ball: { x: 0, y: 0, speedX: 5, speedY: 5 },
    players: {},
    running: false
  };

  private readonly DEFAULT_PORT = 5050;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();
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

      socket.on("start-game", () => {
        this.gameState.running = true;
        // Envoi de l'état initial du jeu à l'utilisateur

        socket.emit("update-game-state", { gameState: this.gameState });

        // Ajout d'un nouvel utilisateur à l'état du jeu
        this.gameState.players[socket.id] = { x: 0, y: 0 }; // Ajoutez une logique appropriée pour positionner les raquettes initiales

        // Émission des informations mises à jour à tous les clients
        this.broadcastToAll("update-game-state", { gameState: this.gameState });

      });


      // Gestion des commandes du joueur
      socket.on("move-paddle", (direction: string) => {
        // Logique de mise à jour de la position de la raquette
        this.updatePaddlePosition(socket.id, direction);

        // Émission des informations mises à jour à tous les clients
        this.broadcastToAll("update-game-state", { gameState: this.gameState });
      });

      // Gestion de la déconnexion d'un utilisateur
      socket.on("disconnect", () => {
        delete this.gameState.players[socket.id];

        // Émission des informations mises à jour à tous les clients
        this.broadcastToAll("update-game-state", { gameState: this.gameState });
      });
    });

    // Logique de mise à jour du jeu (boucle de jeu)
    setInterval(() => {
      // Logique de mise à jour du jeu (position de la balle, etc.)
      this.updateGameState();

      // Émission des informations mises à jour à tous les clients
      this.broadcastToAll("update-game-state", { gameState: this.gameState });
    }, 16); // Environ 60 FPS
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
      const paddleSpeed = 5;

      // Mettez à jour la position de la raquette en fonction de la direction
      switch (direction) {
        case "up":
          player.y -= paddleSpeed;
          break;
        case "down":
          player.y += paddleSpeed;
          break;
        // Ajoutez d'autres cas si nécessaire
      }

      // Limitez la position de la raquette pour éviter qu'elle ne sorte du terrain de jeu
      const maxY = 100; // Ajustez la valeur selon la hauteur de votre terrain de jeu
      const minY = -100; // Ajustez la valeur selon la hauteur de votre terrain de jeu

      player.y = Math.max(minY, Math.min(maxY, player.y));
    }
  }


  private updateGameState(): void {
    // Mettez à jour la position de la balle en fonction de sa vitesse
    this.gameState.ball.x += this.gameState.ball.speedX;
    this.gameState.ball.y += this.gameState.ball.speedY;

    // Gestion des collisions avec les bords du terrain de jeu
    const maxX = 200; // Ajustez la valeur selon la largeur de votre terrain de jeu
    const minX = -200; // Ajustez la valeur selon la largeur de votre terrain de jeu
    const maxY = 100; // Ajustez la valeur selon la hauteur de votre terrain de jeu
    const minY = -100; // Ajustez la valeur selon la hauteur de votre terrain de jeu

    if (this.gameState.ball.x > maxX || this.gameState.ball.x < minX) {
      // Inverser la direction horizontale en cas de collision avec les bords gauche ou droit
      this.gameState.ball.speedX *= -1;
    }

    if (this.gameState.ball.y > maxY || this.gameState.ball.y < minY) {
      // Inverser la direction verticale en cas de collision avec les bords supérieur ou inférieur
      this.gameState.ball.speedY *= -1;
    }

    // Gestion des collisions avec les raquettes
    for (const playerId in this.gameState.players) {
      const player = this.gameState.players[playerId];
      const paddleWidth = 10; // Ajustez la valeur selon la largeur de vos raquettes
      const paddleHeight = 30; // Ajustez la valeur selon la hauteur de vos raquettes

      if (
        this.gameState.ball.x > player.x - paddleWidth / 2 &&
        this.gameState.ball.x < player.x + paddleWidth / 2 &&
        this.gameState.ball.y > player.y - paddleHeight / 2 &&
        this.gameState.ball.y < player.y + paddleHeight / 2
      ) {
        // Inverser la direction horizontale en cas de collision avec une raquette
        this.gameState.ball.speedX *= -1;
      }
    }
  }

}

