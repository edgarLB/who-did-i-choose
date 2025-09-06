// components/TransitionOverlay.tsx
"use client";

import { motion } from "framer-motion";

interface TransitionOverlayProps {
    playerName: string;
    opponentName: string;
    onComplete?: () => void;
}

export default function TransitionOverlay({
                                              playerName,
                                              opponentName,
                                              onComplete,
                                          }: TransitionOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Blue Top Half */}
            <motion.div
                className="absolute top-0 left-0 w-full h-1/2 bg-[#2728BE] flex items-center justify-center text-white text-2xl font-bold"
                initial={{ y: 0 }}
                // animate={{ y: "-100%" }}
                // transition={{ delay: 1, duration: 0.5, ease: "easeInOut" }}
                onAnimationComplete={onComplete}
            >
                <span className="shadow-title">{playerName}</span>
            </motion.div>

            {/* Red Bottom Half */}
            <motion.div
                className="absolute bottom-0 left-0 w-full h-1/2 bg-[#D73A3A] flex items-center justify-center text-white text-2xl font-bold"
                initial={{ y: 0 }}
                // animate={{ y: "100%" }}
                // transition={{ delay: 1, duration: 0.5, ease: "easeInOut" }}
            >
                <span className="shadow-title">{opponentName}</span>
            </motion.div>

            {/* VS Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-title">
                VS
            </div>
        </div>
    );
}
