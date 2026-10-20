// AdminMessagesPage — /admin/messages
// Contact us responses in one place: unread badge, open (marks as read), delete.

import { useCallback, useEffect, useState } from 'react';
import { deleteMessage, getMessages, markMessageRead } from '../services/messageService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';
import Modal from '../components/Common/Modal';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminMessagesPage() {
  usePageTitle();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMessages(await getMessages());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = async (message) => {
    setOpenId((prev) => (prev === message.message_id ? null : message.message_id));
    if (message.status === 'new') {
      setBusyId(message.message_id);
      try {
        const updated = await markMessageRead(message.message_id);
        setMessages((prev) =>
          prev.map((m) => (m.message_id === updated.message_id ? { ...m, ...updated } : m))
        );
      } catch {
        // Badge stays — the view is still readable.
      } finally {
        setBusyId(null);
      }
    }
  };

  const handleDelete = async () => {
    const target = messages.find((m) => m.message_id === deleteId);
    if (!target) return;
    setBusyId(target.message_id);
    try {
      await deleteMessage(target.message_id);
      setMessages((prev) => prev.filter((m) => m.message_id !== target.message_id));
      setOpenId((prev) => (prev === target.message_id ? null : prev));
      setDeleteId(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const unread = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Contact responses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages sent from the Contact us page.
            {unread > 0 ? ` ${unread} unread.` : ' All read.'}
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </header>

      {loading && <Loader label="Loading messages…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && !error && messages.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border px-4 py-14 text-center text-muted-foreground">
          No responses yet. Messages sent from the Contact us page appear here.
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <ul className="space-y-3">
          {messages.map((message) => {
            const isOpen = openId === message.message_id;
            const isNew = message.status === 'new';
            return (
              <li key={message.message_id} className="rounded-2xl border border-border bg-card shadow-sm">
                <button
                  type="button"
                  onClick={() => handleOpen(message)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">{message.name}</span>
                      {isNew && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {message.subject || 'General enquiry'} · {message.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 py-4">
                    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</dt>
                        <dd className="break-all">{message.email}</dd>
                      </div>
                      {message.phone && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</dt>
                          <dd>{message.phone}</dd>
                        </div>
                      )}
                      {(message.country || message.city) && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</dt>
                          <dd>{[message.city, message.country].filter(Boolean).join(', ')}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</dt>
                        <dd>{message.subject || 'General enquiry'}</dd>
                      </div>
                    </dl>

                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/50 px-3.5 py-3 text-sm">
                      {message.message}
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDeleteId(message.message_id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Delete confirmation */}
      <Modal open={Boolean(deleteId)} title="Delete response?" onClose={() => setDeleteId(null)}>
        <p className="text-sm text-muted-foreground">
          This permanently removes the message. It cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={busyId === deleteId}>
            {busyId === deleteId ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
