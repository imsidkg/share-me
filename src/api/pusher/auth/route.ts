import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";
export default function POST (req:NextRequest , res:NextResponse) {
    const {socket_id, channel_name, username} = req.body;
    const randomString = Math.random().toString().slice(2);
    const presenceData =  {
        user_id : 
    }


}