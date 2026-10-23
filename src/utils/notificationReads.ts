import { storage } from '@/api/storage';
import type { AppNotification } from '@/domain/types';

/**
 * Broadcast notifications (sent to everyone, e.g. from the dashboard) have one
 * shared `is_read` flag on the server, so marking them read there is not possible
 * per person, and the server has no way to mark one unread again. This device
 * keeps the ids it read and the ids it was told to show as unread, and applies
 * both on top of whatever the server reports, so a refresh never undoes a tap.
 */
type Role = 'vendor' | 'delivery';

const KEY = (role: Role, kind: 'read' | 'unread') => `notifications.${kind}.${role}`;
const MAX_KEPT = 300;

const read: Record<Role, Set<string>> = { vendor: new Set(), delivery: new Set() };
const unread: Record<Role, Set<string>> = { vendor: new Set(), delivery: new Set() };

const restore = (role: Role, kind: 'read' | 'unread', into: Set<string>) =>
  storage.get(KEY(role, kind)).then(saved => {
    try {
      (JSON.parse(saved ?? '[]') as string[]).forEach(id => into.add(id));
    } catch {
      // A corrupt value is the same as nothing saved.
    }
  });

(['vendor', 'delivery'] as Role[]).forEach(role => {
  restore(role, 'read', read[role]);
  restore(role, 'unread', unread[role]);
});

const save = (role: Role) => {
  storage.set(KEY(role, 'read'), JSON.stringify([...read[role]].slice(-MAX_KEPT)));
  storage.set(KEY(role, 'unread'), JSON.stringify([...unread[role]].slice(-MAX_KEPT)));
};

export const markNotificationsRead = (role: Role, ids: string[]) => {
  ids.forEach(id => {
    read[role].add(id);
    unread[role].delete(id);
  });
  save(role);
};

export const markNotificationsUnread = (role: Role, ids: string[]) => {
  ids.forEach(id => {
    unread[role].add(id);
    read[role].delete(id);
  });
  save(role);
};

export const withLocalReads = (role: Role, list: AppNotification[]): AppNotification[] =>
  list.map(n => {
    const isRead = unread[role].has(n.id) ? false : n.read || read[role].has(n.id);
    return isRead === n.read ? n : { ...n, read: isRead };
  });
