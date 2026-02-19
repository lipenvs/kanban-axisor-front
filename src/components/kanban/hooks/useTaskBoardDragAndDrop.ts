import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import type { ColumnType } from "../Column";

export const useTaskBoardDragAndDrop = (initialData: ColumnType[]) => {
  const [columns, setColumns] = useState<ColumnType[]>(initialData);

  useEffect(() => {
    setColumns(initialData);
  }, [initialData]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const isColumnDrag = activeId ? columns.some((c) => c.id === activeId) : false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumn = (unique: UniqueIdentifier | null) => {
    if (!unique) return null;
    if (columns.some((c) => c.id === unique)) {
      return columns.find((c) => c.id === unique) ?? null;
    }
    return columns.find((c) => c.cards.some((card) => card.id === unique)) ?? null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isColumnDrag) return;

    const { active, over, delta } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;
    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) {
      return null;
    }

    if (activeColumn === overColumn) {
      const activeItems = activeColumn.cards;
      const activeIndex = activeItems.findIndex((i) => i.id === activeId);
      const overIndex = activeItems.findIndex((i) => i.id === overId);

      if (activeIndex !== overIndex) {
        setColumns((prevState) => {
          return prevState.map((column) => {
            if (column.id === activeColumn.id) {
              column.cards = arrayMove(activeItems, activeIndex, overIndex);
              return column;
            }
            return column;
          });
        });
      }
      return;
    }

    setColumns((prevState) => {
      const activeItems = activeColumn.cards;
      const overItems = overColumn.cards;
      const activeIndex = activeItems.findIndex((i) => i.id === activeId);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      if (activeIndex === -1) {
        return prevState;
      }
      
      const newIndex = () => {
        const putOnBelowLastItem =
          overIndex === overItems.length - 1 && delta.y > 0;
        const modifier = putOnBelowLastItem ? 1 : 0;
        return overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      };

      return prevState.map((c) => {
        if (c.id === activeColumn.id) {
          c.cards = activeItems.filter((i) => i.id !== activeId);
          return c;
        } else if (c.id === overColumn.id) {
          c.cards = [
            ...overItems.slice(0, newIndex()),
            activeItems[activeIndex],
            ...overItems.slice(newIndex(), overItems.length)
          ];
          return c;
        } else {
          return c;
        }
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    setActiveId(null);

    if (!overId) return;

    // Column reordering
    if (columns.some((c) => c.id === activeId)) {
      const activeIndex = columns.findIndex((c) => c.id === activeId);
      const overIndex = columns.findIndex((c) => c.id === overId);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        setColumns((prev) => arrayMove(prev, activeIndex, overIndex));
      }
      return;
    }

    // Card reordering
    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn !== overColumn) {
      return;
    }
    const activeIndex = activeColumn.cards.findIndex((i) => i.id === activeId);
    const overIndex = overColumn.cards.findIndex((i) => i.id === overId);
    if (activeIndex !== overIndex) {
      setColumns((prevState) => {
        return prevState.map((column) => {
          if (column.id === activeColumn.id) {
            column.cards = arrayMove(overColumn.cards, activeIndex, overIndex);
            return column;
          } else {
            return column;
          }
        });
      });
    }
  };

  const getActiveCard = () => {
    const allCards = columns.flatMap((c) => c.cards);
    return allCards.find((c) => c.id === activeId);
  };

  const getActiveColumn = () => {
    return columns.find((c) => c.id === activeId);
  };

  return {
    columns,
    activeId,
    isColumnDrag,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getActiveCard,
    getActiveColumn,
  };
};
