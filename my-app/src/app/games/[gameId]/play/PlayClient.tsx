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
    const [myFlipped, setMyFlipped] = useState<Record<string, boolean>>({});
    const [enemyFlipped, setEnemyFlipped] = useState<Record<string, boolean>>({});
    const [guessing, setGuessing] = useState(false);
    const [guessCardId, setGuessCardId] = useState<string | null>(null);
    const [guessResult, setGuessResult] = useState<"win" | "lose" | null>(null);



    useEffect(() => {
        // Initializes MY card flips
        // Just in case page is reloaded
        async function loadFlippedCards()  {
            const { data} = await supabase
                .from("player_cards")
                .select("card_id, flipped")
                .eq("player_id", localPlayerId);

            if (data) {
                setMyFlipped(Object.fromEntries(data.map(row => [row.card_id, row.flipped])))
            }
        }

        loadFlippedCards()



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
    }, [game.id, localPlayerId]);

    // flip or unflip card
    async function toggleFlip(cardId: string) {
        if (!isMyTurn) return;

        const isCurrentlyFlipped = myFlipped[cardId] ?? false;
        const newFlipState = !isCurrentlyFlipped;

        // update UI locally
        setMyFlipped(prev => ({ ...prev, [cardId]: newFlipState }));

        // update DB state
        const { error } = await supabase
            .from("player_cards")
            .update({flipped: newFlipState})
            .eq("player_id", localPlayerId)
            .eq("card_id", cardId);

        if (error) {
            console.error("Flip failed :(", error);
            // Undo UI update if DB update fails
            setMyFlipped(prev => ({ ...prev, [cardId]: isCurrentlyFlipped }));
        }
    }

    useEffect(() => {
        if (!opponentId) return;

        // Initializes OPPONENT'S card flips
        // Just in case page is reloaded
        async function loadFlippedCards()  {
            const { data} = await supabase
                .from("player_cards")
                .select("card_id, flipped")
                .eq("player_id", opponentId);

            if (data) {
                setEnemyFlipped(Object.fromEntries(data.map(row => [row.card_id, row.flipped])))
            }
        }

        loadFlippedCards()

        // See in realtime how many cards your opponent has narrowed down
        const oppChannel = supabase
            .channel(`flipped-${opponentId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "player_cards",
                    filter: `player_id=eq.${opponentId}`,
                },
                payload =>
                    setEnemyFlipped(flip => ({
                        ...flip, [payload.new.card_id]: payload.new.flipped,
                    }))
            )
            .subscribe()

        return () => supabase.removeChannel(oppChannel);
    }, [game.id, opponentId]);

    //
    async function handleGuessConfirm(){
        if (!guessCardId || !opponentId) return;

        // invokes edge function
        // returns true if correct, false if wrong
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-guess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guessCardId, opponentId }),
        });

        if (!res.ok) {
            console.error(await res.text());
        } else {
            const { result } = await res.json();
            // True: Win, False: Lose
            setGuessResult(result ? "win" : "lose");
        }


    }

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
            {guessResult === "win" && <p>You win!</p>}
            {guessResult === "lose" && <p>Loser 🤣🫵</p>}
            <h2>{isMyTurn ? "My Turn" : "Opponent Turn"}</h2>
            <Button disabled={!isMyTurn} onClick={endTurn}>END TURN</Button>

            <Button disabled={!isMyTurn || guessing} onClick={() => setGuessing(true)}>Guess</Button>
            {/*    My Board    */}
            <div className="grid grid-cols-6 gap-2">
                {cards.map(c => (
                    <div key={c.id} className="relative">
                        {guessing ? (
                            // Guessing Mode
                            <>
                                {/*render cards normally*/}
                                <button onClick={() => setGuessCardId(c.id)}>
                                    <img
                                        src={myFlipped[c.id] ? "/images/back_temp.webp" : getPublicUrl(c.image)}
                                        alt={c.name}
                                    />
                                </button>
                                {/* show confirm button on card user guesses */}
                                {guessCardId === c.id && (
                                    <button
                                        className="absolute inset-0 flex items-center justify-center bg-black text-white font-bold"
                                        onClick={handleGuessConfirm}
                                    >
                                        Confirm
                                    </button>
                                )

                                }
                            </>

                        ) : (
                            // Normal Turn
                            <button onClick={() => toggleFlip(c.id)}>
                                <img
                                    src={myFlipped[c.id] ? "/images/back_temp.webp" : getPublicUrl(c.image)}
                                    alt={c.name}
                                />
                            </button>
                        )}
                    </div>

                ))}
            </div>

            {/*    Enemy's Board    */}
            <div className="grid grid-cols-6 gap-2">
                {cards.map(c => (
                    <div key={c.id}>
                        {enemyFlipped[c.id] ? (
                            // blank space if flipped
                            <div className="w-full bg-white"/>
                        ) : (
                            // back of card otherwise
                            <img
                                    src="/images/back_temp.webp"
                                    alt="Flipped Card"
                                />
                        )}

                    </div>

                ))}
            </div>
        </div>
    )
}