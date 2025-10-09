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
import {useEffect, useState} from "react";
import DeckBuilder from "@/components/DeckBuilder";
import CardDisplay from "@/components/CardDisplay";

interface DeckPreviewDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deckName: string;
    deckId: string;
    gameId: string;
    cards: Card[];
    customDId: string;
    onSelect: () => void;
    custom: boolean;
}

export default function DeckPreview({
                                              open,
                                              onOpenChange,
                                              deckName,
    deckId,
    gameId,
                                              cards,

                                              onSelect,
    custom = false,
                                          }: DeckPreviewDrawerProps) {

    const isDesktop = useMediaQuery("(min-width: 768px)");
    const title = custom ? "Deck Builder" : `${deckName} Deck`;
    const description = custom ? "Add images, then tap a card to label it. You can label as many or as few as you like."
        : "Preview the cards in this deck. Selecting a new deck will update it for everyone."
    const [canSelect, setCanSelect] = useState<boolean>(false);

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[668px]">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <DeckContent/>
                    <DialogFooter className="items-center">
                        <Button
                            disabled={canSelect}
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
            <DrawerContent className="">

                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>

                <DeckContent/>


                    <DrawerFooter>
                        <Button
                            onClick={onSelect}
                            className="button blue shadow-text normal"
                        >
                            Select Deck
                        </Button>
                    </DrawerFooter>

            </DrawerContent>
        </Drawer>
    );

    function DeckContent() {
        if (custom) {
            return(
                <>
                    <DeckBuilder deckId={deckId} gameId={gameId} />

                </>


            )
        }
        return (
            <div className="px-4 enemy-board">
                {cards.map((card) => (
                    <div key={card.id}>
                        <CardDisplay frontImage={getPublicUrl(card.image)} editable={false}/>
                        {/*{card.image && (*/}
                        {/*    <img*/}
                        {/*        src={getPublicUrl(card.image)}*/}
                        {/*        alt={card.name}*/}
                        {/*        className="drawer-card"*/}
                        {/*    />*/}
                        {/*)}*/}
                    </div>
                ))}
            </div>
        );
    }
}
