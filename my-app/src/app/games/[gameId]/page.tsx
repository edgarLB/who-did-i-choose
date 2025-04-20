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

    // Game found
    return <LobbyClient gameId={game.id} inviteCode={game.game_code} />;
}
