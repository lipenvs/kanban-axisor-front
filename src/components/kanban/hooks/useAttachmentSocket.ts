import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAttachmentsByTaskIdQueryKey } from '@/lib/api/attachment';

export function useAttachmentSocket(projectId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const ws = new WebSocket(`ws://localhost:3333/ws?projectId=${projectId}`);

    ws.onopen = () => console.log('WebSocket conectado, projectId:', projectId);
    ws.onerror = (e) => console.error('WebSocket erro:', e);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === 'attachment_scanned') {
        console.log('Notificação recebida para taskId:', data.taskId);
        queryClient.invalidateQueries({
          queryKey: getGetAttachmentsByTaskIdQueryKey(data.taskId),
        });
      }
    };

    return () => ws.close();
  }, [projectId, queryClient]);
}