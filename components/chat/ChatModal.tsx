"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { apiErrorMessage, apiGet, apiSend } from "@/components/app/api";
import { formatDateTime } from "@/components/app/format";
import { useMe } from "@/components/app/useMe";
import type { ChatMessage, ConversationSummary } from "@/components/app/types";

type ChatStart = {
  tripId?: string;
  orderId?: string;
};

type ChatModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  conversationId?: string | null;
  start?: ChatStart;
};

type MessageList = {
  items: ChatMessage[];
};

export function ChatModal({ open, onClose, title, conversationId, start }: ChatModalProps) {
  const { me } = useMe();
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef(onClose);
  const startTripId = start?.tripId;
  const startOrderId = start?.orderId;

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setActiveId(conversationId ?? null);
    setMessages([]);
    setDraft("");
    setError(null);
  }, [open, conversationId, startTripId, startOrderId]);

  useEffect(() => {
    if (!open || activeId) return;
    if (!startTripId && !startOrderId) {
      setError("Percakapan tidak tersedia");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const payload = startTripId ? { tripId: startTripId } : { orderId: startOrderId };
    apiSend<ConversationSummary>("/api/conversations", "POST", payload)
      .then((conversation) => {
        if (!cancelled) setActiveId(conversation.id);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(apiErrorMessage(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, activeId, startTripId, startOrderId]);

  const loadMessages = useCallback(async () => {
    if (!activeId) return;
    try {
      const data = await apiGet<MessageList>(
        `/api/conversations/${activeId}/messages?limit=100`
      );
      setMessages(data.items);
    } catch (reason) {
      setError(apiErrorMessage(reason));
    }
  }, [activeId]);

  useEffect(() => {
    if (!open || !activeId) return;
    setLoading(true);
    void loadMessages().finally(() => setLoading(false));
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [open, activeId, loadMessages]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await apiSend<ChatMessage>(
        `/api/conversations/${activeId}/messages`,
        "POST",
        { body }
      );
      setMessages((rows) => [...rows, created]);
      setDraft("");
      inputRef.current?.focus();
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-black bg-white p-3">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-black">{title}</p>
            <p className="text-xs font-medium text-gray-600">Obrolan di dalam web</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border-2 border-black bg-white p-1.5 text-black transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            aria-label="Tutup chat"
          >
            <X size={18} />
          </button>
        </div>

        <div
          ref={listRef}
          className="min-h-48 flex-1 space-y-3 overflow-y-auto bg-[#D1D5DB] p-3 md:p-4"
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-bold text-gray-700">
              <Loader2 size={18} className="animate-spin" /> Memuat pesan...
            </div>
          ) : null}
          {!loading && messages.length === 0 ? (
            <p className="py-8 text-center text-sm font-bold text-gray-700">
              Belum ada pesan. Mulai percakapan.
            </p>
          ) : null}
          {messages.map((message) => {
            const mine = message.senderId === me?.id;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-md border-2 border-black px-3 py-2 text-sm font-semibold text-black ${
                    mine ? "bg-[#A5F3FC]" : "bg-white"
                  }`}
                >
                  {message.body}
                </div>
                <p className="mt-1 text-[10px] font-medium text-gray-600">
                  {mine ? "Anda" : message.sender.name} - {formatDateTime(message.createdAt)}
                </p>
              </div>
            );
          })}
        </div>

        {error ? (
          <p className="border-t-2 border-black bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex items-end gap-2 border-t-[3px] border-black bg-white p-3">
          <label className="flex-1">
            <span className="sr-only">Tulis pesan</span>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder="Tulis pesan untuk lawan bicara"
              className="w-full resize-none rounded-md border-2 border-black bg-white px-3 py-2 text-sm font-medium text-black outline-none placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || draft.trim().length === 0 || !activeId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border-2 border-black bg-[#B7FF8E] px-3 text-sm font-extrabold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            aria-label="Kirim pesan"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
