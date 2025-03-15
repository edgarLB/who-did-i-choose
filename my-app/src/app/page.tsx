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


export default function Home() {
    const[gameCode, setGameCode] = useState<string>("");
    let tab1:string = "Create";
    let tab2:string = "Join";

    const router = useRouter();

    const createGame = async () => {
    //     temp code
        const gameId = Math.random().toString(36).substr(2, 8);
        router.push(`/lobby/${gameId}`);
    }

    const joinGame = (gameId: string) => {
        router.push(`/lobby/${gameId}`);
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
                                  <Input type="text" placeholder="Player 1" />
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
                                  <Input type="text" placeholder="Player 2" />
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
