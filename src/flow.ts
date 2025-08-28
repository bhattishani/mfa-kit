import { randomUUID } from "crypto";
import type { Decision, Factor, FlowTicket } from "./types";
import type { StorageAdapter } from "./storage";

export async function orchestrateFlow(
  userId: string,
  decision: Decision,
  ip: string,
  ray: string,
  store: StorageAdapter
) {
  const ticket: FlowTicket = {
    id: randomUUID(),
    userId,
    queue: decision.required,
    satisfied: [],
    issuedAt: Date.now(),
    ip,
    ray,
    ttlSec: 600,
  };
  await store.saveFlowTicket(ticket);
  return ticket;
}

export async function mintFlowTicket(
  userId: string,
  factors: Factor[],
  ip: string,
  ray: string,
  store: StorageAdapter
) {
  return orchestrateFlow(
    userId,
    { required: factors, allowFallbackOrder: [], rememberDevice: false },
    ip,
    ray,
    store
  );
}

export async function verifyFlowTicket(
  ticketId: string,
  store: StorageAdapter
) {
  const t = await store.getFlowTicket(ticketId);
  if (!t) return null;
  if (Date.now() > t.issuedAt + t.ttlSec * 1000) {
    await store.deleteFlowTicket(ticketId);
    return null;
  }
  return t;
}

export function nextStep(ticket: FlowTicket): Factor | null {
  return ticket.queue[0] ?? null;
}

export function markSatisfied(ticket: FlowTicket, f: Factor): FlowTicket {
  if (ticket.queue[0] !== f) return ticket;
  return {
    ...ticket,
    satisfied: [...ticket.satisfied, f],
    queue: ticket.queue.slice(1),
  };
}
