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
