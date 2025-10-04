import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import IconButton from "@/components/IconButton";
import {Upload, X} from 'lucide-react';
import { supabase } from "@/lib/supabaseClient";
import {useEffect, useState} from "react";

interface DeckBuilderProps {
    gameId: string;
    deckId: string;
}

export default function DeckBuilder({ gameId, deckId }: DeckBuilderProps) {
    const [cards, setCards] = useState<{ id: string; image: string }[]>([]);
    const [files, setFiles] = useState<FileList | null>(null);

    // Load cards from DB
    useEffect(() => {
        const fetchCards = async () => {
            const { data, error } = await supabase
                .from("cards")
                .select("*")
                .eq("deck_id", deckId)
                .order("created_at", { ascending: true });

            if (!error && data) {
                setCards(data);
            }
        };

        fetchCards();

        // load cards in realtime once uploaded
        const channel = supabase
            .channel("cards-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "cards", filter: `deck_id=eq.${deckId}` },
                (payload) => {
                    setCards((prev) => {
                        switch (payload.eventType) {
                            case "INSERT":
                                return [...prev, payload.new as any];
                            case "DELETE":
                                return prev.filter((c) => c.id !== payload.old.id);
                            case "UPDATE":
                                return prev.map((c) => (c.id === payload.new.id ? (payload.new as any) : c));
                            default:
                                return prev;
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [deckId]);

    // Handle file select
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setFiles(e.target.files);
    };

    // Handle upload
    const handleUpload = async () => {
        if (!files) return;


        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) continue;

            const filePath = `user/${gameId}/${Date.now()}_${file.name}`;

            console.log(filePath);

            // Upload to storage
            const { data, error } = await supabase.storage
                .from("decks")
                .upload(filePath, file);
            console.log("Upload result:", data);
            console.log("Upload error:", error);
            if (error) {
                console.error("Upload error:", error);
                continue;
            }

            // Insert row into cards table
            const { error: insertError } = await supabase.from("cards").insert({
                deck_id: deckId,
                image: filePath,
                name: null,
            });

            if (insertError) {
                console.error("DB insert error:", insertError);
            }
        }

        setFiles(null);
    };

    const placeholders = Array.from({ length: 24 }, (_, i) => i + 1);
    return (
        <div className="px-4 space-y-4">
            <div className="deck-builder-grid">
                {placeholders.map((i) => {
                    const card = cards[i-1];
                    return (
                        <div key={i} className="card-placeholder">
                            <div className="delete-btn"><X className="size-4 stroke-3"/></div>

                            <div className="card-placeholder-content">
                                {card ? (
                                    <img src={supabase.storage.from("decks").getPublicUrl(card.image).data.publicUrl} alt="Card" />
                                ) : (<></>
                                )}
                            </div>
                        </div>
                    );
                })}

            </div>
            <div className="deck-builder-upload flex gap-2 items-center">
                <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="border-0 shadow-none"
                    onChange={handleFileChange}
                />
                <IconButton icon={Upload} variant="silver" onClick={handleUpload} />
            </div>
        </div>

    )
}
