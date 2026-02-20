import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

interface Notification {
    id: string;
    message: string;
    date: string;
}

const notifications: Notification[] = [];

export function NotificationPopover() {
    const hasUnread = notifications.length > 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
                    <Bell size={20} />
                    {hasUnread && (
                        <span
                            className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-indigo-500 border-2 border-background shadow"
                            aria-label="Notificações não lidas"
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b font-semibold">Notificações</div>
                <ul className="max-h-60 overflow-y-auto divide-y">
                    {notifications.length === 0 ? (
                        <li className="p-4 text-center text-muted-foreground">Nenhuma notificação</li>
                    ) : (
                        notifications.map((n) => (
                            <li key={n.id} className="p-4 flex flex-col gap-1">
                                <span>{n.message}</span>
                                <span className="text-xs text-muted-foreground">{n.date}</span>
                            </li>
                        ))
                    )}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
