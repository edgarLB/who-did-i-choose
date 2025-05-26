"use client"
import {getLocalPlayerId} from "@/lib/utils";
import {useState} from "react";
import {getPublicUrl} from "@/lib/getPublicUrl";
import CardBackIMG from "@/assets/images/back_temp.webp"

export default function PlayClient({game, players, cards}){

    const localPlayerId = getLocalPlayerId();
    const [currentTurnId, setCurrentTurnId] = useState(game.current_player_id);
    const isMyTurn = currentTurnId === localPlayerId;

    return(
        <div>
            <h2>{isMyTurn ? "My Turn" : "Opponent Turn"}</h2>
            {/*    My Board    */}
            <div className="grid grid-cols-6 gap-2">
                {cards.map(c => (
                    <button
                        key={c.id}
                    >
                        <img
                            src={getPublicUrl(c.image)}
                            alt={c.name}
                        />
                    </button>
                ))}
            </div>

            {/*    Enemy's Board    */}
            <div className="grid grid-cols-6 gap-2">
                {cards.map(c => (
                    <button
                        key={c.id}
                    >
                        <img
                            src="/images/back_temp.webp"
                            alt="Flipped Card"
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}