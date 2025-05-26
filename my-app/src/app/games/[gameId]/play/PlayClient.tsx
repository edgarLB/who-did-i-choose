"use client"
import {getLocalPlayerId} from "@/lib/utils";
import {useState} from "react";

export default function PlayClient({game, players, cards}){

    const localPlayerId = getLocalPlayerId();
    const [currentTurnId, setCurrentTurnId] = useState(game.current_player_id);
    const isMyTurn = currentTurnId === localPlayerId;

    return(
        <div>
            <h2>{isMyTurn ? "My Turn" : "Opponent Turn"}</h2>
        </div>
    )
}