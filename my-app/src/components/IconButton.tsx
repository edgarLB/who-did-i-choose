import { LucideIcon } from "lucide-react";

export default function IconButton({ icon: Icon, variant, onClick}: {
    icon: LucideIcon;
    variant?: "blue" | "silver";
    onClick?: () => void;
}) {
    return (
        <button onClick={onClick}
            className={`icon-button ${variant === "blue" ? "blue" : "silver"}`}>
      <span className="icon-wrapper">
        <div className="relative flex items-center justify-center">
          <Icon className="lucide-outline" />
          <Icon className="lucide-top" />
        </div>
      </span>
        </button>
    );
}

