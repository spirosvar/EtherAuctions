// services/auctionEvents.js
export function attachAuctionEventListeners(
  contract,
  { onCreated, onExpired, onCancelled }
) {
  if (!contract?.events) {
    console.warn(
      "Contract provider does not support subscriptions or ABI missing events."
    );
    return [];
  }
  const subs = [];

  if (typeof contract.events.AuctionCreated === "function") {
    subs.push(contract.events.AuctionCreated().on("data", onCreated));
  }
  if (typeof contract.events.AuctionExpired === "function") {
    subs.push(contract.events.AuctionExpired().on("data", onExpired));
  }
  if (typeof contract.events.AuctionCancelled === "function") {
    subs.push(contract.events.AuctionCancelled().on("data", onCancelled));
  }
  return subs;
}

export function detachEventSubscriptions(subs) {
  if (!Array.isArray(subs)) return;
  for (const s of subs) {
    try {
      s?.unsubscribe?.();
    } catch {}
  }
}
