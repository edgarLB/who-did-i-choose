"use client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useState} from "react";
import {supabase} from "@/lib/supabaseClient";
import JoinGameInput from "@/components/JoinGameInput";


/* ----- Utils ----*/
type Seat = 1 | 2;

function pickSeat(taken: { seat: Seat }[] | null): Seat | null {
    const occupied = new Set<Seat>((taken ?? []).map(p => p.seat));

    if (!occupied.has(1)) return 1;
    if (!occupied.has(2)) return 2;

    return null;
}

function generateGameCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/* ---------*/

export default function Home() {
    const [username, setUsername] = useState<string>("");
    const[gameCode, setGameCode] = useState<string>("");
    let tab1:string = "Create";
    let tab2:string = "Join";

    const router = useRouter();

    const createGame = async () => {
        const defaultUsername = username.trim() || "Player 1";
        const gameCodeGenerated = generateGameCode();

        // Insert a new game into the games table with the generated code and waiting status
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .insert({ game_code: gameCodeGenerated, status: 'waiting' })
          .select()
          .single();

        if (gameError) {
          console.error('Error creating game:', gameError);
          return;
        }

        // Insert the creator as a player in the players table
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .insert({
              game_id: gameData.id,
              screen_name: defaultUsername,
              seat: 1
          })
          .select()
          .single();

        if (playerError) {
          console.error('Error creating player:', playerError);
          return;
        }

        // Store player ID for game permissions
        localStorage.setItem('playerId', playerData.id);
        document.cookie = `playerId=${playerData.id}; path=/; max-age=86400;`
        // Navigate to the lobby page with the created game id
        router.push(`/games/${gameData.game_code}`);
    }

    const joinGame = async (gameCode: string) => {
        const defaultUsername = username.trim() || "Player 2";

        // Fetch the game using the entered game code
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('game_code', gameCode)
          .single();

        if (gameError || !gameData) {
          console.error('Game not found:', gameError);
          return;
        }

        console.log(gameData.gameId)

        // Check DB to see if game is full
        const { data: taken } = await supabase
            .from('players')
            .select('seat')
            .eq('game_id', gameData.id);

        // pick the free seat
        const seat = pickSeat(taken);
        console.log("Free Seat:", seat )

        if (seat === null) {
            alert('Lobby full!');
            return;
        }

        // Insert the joining player into the players table
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .insert({
              game_id: gameData.id,
              screen_name: defaultUsername,
              seat: seat,
          })
          .select()
          .single();

        if (playerError) {
          console.error("Player Error:", playerError);
          return;
        }

        // Store player ID for game permissions
        localStorage.setItem('playerId', playerData.id);
        document.cookie = `playerId=${playerData.id}; path=/; max-age=86400;`
        // Navigate to the lobby page with the found game id
        router.push(`/games/${gameData.game_code}`);
    }

  return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col gap-10 text-center justify-center">
              <img src="/images/logo.webp" className="logo-home mx-auto" alt="Who Did I Choose?"/>
              <Tabs defaultValue={tab1} className="w-[600px]">
                  <TabsList className="grid w-full h-full p-2 grid-cols-2 tab-list">
                      <TabsTrigger className="tab-item shadow-text" value={tab1}>{tab1}</TabsTrigger>
                      <TabsTrigger className="tab-item shadow-text" value={tab2}>{tab2}</TabsTrigger>
                  </TabsList>
                  <TabsContent value={tab1}>
                      <Card className="card">
                          <CardHeader>
                              <CardTitle className="card-title">{tab1} a New Game</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className="white-box-container flex flex-row gap-2 items-center">
                                  <div>
                                      <Label className="blue-text" htmlFor="name">Name</Label>
                                      <Input type="text" placeholder="Player 1" value={username} className="white-text-box chunky-text"
                                             onChange={(e) => setUsername(e.target.value)} />

                                  </div>
                                      <Button
                                      onClick={createGame} className="blue-button shadow-text"
                                  >Create</Button>
                              </div>
                          </CardContent>
                      </Card>
                  </TabsContent>
                  <TabsContent value={tab2}>
                      <Card className="card">
                          <CardHeader>
                              <CardTitle className="card-title">{tab2} an Existing Game</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-5">
                              <div className="white-box-container">
                                  <Label htmlFor="name" className="blue-text">Name</Label>
                                  <Input type="text" placeholder="Player 2" value={username} className="white-text-box chunky-text"
                                         onChange={(e) => setUsername(e.target.value)} />
                              </div>
                              <JoinGameInput onJoin={joinGame} />
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>

          </div>

      </div>

  );
}
