import { Button } from "@web/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@web/components/ui/tooltip";
import { cn } from "@web/lib/utils";
import { COMMON_REACTIONS } from "./constants";

type ReactionBarProps = {
  onReactionClick: (emoji: string) => void;
  onMoreClick: () => void;
  isCurrentUser: boolean;
};

export const ReactionBar = ({
  onReactionClick,
  onMoreClick,
  isCurrentUser,
}: ReactionBarProps) => {
  return (
    <div
      className={cn(
        "absolute -top-7 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-lg px-3 py-1.5 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200 z-10",
        isCurrentUser ? "right-0" : "left-0"
      )}
    >
      {COMMON_REACTIONS.map((emoji) => (
        <TooltipProvider key={emoji} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onReactionClick(emoji)}
              >
                <span className="text-base">{emoji}</span>
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={onMoreClick}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};
