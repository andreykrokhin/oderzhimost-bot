const { Telegraf, Markup } = require('telegraf')

const usersModel = require('./models/users-model')
const { FUNNEL_MSG, BOT_MSG, SERVICE_MSG, NEW_DAY_MSG_IDS, WAIT_ANSWER_MSG_IDS } = require('./locale')
const { CronJob } = require('cron')

const bot = new Telegraf(process.env.TG_BOT_TOKEN)

const getUser = (ctx) => ctx?.update.message?.from || ctx?.update.callback_query?.from || {}

const funnelReply = async (ctx, userId, msgId, isMailing = false) => {
  const funnelMsgGroup = FUNNEL_MSG[msgId]

  console.log(3, msgId)

  if (!funnelMsgGroup?.length) return msgId

  // Если следующее сообщение - сообщение начала дня - не отправляем его, т.к. оно отправится через CronJob
  if (!isMailing && NEW_DAY_MSG_IDS.includes(msgId)) return msgId

  console.log(4, userId)

  /*
    !!! Внимание !!!
    ctx не передается при вызове из CronJob. Номера сообщений в таком случае не должны совпадать с номерами из switch ниже
    потому что пересылка картинок, аудиофайлов и т.д. без ctx пока не поддерживается
  */
  const sendMessage = (msg) => ctx?.reply(...msg) || bot.telegram.sendMessage(userId, ...msg)

  funnelMsgGroup.forEach((msg, index) => {
    setTimeout(async () => {
      switch (msgId) {
        case 1:
          await ctx.replyWithAnimation('CgACAgIAAxkBAAOmZcqgiJaaVvN5HsTVWzavF-K1dNUAAho9AALVY1lKRCLmnGeAo_U0BA')
          ctx.reply(...msg)
          break;
          
        case 8:
          await ctx.replyWithVoice('CQACAgIAAxkBAAPMZcql3-feZ94R1cC9NTHsTjdCpd0AAphLAAJ_llFKs9_Foy5GWiQ0BA')
          ctx.reply(...msg)
          break;
          
        case 10:
          await ctx.replyWithVoice('CQACAgIAAxkBAAIBC2XTurjCKJY4mRbvbsHm0tXElp4yAAKPPwACQRahShPRowGokLyRNAQ')
          ctx.reply(...msg)
          break;

        case 11:
          // await ctx.replyWithAnimation('CgACAgIAAxkBAAIBEGXTu4RvKK9jL8icAeSmaYQyyoCQAAKcPwACQRahSuNoP7eVxekiNAQ')  // квадратная маленькая анимация
          await ctx.replyWithPhoto('AgACAgIAAxkBAAIBdWXT1XL2yydrO320XE_81IDDsNeEAAIU1jEbQRahSvZ9s4tqRsEgAQADAgADeQADNAQ')
          ctx.reply(...msg)
          break;
          
        case 15:
          await ctx.replyWithVoice('AwACAgIAAxkBAAIBImXTvZ0H3QQxtPDt-5lSwG1jgumXAAIvQgAClmJQSivzax2NFv0KNAQ')
          ctx.reply(...msg)
          break;

        // case 5:
        //   ctx.editMessageText(...msg)
          
        //   setTimeout(() => {
        //     ctx.reply(BOT_MSG.price_sale_reminder)
  
        //     setTimeout(() => {
        //       ctx.editMessageText(BOT_MSG.price_sale_end, {
        //         parse_mode: 'markdown',
        //         ...Markup.inlineKeyboard([
        //           Markup.button.callback('Оплатить Нижний уровень - 10 990 руб', 'next_msg'),
        //           Markup.button.callback('Оплатить Все 4 уровеня - 24 990 руб', 'next_msg')
        //         ], { columns: 1 })
        //       })
        //     }, 1 * 10 * 1000) // Повысить цену через 1 час
        //   }, 2 * 10 * 1000) // Сообщение через 2 часа
        //   break;
      
        default:
          // ctx.reply(...msg, { parse_mode: 'markdown' })
          sendMessage(msg, { parse_mode: 'markdown' })
          break;
      }
      
      // ТАЙИЕР НА ЦЕНЫ (если в этот момент нажать /start - какая-то ошибка)
      // if (msgId === 5) {
      // }
    }, index * 2000)
  })

  const newFunnelMsgId = msgId + 1
  const user = getUser(ctx)
  await usersModel.updateOne({ tgId: userId || user.id }, { latestFunnelMsg: newFunnelMsgId, latestFunnelDate: new Date() })

  return newFunnelMsgId
}

const onMsgReceive = async (ctx, userId, isMsgAnswer = false, isMailing = false) => {
  // console.log(ctx)
  console.log(ctx?.update.message)

  const user = getUser(ctx)

  const userdb = await usersModel.findOne({ tgId: userId || user.id })
  const { _id: isUserExists, latestFunnelMsg = 0 } = userdb || {}
        
  if (!isUserExists && user) {
    const referalTgId = ctx.startPayload

    await usersModel.create({
      tgId: user.id,
      name: user.first_name || user.username,
      referalTgId,
      signUpDate: new Date(),
      // totems: 0,
      // keys: 0,
      latestFunnelMessage: 0,
      latestFunnelDate: new Date(),
      // startDayTime: '10:00',
      startDayHour: 10,
    })

    bot.telegram.sendMessage(process.env.ADMIN_CHAT, `Новый пользователь - @${user.username} (${user.first_name})`)
  }
  
  // Если пользователь прислал сообщение, а не нажал на кнопку и на сообщение не ожидается ответ пользователя - не продолжаем воронку
  if (isMsgAnswer && !WAIT_ANSWER_MSG_IDS.includes(latestFunnelMsg)) return latestFunnelMsg

  funnelReply(ctx, userId, latestFunnelMsg, isMailing)
}

bot.start(async (ctx) => onMsgReceive(ctx))

bot.action('next_msg', async (ctx) => onMsgReceive(ctx))

bot.on('message', async (ctx) => {
  // console.log(ctx.update)
  // console.log(ctx.update.message.chat)
  // console.log(ctx.update.message.reply_to_message)

  const fromChatId = ctx.update.message.chat.id

  if (fromChatId.toString() === process.env.ADMIN_CHAT) {
    const msg = ctx.update.message.text
    const replyMsgId = ctx.update.message.reply_to_message.forward_from?.id

    // console.log(fromChatId, replyMsgId, msg)

    if (replyMsgId) {
      bot.telegram.sendMessage(replyMsgId, msg)
    } else {
      ctx.reply(SERVICE_MSG.reply_not_allow(ctx.update.message.reply_to_message.forward_sender_name), { parse_mode: 'markdown' })
    }
  } else {
    ctx.forwardMessage(process.env.ADMIN_CHAT)
    ctx.reply(BOT_MSG.reply, { parse_mode: 'markdown' })

    onMsgReceive(ctx, null, true)
    // ctx.copyMessage(process.env.ADMIN_CHAT)
  }
});

const job = CronJob.from({
	cronTime: '0 */1 * * *',  // каждый час
	// cronTime: '*/1 * * * *',  // каждый час
	onTick: async function () {
    // достаем всех пользователей, у которых следующее сообщение из воронки - 9
    const usersdb = await usersModel.find({ latestFunnelMsg: { $in: [9] } })
    console.log(usersdb?.length)

    if (!usersdb?.length) return

    usersdb.forEach(user => {
      const latestFunnelDate = new Date(user.latestFunnelDate)  // дата последнего отправленного ботом сообщения из воронки
      const currentDate = new Date()   // текущая дата
      const currentHour = currentDate.getHours()  // текущий час

      console.log(1, currentDate.getDate(), latestFunnelDate.getDate())

      // если число месяца последнего сообщения совпадает с текущим - пропускаем пользователя
      if (currentDate.getDate() === latestFunnelDate.getDate()) return

      console.log(2, currentHour, user.startDayHour)

      // если текущий час меньше, чем час, с которого можно отправлять сообщения - пропускаем пользователя
      if (currentHour < user.startDayHour) return

      onMsgReceive(null, user.tgId, false, true)
    })
	},
	start: true,
	utcOffset: -180,
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { TgBot: bot }
