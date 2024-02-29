const { Telegraf, Markup } = require('telegraf')

const usersModel = require('./models/users-model')
const { FUNNEL_MSG, BOT_MSG, SERVICE_MSG, NEW_DAY_MSG_IDS, WAIT_ANSWER_MSG_IDS, PAID_MSG } = require('./locale')
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
  const sendMessage = (msg) => ctx?.reply(...msg) || bot.telegram.sendMessage(userId, ...msg)

  if (!funnelMsgGroup?.length) return msgId

  // Если следующее сообщение - сообщение начала дня - не отправляем его, т.к. оно отправится через CronJob
  if (!isMailing && NEW_DAY_MSG_IDS.includes(msgId)) return msgId

  // Если сработал CronJob, но пользователь не дошел до конца дня
  // if (isMailing && !NEW_DAY_MSG_IDS.includes(msgId)) {
  //   sendMessage(BOT_MSG.funnel_reminder, { parse_mode: 'markdown' })
  // }

  // console.log(4, userId)

  console.log('msgId', msgId);

  funnelMsgGroup.forEach((msg, index) => {
    setTimeout(async () => {
      try {
        switch (msgId) {
          case 1:
            await ctx.replyWithAnimation('CgACAgIAAxkBAAOmZcqgiJaaVvN5HsTVWzavF-K1dNUAAho9AALVY1lKRCLmnGeAo_U0BA')
            await ctx.reply(...msg)
            break;
            
          case 8:
            await ctx.replyWithVoice('CQACAgIAAxkBAAPMZcql3-feZ94R1cC9NTHsTjdCpd0AAphLAAJ_llFKs9_Foy5GWiQ0BA')
            await ctx.reply(...msg)
            break;
            
          case 10:
            await ctx.replyWithVoice('CQACAgIAAxkBAAIBC2XTurjCKJY4mRbvbsHm0tXElp4yAAKPPwACQRahShPRowGokLyRNAQ')
            await ctx.reply(...msg)
            break;
  
          case 11:
            await ctx.replyWithPhoto('AgACAgIAAxkBAAIBdWXT1XL2yydrO320XE_81IDDsNeEAAIU1jEbQRahSvZ9s4tqRsEgAQADAgADeQADNAQ')
            await ctx.reply(...msg)
            break;
            
          case 15:
            await ctx.replyWithVoice('AwACAgIAAxkBAAIBImXTvZ0H3QQxtPDt-5lSwG1jgumXAAIvQgAClmJQSivzax2NFv0KNAQ')
            await ctx.reply(...msg)
            break;
  
          case 22:
            await ctx.replyWithVoice('AwACAgIAAxkBAAITMWXYsqxLGZAmSCGNAW5fNTTx4e-IAALDPwACS5a5SqNc8ixJ0zcpNAQ')
            await ctx.reply(...msg)
            break;
  
          case 23:
            await ctx.replyWithPhoto('AgACAgIAAxkBAAITNGXYsv2ObCa2D1fPAhhXezLZpRL9AALq3jEb1miwSu-O8l7tBMNqAQADAgADeQADNAQ')
            await ctx.reply(...msg)
            break;
  
          case 24:
            // отправляем фото в зависимости от варианта ответа
            switch (actionNumber) {
              case 1:
                await ctx.replyWithPhoto('AgACAgIAAxkBAAITN2XYsyziDaFNTiO1djWbEWN4F-TJAALr3jEb1miwSqjhafgRl4yzAQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
                
              case 2:
                await ctx.replyWithPhoto('AgACAgIAAxkBAAITOmXYsz8P_rD6OThFwvhs7igX9VxPAALs3jEb1miwSoc8wDOl0j4XAQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
                
              case 3:
                await ctx.replyWithPhoto('AgACAgIAAxkBAAITPWXYs2jjAAGPcKfkQoDY5uIohkcOjgAC7d4xG9ZosEpjnYT_A9TGfwEAAwIAA3kAAzQE')
                await ctx.reply(...msg)
                break;
            }
            break;
  
          case 25:
            await ctx.replyWithPhoto('AgACAgIAAxkBAAITQ2XYs8D_AAFQ6xGYfFM-Wq0J4lwQsAACT9wxG7F7wUpp0thLlhYKvgEAAwIAA3kAAzQE')
            await ctx.reply(...msg)
            break;
  
          case 26:
            // отправляем фото в зависимости от варианта ответа
            switch (actionNumber) {
              case 1:
                await ctx.replyWithPhoto('AgACAgIAAxkBAAITRmXYs9INxaV70kWQqzvQRyySk-VCAAJT3DEbsXvBSpMCVnUCl2xwAQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
                
              case 2:
                await ctx.replyWithPhoto('AgACAgIAAxkBAAITSWXYs-PjNhZ0AalefAJJhv2GvVuAAAJU3DEbsXvBSiVc0elERnhsAQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
                
              case 3:
                await ctx.replyWithPhoto('AgACAgIAAxkBAAITTGXYs_Xy_entCWC54GoeFFNKjpAuAAJV3DEbsXvBSoTFpRCIfwr0AQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
            }
            break;
  
          case 29:
            await ctx.replyWithVoice('AwACAgIAAxkBAAITQGXYs6CczhYVITSd5zXGuF6EA8NzAAIvRQAC9fKgSrmqSdbWt2pzNAQ')
            await ctx.reply(...msg)
            break;
  
          case 37:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIU7mXZEW2dzUzSwYN1J9kHDwAB_tYzjQACvUAAAsrz0UrX4ckV4YOfHTQE' : 'AwACAgIAAxkBAAIBbWXbfYVy4QrWfUPAmzAGdQdjNF67AAK9QAACyvPRSpo0R5WAvUgcNAQ')
            await ctx.reply(...msg)
            break;
  
          case 39:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIU8WXZFRXR8APHkCvHkLjUP6ncOoBUAALcQAACyvPRSoLnKJZ_Bf8oNAQ' : 'AwACAgIAAxkBAAIBdWXbfhV8btH9kgpzpYN6x2fbxsxQAALcQAACyvPRStfWi6HOjzwsNAQ')
            await ctx.reply(...msg)
            break;
  
          case 45:
            await ctx.replyWithPhoto(IS_PROD ? 'AgACAgIAAxkBAAIVGWXZJeZAJPxWsLPupxnfNAw4-UbaAAJY1TEbyvPRSst99UEheIx6AQADAgADeQADNAQ' : 'AgACAgIAAxkBAAIBhGXbfu0sCu2OujXeOZns1k5x6QF5AAJY1TEbyvPRSl7OzLMWqC7uAQADAgADeQADNAQ')
            await ctx.reply(...msg)
            break;
  
          case 46:
            // отправляем фото в зависимости от варианта ответа
            switch (actionNumber) {
              case 1:
                await ctx.replyWithPhoto(IS_PROD ? 'AgACAgIAAxkBAAIVHGXZJgKrgLWSjzN-8dPHxuSlSFPkAAJZ1TEbyvPRSpdvKz-mkepFAQADAgADeQADNAQ' : 'AgACAgIAAxkBAAIBh2XbfwKnHHJPoL4bxTEVL64NCSODAAJZ1TEbyvPRSosfKBnDfVJ7AQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
                
              case 2:
                await ctx.replyWithPhoto(IS_PROD ? 'AgACAgIAAxkBAAIVH2XZJhT89ewCPqw0EkpnCE7s4RfUAAJa1TEbyvPRSrb9LAE8l5p_AQADAgADeQADNAQ' : 'AgACAgIAAxkBAAIBimXbfxa0D5Ng9PCgn4WpKUf8x07vAAJa1TEbyvPRSvh6KvTrDAWRAQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
                
              case 3:
                await ctx.replyWithPhoto(IS_PROD ? 'AgACAgIAAxkBAAIVImXZJiQgq0i2lrfofcVBK0V7Q4YYAAJb1TEbyvPRSkJTdnJ_XJb6AQADAgADeQADNAQ' : 'AgACAgIAAxkBAAIBjWXbfyl33WW3idWunApyS3IpdWjqAAJb1TEbyvPRSh-eiOEKKbFZAQADAgADeQADNAQ')
                await ctx.reply(...msg)
                break;
            }
            break;
  
          case 50:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIVC2XZH9q_kQQIF-Bm1ayXOJQBf6j9AALuQAACyvPRShiUVER6EPxoNAQ' : 'AwACAgIAAxkBAAIBe2Xbfn-Ji9lstiwV0_A0cYtQPQndAALuQAACyvPRSpf3gQxnkm6bNAQ')
            await ctx.reply(...msg)
            break;
  
          case 53:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIVCGXZH6neMtwV8WOtZN0YOsbL_OlSAALtQAACyvPRSoW_0qzJhbpVNAQ' : 'AwACAgIAAxkBAAIBeGXbfmN3OXUR-zt_mDTke0u7OT1xAALtQAACyvPRSgR6_oRQuEqiNAQ')
            await ctx.reply(...msg)
            break;
  
          case 60:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIVDmXZIAVgd0aEWkTSkyfdb7UP3uKrAAL6QAACyvPRSg37-kjY3tOlNAQ' : 'AwACAgIAAxkBAAIBfmXbfqMtnTMIoMB7mJJjGYpVBQaMAAL6QAACyvPRSu07Rxy2afR_NAQ')
            await ctx.reply(...msg)
            break;
  
          case 63:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIVFmXZI-VFpETEwhw6nmvWtxu11VqJAAIHQQACyvPRSjyIEeHCFGIHNAQ' : 'AwACAgIAAxkBAAIBgWXbftSc1sM0JHXiRyx71y1dlr6yAAIHQQACyvPRSgABjPqAiauPWjQE')
            await ctx.reply(...msg)
            break;
  
          case 70:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIjfWXfriqyR3iHPZ1mxALzyGzZhSe1AAIKMgACAtOQSWVNmhT-hkSJNAQ' : 'AwACAgIAAxkBAAICCGXfsOngtYW8VXKaL4QCWfdqpBXxAAIKMgACAtOQSZbJn9gCKg4GNAQ')
            await ctx.reply(...msg)
            break;
  
          case 73:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIjeWXfrZtuN1s9qlTn60osf2-9WNNNAALbQgACd9cAAUuUUe4FtBYgszQE' : 'AwACAgIAAxkBAAICBWXfsMaG3T9DFpj0UP2IPVLoYNInAALbQgACd9cAAUu2ZOM6OZXC5zQE')
            await ctx.reply(...msg)
            break;
  
          case 80:
            await ctx.replyWithDocument(IS_PROD ? 'BQACAgIAAxkBAAIkN2XhBrbhrulIDKwYNNTXtn0_WTrGAALrQQAC-r8JS1kwSR4SR-7nNAQ' : 'BQACAgIAAxkBAAICJ2XhBqGNIFRlmG7ohyNnFJNVJZo9AALrQQAC-r8JS6GmFTcvyb0JNAQ')
            await ctx.reply(...msg)
            break;
  
          case 83:
            await ctx.replyWithVoice(IS_PROD ? 'AwACAgIAAxkBAAIkNGXhAWoTQemyzBKjThT1rOp86qfuAALbQQAC-r8JSxbJTpytAu9NNAQ' : 'AwACAgIAAxkBAAICJGXhAXbCKcLRtJ9Nmw6hI2roAAFKfwAC20EAAvq_CUtNrJiKS2YVwzQE')
            await ctx.reply(...msg)
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
            await sendMessage(msg, { parse_mode: 'markdown' })
            break;
        }
      } catch (e) {
        isCatchedError = true

        if (e?.response?.description?.indexOf('VOICE_MESSAGES_FORBIDDEN')) {
          sendMessage(BOT_MSG.voice_not_allow, { parse_mode: 'markdown' })
        }

        bot.telegram.sendMessage(ADMIN_IDS[0],
`Ошибка при отправке сообщения #${msgId}:

${JSON.stringify(e, null, 2)}`)
      }
      
      // ТАЙИЕР НА ЦЕНЫ (если в этот момент нажать /start - какая-то ошибка)
      // if (msgId === 5) {
      // }
    }, index * 2000)
  })

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
  const filteredUsers = usersdb?.filter(userdb => ADMIN_IDS.includes(userdb.tgId))
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
  const filteredUsers = usersdb?.filter(userdb => ADMIN_IDS.includes(userdb.tgId))
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
        isCatchedError = true

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
    console.log(usersdb?.length)

    if (!usersdb?.length) return

    usersdb.forEach(user => {
      const latestFunnelDate = new Date(user.latestFunnelDate)  // дата последнего отправленного ботом сообщения из воронки
      const latestFunnelHour = latestFunnelDate.getHours()
      const currentDate = new Date()   // текущая дата
      const currentHour = currentDate.getHours()  // текущий час

      console.log(1, currentDate.getDate(), latestFunnelDate.getDate(), latestFunnelHour)

      // если число месяца последнего сообщения совпадает с текущим - пропускаем пользователя
      if (currentDate.getDate() === latestFunnelDate.getDate() && latestFunnelHour > 5) return

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
