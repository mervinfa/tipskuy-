"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, MessageCircle, RefreshCw, Search } from "lucide-react";
import { apiErrorMessage, apiGet } from "@/components/app/api";
import { formatDateTime, isClosedStatus } from "@/components/app/format";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useMe } from "@/components/app/useMe";
import { ChatModal } from "@/components/chat/ChatModal";
import { CustomerOrderPanel } from "@/components/caridriver/CustomerOrderPanel";
import type { ConversationSummary, OrderDetail, OrderListItem } from "@/components/app/types";
import { formatRupiah } from "@/lib/format";

type OrderPage = { items: OrderListItem[]; nextCursor: string | null };

const cardClass =
  "rounded-xl border-[3px] border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonNeutral =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";

export function PesananSayaApp() {
  const { me, loading: loadingMe } = useMe();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [chatTarget, setChatTarget] = useState<{
    conversationId?: string;
    orderId?: string;
    title: string;
  } | null>(null);

  const loadOrders = useCallback(async () => {
    if (!me || me.role !== "CUSTOMER") return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await apiGet<OrderPage>("/api/orders?role=customer&limit=50");
      setOrders(data.items);
    } catch (error) {
      setOrdersError(apiErrorMessage(error));
    } finally {
      setLoadingOrders(false);
    }
  }, [me]);

  const loadConversations = useCallback(async () => {
    if (!me || me.role !== "CUSTOMER") return;
    setLoadingConversations(true);
    setConversationsError(null);
    try {
      const data = await apiGet<{ items: ConversationSummary[] }>("/api/conversations");
      setConversations(data.items);
    } catch (error) {
      setConversationsError(apiErrorMessage(error));
    } finally {
      setLoadingConversations(false);
    }
  }, [me]);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!orderId) {
        setOrder(null);
        return;
      }
      if (!silent) setLoadingOrder(true);
      setOrderError(null);
      try {
        const data = await apiGet<OrderDetail>(`/api/orders/${orderId}`);
        setOrder(data);
      } catch (error) {
        setOrderError(apiErrorMessage(error));
      } finally {
        if (!silent) setLoadingOrder(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (me?.role !== "CUSTOMER") return;
    void loadOrders();
    void loadConversations();
    const timer = window.setInterval(() => {
      void loadOrders();
      void loadConversations();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [me, loadOrders, loadConversations]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("order");
    if (fromUrl) setOrderId(fromUrl);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    void loadOrder();
    // Polling 3000 ms selama pesanan masih menunggu pembayaran agar otomatis tersinkronisasi
    const intervalTime = order?.status === "WAITING_CUSTOMER_PAYMENT" ? 3000 : 5000;
    const timer = window.setInterval(() => {
      void loadOrder(true);
    }, intervalTime);
    return () => window.clearInterval(timer);
  }, [orderId, order?.status, loadOrder]);

  function openOrder(id: string) {
    setOrderId(id);
    setOrder(null);
    window.history.replaceState(null, "", `/caridriver/pesanan?order=${encodeURIComponent(id)}`);
  }

  function toggleOrder(id: string) {
    if (orderId === id) {
      closeOrder();
    } else {
      openOrder(id);
    }
  }

  function closeOrder() {
    setOrderId(null);
    setOrder(null);
    setOrderError(null);
    window.history.replaceState(null, "", "/caridriver/pesanan");
  }

  async function refreshOrder() {
    await Promise.all([loadOrder(true), loadOrders()]);
  }

  if (loadingMe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  if (!me) {
    return (
      <div className={cardClass}>
        <h2 className="text-xl font-extrabold text-black md:text-2xl">Masuk untuk melihat pesanan</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Daftar pesanan memerlukan akun customer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/auth/login" className={buttonPrimary}>
            Login
          </Link>
          <Link href="/auth/register" className={buttonNeutral}>
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (me.role === "DRIVER") {
    return (
      <div className={cardClass}>
        <h2 className="text-xl font-extrabold text-black md:text-2xl">
          Halaman ini untuk akun customer
        </h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Kelola order masuk dari dashboard driver.
        </p>
        <Link href="/driver" className={`${buttonPrimary} mt-4`}>
          Buka Dashboard Driver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border-[3px] border-black bg-[#DCFCE7] p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-black md:text-3xl">Pesanan saya</h1>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Pantau status, bayar, dan konfirmasi pesanan titipan Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/caridriver" className={buttonNeutral}>
              <Search size={15} />
              Cari driver
            </Link>
            <Link href="/caridriver/postingan" className={buttonNeutral}>
              Postingan terbuka
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-black md:text-2xl">Daftar pesanan</h2>
          <button type="button" onClick={() => void loadOrders()} className={buttonNeutral} disabled={loadingOrders}>
            <RefreshCw size={15} className={loadingOrders ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>

        {/* 2 Tab: Pesanan Aktif & Riwayat */}
        <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`rounded-lg px-4 py-2 text-sm font-extrabold transition-all ${
              activeTab === "active"
                ? "border-[3px] border-black bg-[#B7FF8E] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "border-2 border-black bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Pesanan Aktif ({orders.filter((o) => !isClosedStatus(o.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-lg px-4 py-2 text-sm font-extrabold transition-all ${
              activeTab === "history"
                ? "border-[3px] border-black bg-[#B7FF8E] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "border-2 border-black bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Riwayat ({orders.filter((o) => isClosedStatus(o.status)).length})
          </button>
        </div>

        {ordersError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">
            {ordersError}
          </p>
        ) : null}

        {!loadingOrders && orders.filter((o) => (activeTab === "active" ? !isClosedStatus(o.status) : isClosedStatus(o.status))).length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">
              {activeTab === "active" ? "Belum ada pesanan aktif." : "Belum ada riwayat pesanan."}
            </p>
            {activeTab === "active" ? (
              <>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Cari trip yang cocok lalu kirim permintaan titipan.
                </p>
                <Link href="/caridriver" className={`${buttonPrimary} mt-3`}>
                  Cari driver
                </Link>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3">
          {orders
            .filter((o) => (activeTab === "active" ? !isClosedStatus(o.status) : isClosedStatus(o.status)))
            .map((item) => {
              const isExpanded = orderId === item.id;
              return (
                <div key={item.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleOrder(item.id)}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border-[3px] border-black p-4 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      isExpanded ? "bg-[#FFF9E6] -translate-y-0.5" : "bg-white hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-500">{formatDateTime(item.createdAt)}</p>
                      <p className="mt-1 text-base font-extrabold text-black">
                        {item.tripId ? `Order ${item.id.slice(-6)}` : `Postingan ${item.id.slice(-6)}`}
                      </p>
                      <p className="text-xs font-medium text-gray-600">
                        {item._count.items} barang - {item.driver?.user.name ?? "Driver"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-black">
                          {item.totalAmount ? formatRupiah(item.totalAmount) : "Menunggu harga"}
                        </p>
                        <StatusBadge status={item.status} />
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-black transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Inline Accordion Content */}
                  {isExpanded ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      {loadingOrder && !order ? (
                        <div className={`${cardClass} flex items-center justify-center gap-2 py-8 text-sm font-bold`}>
                          <Loader2 size={18} className="animate-spin" /> Memuat detail pesanan...
                        </div>
                      ) : order ? (
                        <CustomerOrderPanel
                          order={order}
                          onClose={closeOrder}
                          onRefresh={refreshOrder}
                          onError={setOrderError}
                          onOpenChat={() =>
                            setChatTarget({
                              orderId: order.id,
                              title: `Chat dengan ${order.driver?.user.name ?? "driver"}`,
                            })
                          }
                        />
                      ) : null}
                      {orderError ? (
                        <p className="mt-2 rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">
                          {orderError}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-black md:text-2xl">Percakapan</h2>
          <button
            type="button"
            onClick={() => void loadConversations()}
            className={buttonNeutral}
            disabled={loadingConversations}
          >
            <RefreshCw size={15} className={loadingConversations ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>
        {conversationsError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">
            {conversationsError}
          </p>
        ) : null}
        {!loadingConversations && conversations.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada percakapan.</p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Buka chat dari kartu driver untuk mulai bertanya.
            </p>
          </div>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() =>
                setChatTarget({
                  conversationId: conversation.id,
                  title: `Chat dengan ${conversation.driver.user.name}`,
                })
              }
              className="rounded-xl border-[3px] border-black bg-white p-3 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-extrabold text-black">
                  {conversation.driver.user.name}
                </p>
                <p className="shrink-0 text-[10px] font-semibold text-gray-500">
                  {formatDateTime(conversation.updatedAt)}
                </p>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-600">
                {conversation.trip
                  ? `${conversation.trip.originCity} ke ${conversation.trip.destCity}`
                  : "Order dari postingan terbuka"}
              </p>
              <p className="mt-2 line-clamp-2 rounded-md border-2 border-black bg-gray-50 p-2 text-xs font-medium text-gray-700">
                {conversation.lastMessage?.body ?? "Belum ada pesan."}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs font-extrabold text-black">
                <MessageCircle size={14} />
                Buka chat
              </p>
            </button>
          ))}
        </div>
      </section>

      {chatTarget ? (
        <ChatModal
          open
          onClose={() => setChatTarget(null)}
          title={chatTarget.title}
          conversationId={chatTarget.conversationId}
          start={chatTarget.orderId ? { orderId: chatTarget.orderId } : undefined}
        />
      ) : null}
    </div>
  );
}
