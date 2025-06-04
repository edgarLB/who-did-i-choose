import { notFound } from 'next/navigation';
import LobbyClient from './LobbyClient';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

// Server side
// Checks if game exists in the db
// if exist: renders Lobby Page
// if !exist: 404 page

export default async function LobbyPage({ params }: { params: { gameId: string } }) {

    // Query looking for game
    const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', params.gameId)
        .maybeSingle();

    // 404 page
    if (!game) {
        notFound();
    }

    // Query to get decks
    const { data:decks } = await supabase
        .from('decks')
        .select('id, name, cover_image, scope')

    // console.log(`Decks ${decks?.length}`)

    // Query to get the cards for the currently selected deck
    const { data: cards } = await supabase
        .from('cards')
        .select('id,name,image')
        .eq('deck_id', game.deck_id)
        .order('name')

    // Game found
    return (
        <div className="flex items-center justify-center w-full h-full h-full">
        <div className="w-full max-w-screen-xl h-full">
            <LobbyClient gameId={game.id}
                         inviteCode={game.game_code}
                         deckId={game.deck_id}
                         decks={decks ?? []}
                         cards={cards ?? []}
            />
        </div>
    </div>
    )


}
