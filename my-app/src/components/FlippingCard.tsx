'use client';

import { motion } from 'framer-motion';

interface FlippingCardProps {
    frontImage: string;
    backImage?: string;
    alt: string;
    flipped: boolean;
    onClick?: () => void;
    className?: string;
    enemy?: boolean;
}

export default function FlippingCard({
                                         frontImage,
                                         backImage = '/images/back_temp.webp',
                                         alt,
                                         flipped,
                                         onClick,
                                         className = '',
    enemy = false,
                                     }: FlippingCardProps) {
    return (
            onClick={onClick}
            className={`relative w-full aspect-[300/400] ${className}`}
            style={{ perspective: '1000px' }}
        >
            <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="card-face front">
                    <img src={frontImage} alt={alt} />
                </div>

                {enemy ? (
                    <div className="card-face back enemey-back"/>
                ) : (
                    <div className="card-face back">
                        <img src={backImage} alt="Flipped Card"/>
                    </div>
                )

                }

            </motion.div>
        </button>
    );
}
