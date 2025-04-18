import { Button } from "@web/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@web/components/ui/tooltip";
import { type ReactionCount } from "./types";
import { TooltipArrow } from "@radix-ui/react-tooltip";

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
            className="h-5 px-1.5 flex items-center gap-0.5 bg-white/95 dark:bg-gray-800/95 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 shadow-sm"
            onClick={() => onReactionClick(reaction.emoji)}
          >
            <span className="text-sm leading-none">{reaction.emoji}</span>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
              {reaction.count}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="shadow bg-white px-2 py-1">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {reaction.users.map((u) => u.name).join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
