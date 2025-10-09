// components/CardDisplay.tsx
"use client";


interface CardDisplayProps {
    frontImage: string;
    backImage?: string;
    name?: string;
    custom?: boolean;
    onClick?: () => void;
}

export default function CardDisplay({
                                        frontImage,
                                        backImage = "/images/back_temp.webp",
                                        name,
                                        custom = false,
    onClick,
                                    }: CardDisplayProps) {
    return (
                <div
                    onClick={onClick}
                    className={custom ? "card-content-flex custom" : "card-content-flex"}>
                    <div className="image-wrapper">
                    <img
                        src={frontImage}
                        alt={name || "Card"}
                        className="uploaded-img"
                    />
                    </div>
                    {name && custom && (
                        <p>
                            {name}
                        </p>
                    )}
                </div>




    );
}
