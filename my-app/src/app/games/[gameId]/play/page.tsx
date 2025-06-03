import {notFound} from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PlayClient from "@/app/games/[gameId]/play/PlayClient";
import {getLocalPlayerId} from "@/lib/utils";
import {cookies} from "next/headers";

export default async function PlayPage({ params }: { params: { gameId: string } }) {

    const cookieStore = await cookies();
    const localPlayerId = cookieStore.get("playerId")?.value;
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

    // Only ever recieve the locals player's chosen card
    // help prevent cheating
    const {data:localPlayer} = await supabase
        .from("players")
        .select("chosen_card_id")
        .eq("id", localPlayerId)
        .maybeSingle()

    return(
<div className="flex items-center justify-center w-full h-full h-full">
    <div className="w-full max-w-screen-xl h-full">
    <PlayClient
        game = {game}
        players = {players ?? []}
        cards = {cards ?? []}
        chosenCardID={localPlayer?.chosen_card_id ?? null}
    />
    </div>

</div>

    );
}