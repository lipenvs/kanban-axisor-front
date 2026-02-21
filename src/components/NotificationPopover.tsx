import { Bell, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { useScanStore } from '@/hooks/useScanStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

export function NotificationPopover() {
    const notifications = useScanStore((state) => state.notifications);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAsRead = useScanStore((state) => state.markAsRead);
    const clearNotifications = useScanStore((state) => state.clearNotifications);

    const hasUnread = unreadCount > 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificações" className="relative h-9 w-9">
                    <Bell size={20} className="text-muted-foreground" />
                    {hasUnread && (
                        <span
                            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white border-2 border-background shadow"
                            aria-label={`${unreadCount} notificações não lidas`}
                        >
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-xl border-border/40">
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <span className="font-semibold text-sm">Notificações</span>
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={clearNotifications}
                        >
                            Limpar tudo
                        </Button>
                    )}
                </div>
                <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Nenhuma notificação
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-muted/50",
                                        !n.read && "bg-blue-50/40 relative"
                                    )}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    {!n.read && (
                                        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                    <div className="flex items-center gap-2 pr-4">
                                        {n.status === 'clean' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : n.status === 'infected' ? (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-gray-500" />
                                        )}
                                        <span className="text-xs font-semibold">
                                            {n.status === 'clean' ? 'Arquivo seguro' : n.status === 'infected' ? 'Arquivo infectado!' : 'Erro no scan'}
                                        </span>
                                        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed pr-2">
                                        O scan do anexo na tarefa foi concluído. {n.status === 'infected' && 'O arquivo foi removido por segurança.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
