"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useHeartbeat(playerId: string | null, period = 15_000) {
    useEffect(() => {
        if (!playerId) return;

        const id = setInterval(() => {
            supabase
                .from("players")
                .update({ last_seen: "now()" })
                .eq("id", playerId)
                .then(({ error }) => error && console.error(error));
        }, period);

        // stop
        return () => clearInterval(id);
    }, [playerId, period]);
}