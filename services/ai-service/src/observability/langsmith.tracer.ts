import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export interface LangSmithSpan {
  id: string;
  name: string;
  type: "router" | "vector_db" | "tool_execution" | "llm_generation" | "synthesizer" | "retriever" | "tool" | "llm";
  startTime: number;
  endTime?: number;
  latencyMs?: number;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: "running" | "success" | "error";
  error?: string;
}

export interface LangSmithTrace {
  id: string;
  name: string;
  project: string;
  startTime: number;
  endTime?: number;
  latencyMs?: number;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  spans: LangSmithSpan[];
  metadata: Record<string, unknown>;
  hallucinationScore?: number;
  groundedScore?: number;
}

const activeTraces = new Map<string, LangSmithTrace>();

export class LangSmithTracer {
  private isEnabled: boolean;
  private apiKey: string;
  private project: string;
  private endpoint: string;

  constructor() {
    this.isEnabled = env.LANGCHAIN_TRACING_V2;
    this.apiKey = env.LANGCHAIN_API_KEY;
    this.project = env.LANGCHAIN_PROJECT;
    this.endpoint = env.LANGCHAIN_ENDPOINT;
  }

  startTrace(
    name: string,
    inputs: Record<string, unknown>,
    metadata: Record<string, unknown> = {}
  ): { traceId: string } {
    const traceId = `trace_${randomUUID()}`;
    const trace: LangSmithTrace = {
      id: traceId,
      name,
      project: this.project,
      startTime: Date.now(),
      inputs,
      spans: [],
      metadata: {
        environment: env.NODE_ENV,
        service: "stayease-ai-service",
        ...metadata,
      },
    };

    activeTraces.set(traceId, trace);
    return { traceId };
  }

  startSpan(
    traceId: string,
    name: string,
    type: LangSmithSpan["type"],
    inputs: Record<string, unknown>
  ): string {
    const trace = activeTraces.get(traceId);
    const spanId = `span_${randomUUID()}`;
    if (!trace) return spanId;

    const span: LangSmithSpan = {
      id: spanId,
      name,
      type,
      startTime: Date.now(),
      inputs,
      status: "running",
    };

    trace.spans.push(span);
    return spanId;
  }

  endSpan(
    traceId: string,
    spanId: string,
    outputs: Record<string, unknown> = {},
    error?: string
  ): void {
    const trace = activeTraces.get(traceId);
    if (!trace) return;

    const span = trace.spans.find((s) => s.id === spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.latencyMs = span.endTime - span.startTime;
    span.outputs = outputs;
    span.status = error ? "error" : "success";
    if (error) span.error = error;
  }

  async endTrace(
    traceId: string,
    outputs: Record<string, unknown> = {},
    errorOrEval?: string | { hallucinationScore?: number; groundedScore?: number }
  ): Promise<LangSmithTrace | null> {
    const trace = activeTraces.get(traceId);
    if (!trace) return null;

    trace.endTime = Date.now();
    trace.latencyMs = trace.endTime - trace.startTime;
    trace.outputs = outputs;

    if (typeof errorOrEval === "object" && errorOrEval !== null) {
      trace.hallucinationScore = errorOrEval.hallucinationScore;
      trace.groundedScore = errorOrEval.groundedScore;
    } else if (typeof errorOrEval === "string") {
      trace.metadata.error = errorOrEval;
    }

    if (this.isEnabled && this.apiKey) {
      void this.exportToLangSmith(trace).catch((err) => {
        console.warn("[LangSmith] Telemetry export failed:", err);
      });
    }

    setTimeout(() => {
      activeTraces.delete(traceId);
    }, 60_000);

    return trace;
  }

  private async exportToLangSmith(trace: LangSmithTrace): Promise<void> {
    try {
      await fetch(`${this.endpoint}/runs`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: trace.id.replace("trace_", ""),
          name: trace.name,
          run_type: "chain",
          inputs: trace.inputs,
          outputs: trace.outputs,
          start_time: new Date(trace.startTime).toISOString(),
          end_time: trace.endTime ? new Date(trace.endTime).toISOString() : new Date().toISOString(),
          extra: {
            metadata: trace.metadata,
            project_name: this.project,
            spans: trace.spans,
          },
        }),
      });
    } catch {
      // Non-blocking telemetry
    }
  }

  getTrace(traceId: string): LangSmithTrace | undefined {
    return activeTraces.get(traceId);
  }

  getTraces(limit = 20): LangSmithTrace[] {
    return Array.from(activeTraces.values()).slice(-limit);
  }
}

export const langsmith = new LangSmithTracer();
