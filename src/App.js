// App.js
import "./App.css";
import React, { Component } from "react";
import web3 from "./web3";
import auctionFactory from "./auctionFactory";
import AuctionFactoryView from "./components/AuctionFactoryView";
import {
  attachAuctionEventListeners,
  detachEventSubscriptions,
} from "./services/auctionEvents";
import { makeEventCallbacks, makeWriteActions } from "./logic/auctionActions";

class App extends Component {
  state = {
    currentAccount: "",
    chainId: null,
    contractCodePresent: false,

    title: "",
    ttlSeconds: "",
    ttlBlocks: "",
    cancelTitle: "",

    status: "idle",
    message: "",

    auctionsCount: 0,
    lastCreated: null,
    lastExpired: null,
    lastCancelled: null,
  };

  accountsChangedHandler = (accounts) => {
    const currentAccount = accounts?.[0] || "";
    this.setState({ currentAccount });
  };
  chainChangedHandler = () => window.location.reload();

  _subs = [];
  eventListenersSet = false;

  // helpers to pass to factories (no direct this binding)
  getState = () => this.state;
  setStateSafe = (patch) => this.setState(patch);

  async componentDidMount() {
    document.title = "EtherAuctions · AuctionFactory";

    try {
      this.setState({ status: "loading", message: "Connecting to wallet…" });

      await window.ethereum?.request?.({ method: "eth_requestAccounts" });
      const [accounts, chainId, code] = await Promise.all([
        web3.eth.getAccounts(),
        web3.eth.getChainId(),
        web3.eth.getCode(auctionFactory.options.address),
      ]);
      if (!accounts?.length)
        throw new Error("No accounts. Please connect a wallet.");

      let auctionsCount = 0;
      try {
        const onChain = await auctionFactory.methods
          .auctionsCount()
          .call({ from: accounts[0] });
        const n = Number(onChain);
        auctionsCount = Number.isFinite(n) ? n : 0;
      } catch {
        auctionsCount = 0;
      }

      this.setState({
        currentAccount: accounts[0],
        chainId,
        contractCodePresent: code && code !== "0x",
        auctionsCount,
        status: "idle",
        message: "",
      });
    } catch (error) {
      console.error(error);
      this.setState({
        status: "error",
        message:
          error?.message || "Metamask is not installed or failed to connect.",
      });
    }

    // wallet listeners
    if (window.ethereum?.on) {
      window.ethereum.on("accountsChanged", this.accountsChangedHandler);
      window.ethereum.on("chainChanged", this.chainChangedHandler);
    }

    // contract events
    if (!this.eventListenersSet) {
      const callbacks = makeEventCallbacks({
        contract: auctionFactory,
        getState: this.getState,
        setState: this.setStateSafe,
      });
      this._subs = attachAuctionEventListeners(auctionFactory, {
        onCreated: callbacks.onAuctionCreated,
        onExpired: callbacks.onAuctionExpired,
        onCancelled: callbacks.onAuctionCancelled,
      });
      this.eventListenersSet = true;
    }

    // write actions
    this.actions = makeWriteActions({
      contract: auctionFactory,
      getState: this.getState,
      setState: this.setStateSafe,
    });
  }

  componentWillUnmount() {
    detachEventSubscriptions(this._subs);
    this._subs = [];
    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener(
        "accountsChanged",
        this.accountsChangedHandler
      );
      window.ethereum.removeListener("chainChanged", this.chainChangedHandler);
    }
  }

  // UI helpers
  networkName = () => {
    const { chainId } = this.state;
    if (chainId == 11155111) return "Sepolia";
    if (chainId == 1) return "Ethereum Mainnet";
    if (chainId == 137) return "Polygon";
    if (chainId == 10) return "OP Mainnet";
    if (!chainId) return "—";
    return `Chain ${chainId}`;
  };
  modeLabel = (m) =>
    Number(m) === 1 ? "Time" : Number(m) === 2 ? "Block" : "None";
  formatEndValue = (mode, endValue) => {
    const n = Number(mode);
    if (endValue == null) return "—";
    if (n === 1) {
      const ts = Number(endValue);
      return Number.isFinite(ts) && ts
        ? new Date(ts * 1000).toLocaleString()
        : "—";
    }
    if (n === 2) return `#${endValue}`;
    return "—";
  };
  formatExpiredAt = (mode, ts, block) => {
    const n = Number(mode);
    if (n === 1 && ts) return new Date(Number(ts) * 1000).toLocaleString();
    if (n === 2 && block) return `#${block}`;
    return "—";
  };

  render() {
    const s = this.state;
    const a = this.actions || {};

    return (
      <AuctionFactoryView
        contractAddress={auctionFactory.options.address}
        currentAccount={s.currentAccount}
        contractCodePresent={s.contractCodePresent}
        networkName={this.networkName()}
        title={s.title}
        ttlSeconds={s.ttlSeconds}
        ttlBlocks={s.ttlBlocks}
        cancelTitle={s.cancelTitle}
        onSetTitle={(v) => this.setState({ title: v })}
        onSetTtlSeconds={(v) => this.setState({ ttlSeconds: v, ttlBlocks: "" })}
        onSetTtlBlocks={(v) => this.setState({ ttlBlocks: v, ttlSeconds: "" })}
        onSetCancelTitle={(v) => this.setState({ cancelTitle: v })}
        onCreateByTime={a.onCreateByTime}
        onCreateByBlocks={a.onCreateByBlocks}
        onCancel={a.onCancel}
        status={s.status}
        message={s.message}
        auctionsCount={s.auctionsCount}
        lastCreated={s.lastCreated}
        lastExpired={s.lastExpired}
        lastCancelled={s.lastCancelled}
        modeLabel={this.modeLabel}
        formatEndValue={this.formatEndValue}
        formatExpiredAt={this.formatExpiredAt}
      />
    );
  }
}

export default App;
