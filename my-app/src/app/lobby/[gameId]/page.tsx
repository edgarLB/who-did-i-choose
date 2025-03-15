"use client"
import {useParams, useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

export default function Lobby() {

    const params = useParams();

    return(
        <div>
            <h1>Lobby</h1>
            <h2>Invite Code: {params.gameId}</h2>
            <p>Waiting for other player...</p>
            <Button disabled={true}>Start Game</Button>
        </div>
    )
}