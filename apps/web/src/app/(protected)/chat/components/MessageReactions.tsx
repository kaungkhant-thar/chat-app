import { cn } from "@web/lib/utils";
import { type ChatMessage, type ReactionCount } from "./types";
import { ReactionButton } from "./ReactionButton";

type MessageReactionsProps = {
  reactions: ChatMessage["reactions"];
  isCurrentUser: boolean;
  onReactionClick: (emoji: string) => void;
  setShowReactionBar: (show: boolean) => void;
};

export const MessageReactions = ({
  reactions,
  isCurrentUser,
  onReactionClick,
  setShowReactionBar,
}: MessageReactionsProps) => {
  // Group reactions by emoji
  const reactionCounts = reactions.reduce<ReactionCount[]>((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(reaction.user);
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user],
      });
    }
    return acc;
  }, []);

  if (reactionCounts.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute -bottom-4 flex flex-wrap gap-0.5 z-10",
        isCurrentUser ? "right-0" : "left-0"
      )}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setShowReactionBar(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setShowReactionBar(false);
      }}
    >
      {reactionCounts.map((reaction) => (
        <ReactionButton
          key={reaction.emoji}
          reaction={reaction}
          onReactionClick={onReactionClick}
        />
      ))}
    </div>
  );
};
