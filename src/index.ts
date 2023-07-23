//import * as zksync from "zksync";
import { CoinGeckoClient, SimplePriceResponse } from "coingecko-api-v3";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { BigNumber, ethers } from "ethers";
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
    process.env.PRIVATE_KEY as string,
    zksyncProvider
  );

  // create the contract instance
  const contract = new ethers.Contract(
    KYBER_ROUTER_ADDRESS,
    contractAbi,
    signer
  );

  const bot = new TelegramBot(token as string, { polling: true });

  async function executeAction() {
    // estimate gas price
    const gasPrice = await zksyncProvider.getGasPrice();
    const currentEthBlock = await ethProvider.getBlock("latest");
    const timestamp = currentEthBlock.timestamp;
    const gasLimitEstimate = await contract.estimateGas.swapExactTokensForETH(
      100 * 10 ** 6, //6 decimals: 100 USDC
      1,
      [ETH_USDC_POOL_ADDRESS],
      [USDC_ADDRESS, WETH_ADDRESS],
      "0x05bfb506cbd63bb468c903d53dfef1c72f47d974", //TODO: Needs to be the address of the user
      timestamp + 1000
    );
    // the total gas cost is gasPrice * gasLimit
    const totalGasCost = gasPrice.mul(gasLimitEstimate);

    console.log("gasLimitEstimate", gasLimitEstimate.toString());
    console.log("gasPrice", gasPrice.toString());
    console.log("totalGasCost", totalGasCost.toString());

    const totalGasCostWithBuffer = totalGasCost.mul(3);

    // get amounts in
    const usdcAmountForEth = await contract.getAmountsIn(
      totalGasCostWithBuffer,
      [ETH_USDC_POOL_ADDRESS],
      [USDC_ADDRESS, WETH_ADDRESS]
    );
    console.log("usdcAmountForEth", usdcAmountForEth);

    const amountIn = 100 * 10 ** 6 - usdcAmountForEth[0]; // TODO: check if this is correct

    const ethAmountForUsdc = await contract.getAmountsOut(
      amountIn,
      [ETH_USDC_POOL_ADDRESS],
      [USDC_ADDRESS, WETH_ADDRESS]
    );
    const amountOut = BigNumber.from(ethAmountForUsdc).mul(70).div(100);

    // TODO: Uncomment eventually
    // const result = await contract.swapExactTokensForETH(
    //   amountIn,
    //   amountOut,
    //   [ETH_USDC_POOL_ADDRESS],
    //   [USDC_ADDRESS, WETH_ADDRESS],
    //   "0x05bfb506cbd63bb468c903d53dfef1c72f47d974", //TODO: Needs to be the address of the user
    //   timestamp + 1000
    // );
    // console.log(result);
    // bot.sendMessage(chatId, result);
  }

  bot.onText(/\/echo (.+)/, async (msg: any, match: any) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    if (chatId == groupID) {
      // test by sending /echo something
      await executeAction();
    }
  });

  // Pull the value of USDC
  while (true) {
    try {
      const data: SimplePriceResponse = await client.simplePrice({
        ids: "usd-coin",
        vs_currencies: "usd",
      });

      if (data["usd-coin"].usd <= 0.85) {
        bot.sendMessage(groupID as string, "USDC is below 0.85");
        await executeAction();
      }

      // delay for 20 seconds
      await new Promise((resolve) => setTimeout(resolve, 20000));
    } catch (e) {
      console.log(e);
    }
  }
}

init();
