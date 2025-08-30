// logic/auctionActions.js

// Small helper to show good revert reasons
const reasonOf = (e) =>
  e?.reason ||
  e?.data?.message ||
  e?.error?.message ||
  e?.message ||
  "Transaction failed.";

export function makeEventCallbacks({ contract, getState, setState }) {
  return {
    onAuctionCreated: async (data) => {
      const { title, mode, endValue } = data.returnValues;

      // update count from chain if available; else fallback +1
      let next = getState().auctionsCount;
      try {
        const onChain = await contract.methods.auctionsCount().call();
        const n = Number(onChain);
        next = Number.isFinite(n) ? n : next + 1;
      } catch {
        next = next + 1;
      }

      setState({
        auctionsCount: next,
        lastCreated: { title, mode: Number(mode), endValue },
        status: "success",
        message: `Auction created: ${title}`,
      });
    },

    onAuctionExpired: (data) => {
      const { title, mode, expiredAtTs, expiredAtBlock } = data.returnValues;
      setState({
        lastExpired: {
          title,
          mode: Number(mode),
          ts: expiredAtTs,
          block: expiredAtBlock,
        },
        status: "success",
        message: `Auction expired: ${title}`,
      });
    },

    onAuctionCancelled: async (data) => {
      const { title, seller, at } = data.returnValues;

      // if your count is of "active" auctions, decrement as fallback
      let next = getState().auctionsCount;
      try {
        const onChain = await contract.methods.auctionsCount().call();
        const n = Number(onChain);
        next = Number.isFinite(n) ? n : Math.max(0, next - 1);
      } catch {
        next = Math.max(0, next - 1);
      }

      setState({
        auctionsCount: next,
        lastCancelled: { title, seller, at },
        status: "success",
        message: `Auction cancelled: ${title}`,
      });
    },
  };
}

export function makeWriteActions({ contract, getState, setState }) {
  return {
    onCreateByTime: async (e) => {
      e.preventDefault();
      const { currentAccount, title, ttlSeconds } = getState();
      if (!title || !ttlSeconds) {
        return setState({
          status: "error",
          message: "Provide title & TTL (seconds).",
        });
      }
      try {
        setState({
          status: "loading",
          message: "Creating (time)… Confirm in wallet.",
        });
        await contract.methods
          .createAuctionByTime(title, String(ttlSeconds))
          .estimateGas({ from: currentAccount });
        const tx = await contract.methods
          .createAuctionByTime(title, String(ttlSeconds))
          .send({ from: currentAccount });
        setState({
          status: "success",
          message: `Tx sent: ${tx.transactionHash.slice(
            0,
            10
          )}… Waiting for event…`,
          ttlSeconds: "",
        });
      } catch (e2) {
        setState({ status: "error", message: reasonOf(e2) });
      }
    },

    onCreateByBlocks: async (e) => {
      e.preventDefault();
      const { currentAccount, title, ttlBlocks } = getState();
      if (!title || !ttlBlocks) {
        return setState({
          status: "error",
          message: "Provide title & TTL (blocks).",
        });
      }
      try {
        setState({
          status: "loading",
          message: "Creating (blocks)… Confirm in wallet.",
        });
        await contract.methods
          .createAuctionByBlocks(title, String(ttlBlocks))
          .estimateGas({ from: currentAccount });
        const tx = await contract.methods
          .createAuctionByBlocks(title, String(ttlBlocks))
          .send({ from: currentAccount });
        setState({
          status: "success",
          message: `Tx sent: ${tx.transactionHash.slice(
            0,
            10
          )}… Waiting for event…`,
          ttlBlocks: "",
        });
      } catch (e2) {
        setState({ status: "error", message: reasonOf(e2) });
      }
    },

    onCancel: async (e) => {
      e.preventDefault();
      const { currentAccount, cancelTitle } = getState();
      if (!cancelTitle) {
        return setState({
          status: "error",
          message: "Provide exact title to cancel.",
        });
      }
      try {
        setState({
          status: "loading",
          message: "Cancelling… Confirm in wallet.",
        });
        await contract.methods
          .cancelAuction(cancelTitle)
          .estimateGas({ from: currentAccount });
        const tx = await contract.methods
          .cancelAuction(cancelTitle)
          .send({ from: currentAccount });
        setState({
          status: "success",
          message: `Tx sent: ${tx.transactionHash.slice(
            0,
            10
          )}… Waiting for event…`,
          cancelTitle: "",
        });
      } catch (e2) {
        setState({ status: "error", message: reasonOf(e2) });
      }
    },
  };
}
