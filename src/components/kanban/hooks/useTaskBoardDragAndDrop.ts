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
import { useEffect, useRef, useState } from "react";
import type { ColumnType } from "../Column";

import { usePatchColumnsReorderWithJson } from "@/lib/api/column";
import { usePatchTasksReorderWithJson } from "@/lib/api/task";

export const useTaskBoardDragAndDrop = (initialData: ColumnType[]) => {
  const [columns, setColumns] = useState<ColumnType[]>(initialData);

  // Snapshot para rollback em caso de erro no backend
  const snapshotRef = useRef<ColumnType[]>(initialData);

  // Coluna de origem do card no momento em que o drag começou
  // Necessário para detectar mudança de coluna no handleDragEnd,
  // já que o handleDragOver já moveu o card visualmente antes do drop
  const originColumnIdRef = useRef<string | null>(null);

  useEffect(() => {
    setColumns(initialData);
  }, [initialData]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const isColumnDrag = activeId ? columns.some((c) => c.id === activeId) : false;

  const { mutate: reorderColumns } = usePatchColumnsReorderWithJson({
    mutation: {
      onError: () => setColumns(snapshotRef.current),
    },
  });

  const { mutate: reorderTasks } = usePatchTasksReorderWithJson({
    mutation: {
      onError: () => setColumns(snapshotRef.current),
    },
  });

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
    snapshotRef.current = columns;

    // Guarda a coluna de origem antes de qualquer movimento
    const originColumn = findColumn(active.id);
    originColumnIdRef.current = originColumn?.id ?? null;
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
            ...overItems.slice(newIndex(), overItems.length),
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

    let nextColumns = columns;

    // Reordenação de colunas
    if (columns.some((c) => c.id === activeId)) {
      const activeIndex = columns.findIndex((c) => c.id === activeId);
      const overIndex = columns.findIndex((c) => c.id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        nextColumns = arrayMove(columns, activeIndex, overIndex);
        setColumns(nextColumns);
      }

      reorderColumns({
        data: {
          columns: nextColumns.map((col, index) => ({
            id: col.id,
            order: index + 1,
          })),
        },
      });

      return;
    }

    // Reordenação de tasks
    // Neste ponto o handleDragOver já moveu o card para a coluna de destino,
    // então findColumn(activeId) retorna a coluna atual (destino), não a origem.
    const currentColumn = findColumn(activeId);
    const originColumnId = originColumnIdRef.current;
    const movedBetweenColumns = originColumnId !== null && originColumnId !== currentColumn?.id;

    if (!currentColumn) return;

    if (movedBetweenColumns) {
      // Card mudou de coluna: precisa persistir as duas colunas afetadas
      // - coluna de destino: cards reordenados com o novo card incluso
      // - coluna de origem: cards reordenados após a remoção do card
      const originColumn = nextColumns.find((c) => c.id === originColumnId);
      const destinationColumn = nextColumns.find((c) => c.id === currentColumn.id);

      if (!originColumn || !destinationColumn) return;

      const tasksToReorder = [
        ...destinationColumn.cards.map((card, index) => ({
          id: card.id,
          columnId: destinationColumn.id,
          order: index + 1,
        })),
        ...originColumn.cards.map((card, index) => ({
          id: card.id,
          columnId: originColumn.id,
          order: index + 1,
        })),
      ];

      reorderTasks({
        data: {
          tasks: tasksToReorder,
        },
      });
    } else {
      // Card ficou na mesma coluna, reordena só ela
      const activeIndex = currentColumn.cards.findIndex((i) => i.id === activeId);
      const overIndex = currentColumn.cards.findIndex((i) => i.id === overId);

      if (activeIndex !== overIndex) {
        nextColumns = columns.map((column) => {
          if (column.id === currentColumn.id) {
            return {
              ...column,
              cards: arrayMove(currentColumn.cards, activeIndex, overIndex),
            };
          }
          return column;
        });
        setColumns(nextColumns);
      }

      const updatedColumn = nextColumns.find((c) => c.id === currentColumn.id)!;

      reorderTasks({
        data: {
          tasks: updatedColumn.cards.map((card, index) => ({
            id: card.id,
            columnId: updatedColumn.id,
            order: index + 1,
          })),
        },
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