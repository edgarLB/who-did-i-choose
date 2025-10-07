import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import IconButton from "@/components/IconButton";
import {Upload, X} from 'lucide-react';
import { supabase } from "@/lib/supabaseClient";
import {useEffect, useRef, useState} from "react";
import { Card } from "@/types";
import FlippingCard from "@/components/FlippingCard";
import {getPublicUrl} from "@/lib/getPublicUrl";

interface DeckBuilderProps {
    gameId: string;
    deckId: string;
}

export default function DeckBuilder({ gameId, deckId }: DeckBuilderProps) {
    const [cards, setCards] = useState<Card[]>([]);
    const [files, setFiles] = useState<FileList | null>(null);
    const [cardClicked, setCardClicked] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [editedName, setEditedName] = useState("");

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async (cardId:string) => {
        if (!cardId) return;
        const { error } = await supabase
            .from("cards")
            .update({ name: editedName })
            .eq("id", cardId);

        if (error) {
            console.error("Error updating name:", error);
            return;
        }

        // update local state instantly
        setCards((prev) =>
            prev.map((c) =>
                c.id === cardId ? { ...c, name: editedName } : c
            )
        );

        setCardClicked(null);
    };



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
        const files = e.target.files ? Array.from(e.target.files) : [];
        console.log("Files dropped/selected:", files);
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

    function handleCardClick(cardId: string, cardName: string | undefined) {
        if (cardId) {
            const newCardId = cardId === cardClicked ? null : cardId;
            setCardClicked(newCardId);
            setEditedName(cardName)
        } else {
            handleFileClick();
        }
    }

    const placeholders = Array.from({ length: 24 }, (_, i) => i + 1);
    return (
        <div className="px-4 space-y-4">

            <div className="deck-builder-grid">
                {placeholders.map((i) => {
                    const card = cards[i -1];

                    if (card) {
                        const isClicked = cardClicked === card.id;
                        return(
                            <div key={card.id} className="relative">
                                <div
                                    className={`deck-builder guess-card-container ${isClicked ? "expanded" : ""}`}
                                >
                                    <div className="card-content-flex">
                                        <div className="image-wrapper">
                                            <img
                                                className="uploaded-img"
                                                src={supabase.storage.from("decks").getPublicUrl(card.image).data.publicUrl}
                                                alt="Card"
                                                onClick={() => handleCardClick(card.id, card.name)}
                                            />
                                        </div>
                                        <p>{card.name}</p>
                                    </div>



                                    {isClicked && (
                                        <div className="deck-builder guess-card-overlay">

                                            <div className="card-content-flex">
                                                <div className="image-wrapper">
                                                    <img
                                                        className="uploaded-img"
                                                        src={supabase.storage.from("decks").getPublicUrl(card.image).data.publicUrl}
                                                        alt="Card"
                                                        onClick={() => handleCardClick(card.id, card.name)}
                                                    />
                                                </div>
                                                <Input
                                                    autoFocus={true}
                                                    value={editedName}
                                                    onChange={(e) => setEditedName(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                className="deck-builder simple-button"
                                                onClick={() => handleSave(card.id)}
                                            >
                                                SAVE
                                            </Button>
                                        </div>)}
                                </div>

                            </div>)
                    } else {
                        return (
                            <div key={i}
                            className="empty-slot card-placeholder">

                            </div>
                        )
                    }

                }

                )}


            </div>

            {cards.length !== 24 && (
                <>
                    <div className="deck-builder-upload flex gap-2 items-center">
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            className="border-0 shadow-none"
                            onChange={handleFileChange}
                        />

                        {files && (

                            <IconButton icon={Upload} variant="silver" onClick={handleUpload} />
                        )

                        }

                    </div>
                    <p className="font-bold text-center pt-1">You need to create <span className="shadow-text">{24 - cards.length}</span> more cards</p>

                </>
                )}

        </div>

    )
}