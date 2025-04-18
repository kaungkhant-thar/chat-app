import { Button } from "@web/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@web/components/ui/tooltip";
import { type ReactionCount } from "./types";

type ReactionButtonProps = {
  reaction: ReactionCount;
  onReactionClick: (emoji: string) => void;
};

export const ReactionButton = ({
  reaction,
  onReactionClick,
}: ReactionButtonProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-5 px-1.5 flex items-center gap-0.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => onReactionClick(reaction.emoji)}
          >
            <span className="text-sm leading-none">{reaction.emoji}</span>
            <span className="text-[11px] text-black dark:text-white font-medium">
              {reaction.count}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white dark:bg-gray-800 px-2 py-1"
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {reaction.users.map((u) => u.name).join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
