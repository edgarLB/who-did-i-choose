"use client";

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/types";
import { getPublicUrl } from "@/lib/getPublicUrl";
import { useMediaQuery } from "@/hooks/use-media-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

interface DeckPreviewDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deckName?: string;
    cards: Card[];
    onSelect: () => void;
}

export default function DeckPreviewDrawer({
                                              open,
                                              onOpenChange,
                                              deckName,
                                              cards,
                                              onSelect,
                                          }: DeckPreviewDrawerProps) {

    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[668px]">
                    <DialogHeader>
                        <DialogTitle>{deckName ? `${deckName} Deck` : "Deck Preview"}</DialogTitle>
                        <DialogDescription>
                            Preview the cards in this deck. Selecting a new deck will update it for everyone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="enemy-board">
                        {cards.map((card) => (
                            <div key={card.id}>
                                {card.image && (
                                    <img
                                        src={getPublicUrl(card.image)}
                                        alt={card.name}
                                        className="dialog-card"
                                    />
                                )}

                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={onSelect}
                            className="button blue shadow-text normal"
                        >
                            Select Deck
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )


    }
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="drawer">

                <div>
                    <DrawerHeader>
                        <DrawerTitle>{deckName ?? "Deck Preview"}</DrawerTitle>
                        <DrawerDescription>
                            Preview the cards in this deck. Selecting a new deck will update it for everyone.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 enemy-board">
                        {cards.map((card) => (
                            <div key={card.id}>
                                {card.image && (
                                    <img
                                        src={getPublicUrl(card.image)}
                                        alt={card.name}
                                        className="drawer-card"
                                    />
                                )}

                            </div>
                        ))}
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={onSelect}
                            className="button blue shadow-text normal"
                        >
                            Select Deck
                        </Button>
                    </DrawerFooter>
                </div>

            </DrawerContent>
        </Drawer>
    );
}
