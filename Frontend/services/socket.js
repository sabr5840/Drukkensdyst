import { io } from "socket.io-client";

const socket = io("http://172.20.10.3:3000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Forbundet til serveren:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("Socket-forbindelsesfejl:", error.message);
});

export default socket;