export default function UserIcon({
                                     size = 24,
                                     fillColor = "currentColor",
                                     className = "",
                                 }: {
    size?: number
    fillColor?: string
    className?: string
}) {
    return (
        <div className="user-circle">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 512"
                width={size}
                height={size}
                fill={fillColor}
                className={className}
            >
                <path d="M320 312c66.3 0 120-53.7 120-120S386.3 72 320 72 200 125.7 200 192s53.7 120 120 120zm-29.7 56C191.8 368 112 447.8 112 546.3c0 16.4 13.3 29.7 29.7 29.7h356.6c16.4 0 29.7-13.3 29.7-29.7C528 447.8 448.2 368 349.7 368h-59.4z" />
            </svg>
        </div>

    )
}
