"use client"
import {getLocalPlayerId} from "@/lib/utils";
import {useEffect, useState} from "react";
import {getPublicUrl} from "@/lib/getPublicUrl";
import CardBackIMG from "@/assets/images/back_temp.webp"
import {supabase} from "@/lib/supabaseClient";
import {Button} from "@/components/ui/button";
import FlippingCard from "@/components/FlippingCard";
import TransitionOverlay from "@/components/TransitionOverlay";
import { motion } from "framer-motion";
import {useRouter} from "next/navigation";

export default function PlayClient({game, players, cards, chosenCardID}){

    const router = useRouter();
    const localPlayerId = getLocalPlayerId();
    const opponentId = players.find((p) => p.id !== localPlayerId)?.id;
    const [currentTurnId, setCurrentTurnId] = useState(game.current_player_id);
    const isMyTurn = currentTurnId === localPlayerId;
    const [myFlipped, setMyFlipped] = useState<Record<string, boolean>>({});
    const [enemyFlipped, setEnemyFlipped] = useState<Record<string, boolean>>({});
    const [guessing, setGuessing] = useState(false);
    const [guessCardId, setGuessCardId] = useState<string | null>(null);
    const [guessResult, setGuessResult] = useState<boolean | null>(null);
    const [showOverlay, setShowOverlay] = useState(true);
    const [countdown, setCountdown] = useState(3);
    const [phase, setPhase] = useState<"play" | "results">("play");
    const [showAnswer, setShowAnswer] = useState(false);
    const [correctCardId, setCorrectCardId] = useState<string | null>(null);
    const announcementVariants = {
        open: {
            y: 0,
            transition: { duration: 0.4, ease: "easeInOut" }
        },
        closed: {
            y: -120,
            transition: { duration: 0.2, ease: "easeInOut" }
        }
    }


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

                    setGuessing(payload.new.guessing);


                    // check if game is over
                    if (payload.new.status === "finished") {
                        setPhase("results");
                        setGuessCardId(payload.new.guess_card_id);
                        setGuessResult(payload.new.last_result);



                        let timer = 3;
                        setCountdown(timer);

                        const interval = setInterval(() => {
                            timer--;
                            if (timer <= 0) {
                                clearInterval(interval);
                                setShowAnswer(true);
                            }
                            setCountdown(timer);
                        }, 1000)

                    } else if (payload.new.status === "in_progress") {
                        setPhase("play");
                    }
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
            body: JSON.stringify({ guessCardId, opponentId, gameId: game.id }),
        });

        if (!res.ok) {
            console.error(await res.text());
        } else {
            const { result, chosenCardId } = await res.json();
            // True: Win, False: Lose
            setGuessResult(result);
            setCorrectCardId(chosenCardId);
        }

        const { error} =await supabase
            .from("games")
            .update({status: "finished"})
            .eq("id", game.id)
            .single();

        // Only update local state if DB updated successfully
        if( !error) {
            toggleGuessMode(false);
            setPhase("results");
        }
        else {
            console.log("Could not update game status:", error);
        }

        setShowAnswer(false);
        setGuessing(false);

    }

    async function toggleGuessMode(on: boolean) {

        const { error} =await supabase
            .from("games")
            .update({guessing: on})
            .eq("id", game.id)
            .single();

        // Only update local state if DB updated successfully
        if( !error) {
            setGuessing(on)
        }
        else {
            console.log("Could not update guess mode:", error);
        }
    }

    async function handlePlayAgain() {

        const { error} =await supabase
            .from("players")
            .update({play_again: true})
            .eq("id", localPlayerId)
            .single();

        // Only update local state if DB updated successfully
        if( !error) {
            console.log("Play Again");
        }
        else {
            console.log("Could not update guess mode:", error);
        }
    }

    async function handleLeave() {
        const { error} =await supabase
            .from("players")
            .delete()
            .eq("id", localPlayerId)
            .single();


        // Only update local state if DB updated successfully
        if( !error) {
            console.log("Did not want to play again");
            router.push("/")
        }
        else {
            console.log("Could not update guess mode:", error);
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
        toggleGuessMode(false);
        setGuessCardId(null);
    }

    function handleGuessModeCardClick(cardClickedID: string) {
        if (!guessCardId) {
            setGuessCardId(cardClickedID)
        } else {
            setGuessCardId(null)
        }
    }

    return(
        <div className="flex flex-col items-center justify-center w-full min-h-screen gap-5">

            {/* Transition */}
            {showOverlay && (
                <TransitionOverlay
                    playerName="Player 1"
                    opponentName="Player 2"
                    onComplete={() => setShowOverlay(true)}
                />
            )}

            <motion.div
                className="guess-mode-announcement"
                initial="closed"
                animate={guessing ? "open" : "closed"}
                variants={announcementVariants}
            >
                    <h2 className="shadow-text larger">Final Guess</h2>
                    <p className="subtitle">Pick one card as your final guess. If you’re right, you win.
                        If you’re wrong, your opponent wins.</p>
                </motion.div>

            {phase === "play" && (
                <>
                    <img className="game-logo" src="/images/logo.webp" alt="Who Did I Choose?" />

                    {/*    My Board    */}
                    <div className="play-gameboard-container folder-card">
                        <h2 className="folder-tab shadow-text normal">{isMyTurn ? "Your Turn" : "Opponent's Turn"}</h2>
                        <div className="card-br">
                            <div className="gameboard">
                                {cards.map(c => {
                                    const isGuessed = guessCardId === c.id;

                                    return (
                                        <div key={c.id} className="relative">
                                            <div
                                                className={`guess-card-container ${isGuessed ? "expanded" : ""}`}
                                            >
                                                {/*
                                        onClick: switch between guess card and normal flipping
                                        shaking: jiggle effect for unselected cards
                                         */}
                                                <FlippingCard
                                                    frontImage={getPublicUrl(c.image)}
                                                    alt={c.name}
                                                    flipped={myFlipped[c.id]}
                                                    onClick={() =>
                                                        guessing
                                                            ? setGuessCardId(c.id)
                                                            : toggleFlip(c.id)
                                                    }
                                                    shaking={guessing && !isGuessed}
                                                    className={isGuessed ? "expanded" : ""}
                                                />

                                                {isGuessed && guessing && (
                                                    <div className="guess-card-overlay">
                                                        <img
                                                            src={
                                                                myFlipped[c.id]
                                                                    ? "/images/back_temp.webp"
                                                                    : getPublicUrl(c.image)
                                                            }
                                                            alt={c.name}
                                                            onClick={() => handleGuessModeCardClick(c.id)}
                                                            className="cursor-pointer"
                                                        />
                                                        <Button
                                                            className="simple-button"
                                                            onClick={handleGuessConfirm}
                                                        >
                                                            GUESS
                                                        </Button>
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    );
                                })}
                            </div>



                            { !isMyTurn ? (
                                <h2 className="shadow-text normal">Waiting...</h2>
                            ) : guessing ? (
                                <Button
                                    onClick={() => handleNVM()}
                                    className="button silver shadow-text normal">Never mind</Button>
                            ) : (
                                <div className="space-x-2">
                                    <Button
                                        className="button red shadow-text normal"
                                        disabled={!isMyTurn || guessing}
                                        onClick={() => toggleGuessMode(true)}
                                    > Guess</Button>
                                    <Button disabled={!isMyTurn}
                                            onClick={endTurn}
                                            className="button blue shadow-text normal"
                                    >END TURN</Button>
                                    {/*<Button onClick={() => setPhase("results")}>*/}
                                    {/*    Results*/}
                                    {/*</Button>*/}
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

                    </div>

                </>

            )}

            {phase === "results" && (
                <div className="gameover-container">
                    <img className="gameover-logo" src="/images/logo.webp" alt="Who Did I Choose?" />

                    {!showAnswer ? (
                        <>
                            <h1 className="shadow-text largest countdown">{countdown}</h1>
                            <p className="shadow-text large">The winner is...</p>
                        </>
                    ) : (
                        <>
                            {guessResult ? (
                                isMyTurn ? (
                                    <p className="shadow-text large">You Win!</p>
                                ) : (
                                    <p className="shadow-text large">You Lose 🤣🫵</p>
                                )
                            ) : (
                                isMyTurn ? (
                                    <p className="shadow-text large">Not you, Loser 🤣🫵</p>
                                ) : (
                                    <p className="shadow-text large">You Win!</p>
                                )
                            )}
                        </>
                    )}



                    {isMyTurn ? (
                        <div className="choices-container">
                            <div className="card-br">
                                <p className="shadow-text normal">You Guessed</p>
                                <img className="gameover-card emboss" src={getPublicUrl(cards.find((c) => c.id === guessCardId)?.image)}/>

                            </div>
                            <div className="card-br">
                                <p className="shadow-text normal">Answer</p>
                                <FlippingCard
                                    frontImage="/images/back_temp.webp"
                                    backImage={getPublicUrl(cards.find((c) => c.id === correctCardId)?.image)}
                                    alt="Game Over Card"
                                    flipped={showAnswer}
                                    className=""
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="choices-container">
                            <div className="card-br">
                                <p className="shadow-text normal">Your Card</p>
                                <img className="gameover-card emboss" src={getPublicUrl(cards.find((c) => c.id === chosenCardID)?.image)}/>

                            </div>
                            <div className="card-br">
                                <p className="shadow-text normal">They Guessed</p>
                                <FlippingCard
                                    frontImage="/images/back_temp.webp"
                                    backImage={getPublicUrl(cards.find((c) => c.id === guessCardId)?.image)}
                                    alt="Game Over Card"
                                    flipped={showAnswer}
                                    className=""
                                />
                            </div>
                        </div>
                    )}


                    <Button
                            onClick={handlePlayAgain}
                            className="button blue shadow-text larger"
                    >Play Again</Button>
                    <Button
                        className="button red shadow-text normal"
                        onClick={handleLeave}
                    > Leave</Button>
                    {/*<Button onClick={() => setPhase("play")}>*/}
                    {/*    Game*/}
                    {/*</Button>*/}

                </div>
            )}


        </div>
    )
}