"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, type UserSession } from "@/lib/api-client";

export interface HotelRecommendation {
  id: string;
  name: string;
  city: string;
  location: string;
  price: number;
  rating: number | string;
  image?: string;
  tag?: string;
  description?: string;
  features?: string[];
  [key: string]: unknown;
}

export interface ServiceTicket {
  ticketId: string;
  hotelId: string;
  roomNumber: string;
  serviceType: string;
  priority: string;
  status: string;
  scheduledTime?: string;
  createdAt?: string;
}

export interface DestinationGuide {
  city: string;
  tagline?: string;
  sightseeing?: Array<{ name: string; description?: string; bestTime?: string }>;
  foodSpots?: Array<{ name: string; speciality?: string; location?: string }>;
  localTransit?: Array<{ type: string; info: string }>;
  tips?: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: HotelRecommendation[];
  serviceTicket?: ServiceTicket;
  itinerary?: DestinationGuide;
  traceId?: string;
  latencyMs?: number;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "🏖️ Find me a quiet beachfront villa in Goa under ₹10,000 with private pool",
  "🧹 Send 2 extra bath towels to room 204",
  "⏰ Request late check-out at 1 PM",
  "🗺️ What should I explore in Kolkata today?",
  "🍛 Best local food spots in Udaipur",
];

export function AiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your **StayEase 24/7 AI Concierge**, powered by **LangGraph, Pinecone Vector DB, and Gemini**.\n\nI can recommend luxury beachfront villas, dispatch instant room requests (extra towels, late check-out), or curate local city itineraries. How may I assist your stay today?",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(api.getUser());
    const syncUser = () => setUser(api.getUser());
    window.addEventListener("stayease-user-updated", syncUser);
    return () => window.removeEventListener("stayease-user-updated", syncUser);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          context: {
            guestName: user?.name || "Guest",
            userEmail: user?.email || "guest@stayease.com",
            currentCity: "Goa",
            roomNumber: "204",
            currentHotel: "palm-house",
          },
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply || "Here is what I found for you:",
          recommendations: data.recommendations,
          serviceTicket: data.serviceTicket,
          itinerary: data.itinerary,
          traceId: data.trace?.traceId,
          latencyMs: data.trace?.latencyMs,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data?.message || "Failed to process request");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ I encountered an error: ${err?.message || "Could not reach concierge service"}. Please try again.`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-full bg-forest px-4 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#344d40] focus:outline-none"
          aria-label="Open AI Concierge"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#52b788] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#52b788]" />
          </span>
          <span className="text-xl">🤖</span>
          <span className="text-xs font-semibold tracking-wide">
            AI Concierge
          </span>
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-mint">
            RAG
          </span>
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="flex h-[600px] w-[92vw] max-w-[430px] flex-col rounded-2xl border border-line bg-white shadow-2xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-forest to-[#283d32] p-4 text-white rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">StayEase Concierge</h3>
                  <span className="rounded bg-[#52b788] px-1.5 py-0.2 text-[8px] font-bold text-forest">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-white/80">
                  LangGraph · Pinecone Vector DB · Gemini 1.5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                title="Close Concierge"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Connected Context Strip */}
          <div className="flex items-center justify-between border-b border-line/60 bg-[#f4f8f5] px-4 py-1.5 text-[10px] text-muted">
            <span className="flex items-center gap-1 text-forest font-medium">
              <span>📍</span> Candolim, Goa · Room 204
            </span>
            <span className="font-mono text-[9px]">LangSmith: ACTIVE</span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "bg-forest text-white rounded-tr-none"
                      : "bg-[#f8faf9] text-charcoal border border-line/60 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>

                  {/* Render Structured Hotel Recommendation Cards */}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {m.recommendations.map((hotel) => (
                        <div
                          key={hotel.id}
                          className="overflow-hidden rounded-xl border border-line bg-white shadow-xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="h-28 w-full object-cover"
                          />
                          <div className="p-2.5">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-charcoal text-xs">{hotel.name}</h4>
                                <p className="text-[10px] text-muted">{hotel.location}</p>
                              </div>
                              <span className="rounded bg-mint px-1.5 py-0.5 text-[9px] font-bold text-forest">
                                ★ {hotel.rating}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {(hotel.features || []).slice(0, 3).map((f: string) => (
                                <span
                                  key={f}
                                  className="rounded bg-mist px-1.5 py-0.5 text-[8px] text-muted"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                            <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
                              <div>
                                <span className="text-[9px] text-muted">From</span>
                                <span className="ml-1 font-bold text-forest text-xs">
                                  ₹{hotel.price.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[9px] text-muted"> /night</span>
                              </div>
                              <Link
                                href={`/?search=${encodeURIComponent(hotel.name)}`}
                                className="rounded bg-forest px-2.5 py-1 text-[9px] font-semibold text-white hover:bg-[#344d40] transition-colors"
                              >
                                View Stay ↗
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Verified Housekeeping Service Ticket */}
                  {m.serviceTicket && (
                    <div className="mt-2.5 rounded-xl border border-emerald-300 bg-[#eef8f2] p-3 text-forest">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <span className="flex items-center gap-1 font-bold text-[11px]">
                          <span>🛎️</span> Service Ticket Created
                        </span>
                        <span className="rounded bg-emerald-600 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                          #{m.serviceTicket.ticketId}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-muted block text-[8px] uppercase">Service</span>
                          <strong className="text-charcoal">{m.serviceTicket.serviceType}</strong>
                        </div>
                        <div>
                          <span className="text-muted block text-[8px] uppercase">Room</span>
                          <strong className="text-charcoal">Room {m.serviceTicket.roomNumber}</strong>
                        </div>
                        <div>
                          <span className="text-muted block text-[8px] uppercase">Status</span>
                          <span className="font-semibold text-emerald-700">● {m.serviceTicket.status}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[8px] uppercase">Est. Delivery</span>
                          <strong className="text-charcoal">{m.serviceTicket.scheduledTime}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render City Itinerary & Destination Guide */}
                  {m.itinerary && (
                    <div className="mt-2.5 rounded-xl border border-purple-200 bg-[#f9f5ff] p-3 text-charcoal">
                      <div className="border-b border-purple-200 pb-2">
                        <h4 className="font-bold text-purple-900 text-xs flex items-center gap-1">
                          <span>🧭</span> {m.itinerary.city} Explorer Guide
                        </h4>
                        <p className="text-[9px] text-purple-700">{m.itinerary.tagline}</p>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-purple-800">
                            Must-Visit Sights:
                          </span>
                          <ul className="mt-1 space-y-1 text-[10px]">
                            {(m.itinerary.sightseeing || []).slice(0, 3).map((s) => (
                              <li key={s.name} className="flex flex-col">
                                <strong>• {s.name}</strong>
                                <span className="text-muted text-[9px]">{s.description} ({s.bestTime})</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t border-purple-100 pt-1.5">
                          <span className="text-[9px] font-bold uppercase text-purple-800">
                            Iconic Food Spots:
                          </span>
                          <ul className="mt-1 space-y-1 text-[10px]">
                            {(m.itinerary.foodSpots || []).slice(0, 2).map((f) => (
                              <li key={f.name}>
                                <strong>🍴 {f.name}</strong>: {f.speciality}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {m.itinerary.localTransit && m.itinerary.localTransit.length > 0 && (
                          <div className="rounded bg-white p-2 border border-purple-100 text-[9px] text-muted">
                            <span className="font-bold text-purple-900">⛴️ Transit / Ferry: </span>
                            {m.itinerary.localTransit[0].info}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-[9px] text-muted px-1">
                  <span>{m.timestamp}</span>
                  {m.traceId && (
                    <span className="font-mono text-[8px] text-forest/80">
                      trace:{m.traceId.slice(-6)} ({m.latencyMs}ms)
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-muted text-xs">
                <span className="flex h-2 w-2 rounded-full bg-forest animate-ping" />
                <span>AI Concierge is reasoning through LangGraph nodes…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="border-t border-line/60 bg-[#fbfdfc] p-2">
            <p className="px-1 text-[9px] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Quick Inquiries:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1 text-[9px] font-medium text-charcoal shadow-2xs hover:border-forest hover:text-forest disabled:opacity-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="border-t border-line p-3 bg-white rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for villa recommendations, extra towels, or local guides..."
                disabled={loading}
                className="flex-1 rounded-xl border border-line bg-mist/30 px-3.5 py-2 text-xs text-charcoal focus:border-forest focus:outline-none focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-white shadow-xs hover:bg-[#344d40] disabled:opacity-50 transition-colors"
                aria-label="Send query"
              >
                ➤
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[8px] text-muted">
              <span>Google Gemini 1.5 · Pinecone Serverless · LangGraph</span>
              <span>24/7 Guest Assistant</span>
            </div>
          </div>
        </div>
      )}