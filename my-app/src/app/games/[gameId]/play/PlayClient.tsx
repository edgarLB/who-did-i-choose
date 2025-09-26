"use client"
import {getLocalPlayerId} from "@/lib/utils";
import {useEffect, useState} from "react";
import {getPublicUrl} from "@/lib/getPublicUrl";
import CardBackIMG from "@/assets/images/back_temp.webp"
import {supabase} from "@/lib/supabaseClient";
import {Button} from "@/components/ui/button";
import FlippingCard from "@/components/FlippingCard";
import TransitionOverlay from "@/components/TransitionOverlay";

export default function PlayClient({game, players, cards, chosenCardID}){

    const localPlayerId = getLocalPlayerId();
    const opponentId = players.find((p) => p.id !== localPlayerId)?.id;
    const [currentTurnId, setCurrentTurnId] = useState(game.current_player_id);
    const isMyTurn = currentTurnId === localPlayerId;
    const [myFlipped, setMyFlipped] = useState<Record<string, boolean>>({});
    const [enemyFlipped, setEnemyFlipped] = useState<Record<string, boolean>>({});
    const [guessing, setGuessing] = useState(false);
    const [guessCardId, setGuessCardId] = useState<string | null>(null);
    const [guessResult, setGuessResult] = useState<"win" | "lose" | null>(null);
    const [showOverlay, setShowOverlay] = useState(true);


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

    function handleNVM() {
        setGuessing(false);
        setGuessCardId(null);
    }

    return(
        <div className="flex flex-col items-center justify-center w-full h-full gap-5">
            {guessResult === "win" && <p>You win!</p>}
            {guessResult === "lose" && <p>Loser 🤣🫵</p>}
            {/* Transition */}
            {showOverlay && (
                <TransitionOverlay
                    playerName="Player 1"
                    opponentName="Player 2"
                    onComplete={() => setShowOverlay(true)}
                />
            )}
            <img className="game-logo" src="/images/logo.webp" alt="Who Did I Choose?" />

            {/*    My Board    */}
            <div className="play-gameboard-container folder-card">
                <h2 className="folder-tab shadow-title">{isMyTurn ? "Your Turn" : "Opponent's Turn"}</h2>
                <div className="card-br">
                    <div className="gameboard">
                        {cards.map(c => {
                            const isGuessed = guessCardId === c.id;

                            return (
                                <div key={c.id} className="relative">
                                    {guessing ? (
                                        <div
                                            className={`guess-card-container ${guessCardId === c.id ? "expanded" : ""}`}
                                        >
                                            <button onClick={() => setGuessCardId(c.id)}>
                                                <img
                                                    className="emboss"
                                                    src={
                                                        myFlipped[c.id]
                                                            ? "/images/back_temp.webp"
                                                            : getPublicUrl(c.image)
                                                    }
                                                    alt={c.name}
                                                />
                                            </button>

                                            {guessCardId === c.id && (
                                                <div className="guess-card-overlay">
                                                    <img
                                                        src={
                                                            myFlipped[c.id]
                                                                ? "/images/back_temp.webp"
                                                                : getPublicUrl(c.image)
                                                        }
                                                        alt={c.name}
                                                    />
                                                    <Button
                                                        className="simple-button"
                                                        onClick={() => handleGuessConfirm()}
                                                    >
                                                        GUESS
                                                    </Button>
                                                </div>

                                            )}
                                        </div>
                                    ) : (
                                        <FlippingCard
                                            frontImage={getPublicUrl(c.image)}
                                            alt={c.name}
                                            onClick={() => toggleFlip(c.id)}
                                            flipped={myFlipped[c.id]}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>


                    { !isMyTurn ? (
                        <h2 className="shadow-text">Waiting...</h2>
                    ) : guessing ? (
                        <Button
                            onClick={() => handleNVM()}
                        className="button silver shadow-text">Never mind</Button>
                    ) : (
                        <div className="space-x-2">
                            <Button
                                className="button red shadow-text"
                                disabled={!isMyTurn || guessing}
                                onClick={() => setGuessing(true)}
                            > Guess</Button>
                            <Button disabled={!isMyTurn}
                                    onClick={endTurn}
                                    className="button blue shadow-text"
                            >END TURN</Button>
                        </div>
                    )}
                </div>


            </div>

                <div className="game-area">
                    <img className="play-chosen-card emboss" src={getPublicUrl(cards.find((c) => c.id === chosenCardID)?.image)}/>
                    {/*    Enemy's Board    */}
                    <div className="enemy-board">
                        {cards.map(c => (
                            <div key={c.id}>
                                <FlippingCard
                                    frontImage={"/images/back_temp.webp"} // This will be hidden on flip
                                    flipped={enemyFlipped[c.id]}
                                    enemy={true}
                                    alt={c.name}
                                    className="no-point"
                                />
                            </div>
                        ))}
                    </div>
                    {/*<img className="play-chosen-card" src={getPublicUrl(cards.find((c) => c.id === chosenCardID)?.image)}/>*/}
                    {/*<Button*/}
                    {/*    className="play-guess-button shadow-text w-full"*/}

                    {/*    disabled={!isMyTurn || guessing}*/}
                    {/*    onClick={() => setGuessing(true)}*/}
                    {/*>*/}
                    {/*    <div className="guess-button">*/}
                    {/*        <div className="guess-button-user">*/}
                    {/*            <svg*/}
                    {/*                className="guess-user-svg"*/}
                    {/*                viewBox="0 0 122 158"*/}
                    {/*                fill="none"*/}
                    {/*                xmlns="http://www.w3.org/2000/svg"*/}
                    {/*            >*/}
                    {/*                <path*/}
                    {/*                    fillRule="evenodd"*/}
                    {/*                    clipRule="evenodd"*/}
                    {/*                    d="M61.1529 66.8942C79.501 66.8942 94.375 52.0201 94.375 33.6719C94.375 15.3238 79.501 0.449707 61.1529 0.449707C42.8048 0.449707 27.9307 15.3238 27.9307 33.6719C27.9307 52.0201 42.8048 66.8942 61.1529 66.8942Z"*/}
                    {/*                    fill="#5F6E73"*/}
                    {/*                />*/}
                    {/*                <path*/}
                    {/*                    fillRule="evenodd"*/}
                    {/*                    clipRule="evenodd"*/}
                    {/*                    d="M121.937 157.333C118.594 106.473 92.655 66.8942 61.1529 66.8942C29.6505 66.8942 3.71224 106.473 0.369141 157.333H121.937Z"*/}
                    {/*                    fill="#5F6E73"*/}
                    {/*                />*/}
                    {/*            </svg>*/}
                    {/*        </div>*/}


                    {/*        <h2 className="p-1">Guess</h2>*/}


                    {/*    </div>*/}
                    {/*</Button>*/}



                {/*<div className="right">*/}
                {/*    <div className="endturn-srn-lg-container">*/}
                {/*        <Button disabled={!isMyTurn}*/}
                {/*                onClick={endTurn}*/}
                {/*                className="blue-button shadow-text"*/}
                {/*        >END TURN</Button>*/}
                {/*    </div>*/}

                {/*    <img src="/images/logo.webp" className="endturn-logo"/>*/}
                {/*</div>*/}


            </div>
        </div>
    )
}