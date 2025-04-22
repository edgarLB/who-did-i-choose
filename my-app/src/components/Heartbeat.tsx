"use client";
import { useHeartbeat } from "@/hooks/useHeartbeat";

export function Heartbeat({ playerId }: { playerId: string | null }) {
    useHeartbeat(playerId);
    return null;
}