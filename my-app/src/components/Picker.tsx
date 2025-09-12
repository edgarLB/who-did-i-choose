"use client"
import {useEffect, useRef, useState} from "react";
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton";
import {it} from "node:test";


export interface PickerItem {
    id: string;
    image: string;
    label?: string;
}

interface PickerProps {
    items: PickerItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    type: 1 | 2;
    className?: string;
}

export default function Picker({
                                   items,
                                   selectedId,
                                   onSelect,
                                   type = 1,
                                   className,
                               } : PickerProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [ selectedIMG, setSelectedIMG ] = useState<string | null>();
    let title = type === 1 ? "Deck" : "Card";

    useEffect(() => {
        if (!selectedId) return;
        const selectedItem = items.find(item => item.id === selectedId)
        if (selectedItem) {
            setSelectedIMG(selectedItem.image);
        }
    }, [items, selectedId]);


    return (
        <div className="picker-container card-br">
            <div className="flex items-center justify-between">
                <div className=" flex flex-row gap-5">
                    <h3 className="shadow-text">Choose a {title}</h3>
                    {/*<IconButton icon={Shuffle} variant="silver"/>*/}
                </div>
            </div>
            {type === 1 ?
                <div className="deck-container">
                    {items.map((it) => (
                        <Button
                            key={it.id}
                            onClick={() => {
                                onSelect(it.id)
                                setSelectedIMG(it.image)
                            }}
                            className={cn(
                                "deck-button bold-text-sma",
                                selectedId === it.id ? "ring ring-white" : "",
                            )}
                        >
                            {it.label}
                        </Button>
                        ))}
                </div>
                : <div
                    ref={scrollRef}
                    className={cn(
                        "grid snap-x snap-mandatory overflow-x-auto scroll-smooth gap-2",
                        "grid-flow-col auto-cols-[minmax(100px,210px)]",
                        type === 2 ? "grid-rows-3" : "grid-rows-1",
                        "flex-grow overflow-visible"
                    )}
                >
                    {items.map((it) => (
                        <button
                            key={it.id}
                            onClick={() => {
                                onSelect(it.id)
                                setSelectedIMG(it.image)
                            }}
                            className={cn(
                                "aspect-[3/4] h-full w-auto", "ring-offset-2 transition-[scale] hover:scale-105 rounded-xl overflow-hidden",
                                selectedId === it.id ? "ring ring-blue-500" : "",
                            )}
                        >
                            <img
                                src={it.image}
                                alt={it.label ?? ""}
                            />

                        </button>
                    ))}
                </div>
            }

        </div>
    );
}