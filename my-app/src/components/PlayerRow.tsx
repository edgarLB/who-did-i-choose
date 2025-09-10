import { Check, Pencil } from "lucide-react";
import UserIcon from "@/components/UserIcon";
import { Input } from "@/components/ui/input";
import IconButton from "@/components/IconButton";

type PlayerRowProps = {
    player?: { id: string; screen_name: string };
    isLocal?: boolean;
    isEditing?: boolean;
    tmpName?: string;
    setTmpName?: (val: string) => void;
    setIsEditing?: (val: boolean) => void;
    saveScreenName?: () => void;
};

export default function PlayerRow({
                                      player,
                                      isLocal = false,
                                      isEditing = false,
                                      tmpName = "",
                                      setTmpName,
                                      setIsEditing,
                                      saveScreenName,
                                  }: PlayerRowProps) {
    // Empty slot
    if (!player) {
        return (
            <li className="flex items-center gap-2 border-t-1 border-[#9E7B67] pt-[1em]">
                <div className="flex flex-row gap-1">
                    <UserIcon fillColor="#9E7B67" size={32} />
                    <span className="bold-text-sma">Waiting for the other player…</span>
                </div>
            </li>
        );
    }

    // Local player
    if (isLocal) {
        if (isEditing) {
            return (
                <li className="flex items-center gap-2">
                    <div className="white-box-container flex flex-row gap-2 items-center">
                        <Input
                            value={tmpName}
                            onChange={(e) => setTmpName?.(e.target.value)}
                            className="white-text-box bold-text-sma"
                        />
                        <IconButton icon={Check} variant="blue" onClick={saveScreenName} />
                    </div>
                </li>
            );
        }
        return (
            <li className="flex items-center gap-2">
                <div className="flex flex-row w-full justify-between gap-2 items-center pb-[1em]">
                    <div className="flex flex-row gap-1 items-center">
                        <UserIcon fillColor="#125dd9" size={32} />
                        <span className="bold-text-sma">{player.screen_name}</span>
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
            <div className="flex flex-row gap-1 items-center">
                <UserIcon fillColor="#d93312" size={32} />
                <span className="bold-text-sma">{player.screen_name}</span>
            </div>
        </li>
    );
}
