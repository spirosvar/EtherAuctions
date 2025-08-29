// import "./App.css";
// import React from "react";
// import web3 from "./web3";
// import lottery from "./lottery";

// class App extends React.Component {
//   // Instead of a constructor, we can use a class field to initialize state
//   state = {
//     manager: "0x0000000000000000000000000000000000000000",
//     players: [],
//     balance: "", // in wei
//     value: "", // input value
//     message: "",
//   };

//   async componentDidMount() {
//     document.title = "EtherAuctions";
//     try {
//       await window.ethereum.request({ method: "eth_requestAccounts" });

//       const [chainId, code] = await Promise.all([
//         web3.eth.getChainId(), // Sepolia = 11155111
//         web3.eth.getCode(lottery.options.address), // must NOT be "0x"
//       ]);

//       console.log("chainId:", chainId, "code:", code);

//       await window.ethereum.request({ method: "eth_requestAccounts" });
//       const accounts = await web3.eth.getAccounts();
//       console.log("Accounts:", accounts);
//       if (accounts.length === 0) {
//         throw new Error("No accounts found. Please connect an account.");
//       }

//       console.log("Continuing using default account:", accounts[0]);

//       // Fetch concurrently with Promise.all:
//       const [manager, players, balance] = await Promise.all([
//         lottery.methods.manager().call({ from: accounts[0] }),
//         lottery.methods.getPlayers().call({ from: accounts[0] }),
//         web3.eth.getBalance(lottery.options.address),
//       ]);
//       console.log("manager:", manager);
//       console.log("players:", players);
//       console.log("balance:", balance);

//       // Update state once with all three values:
//       this.setState({ manager, players, balance: balance || "0" });
//     } catch (err) {
//       console.error("Init failed:", err);
//       this.setState({
//         manager: "<ERROR>",
//         players: [],
//         balance: "0",
//       });
//     }
//   }

//   onSubmit = async (event) => {
//     console.log("onSubmit: called...");
//     event.preventDefault();

//     const accounts = await web3.eth.getAccounts();

//     if (web3.utils.toWei(this.state.value, "ether") <= 1) {
//       alert("Please enter an amount greater than 1 wei.");
//       return;
//     }

//     this.setState({ message: "Waiting on transaction successs..." });

//     try {
//       await lottery.methods.enter().send({
//         from: accounts[0], // default account
//         value: web3.utils.toWei(this.state.value, "ether"),
//       });
//       this.setState({ message: "You have been entered!" });
//     } catch (err) {
//       console.error("Transaction failed:", err);
//       this.setState({
//         message: "Transaction failed. See console for details.",
//       });
//     }
//   };

//   onClick = async () => {
//     console.log("onClick: called...");
//     const accounts = await web3.eth.getAccounts();
//     console.log("Accounts:", accounts);

//     this.setState({ message: "Waiting on transaction successs..." });

//     await lottery.methods.pickWinner().send({
//       from: accounts[0],
//     });
//     this.setState({ message: "A winner has been picked!" });
//   };

//   render() {
//     console.log(web3.version);

//     return (
//       <div className="App">
//         <h2>Lottery Contract</h2>
//         <p>
//           This Contract is managed by {this.state.manager}
//           There are currently {this.state.players.length} people entered,
//           competing to win {web3.utils.fromWei(this.state.balance, "ether")}{" "}
//           ether!
//         </p>

//         <hr />
//         <form onSubmit={this.onSubmit}>
//           <h4>Want to try your luck?</h4>
//           <div>
//             <label>Amount of ether to enter</label>
//             <input
//               value={this.state.value}
//               onChange={(event) => this.setState({ value: event.target.value })}
//             ></input>
//           </div>

//           <button>Enter</button>
//         </form>

//         <hr />

//         <h4>Ready to pick a winner?</h4>
//         <button onClick={this.onClick}>Pick a winner!</button>
//         <hr />
//         <h1>{this.state.message}</h1>
//       </div>
//     );
//   }
// }
// export default App;
import "./App.css";
import React from "react";
import web3 from "./web3";
import lottery from "./lottery";

class App extends React.Component {
  state = {
    manager: "0x0000000000000000000000000000000000000000",
    players: [],
    balance: "0",
    value: "",
    message: "",
    status: "idle", // idle | loading | success | error
    account: "",
    chainId: null,
    contractCodePresent: false,
  };

  async componentDidMount() {
    document.title = "EtherAuctions · Lottery";
    await this.init();
    if (window.ethereum) {
      // Re-init when account changes
      window.ethereum.on?.("accountsChanged", this.init);
      window.ethereum.on?.("chainChanged", () => window.location.reload());
    }
  }

  componentWillUnmount() {
    if (window.ethereum) {
      window.ethereum.removeListener?.("accountsChanged", this.init);
      window.ethereum.removeListener?.("chainChanged", () => {});
    }
  }

  init = async () => {
    try {
      this.setState({ status: "loading", message: "Connecting to wallet…" });
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const [chainId, code] = await Promise.all([
        web3.eth.getChainId(),
        web3.eth.getCode(lottery.options.address),
      ]);

      const accounts = await web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts. Please connect a wallet.");
      }

      const [manager, players, balance] = await Promise.all([
        lottery.methods.manager().call({ from: accounts[0] }),
        lottery.methods.getPlayers().call({ from: accounts[0] }),
        web3.eth.getBalance(lottery.options.address),
      ]);

      this.setState({
        manager,
        players,
        balance: balance || "0",
        account: accounts[0],
        chainId,
        contractCodePresent: code && code !== "0x",
        status: "idle",
        message: "",
      });
    } catch (err) {
      console.error(err);
      this.setState({
        status: "error",
        message: err?.message || "Failed to initialize.",
        players: [],
        balance: "0",
      });
    }
  };

  networkName = () => {
    const { chainId } = this.state;
    if (chainId === 11155111) return "Sepolia";
    if (chainId === 1) return "Ethereum Mainnet";
    if (chainId === 137) return "Polygon";
    if (chainId === 10) return "OP Mainnet";
    if (!chainId) return "—";
    return `Chain ${chainId}`;
  };

  balanceEth = () => {
    try {
      return web3.utils.fromWei(this.state.balance || "0", "ether");
    } catch {
      return "0";
    }
  };

  onSubmit = async (e) => {
    e.preventDefault();
    const { value, account } = this.state;

    if (!value) {
      return this.setState({
        status: "error",
        message: "Enter an amount in ether.",
      });
    }

    let wei;
    try {
      wei = web3.utils.toWei(value, "ether");
    } catch {
      return this.setState({ status: "error", message: "Invalid amount." });
    }

    if (wei === "0") {
      return this.setState({
        status: "error",
        message: "Please enter an amount greater than 0.",
      });
    }

    try {
      this.setState({
        status: "loading",
        message: "Sending transaction… Confirm in your wallet.",
      });
      await lottery.methods.enter().send({ from: account, value: wei });

      this.setState({
        status: "success",
        message: "You have been entered! Refreshing…",
      });

      const [players, balance] = await Promise.all([
        lottery.methods.getPlayers().call({ from: account }),
        web3.eth.getBalance(lottery.options.address),
      ]);

      this.setState({
        players,
        balance: balance || "0",
        value: "",
        status: "idle",
        message: "",
      });
    } catch (err) {
      console.error(err);
      this.setState({
        status: "error",
        message: err?.message || "Transaction failed.",
      });
    }
  };

  onPickWinner = async () => {
    const { account } = this.state;
    try {
      this.setState({
        status: "loading",
        message: "Picking a winner… Confirm in your wallet.",
      });
      await lottery.methods.pickWinner().send({ from: account });

      this.setState({
        status: "success",
        message: "Winner picked! Refreshing…",
      });

      const [players, balance] = await Promise.all([
        lottery.methods.getPlayers().call({ from: account }),
        web3.eth.getBalance(lottery.options.address),
      ]);

      this.setState({
        players,
        balance: balance || "0",
        status: "idle",
        message: "",
      });
    } catch (err) {
      console.error(err);
      this.setState({
        status: "error",
        message: err?.message || "Failed to pick a winner.",
      });
    }
  };

  render() {
    const {
      manager,
      players,
      value,
      message,
      status,
      account,
      contractCodePresent,
    } = this.state;

    return (
      <div className="page">
        <header className="header">
          <div className="brand">
            <div className="logo">🎲</div>
            <div className="brand-text">
              <h1>EtherAuctions</h1>
              <p className="subtitle">Provably Fair Lottery</p>
            </div>
          </div>
          <div className="wallet">
            <div className="pill">
              <span className={`dot ${contractCodePresent ? "ok" : "bad"}`} />
              Contract {contractCodePresent ? "Deployed" : "Not Found"}
            </div>
            <div className="pill">{this.networkName()}</div>
            <div className="pill mono">
              {account
                ? `${account.slice(0, 6)}…${account.slice(-4)}`
                : "No wallet"}
            </div>
          </div>
        </header>

        <main className="container">
          <section className="card highlight">
            <h2 className="card-title">Lottery Overview</h2>
            <div className="grid two">
              <div className="stat">
                <div className="label">Manager</div>
                <div className="value mono">{manager}</div>
              </div>
              <div className="stat">
                <div className="label">Players Entered</div>
                <div className="value">{players.length}</div>
              </div>
              <div className="stat">
                <div className="label">Prize Pool</div>
                <div className="value">{this.balanceEth()} ETH</div>
              </div>
              <div className="stat">
                <div className="label">Contract</div>
                <div className="value mono">{lottery.options.address}</div>
              </div>
            </div>
          </section>

          <section className="grid responsive">
            <div className="card">
              <h3 className="card-title">Enter the Lottery</h3>
              <p className="muted">
                Send any positive amount of Ether to join the current round.
              </p>
              <form onSubmit={this.onSubmit} className="form">
                <label className="field">
                  <span>Amount (ETH)</span>
                  <input
                    inputMode="decimal"
                    placeholder="0.01"
                    value={value}
                    onChange={(e) => this.setState({ value: e.target.value })}
                  />
                </label>
                <button
                  className="btn primary"
                  type="submit"
                  disabled={status === "loading" || !account}
                >
                  {status === "loading" ? "Processing…" : "Enter Lottery"}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">Admin</h3>
              <p className="muted">Only the manager can pick a winner.</p>
              <button
                className="btn accent"
                onClick={this.onPickWinner}
                disabled={status === "loading" || !account}
              >
                {status === "loading" ? "Processing…" : "Pick a Winner"}
              </button>
            </div>
          </section>

          {!!players.length && (
            <section className="card">
              <h3 className="card-title">Current Players</h3>
              <div className="players">
                {players.map((p, i) => (
                  <div className="player mono" key={p + i}>
                    {i + 1}. {p}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section
            className={`toast ${
              status === "error"
                ? "error"
                : status === "success"
                ? "success"
                : ""
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
}

export default App;
