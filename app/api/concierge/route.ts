import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], context = {} } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Valid message required" },
        { status: 400 }
      );
    }

    const aiServiceBase = process.env.AI_SERVICE_URL || "http://localhost:8013";
    const gatewayBase = process.env.API_GATEWAY_URL || "http://localhost:8000";

    let res: Response | null = null;

    // Try API Gateway first, fallback to direct ai-service port 8013
    try {
      res = await fetch(`${gatewayBase}/api/v1/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), history, context }),
      });
    } catch {
      try {
        res = await fetch(`${aiServiceBase}/api/v1/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.trim(), history, context }),
        });
      } catch (err: any) {
        throw new Error(err?.message || "AI Service unavailable");
      }
    }

    if (!res || !res.ok) {
      const errText = await res?.text().catch(() => "");
      throw new Error(`AI Service returned ${res?.status}: ${errText}`);
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      reply: data.reply,
      intent: data.intent,
      recommendations: data.hotels || [],
      serviceTicket: data.ticket,
      itinerary: data.guide,
      trace: {
        traceId: data.traceId,
        ...data.trace,
      },
    });
  } catch (err: any) {
    console.error("[API /api/concierge] Proxy error:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "AI Concierge service temporarily unavailable",
      },
      { status: 500 }
    );
  }
}
