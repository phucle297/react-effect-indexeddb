import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text = "Processing...",
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center">
        <Loader2
          className={`${sizeClasses[size]} animate-spin text-blue-600 mb-4`}
        />
        <p className="text-white text-sm font-medium">{text}</p>
      </div>
    </div>
  );
};
