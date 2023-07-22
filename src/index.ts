import * as zksync from "zksync";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
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
  const syncProvider = await zksync.getDefaultProvider("goerli");

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token as string, { polling: true });

  // Matches "/echo [whatever]"
  bot.onText(/\/echo (.+)/, (msg: any, match: any) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    if (chatId == groupID) {
      //console.log(msg);

      // send back the matched "whatever" to the chat
      bot.sendMessage(chatId, resp);
    }
  });
}

init();
