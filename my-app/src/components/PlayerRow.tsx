import { Check, Pencil } from "lucide-react";
import UserIcon from "@/components/UserIcon";
import { Input } from "@/components/ui/input";
import IconButton from "@/components/IconButton";
import { Badge } from "./ui/badge";

type PlayerRowProps = {
    player?: { id: string; screen_name: string };
    isLocal?: boolean;
    isEditing?: boolean;
    tmpName?: string;
    setTmpName?: (val: string) => void;
    setIsEditing?: (val: boolean) => void;
    saveScreenName?: () => void;
    ready: boolean;
};

export default function PlayerRow({
                                      player,
                                      isLocal = false,
                                      isEditing = false,
                                      ready = false,
                                      tmpName = "",
                                      setTmpName,
                                      setIsEditing,
                                      saveScreenName,
                                  }: PlayerRowProps) {

    let colorMap = {
        "p1" : "#66A6FF",
        "p2" : "#d93312",
        "p0" : "#9E7B67"
    };


    // Empty slot
    if (!player) {
        return (
            <li className="flex flex-row w-full items-start gap-2">
                <div className="player-row-content">
                    <UserIcon fillColor={colorMap["p0"]} size={45} />
                    <p className="bold-text-sma waiting-text w-full">Waiting for the other player</p>
                </div>
            </li>
        );
    }

    // Local player
    if (isLocal) {
        if (isEditing) {
            return (
                <li className="flex items-center gap-2">
                    <div className="white-box-container player flex flex-row gap-2 items-center overflow-hidden">
                        <Input
                            value={tmpName}
                            onChange={(e) => setTmpName?.(e.target.value)}
                            className="white-text-box bold-text-sma"
                            maxLength={8}
                        />
                        <IconButton icon={Check} variant="simple" onClick={saveScreenName} />


                    </div>

                </li>
            );
        }
        return (
            <li className="flex items-center gap-2">
                <div className="flex flex-row w-full justify-between gap-2 items-center">
                    <div className="player-row-content">
                        <UserIcon fillColor={colorMap["p1"]} size={45} />
                        <div className="flex-col">
                            <p className="bold-text-sma">{player.screen_name}</p>

                            {ready ? <Badge variant="outline" className="ready">Ready</Badge>
                                : <Badge variant="outline"  className="not-ready">Card Not Chosen</Badge>}


                        </div>
                    </div>
                    <IconButton
                        icon={Pencil}
                        variant="silver"
                        onClick={() => {
                            setTmpName?.(player.screen_name);
                            setIsEditing?.(true);
                        }}
                    />
                </div>
            </li>
        );
    }

    // Other players
    return (
        <li className="flex items-center gap-2">
            <div className="player-row-content">
                <UserIcon fillColor={colorMap["p2"]} size={45} />
                <div className="flex-col">
                    <p className="bold-text-sma">{player.screen_name}</p>

                    {ready ? <Badge variant="outline" className="ready">Ready</Badge>
                        : <Badge variant="outline"  className="not-ready">Card Not Chosen</Badge>}


                </div>
            </div>
        </li>
    );
}
