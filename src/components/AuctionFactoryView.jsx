// components/AuctionFactoryView.jsx
import React from "react";

export default function AuctionFactoryView(props) {
  const {
    contractAddress,
    currentAccount,
    contractCodePresent,
    networkName,

    // forms
    title,
    ttlSeconds,
    ttlBlocks,
    cancelTitle,
    onSetTitle,
    onSetTtlSeconds,
    onSetTtlBlocks,
    onSetCancelTitle,
    onCreateByTime,
    onCreateByBlocks,
    onCancel,

    // ui
    status,
    message,

    // stats
    auctionsCount,
    lastCreated,
    lastExpired,
    lastCancelled,
    modeLabel,
    formatEndValue,
    formatExpiredAt,
  } = props;

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <div className="logo">🏷️</div>
          <div className="brand-text">
            <h1>EtherAuctions</h1>
            <p className="subtitle">AuctionFactory</p>
          </div>
        </div>
        <div className="wallet">
          <div className="pill">
            <span className={`dot ${contractCodePresent ? "ok" : "bad"}`} />
            Contract {contractCodePresent ? "Deployed" : "Not Found"}
          </div>
          <div className="pill">{networkName}</div>
          <div className="pill mono">
            {currentAccount
              ? `${currentAccount.slice(0, 6)}…${currentAccount.slice(-4)}`
              : "No wallet"}
          </div>
        </div>
      </header>

      <main className="container">
        <section className="card highlight">
          <h2 className="card-title">Factory Overview</h2>
          <div className="grid two">
            <div className="stat">
              <div className="label">Contract</div>
              <div className="value mono">{contractAddress}</div>
            </div>
            <div className="stat">
              <div className="label">Auctions (approx)</div>
              <div className="value">{auctionsCount}</div>
            </div>

            {lastCreated && (
              <div className="stat">
                <div className="label">Last Created</div>
                <div className="value mono">
                  {lastCreated.title} • {modeLabel(lastCreated.mode)} • end{" "}
                  {formatEndValue(lastCreated.mode, lastCreated.endValue)}
                </div>
              </div>
            )}

            {lastExpired && (
              <div className="stat">
                <div className="label">Last Expired</div>
                <div className="value mono">
                  {lastExpired.title} • {modeLabel(lastExpired.mode)} • at{" "}
                  {formatExpiredAt(
                    lastExpired.mode,
                    lastExpired.ts,
                    lastExpired.block
                  )}
                </div>
              </div>
            )}

            {lastCancelled && (
              <div className="stat">
                <div className="label">Last Cancelled</div>
                <div className="value mono">
                  {lastCancelled.title} • by {lastCancelled.seller}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid responsive">
          <div className="card">
            <h3 className="card-title">Create Auction (Time)</h3>
            <p className="muted">Expires after N seconds from now.</p>
            <form className="form" onSubmit={onCreateByTime}>
              <label className="field">
                <span>Title</span>
                <input
                  placeholder="My first auction"
                  value={title}
                  onChange={(e) => onSetTitle(e.target.value)}
                />
              </label>
              <label className="field">
                <span>TTL (seconds)</span>
                <input
                  inputMode="numeric"
                  placeholder="3600"
                  value={ttlSeconds}
                  onChange={(e) => onSetTtlSeconds(e.target.value)}
                />
              </label>
              <button
                className="btn primary"
                disabled={status === "loading" || !currentAccount}
              >
                {status === "loading" ? "Processing…" : "Create by Time"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="card-title">Create Auction (Blocks)</h3>
            <p className="muted">Expires after N blocks from now.</p>
            <form className="form" onSubmit={onCreateByBlocks}>
              <label className="field">
                <span>Title</span>
                <input
                  placeholder="My first auction"
                  value={title}
                  onChange={(e) => onSetTitle(e.target.value)}
                />
              </label>
              <label className="field">
                <span>TTL (blocks)</span>
                <input
                  inputMode="numeric"
                  placeholder="200"
                  value={ttlBlocks}
                  onChange={(e) => onSetTtlBlocks(e.target.value)}
                />
              </label>
              <button
                className="btn accent"
                disabled={status === "loading" || !currentAccount}
              >
                {status === "loading" ? "Processing…" : "Create by Blocks"}
              </button>
            </form>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Cancel Auction</h3>
          <form className="form" onSubmit={onCancel}>
            <label className="field">
              <span>Title</span>
              <input
                placeholder="Exact title"
                value={cancelTitle}
                onChange={(e) => onSetCancelTitle(e.target.value)}
              />
            </label>
            <button
              className="btn accent"
              disabled={status === "loading" || !currentAccount}
            >
              {status === "loading" ? "Processing…" : "Cancel"}
            </button>
          </form>
        </section>

        <section
          className={`toast ${
            status === "error" ? "error" : status === "success" ? "success" : ""
          } ${message ? "show" : ""}`}
          aria-live="polite"
        >
          {message}
        </section>
      </main>

      <footer className="footer">
        <span>Built by svärd • {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
