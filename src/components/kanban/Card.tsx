import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Trash2, User, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { GetColumnsWithTasks200ItemCardsItem } from "../../lib/api/model/getColumnsWithTasks200ItemCardsItem";

export type CardType = GetColumnsWithTasks200ItemCardsItem;

interface CardProps {
  card: CardType;
  onDelete?: () => void;
  onClick?: () => void;
}

const Card = ({ card, onDelete, onClick }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: card.id
  });

  const style = {
    transform: CSS.Transform.toString(transform)
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group relative bg-card border border-border/60 rounded-xl p-3.5
        hover:border-border hover:shadow-md hover:shadow-black/5
        transition-shadow duration-200
        ${isDragging ? 'opacity-50 shadow-xl shadow-black/10 scale-[1.02] z-50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {card.title}
        </h4>
        {onDelete && (
          <Button
            data-delete-btn
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {card.label && (
        <div className="mt-2">
          <div
            className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border max-w-full"
            style={{ borderColor: card.label.color, color: card.label.color }}
            title={card.label.name}
          >
            <span className="truncate">
              {card.label.name}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {card.dueDate && (
            <span className="flex items-center gap-1 text-[12px]">
              <Calendar className="w-3 h-3" />
              {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}

          <span className="flex items-center gap-1 text-[12px]">
            <Paperclip className="w-3 h-3" />
            {card.attachmentCount}
          </span>
        </div>

        <Avatar className="h-6 w-6">
          {card.assignee ? (
            <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-semibold">
              {card.assignee.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-gray-200 text-gray-500 text-[10px] font-semibold">
              <User className="w-3.5 h-3.5" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
  );
};

export default Card;
