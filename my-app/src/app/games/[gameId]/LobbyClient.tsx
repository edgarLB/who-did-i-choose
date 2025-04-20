"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Load player ID
const getLocalPlayerId = () =>
    typeof window !== "undefined" ? localStorage.getItem("playerId") : null;

export default function LobbyClient({gameId, inviteCode} : {gameId: string; inviteCode: string}) {
    const [players, setPlayers] = useState<{ id: string; screen_name: string }[]>(
        []
    );
    const [isEditing, setIsEditing] = useState(false);
    const [tmpName, setTmpName] = useState("");
    const localPlayerId = getLocalPlayerId();
    const playerCount = players.length;

    // Fetch players & subscribe to realtime changes
    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | undefined;

        async function fetchPlayers() {

            // Player list
            const { data: initialPlayers, error: playersError } = await supabase
                .from("players")
                .select("id, screen_name")
                .eq("game_id", gameId);

            if (playersError) {
                console.error("Error fetching players:", playersError);
            } else {
                setPlayers(initialPlayers ?? []);
            }

            // Subscribe to realtime changes to players
            channel = supabase
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

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [gameId]);

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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-2xl font-bold">Lobby</h1>
            <h2 className="text-lg">Invite Code: {inviteCode}</h2>

            <p className="font-semibold">Players:</p>
            <ul className="space-y-1">
                {players.map((player) => (
                    <li key={player.id} className="flex items-center gap-2">
                        {player.id === localPlayerId ? (
                            isEditing ? (
                                <>
                                    <Input
                                        value={tmpName}
                                        onChange={(e) => setTmpName(e.target.value)}
                                        className="w-40 h-8"
                                    />
                                    <Button size="sm" onClick={saveScreenName}>
                                        Save
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span className="font-medium">{player.screen_name}</span>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setTmpName(player.screen_name);
                                        setIsEditing(true);
                                    }}>
                                        Edit
                                    </Button>
                                </>
                            )
                        ) : (
                            <span>{player.screen_name}</span>
                        )}
                    </li>
                ))}
            </ul>

            {playerCount < 2 ? (
                <p>Waiting for the other player…</p>
            ) : null}

            <Button disabled={playerCount < 2}>Start Game</Button>
        </div>
    );
}
