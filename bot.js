const { Telegraf, Markup } = require('telegraf')

const usersModel = require('./models/users-model')
const { FUNNEL_MSG, BOT_MSG, SERVICE_MSG, NEW_DAY_MSG_IDS, WAIT_ANSWER_MSG_IDS, PAID_MSG, MEDIA_MSG } = require('./locale')
const { CronJob } = require('cron')

const bot = new Telegraf(process.env.TG_BOT_TOKEN)

const SERVICE_COMMANDS = ['/stat']
const ADMIN_IDS = process.env.ADMIN_IDS.split(',')
const IS_PROD = Boolean(process.env.IS_PROD)

const getUser = (ctx) => ctx?.update.message?.from || ctx?.update.callback_query?.from || {}

const funnelReply = async (ctx, userId, msgId, isMailing = false, actionNumber, paidModule) => {
  const paidMsgAvailable = PAID_MSG.slice(0, paidModule)?.flat()
  const funnelMsgAll = [...FUNNEL_MSG, ...paidMsgAvailable]

  const funnelMsgGroup = funnelMsgAll[msgId]

  // console.log(3, msgId)
  
  // ** Если произошла ошибка при попытке отправить сообщение - помечаем флагом и не продвигаем по воронке
  let isCatchedError = false

  /*
    !!! Внимание !!!
    ctx не передается при вызове из CronJob. Номера сообщений в таком случае не должны совпадать с номерами из switch ниже
    потому что пересылка картинок, аудиофайлов и т.д. без ctx пока не поддерживается
  */
  const sendMessage = (msg) =>
    ctx?.reply(...msg, { parse_mode: 'markdown' }) || bot.telegram.sendMessage(userId, ...msg, { parse_mode: 'markdown' })

  if (!funnelMsgGroup?.length) return msgId

  // Если следующее сообщение - сообщение начала дня - не отправляем его, т.к. оно отправится через CronJob
  if (!isMailing && NEW_DAY_MSG_IDS.includes(msgId)) return msgId

  // Если сработал CronJob, но пользователь не дошел до конца дня
  // if (isMailing && !NEW_DAY_MSG_IDS.includes(msgId)) {
  //   sendMessage(BOT_MSG.funnel_reminder, { parse_mode: 'markdown' })
  // }

  // console.log(4, userId)

  console.log('msgId', msgId)

  const msgPromises = funnelMsgGroup.map((msg, index) =>
    new Promise(res =>
      setTimeout(async () => {
        try {
          const mediaMsg = MEDIA_MSG[msgId]

          if (mediaMsg) await mediaMsg(ctx, actionNumber, IS_PROD)

          await sendMessage(msg)

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
        } catch (e) {
          isCatchedError = true

          if (e?.response?.description?.indexOf('VOICE_MESSAGES_FORBIDDEN') !== -1) {
            // ** Передаем массив, потому что потом его деструктуризруем (иначе строка превратится в массив и отправится первый символ строки)
            sendMessage([BOT_MSG.voice_not_allow])
          }

          bot.telegram.sendMessage(ADMIN_IDS[0], `Ошибка при отправке сообщения #${msgId}:\n\n${JSON.stringify(e, null, 2)}`)
        }

        res()
        // ТАЙИЕР НА ЦЕНЫ (если в этот момент нажать /start - какая-то ошибка)
        // if (msgId === 5) {
        // }
      }, index * 2000)
    )
  )

  // ** https://habr.com/ru/articles/435084/
  await Promise.all(msgPromises)

  if (isCatchedError) return

  const newFunnelMsgId = msgId + 1
  const user = getUser(ctx)
  await usersModel.updateOne({ tgId: userId || user.id }, { latestFunnelMsg: newFunnelMsgId, latestFunnelDate: new Date() })

  return newFunnelMsgId
}

const onMsgReceive = async (ctx, userId, isMsgAnswer = false, isMailing = false, actionNumber) => {
  // console.log(ctx)

  if (ctx?.update.message) console.log('ctx?.update.message', ctx?.update.message)

  const user = getUser(ctx)

  const userdb = await usersModel.findOne({ tgId: userId || user.id })
  const { _id: isUserExists, latestFunnelMsg = 0, paidModule = 0 } = userdb || {}
        
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

    const username = user.username ? `@${user.username} (${user.first_name})` : user.first_name

    bot.telegram.sendMessage(process.env.ADMIN_CHAT, `Новый пользователь - ${username}`)
  }

  // Если пользователь прислал сообщение, а не нажал на кнопку и на сообщение не ожидается ответ пользователя - не продолжаем воронку
  if (isMsgAnswer && !WAIT_ANSWER_MSG_IDS.includes(latestFunnelMsg)) return latestFunnelMsg

  funnelReply(ctx, userId, latestFunnelMsg, isMailing, actionNumber, paidModule)
}

bot.start(async (ctx) => onMsgReceive(ctx))

bot.action('next_msg_1', async (ctx) => onMsgReceive(ctx, undefined, undefined, undefined, 1))
bot.action('next_msg_2', async (ctx) => onMsgReceive(ctx, undefined, undefined, undefined, 2))
bot.action('next_msg_3', async (ctx) => onMsgReceive(ctx, undefined, undefined, undefined, 3))
bot.action('next_msg', async (ctx) => onMsgReceive(ctx))

bot.command('stat', async (ctx) => {
  const user = getUser(ctx)

  if (!ADMIN_IDS.includes(user.id?.toString())) return

  const usersdb = await usersModel.find()
  const filteredUsers = usersdb?.filter(userdb => !ADMIN_IDS.includes(userdb.tgId?.toString()))
  const usersByDay = NEW_DAY_MSG_IDS.map(value => filteredUsers?.filter(user => user.latestFunnelMsg >= value))
  
  let msgStat = `Пользователей всего — ${filteredUsers?.length || 0}\n`

  usersByDay.forEach((users, i) => {
    const prevUsers = i === 0 ? filteredUsers?.length : usersByDay[i - 1]?.length
    const currentUsers = users?.length || 0
    const percent = (((currentUsers * 100) / prevUsers) || 0).toFixed(0)

    msgStat += `День ${i} — ${currentUsers} чел. (${percent}%)\n`
  })

  ctx.reply(msgStat, { parse_mode: 'markdown' })
})

bot.command('statm', async (ctx) => {
  const user = getUser(ctx)

  if (!ADMIN_IDS.includes(user.id?.toString())) return

  const usersdb = await usersModel.find()
  const filteredUsers = usersdb?.filter(userdb => !ADMIN_IDS.includes(userdb.tgId?.toString()))
  const usersByMsg = FUNNEL_MSG.map((_v, key) => filteredUsers?.filter(user => user.latestFunnelMsg === key))
  
  let msgStat = ``

  usersByMsg.forEach((users, i) => {
    const currentUsers = users?.length || 0
    const percent = (((currentUsers * 100) / filteredUsers?.length) || 0).toFixed(0)

    msgStat += `#${i} — ${currentUsers} чел. (${percent}%)\n`
  })

  ctx.reply(msgStat, { parse_mode: 'markdown' })
})

bot.on('message', async (ctx) => {
  // console.log(ctx.update)
  // console.log(ctx.update.message.chat)
  // console.log(ctx.update.message.reply_to_message)

  if (SERVICE_COMMANDS.includes(ctx.update.message.text)) return

  const fromChatId = ctx.update.message.chat.id

  if (fromChatId.toString() === process.env.ADMIN_CHAT) {
    const msg = ctx.update.message.text
    const replyMsgId = ctx.update.message.reply_to_message.forward_from?.id

    // console.log(fromChatId, replyMsgId, msg)

    if (replyMsgId) {
      try {
        bot.telegram.sendMessage(replyMsgId, msg)
      } catch (e) {
        bot.telegram.sendMessage(ADMIN_IDS[0],
`Ошибка при отправке ответа пользователю:

${JSON.stringify(e, null, 2)}`)
      }
    } else {
      ctx.reply(SERVICE_MSG.reply_not_allow(ctx.update.message.reply_to_message.forward_sender_name), { parse_mode: 'markdown' })
    }
  } else {
    const user = getUser(ctx)

    if (IS_PROD && ADMIN_IDS[0] !== user.id?.toString()) ctx.forwardMessage(process.env.ADMIN_CHAT)

    if (ADMIN_IDS[0] === user.id?.toString()) ctx.reply(JSON.stringify(ctx?.update.message, null, 2))

    ctx.reply(BOT_MSG.reply, { parse_mode: 'markdown' })

    onMsgReceive(ctx, null, true)
    // ctx.copyMessage(process.env.ADMIN_CHAT)
  }
});

const job = CronJob.from({
	cronTime: IS_PROD ? '0 */1 * * *' : '*/1 * * * *',  // каждый час
	// cronTime: '*/1 * * * *',  // каждую минуту
	onTick: async function () {
    // достаем всех пользователей, у которых следующее сообщение из воронки - 9
    const usersdb = await usersModel.find({ latestFunnelMsg: { $in: NEW_DAY_MSG_IDS } })
    console.log('users for next day:', usersdb?.length)

    if (!usersdb?.length) return

    usersdb.forEach(user => {
      const latestFunnelDate = new Date(user.latestFunnelDate)  // дата последнего отправленного ботом сообщения из воронки
      const latestFunnelHour = latestFunnelDate.getHours()
      const currentDate = new Date()   // текущая дата
      const currentHour = currentDate.getHours()  // текущий час

      console.log('check 1', currentDate.getDate(), latestFunnelDate.getDate(), latestFunnelHour)

      // если число месяца последнего сообщения совпадает с текущим - пропускаем пользователя
      if (currentDate.getDate() === latestFunnelDate.getDate() && latestFunnelHour > 5) return

      console.log('check 2', currentHour, user.startDayHour)

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
