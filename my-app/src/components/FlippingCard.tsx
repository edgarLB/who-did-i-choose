'use client';

import { motion } from 'framer-motion';
import { ReactNode, useMemo } from 'react';

interface FlippingCardProps {
    frontContent: ReactNode;
    backImage?: string;
    alt: string;
    flipped: boolean;
    onClick?: () => void;
    className?: string;
    enemy?: boolean;
    shaking?: boolean;
}

export default function FlippingCard({
                                         frontContent,
                                         backImage = '/images/back_temp.webp',
                                         alt,
                                         flipped,
                                         onClick,
                                         className = '',
                                         enemy = false,
                                         shaking = false,
                                     }: FlippingCardProps) {
    const randomDelay = useMemo(() => Math.random() * 0.5, []);

    return (
        <button
            onClick={onClick}
            className={`relative w-full aspect-[300/400] ${className}`}
            style={{ perspective: '1000px' }}
        >
            <motion.div
                className="relative w-full h-full"
                animate={{
                    rotateY: flipped ? 180 : 0,
                    rotate: shaking ? [-0.8, 0.8] : 0,

                }}
                transition={{
                    duration: shaking ? 0.2 : 0.3,
                    repeat: shaking ? Infinity : 0,
                    repeatType: 'mirror',
                    ease: 'easeOut',
                    delay: shaking ? randomDelay : 0,

            }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className={"card-face front"}>
                    {frontContent}
                </div>

                {enemy ? (
                    <div className="card-face back enemey-back empty-slot darker"/>
                ) : (
                    <div className="card-face back">
                        <img  src={backImage} alt="Flipped Card"/>
                    </div>
                )

                }

            </motion.div>
        </button>
    );
}
