import {
  closestCenter,
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Column from "./Column";
import Card from "./Card";
import ColumnDialog from "./ColumnDialog";
import TaskDialog from "./TaskDialog";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetColumnsKanban, usePostColumnsWithJson, getGetColumnsKanbanQueryKey, useDeleteColumnsById, usePutColumnsByIdWithJson } from "../../lib/api/column";
import { usePostTasksWithJson, useDeleteTasksById, useGetTasks, usePutTasksByIdWithJson, getGetTasksQueryKey } from "../../lib/api/task";
import { useGetLabelsByProjectId } from "../../lib/api/label";
import { postAttachmentsUploadByTaskIdWithFormData, getGetAttachmentsByTaskIdQueryKey } from "../../lib/api/attachment";
import { useTaskBoardDragAndDrop } from "./hooks/useTaskBoardDragAndDrop";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

interface TaskBoardProps {
  projectId: string;
}

export default function TaskBoard({ projectId }: TaskBoardProps) {
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: kanbanData, isLoading: isLoadingKanban } = useGetColumnsKanban({ projectId });
  const { data: tasksData, isLoading: isLoadingTasks } = useGetTasks({ projectId });
  const { data: labelsData } = useGetLabelsByProjectId(projectId);

  const {
    columns,
    isColumnDrag,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getActiveCard,
    getActiveColumn,
  } = useTaskBoardDragAndDrop(kanbanData?.data ?? []);

  const activeCard = getActiveCard();
  const activeColumn = getActiveColumn();

  const { mutate: createColumn } = usePostColumnsWithJson();
  const { mutate: createTask } = usePostTasksWithJson();
  const { mutate: deleteTask } = useDeleteTasksById();
  const { mutate: updateTask } = usePutTasksByIdWithJson();

  const handleCreateColumn = (title: string) => {
    createColumn(
      { data: { title, projectId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetColumnsKanbanQueryKey({ projectId }) });
        },
      }
    );
  };

  async function uploadFiles(taskId: string, files: File[]) {
    await Promise.all(
      files.map((file) =>
        postAttachmentsUploadByTaskIdWithFormData(taskId, { file })
      )
    );
    queryClient.invalidateQueries({ queryKey: getGetAttachmentsByTaskIdQueryKey(taskId) });
  }

  const handleCreateOrUpdateTask = (data: { title: string; description?: string; dueDate?: string | null; labelId?: string | null; assigneeId?: string | null; files?: File[] }) => {
    if (editingTaskId) {
      updateTask(
        {
          id: editingTaskId,
          data: {
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            labelId: data.labelId,
            assigneeId: data.assigneeId,
          }
        },
        {
          onSuccess: async () => {
            if (data.files && data.files.length > 0) {
              await uploadFiles(editingTaskId, data.files);
            }
            queryClient.invalidateQueries({ queryKey: getGetColumnsKanbanQueryKey({ projectId }) });
            queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey({ projectId }) });
            setEditingTaskId(null);
          }
        }
      )
    } else if (createTaskColumnId) {
      createTask(
        {
          data: {
            title: data.title,
            columnId: createTaskColumnId,
            description: data.description,
            dueDate: data.dueDate,
            labelId: data.labelId,
            assigneeId: data.assigneeId,
          }
        },
        {
          onSuccess: async (response) => {
            if (data.files && data.files.length > 0) {
              await uploadFiles(response.data.id, data.files);
            }
            queryClient.invalidateQueries({ queryKey: getGetColumnsKanbanQueryKey({ projectId }) });
            queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey({ projectId }) });
            setCreateTaskColumnId(null);
          },
        }
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
  };

  const confirmDeleteTask = () => {
    if (deletingTaskId) {
      deleteTask(
        { id: deletingTaskId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetColumnsKanbanQueryKey({ projectId }) });
            queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey({ projectId }) });
            setDeletingTaskId(null);
          },
        }
      );
    }
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const { mutate: deleteColumn } = useDeleteColumnsById();
  const { mutate: updateColumn } = usePutColumnsByIdWithJson();

  const handleDeleteColumn = (columnId: string) => {
    setDeletingColumnId(columnId);
  };

  const confirmDeleteColumn = () => {
    if (deletingColumnId) {
      deleteColumn(
        { id: deletingColumnId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetColumnsKanbanQueryKey({ projectId }) });
            setDeletingColumnId(null);
          },
        }
      );
    }
  };

  const handleEditColumn = (columnId: string) => {
    setEditingColumnId(columnId);
    setIsColumnDialogOpen(true);
  };

  const handleCreateOrUpdateColumn = (title: string) => {
    if (editingColumnId) {
      updateColumn(
        {
          id: editingColumnId,
          data: { title }
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetColumnsKanbanQueryKey({ projectId }) });
            setIsColumnDialogOpen(false);
            setEditingColumnId(null);
          }
        }
      );
    } else {
      handleCreateColumn(title);
    }
  };

  if (isLoadingKanban || isLoadingTasks) {
    return <div className="flex items-center justify-center w-full h-full">Carregando...</div>;
  }

  const editingTask = editingTaskId ? tasksData?.data.tasks.find(t => t.id === editingTaskId) : null;


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <ScrollArea className="flex-1 w-full whitespace-nowrap">
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex w-max space-x-3 md:space-x-4 pb-4">
            {columns.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                cards={column.cards}
                onCreateTask={setCreateTaskColumnId}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                onEditColumn={(id) => handleEditColumn(id)}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}
            <button
              onClick={() => setIsColumnDialogOpen(true)}
              className="w-64 md:w-72 shrink-0 h-fit flex items-center justify-center gap-2 py-10
                  rounded-xl border-2 border-dashed border-border/40 hover:border-border
                  text-muted-foreground hover:text-foreground
                  bg-muted/10 hover:bg-muted/30
                  transition-all duration-200 cursor-pointer">
              <Plus className="w-4 h-4" />
              Criar coluna
            </button>
          </div>
        </SortableContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <DragOverlay dropAnimation={dropAnimation}>
        {isColumnDrag && activeColumn ? (
          <div className="w-64 md:w-72 rounded-xl p-3 bg-gray-100 opacity-80 shadow-lg min-h-[200px]">
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-sm font-semibold text-foreground">{activeColumn.title}</h3>
            </div>
            <div className="text-xs text-muted-foreground">{activeColumn.cards.length} tarefa(s)</div>
          </div>
        ) : activeCard ? (
          <Card card={activeCard} />
        ) : null}
      </DragOverlay>

      <ColumnDialog
        open={isColumnDialogOpen}
        onOpenChange={(open) => {
          setIsColumnDialogOpen(open);
          if (!open) setEditingColumnId(null);
        }}
        onSubmit={handleCreateOrUpdateColumn}
        initialTitle={editingColumnId ? columns.find(c => c.id === editingColumnId)?.title : ""}
      />

      <TaskDialog
        open={!!createTaskColumnId || !!editingTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setCreateTaskColumnId(null);
            setEditingTaskId(null);
          }
        }}
        task={editingTask}
        labels={labelsData?.data?.labels ?? []}
        onSubmit={handleCreateOrUpdateTask}
      />

      <ConfirmDeleteDialog
        open={!!deletingTaskId}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
        title="Excluir tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteTask}
        triggerLabel="Excluir"
      />

      <ConfirmDeleteDialog
        open={!!deletingColumnId}
        onOpenChange={(open) => !open && setDeletingColumnId(null)}
        title="Excluir coluna"
        description="Tem certeza que deseja excluir esta coluna? Todas as tarefas nela serão perdidas. Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteColumn}
        triggerLabel="Excluir"
      />
    </DndContext>
  );
}
