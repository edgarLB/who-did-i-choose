"use client"

function generateGameCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
          .insert({ game_id: gameData.id, screen_name: defaultUsername })
          .select()
          .single();

        if (playerError) {
          console.error('Error creating player:', playerError);
          return;
        }

        // Store player ID for game permissions
        localStorage.setItem('playerId', playerData.id);

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

        // Insert the joining player into the players table
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .insert({ game_id: gameData.id, screen_name: defaultUsername })
          .select()
          .single();

        if (playerError) {
          console.error('Error joining game:', playerError);
          return;
        }

        // Store player ID for game permissions
        localStorage.setItem('playerId', playerData.id);

        // Navigate to the lobby page with the found game id
        router.push(`/games/${gameData.game_code}`);
    }

  return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col gap-2 text-center">
              <h1>Who Did I Choose?</h1>
              <Tabs defaultValue={tab1} className="w-[500px]">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value={tab1}>{tab1}</TabsTrigger>
                      <TabsTrigger value={tab2}>{tab2}</TabsTrigger>
                  </TabsList>
                  <TabsContent value={tab1}>
                      <Card>
                          <CardHeader>
                              <CardTitle>{tab1} a New Game</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                              <div className="space-y-1">
                                  <Label htmlFor="name">Name</Label>
                                  <Input type="text" placeholder="Player 1" value={username}
                                         onChange={(e) => setUsername(e.target.value)} />
                              </div>
                          </CardContent>
                          <CardFooter>
                              <Button
                                  onClick={createGame}
                              >Create</Button>
                          </CardFooter>
                      </Card>
                  </TabsContent>
                  <TabsContent value={tab2}>
                      <Card>
                          <CardHeader>
                              <CardTitle>{tab2} an Existing Game</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-5">
                              <div className="space-y-1">
                                  <Label htmlFor="name">Name</Label>
                                  <Input type="text" placeholder="Player 2" value={username}
                                         onChange={(e) => setUsername(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                  <Label htmlFor="code">Invite Code</Label>
                                  <Input type="text" id="gameCode" placeholder="Code" value={gameCode}
                                  onChange={(e) => setGameCode(e.target.value)} />
                              </div>
                          </CardContent>
                          <CardFooter>
                              <Button onClick={() => joinGame(gameCode)}
                              >Join</Button>
                          </CardFooter>
                      </Card>
                  </TabsContent>
              </Tabs>

          </div>

      </div>

  );
}
