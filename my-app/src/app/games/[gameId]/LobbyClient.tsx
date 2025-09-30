"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocalPlayerId } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Deck, Card } from "@/types";
import {getPublicUrl} from "@/lib/getPublicUrl";
import {useRouter} from "next/navigation";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
import { Copy, Pencil, Check, X, User } from 'lucide-react';
import Picker, { PickerItem } from "@/components/Picker";
import IconButton from "@/components/IconButton";
import UserIcon from "@/components/UserIcon";
import PlayerRow from "@/components/PlayerRow";

export default function LobbyClient({gameId, inviteCode, decks, deckId : intialDeckId, cards : intialCards} : {
    gameId: string;
    inviteCode: string
    decks: Deck[];
    deckId: string;
    cards: Card[];
}) {

    const [deckId, setDeckId] = useState(intialDeckId);
    const [cards, setCards] = useState(intialCards);
    const [pickedCardId, setPickedCardId] = useState<string | null>(null);
    const [players, setPlayers] = useState<{ id: string; screen_name: string }[]>([]);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tmpName, setTmpName] = useState("");
    const localPlayerId = getLocalPlayerId();
    const playerCount = players.length;
    const router = useRouter();

    // Fetch players & subscribe to realtime changes
    useEffect(() => {
        let playerChannel: ReturnType<typeof supabase.channel> | undefined;

        async function fetchPlayers() {

            // Player list
            const { data: initialPlayers, error: playersError } = await supabase
                .from("players")
                .select("id, screen_name, chosen_card_id")
                .eq("game_id", gameId);

            if (playersError) {
                console.error("Error fetching players:", playersError);
            } else {
                const playersList = initialPlayers ?? [];
                setPlayers(playersList);

                const me = playersList.find(p=>p.id === localPlayerId);
                if (me?.chosen_card_id) {
                    setPickedCardId(me.chosen_card_id);
                }
            }

            // Subscribe to realtime changes to players
            playerChannel = supabase
                .channel(`players-channel-${gameId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "players",
                        filter: `game_id=eq.${gameId}`,
                    },
                    (payload) => {
                        setPlayers((prev) => {
                            switch (payload.eventType) {
                                case "INSERT":
                                    return [...prev, payload.new as any];
                                case "UPDATE":
                                    return prev.map((p) =>
                                        p.id === payload.new.id ? (payload.new as any) : p
                                    );
                                case "DELETE":
                                    return prev.filter((p) => p.id !== payload.old.id);
                                default:
                                    return prev;
                            }
                        });
                    }
                )
                .subscribe();
        }


        fetchPlayers();

        const gameChannel = supabase
            .channel(`game-channel-${gameId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "games",
                    filter: `id=eq.${gameId}`,
                },
                async (payload) => {

                    // so the player that didn't press start also goes to the game screen
                    if (payload.new.status === "in_progress"){
                        router.push(`/games/${inviteCode}/play`);
                        return;
                    }

                    const newDeckId = payload.new.deck_id as string;

                    // update and clear local deck and pick
                    setDeckId(newDeckId);
                    setPickedCardId(null);

                    const { data: newCards } = await supabase
                        .from("cards")
                        .select("id, name, image")
                        .eq("deck_id", newDeckId)
                        .order("name")

                    setCards(newCards ?? []);
                }
            ) .subscribe();

        return () => {
            if (playerChannel) supabase.removeChannel(playerChannel);
            if (gameChannel) supabase.removeChannel(gameChannel);
        };
    }, [gameId]);

    const deckItems: { image: string | null; id: string; label: string }[] = decks.map((d) => ({
        id: d.id,
        image: getPublicUrl(d.cover_image),
        label: d.name,
    }));

    const cardItems: { image: string | null; id: string; label: string }[] = cards.map((c) => ({
        id: c.id,
        image: getPublicUrl(c.image),
        label: c.name,
    }));

// …


    // To let players change their screen name
    const saveScreenName = async () => {
        if (!localPlayerId || !tmpName.trim()) return;

        const { error } = await supabase
            .from("players")
            .update({ screen_name: tmpName.trim() })
            .eq("id", localPlayerId);

        console.log("Name changed to", tmpName);

        if (error) {
            console.error("Error updating screen name:", error);
        } else {
            setIsEditing(false);
        }
    };

    const chooseDeck = async (id: string) => {
        // deck already chosen
        if (id == deckId) return;

        // locally update chosen deck
        setDeckId(id);

        // new card needs to be picked in new deck
        setPickedCardId(null);

        // update game in db so all players get a realtime update
        const { error } = await supabase
            .from("games")
            .update({
                deck_id: id,
            })
            .eq("id", gameId);

        if (error) console.error("Error updating deck:", error);

        // clear any chosen card for all players in game when deck changed
        await supabase
            .from("players")
            .update({
                chosen_card_id: null
            })
            .eq("game_id", gameId)

    }


    const chooseCard = async (id: string) => {
        // card already chosen
        if (id == pickedCardId) return;

        // locally update chosen card
        setPickedCardId(id);

        // update db with player's card
        const { error } = await supabase
            .from("players")
            .update({
                chosen_card_id: id,
            })
            .eq("id", localPlayerId);

        if (error) console.error("Error picking card:", error);
    }

    const seedPlayerCards = async () => {
        const rows = players.flatMap(player =>
            cards!.map(card => (
                {
                    player_id: player.id,
                    card_id: card.id
                })
            )
        );

        await supabase
            .from("player_cards")
            .upsert(rows, { onConflict: "player_id,card_id"});
    }

    const startGame = async () => {
        if (playerCount < 2) return;

    //     Pick who starts
        const [p1, p2] = players;
        const firstTurnId = Math.random() < 0.5 ? p1.id : p2.id;

        const {error} = await supabase
            .from("games")
            .update({
                status: "in_progress",
                current_player_id: firstTurnId,
            })
            .eq("id", gameId);

        if (error) {
            console.error("Game not started:", error);
            return;
        }

        await seedPlayerCards();

        router.push(`/games/${inviteCode}/play`);
    }

    function copyToClipboard(clip: String) {
        navigator.clipboard.writeText(clip);
        setCopiedCode(true);
        setTimeout(() => {
            setCopiedCode(false);
        }, 1500)
    }

    function prettyInviteCode(inviteCode: string) {
        return [inviteCode.slice(0,3), inviteCode.slice(3)].join('-');
    }

    return (
        <div className="lobby-container">
            <div className="lobby-side-bar">

                <div className="space-y-5 w-full">
                    <img src="/images/logo.webp" className="lobby-logo" alt="Who Did I Choose?"/>
                    <div className="white-box-container flex flex-row justify-between gap-2 items-center">
                        <div>
                            <Label className="blue-text">Invite Code</Label>
                            <Label className="chunky-text">{prettyInviteCode(inviteCode)}</Label>
                        </div>
                        <IconButton
                            icon={copiedCode ? Check : Copy}
                            variant="blue"
                            onClick={()=>copyToClipboard(inviteCode)}/>
                    </div>


                </div>
                    {/* Display Players List */}
                    <div className="players-card card-br" >
                        <h3 className="shadow-text normal pb-2">Players</h3>

                        <ul className="space-y-1">
                            {players.map((player) => (
                                <PlayerRow
                                    key={player.id}
                                    player={player}
                                    isLocal={player.id === localPlayerId}
                                    isEditing={isEditing}
                                    tmpName={tmpName}
                                    setTmpName={setTmpName}
                                    setIsEditing={setIsEditing}
                                    saveScreenName={saveScreenName}
                                />
                            ))}

                            {/* If less than 2 players, render placeholder slot */}
                            {playerCount < 2 && <PlayerRow />}
                        </ul>
                    </div>



                <Button
                    disabled={playerCount < 2}
                    onClick={() => startGame()}
                    className="button blue shadow-text larger"
                >
                    <span>Start Game</span>
                </Button>
            </div>

            <div className="lobby-main">
                <div className="lobby-main-item">
                    {/* Display Decks */}
                    <Picker
                        items={deckItems}
                        selectedId={deckId}
                        onSelect={chooseDeck}
                        type={1}
                    />
                </div>

                <div className="lobby-main-item">
                    {/* Display Cards */}
                    <Picker
                        items={cardItems}
                        selectedId={pickedCardId}
                        onSelect={chooseCard}
                        type={2}
                    />
                </div>

            </div>

        </div>
    );
}
