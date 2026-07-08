import { io } from "socket.io-client";

const socket = io("http://10.0.0.28:3000", {
  transports: ["websocket"],
});

export default socket;