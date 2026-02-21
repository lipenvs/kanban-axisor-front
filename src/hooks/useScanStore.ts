import { create } from 'zustand';

interface Notification {
  id: string;
  taskId: string;
  attachmentId: string;
  status: 'clean' | 'infected' | 'error';
  timestamp: number;
  read: boolean;
}

interface ScanStore {
  scanningAttachmentIds: Set<string>;
  scanningTaskIds: Map<string, number>; // taskId -> count of scanning attachments
  notifications: Notification[];
  addScanningAttachment: (taskId: string, attachmentId: string) => void;
  removeScanningAttachment: (taskId: string, attachmentId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  scanningAttachmentIds: new Set(),
  scanningTaskIds: new Map(),
  notifications: [],
  addScanningAttachment: (taskId, attachmentId) =>
    set((state) => {
      const nextAttachmentIds = new Set(state.scanningAttachmentIds);
      nextAttachmentIds.add(attachmentId);

      const nextTaskIds = new Map(state.scanningTaskIds);
      const currentCount = nextTaskIds.get(taskId) ?? 0;
      nextTaskIds.set(taskId, currentCount + 1);

      return { 
        scanningAttachmentIds: nextAttachmentIds,
        scanningTaskIds: nextTaskIds
      };
    }),
  removeScanningAttachment: (taskId, attachmentId) =>
    set((state) => {
      const nextAttachmentIds = new Set(state.scanningAttachmentIds);
      nextAttachmentIds.delete(attachmentId);

      const nextTaskIds = new Map(state.scanningTaskIds);
      const currentCount = nextTaskIds.get(taskId) ?? 0;
      if (currentCount <= 1) {
        nextTaskIds.delete(taskId);
      } else {
        nextTaskIds.set(taskId, currentCount - 1);
      }

      return { 
        scanningAttachmentIds: nextAttachmentIds,
        scanningTaskIds: nextTaskIds
      };
    }),
  addNotification: (notification) =>
    set((state) => {
      const newNotification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        read: false,
      };
      return {
        notifications: [newNotification, ...state.notifications].slice(0, 50),
      };
    }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
