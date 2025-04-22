import { ReactNode } from "react";
import { getLocalPlayerId } from "@/lib/utils";
import { Heartbeat } from "@/components/Heartbeat";

export default function GameLayout({ children }: { children: ReactNode }) {
    const playerId = getLocalPlayerId();
    return (
        <>
            <Heartbeat playerId={playerId} />
            {children}
        </>
    );
}