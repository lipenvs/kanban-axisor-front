import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAttachmentsByTaskIdQueryKey } from '@/lib/api/attachment';
import { useScanStore } from '@/hooks/useScanStore';
import { toast } from 'sonner';

export function useAttachmentSocket(projectId: string | null) {
  const queryClient = useQueryClient();
  const removeScanningAttachment = useScanStore((state) => state.removeScanningAttachment);
  const addNotification = useScanStore((state) => state.addNotification);

  useEffect(() => {
    if (!projectId) return;

    const ws = new WebSocket(`ws://localhost:3333/ws?projectId=${projectId}`);

    ws.onopen = () => console.log('WebSocket conectado, projectId:', projectId);
    ws.onerror = (e) => console.error('WebSocket erro:', e);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === 'attachment_scanned') {
        console.log('Notificação recebida para taskId:', data.taskId);
        
        // Atualiza o estado global
        removeScanningAttachment(data.taskId, data.attachmentId);
        addNotification({
          taskId: data.taskId,
          attachmentId: data.attachmentId,
          status: data.status,
        });

        if (data.status === 'clean') {
          toast.success('Anexo verificado e seguro!');
        } else if (data.status === 'infected') {
          toast.error('Anexo infectado detectado e removido!', {
            description: 'O arquivo foi excluído por segurança.',
          });
        }

        // Invalida a query para atualizar a UI
        queryClient.invalidateQueries({
          queryKey: getGetAttachmentsByTaskIdQueryKey(data.taskId),
        });
      }
    };

    return () => ws.close();
  }, [projectId, queryClient, removeScanningAttachment, addNotification]);
}