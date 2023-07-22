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

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

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

// // Listen for any kind of message. There are different kinds of
// // messages.
// bot.on("message", (msg: any) => {
//   const chatId = msg.chat.id;

//   // if message is from the specific group then respond, else do nothing
//   if (chatId == groupID) {
//     // send a message to the chat acknowledging receipt of their message
//     bot.sendMessage(chatId, "Received your message");
//   }
// });
