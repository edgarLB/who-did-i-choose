"use client"
import {useEffect, useRef, useState} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export interface PickerItem {
    id: string;
    image: string;
    label?: string;
}

interface PickerProps {
    items: PickerItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    rows: 1 | 2;
    className?: string;
}

export default function Picker({
                                   items,
                                   selectedId,
                                   onSelect,
                                   rows = 1,
                                   className,
                               } : PickerProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [ selectedIMG, setSelectedIMG ] = useState<string | null>();
    let left = "<"
    let right = ">"
    const scrollBy = (sign: -1 | 1 ) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({
            left: sign * scrollRef.current.clientWidth,
            behavior: "smooth",
        });

    };

    useEffect(() => {
        if (!selectedId) return;
        const selectedItem = items.find(item => item.id === selectedId)
        if (selectedItem) {
            setSelectedIMG(selectedItem.image);
        }
    }, [items, selectedId]);


    return (
        <div className="picker-container">
            <div className="flex items-center justify-between py-2">
                <div className=" flex flex-row gap-5">
                    <h3 className="shadow-title">Choose a Card</h3>
                    <Button
                        className="silver-button shadow-text">
                        Random
                    </Button>
                </div>

                <div className="space-x-2">
                    <Button
                        onClick={() => scrollBy(-1)}
                        className="blue-button shadow-text">
                        {left}
                    </Button>
                    <Button
                        onClick={() => scrollBy(1)}
                        className="blue-button shadow-text">
                        {right}
                    </Button>
                </div>

            </div>

            {/* scrolling track */}
            <div className="flex flex-row gap-5 h-full">
                <div
                    className="h-full aspect-[3/4] flex-shrink-0 flex items-center justify-center rounded-[2em] bg-white/20">
                    {selectedIMG ? (
                        <img
                            src={selectedIMG}
                            className="h-full w-auto object-contain rounded-[2em]"
                            alt=""
                        />
                    ) : (
                        <div className="w-full h-full"/>
                    )}
                </div>

                <div
                    ref={scrollRef}
                    className={cn(
                        "grid snap-x snap-mandatory overflow-x-auto scroll-smooth gap-2",
                        "grid-flow-col auto-cols-[minmax(100px,210px)]",
                        rows === 2 ? "grid-rows-2" : "grid-rows-1",
                        "card-br p-5 flex-grow"
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
                                "aspect-[3/4] h-full w-auto", "ring-offset-2 transition-[transform] hover:scale-105 rounded-xl overflow-hidden",
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
            </div>

        </div>
    );
}