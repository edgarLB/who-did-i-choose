import {supabase} from "@/lib/supabaseClient";

export function getPublicUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    const { data } = supabase.storage.from("decks").getPublicUrl(path);
    return data?.publicUrl ?? null;
}