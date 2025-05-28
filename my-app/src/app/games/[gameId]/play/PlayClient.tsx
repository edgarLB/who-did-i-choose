"use client"
import {getLocalPlayerId} from "@/lib/utils";
import {useEffect, useState} from "react";
import {getPublicUrl} from "@/lib/getPublicUrl";
import CardBackIMG from "@/assets/images/back_temp.webp"
import {supabase} from "@/lib/supabaseClient";
import {Button} from "@/components/ui/button";

export default function PlayClient({game, players, cards}){

    const localPlayerId = getLocalPlayerId();
    const opponentId = players.find((p) => p.id !== localPlayerId)?.id;
    const [currentTurnId, setCurrentTurnId] = useState(game.current_player_id);
    const isMyTurn = currentTurnId === localPlayerId;

    useEffect(() => {
        // Realtime games channel
        const gameChannel = supabase
            .channel(`game-${game.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "games",
                    filter: `id=eq.${game.id}`,
                },
                (payload) => {
                    // When turn changes in DB, update the local state
                    const newTurnId = payload.new.current_player_id;
                    setCurrentTurnId(newTurnId);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(gameChannel);
    }, [game.id]);

    async function endTurn() {
        // Safeguard: Only current player can end their turn
        if (!isMyTurn || !opponentId) return;

        // Update DB current_player_id to opponentID
        const { error} =await supabase
            .from("games")
            .update({"current_player_id": opponentId})
            .eq("id", game.id)
            .single();

        // Only update local state if DB updated successfully
        if( !error) {
            setCurrentTurnId(opponentId);
        }
        else {
            console.log("Did not end turn:", error);
        }
    }

    return(
        <div>
            <h2>{isMyTurn ? "My Turn" : "Opponent Turn"}</h2>
            <Button disabled={!isMyTurn} onClick={endTurn}>END TURN</Button>

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