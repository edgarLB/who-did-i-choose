import {useState} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

type JoinGameInputProps = {
    onJoin : (code:string) => void;
};

export default function JoinGameInput({onJoin}: JoinGameInputProps) {
    const [rawCode, setRawCode] = useState<string>("");
    const formattedForDisplay = (code: string) => {
        if (code.length <= 3) {
            return code
        }
        return code.slice(0, 3) + "-" + code.slice(3);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        let sanitized = input.replace(/-/g, "");
        sanitized = sanitized.replace(/^a-z0-9/g, "");
        sanitized = sanitized.toUpperCase();

        if (sanitized.length > 6) {
            sanitized = sanitized.slice(0,6);
        }

        setRawCode(sanitized);
    };

    const handleJoin = () => {
        onJoin(rawCode);
    }
    return (
        <div className="white-box-container flex flex-row gap-2 items-center">
            <div>
                <Label htmlFor="code" className="blue-text">Invite Code</Label>
                <Input
                    type="text"
                    id="gameCode"
                    placeholder="___-___"
                    value={formattedForDisplay(rawCode)}
                    className="white-text-box chunky-text"
                    onChange={handleChange}/>

            </div>
            <Button onClick={handleJoin} className="blue-button shadow-text">
                Join
            </Button>
        </div>

    )
}