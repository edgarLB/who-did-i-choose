import {notFound} from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PlayClient from "@/app/games/[gameId]/play/PlayClient";

export default async function PlayPage({ params }: { params: { gameId: string } }) {

    // Query looking for game
    const { data: game } = await supabase
        .from('games')
        .select('id, status, deck_id, current_player_id')
        .eq('game_code', params.gameId)
        .maybeSingle();

    // 404 page
    if (!game) {
        notFound();
    }

    // get cards
    const { data: cards } = await supabase
        .from('cards')
        .select("id, name, image")
        .eq("deck_id", game.deck_id)
        .order("name");

    // get game players
    const { data: players } = await supabase
        .from('players')
        .select("id, screen_name")
        .eq("game_id", game.id);

    return(
        <PlayClient
            game = {game}
            players = {players ?? []}
            cards = {cards ?? []}
        />
    );
}