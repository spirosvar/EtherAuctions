import "./App.css";
import React from "react";
import web3 from "./web3";
import lottery from "./lottery";

class App extends React.Component {
  // Instead of a constructor, we can use a class field to initialize state
  state = {
    manager: "0x0000000000000000000000000000000000000000",
    players: [],
    balance: "", // in wei
    value: "", // input value
    message: "",
  };

  async componentDidMount() {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const [chainId, code] = await Promise.all([
        web3.eth.getChainId(), // Sepolia = 11155111
        web3.eth.getCode(lottery.options.address), // must NOT be "0x"
      ]);

      console.log("chainId:", chainId, "code:", code);

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      console.log("Accounts:", accounts);
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please connect an account.");
      }

      console.log("Continuing using default account:", accounts[0]);

      // Fetch concurrently with Promise.all:
      const [manager, players, balance] = await Promise.all([
        lottery.methods.manager().call({ from: accounts[0] }),
        lottery.methods.getPlayers().call({ from: accounts[0] }),
        web3.eth.getBalance(lottery.options.address),
      ]);
      console.log("manager:", manager);
      console.log("players:", players);
      console.log("balance:", balance);

      // Update state once with all three values:
      this.setState({ manager, players, balance: balance || "0" });
    } catch (err) {
      console.error("Init failed:", err);
      this.setState({
        manager: "<ERROR>",
        players: [],
        balance: "0",
      });
    }
  }

  onSubmit = async (event) => {
    console.log("onSubmit: called...");
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    if (web3.utils.toWei(this.state.value, "ether") <= 1) {
      alert("Please enter an amount greater than 1 wei.");
      return;
    }

    this.setState({ message: "Waiting on transaction successs..." });

    try {
      await lottery.methods.enter().send({
        from: accounts[0], // default account
        value: web3.utils.toWei(this.state.value, "ether"),
      });
      this.setState({ message: "You have been entered!" });
    } catch (err) {
      console.error("Transaction failed:", err);
      this.setState({
        message: "Transaction failed. See console for details.",
      });
    }
  };

  onClick = async () => {
    console.log("onClick: called...");
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts:", accounts);

    this.setState({ message: "Waiting on transaction successs..." });

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });
    this.setState({ message: "A winner has been picked!" });
  };

  render() {
    console.log(web3.version);

    return (
      <div className="App">
        <h2>Lottery Contract</h2>
        <p>
          This Contract is managed by {this.state.manager}
          There are currently {this.state.players.length} people entered,
          competing to win {web3.utils.fromWei(this.state.balance, "ether")}{" "}
          ether!
        </p>

        <hr />
        <form onSubmit={this.onSubmit}>
          <h4>Want to try your luck?</h4>
          <div>
            <label>Amount of ether to enter</label>
            <input
              value={this.state.value}
              onChange={(event) => this.setState({ value: event.target.value })}
            ></input>
          </div>

          <button>Enter</button>
        </form>

        <hr />

        <h4>Ready to pick a winner?</h4>
        <button onClick={this.onClick}>Pick a winner!</button>
        <hr />
        <h1>{this.state.message}</h1>
      </div>
    );
  }
}
export default App;
