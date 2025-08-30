import web3 from "./web3";
import artifact from "./ABI/AuctionFactory.json";

const { address, abi } = artifact;

const auctionFactory = new web3.eth.Contract(abi, address);

export async function assertLotteryReady() {
  const EXPECTED = 11155111; // Sepolia
  const chainId = await web3.eth.getChainId();
  if (chainId !== EXPECTED) {
    throw new Error(
      `Wrong network: expected Sepolia (11155111), got ${chainId}`
    );
  }
  const code = await web3.eth.getCode(address);
  if (!code || code === "0x") {
    throw new Error(`No contract code at ${address} on chain ${chainId}`);
  }
}

export default auctionFactory;
