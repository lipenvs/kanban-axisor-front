import { verticalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GetColumnsKanban200Item } from "../../lib/api/model/getColumnsKanban200Item";
import Card from "./Card";

export type ColumnType = GetColumnsKanban200Item;

interface ColumnProps extends ColumnType {
  onCreateTask: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

const Column = ({ id, title, cards, onCreateTask, onDeleteTask, onEditTask, onEditColumn, onDeleteColumn }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: "Column",
      column: { id, title, cards }
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col w-72 shrink-0 rounded-xl p-3 transition-colors duration-200 min-h-[200px]
        ${isOver ? 'bg-gray-200 shadow-inner' : 'bg-gray-100'}
      `}
    >
      <div className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge className="h-5 px-1.5 text-[10px] font-semibold bg-gray-200 text-gray-600">
            {cards.length}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditColumn(id, title)}>
              <Pencil className="w-4 h-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteColumn(id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1">
        <ScrollArea className="h-full">
          <SortableContext id={id} items={cards} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {cards.map((card) => (
                <Card
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  label={card.label}
                  dueDate={card.dueDate}
                  assignee={card.assignee}
                  onDelete={() => onDeleteTask(card.id)}
                  onClick={() => onEditTask(card.id)}
                />
              ))}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
      <button
        onClick={() => onCreateTask(id)}
        className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                text-muted-foreground hover:text-foreground hover:bg-accent/50
                border border-dashed border-border/50 hover:border-border
                transition-all duration-200 text-sm"
      >
        <Plus className="w-4 h-4" />
        Criar tarefa
      </button>
    </div>
  );
};

export default Column;
