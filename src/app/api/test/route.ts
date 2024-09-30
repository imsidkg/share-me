import next from "next";
import { createServer } from "node:http";
import { NextResponse } from "next/server";
import { Server } from "socket.io";

const hostname = "localhost";
const port = 3000;
const app = next({ hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer)
})

export async function GET() {
  return NextResponse.json("hello wordl");
}
