//import * as zksync from "zksync";
import { CoinGeckoClient, SimplePriceResponse } from "coingecko-api-v3";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { ethers } from "ethers";
import {
  ETH_USDC_POOL_ADDRESS,
  KYBER_ROUTER_ADDRESS,
} from "../constants/kyber-addresses";
import contractAbi from "../abi/DmmPool";
import {
  USDC_ADDRESS,
  WETH_ADDRESS,
} from "../constants/zksync-token-addresses";
dotenv.config();

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_TOKEN;
const groupID = process.env.TELEGRAM_CHAT_ID;

if (!token) {
  throw new Error("TELEGRAM_TOKEN is not defined");
}
if (!groupID) {
  throw new Error("TELEGRAM_CHAT_ID is not defined");
}

async function init() {
  //const syncProvider = await zksync.getDefaultProvider("goerli");
  const client = new CoinGeckoClient({
    timeout: 10000,
    autoRetry: true,
  });

  const zksyncProvider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.era.zksync.io"
  );

  const ethProvider = new ethers.providers.JsonRpcProvider(
    "https://eth.llamarpc.com	"
  );

  const signer = new ethers.Wallet(
    "df67a1b6eb8e55436ed4219a88ef7f098ff50c3cf84d038968d0b4a8d90cf243", //"f32d80298542bdb88a2f065b6f3ec3358b9bb9f94b6d89a47be600039ff4c99f",
    zksyncProvider
  );

  // create the contract instance
  const contract = new ethers.Contract(
    KYBER_ROUTER_ADDRESS,
    contractAbi,
    signer
  );

  // estimate gas price
  const gasPrice = await zksyncProvider.getGasPrice();

  // estimate gas limit
  // {
  //   inputs: [
  //     { internalType: "uint256", name: "amountIn", type: "uint256" },
  //     { internalType: "uint256", name: "amountOutMin", type: "uint256" },
  //     { internalType: "address[]", name: "poolsPath", type: "address[]" },
  //     { internalType: "contract IERC20[]", name: "path", type: "address[]" },
  //     { internalType: "address", name: "to", type: "address" },
  //     { internalType: "uint256", name: "deadline", type: "uint256" },
  //   ],
  //   name: "swapExactTokensForETH",
  //   outputs: [
  //     { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
  //   ],
  //   stateMutability: "nonpayable",
  //   type: "function",
  // },
  const currentEthBlock = await ethProvider.getBlock("latest");
  const timestamp = currentEthBlock.timestamp;
  const gasLimitEstimate = await contract.estimateGas.swapExactTokensForETH(
    0,
    0,
    ["0x40e76c271e501803ae7f6854ae06c68231c6ec91"],
    [
      "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
      "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91",
    ],
    "0x05bfb506cbd63bb468c903d53dfef1c72f47d974", //TODO: Needs to be the address of the user
    timestamp + 1000
  );
  // const gasLimitEstimate = await signer.estimateGas({
  //   to: KYBER_ROUTER_ADDRESS,
  //   data: contract.interface.encodeFunctionData("swapExactTokensForETH", [
  //     0,
  //     0,
  //     [ETH_USDC_POOL_ADDRESS],
  //     [USDC_ADDRESS, ETH_ADDRESS],
  //     "0x05bfb506cbd63bb468c903d53dfef1c72f47d974", //TODO: Needs to be the address of the user
  //     currentEthBlockNumber + 100,
  //   ]),
  // });

  // the total gas cost is gasPrice * gasLimit
  const totalGasCost = gasPrice.mul(gasLimitEstimate);

  console.log("gasLimitEstimate", gasLimitEstimate.toString());
  console.log("gasPrice", gasPrice.toString());
  console.log("totalGasCost", totalGasCost.toString());

  const bot = new TelegramBot(token as string, { polling: true });

  bot.onText(/\/echo (.+)/, (msg: any, match: any) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    if (chatId == groupID) {
      bot.sendMessage(chatId, resp);
    }
  });

  // Pull the value of USDC
  while (true) {
    try {
      const data: SimplePriceResponse = await client.simplePrice({
        ids: "usd-coin",
        vs_currencies: "usd",
      });

      console.log(data["usd-coin"].usd);

      // calculate the gas cost times 3 x

      // delay for 20 seconds
      await new Promise((resolve) => setTimeout(resolve, 20000));
    } catch (e) {
      console.log(e);
    }
  }
}

init();
