import next from "next";
import { NextResponse } from "next/server";

const hostname = "localhost";
const port = 3000;
const app = next({ hostname, port });

app.

export async function GET() {
  return NextResponse.json("hello wordl");
}
