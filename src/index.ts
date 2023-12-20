import { PongServer } from "./server";

const server = new PongServer();

server.listen(port => {
  console.log(`Server is listening on http://152.228.174.98:5151`);
});
