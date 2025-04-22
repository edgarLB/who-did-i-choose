import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Load player ID
export function getLocalPlayerId() {
  return (typeof window !== "undefined") ? localStorage.getItem("playerId") : null;
}

