"use client"
import {useEffect, useRef, useState} from "react";
import {Check, ChevronLeft, ChevronRight, CircleCheckBig, Shuffle} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton";
import CardDisplay from "@/components/CardDisplay";



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
    custom?: boolean;
}

export default function Picker({
                                   items,
                                   selectedId,
                                   onSelect,
                                   type = 1,
                                   custom = false,
                               } : PickerProps) {

    let title = type === 1 ? "Deck" : "Card";
    const placeholders = Array.from({ length: 24 }, (_, i) => i + 1);
    useEffect(() => {
        if (!selectedId) return;
        const selectedItem = items.find(item => item.id === selectedId)

    }, [items, selectedId]);


    return (
        <div className="picker-container card-br">
            <div className="flex items-center justify-between">
                <div className="flex flex-row gap-5">
                    <h3 className="shadow-text normal">Choose a {title}</h3>
                </div>
            </div>

            {type === 1 ? (
                <div className="deck-container">
                    {items.map((it) => (
                        <Button
                            key={it.id}
                            onClick={() => onSelect(it.id)}
                            className={cn(
                                "deck-button bold-text-sma",
                                selectedId === it.id && "ring ring-white"
                            )}
                        >
                            {it.label}
                        </Button>
                    ))}
                </div>
            ) : (
                <div className="gameboard">
                    {items.length > 0
                        ? items.map((it) => {
                            const isSelected = selectedId === it.id;
                            return (
                                <div key={it.id} className="relative cursor-pointer">
                                    <div
                                        className={`guess-card-container ${isSelected ? "expanded" : ""}`}
                                    >
                                        <CardDisplay
                                            frontImage={it.image}
                                            name={it.label}
                                            custom={custom}
                                            onClick={() => onSelect(it.id)}
                                        />
                                        {isSelected && (
                                            <div className="deck-builder guess-card-overlay overflow-hidden">
                                                <div className="selected-check"
                                                     onClick={() => onSelect(it.id)}>
                                                    <Check className="stroke-3"/>
                                                </div>

                                                <CardDisplay
                                                    frontImage={it.image}
                                                    name={it.label}
                                                    custom={custom}
                                                    onClick={() => onSelect(it.id)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                        : placeholders.map((it) => (
                            <div
                                key={it}
                                className="empty-slot loading card-placeholder"
                            />
                        ))}
                </div>
            )}
        </div>
    );
}