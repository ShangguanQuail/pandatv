const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');
const util = require('./util')
const user = require('./config').user

// 定义一个全局延时消息队列, 存job信息, delay_queue根据delay排序
let delay_queue = [];


(async() => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await page.goto('https://www.panda.tv/11010');
  await login(browser, page)
  await producer(browser, page)
  //
  poll()


  // browser.close();
})();


/**
 *  登陆模块
 *
 *
 * */
let login = async(browser, page) => {

  await page.click('.sidebar-collapse-foot-userinfo .sidebar-userinfo-login-btn');
  await page.focus("input[name='account']")
  await page.type(user.account)
  await page.focus("input[name='password']")
  await page.type(user.password)
  await page.click('.login-button-container')
  await util.sleep(1000)

  let password_error = await page.evaluate(() => {
    return Promise.resolve($('.input-item-error-text').text())
  })
  if (password_error === '用户名或密码错误') {
    console.log(`${password_error}`)
    console.log(`请修改您的用户名或密码后重新启动程序`)
    browser.close();
  }

  await util.sleep(1000)
  let error_message = await page.evaluate(() => {
    return Promise.resolve($('.common-error-msg-container').text())
  })

  if (error_message === '您的账号存在被盗风险，请使用短信验证账号') {
    console.log(`${error_message}`)
    // 点击发送验证码，控制台等待输入
    await page.click('.ruc-send-voice-verify-btn')
    let phone_code = readlineSync.question('请输入您的手机验证码: ');
    await page.focus("input[name='voice-verify']")
    await page.type(phone_code)
    await page.click('.login-button-container')

    await util.sleep(500)
    let error_code = await page.evaluate(() => {
      return Promise.resolve($('.ruc-error-auth').text())
    })
    if (error_code === '验证码错误') {
      console.log(error_code)
      let phone_code = readlineSync.question('请确认后重新输入您的验证码: ');
      await page.focus("input[name='voice-verify']")
      await page.type(phone_code)
      await page.click('.login-button-container')
      await util.sleep(500)
      let error_code = await page.evaluate(() => {
        return Promise.resolve($('.ruc-error-auth').text())
      })
      if (error_code === '验证码错误') {
        console.log(`验证码错误，程序退出`)
        browser.close();
      }
    }
  }
}

/**
 * 生产者函数：定时器定时刷新主页面，如果有人刷佛跳墙，则记录下被刷墙的房间号并放入队列
 *
 job: {
  room_num: room_num, // 房间号 作为唯一id
  status: 'ready', // 任务状态 ready delay reserved deleted
  delay: 100 * 1000, // 等待时间 ms
  ttr: 10 * 1000, // 超时 s
  create_time: new Date().getTime() // 创建时间
 }
 */
let producer = async(browser, page) => {
  setInterval(async()=> {
    // console.log(`delay_queue.length---${delay_queue.length}`)
    // 获取当前页面所有被刷墙的房间号
    let ftqs = await page.$$('.h5player-gift-banner-311');
    let ftq_rooms = [];
    if (ftqs[0]) {
      console.log(`ftq coming!`)
      ftq_rooms = await page.evaluate(() => {
        let ftq_doms = $(".h5player-gift-banner-link");
        let current_rooms = [];
        for (let i = 0, len = ftq_doms.length; i < len; i++) {
          current_rooms.push(ftq_doms[i].dataset['toroom']);
        }
        return Promise.resolve(current_rooms)
      })
      console.log(`ftq_rooms: ${ftq_rooms}`)
      if (ftq_rooms[0]) {
        ftq_rooms.forEach(async(room_num) => {
          console.log(`room_num: ${room_num}`)
          // 检查是否已经跳转到抢竹子页面，如果没有才跳转
          if (!delay_queue.hasItem('room_num', room_num)) {
            console.log(`come in room_num: ${room_num}`)

            // 新建一个页面并跳转到相应房间，同时放入已跳转的房间列表
            let new_page = await browser.newPage();
            await new_page.goto(`https://www.panda.tv/${room_num}`);

            await util.sleep(2000)

            let wait_time = await new_page.evaluate(() => {
              let time_doms = $(".h5player-gift-fudai-countdown-time");
              return Promise.resolve(time_doms.text())
            })

            // 将job信息放入队列 delay_queue
            delay_queue.sortedAdd({
              room_num: room_num,
              page: new_page,
              status: 'delay',
              delay: Date.now() + parseInt(wait_time || 120) * 1000
            });
            console.log(`delay_queue------------------`)
            console.log(delay_queue)
          }
        })
      }
    }

    console.log(ftq_rooms)

  }, 9000)
}


/**
 *  轮询，每4秒检查一次队列中最后一个的job是否到时间去执行,5秒之内的都抛出
 *  每次抛出最近执行的那个任务
 *  可以考虑加上时间轮机制提升效率
 *
 * */

let poll = function () {
  setInterval(function () {
    while (delay_queue[0] && (delay_queue[delay_queue.length - 1].delay - Date.now()) < 10000) {
      consumer(delay_queue.pop()).then();
    }
  }, 1000)
}

/**
 *  消费者，抢佛跳墙
 *
 *
 * */

let consumer = async function (job) {
  console.log(`come in consumer...`)
  console.log(job)

  let page = job.page;
  let interval_handle = setInterval(async function () {
    let wait_time = await page.evaluate(() => {
      return Promise.resolve($(".h5player-gift-fudai-countdown-time").text())
    })
    wait_time = parseInt(wait_time)
    console.log(`wait_time---${wait_time}`)
    if (wait_time <= 2) {
      // 执行点击佛跳墙，抢竹子
      console.log(`click click click ...`)
      for (let i = 0; i< 20; i++) {
        await page.evaluate(()=>{
          $('.h5player-gift-fudai-pointer').click();
        });
        util.sleep(100);
      }
      util.sleep(3000);
      // 清除interval，关闭这个页面
      clearInterval(interval_handle);
      page.close().then();
    } else if (wait_time > 10){
      // 如果监听期间有人重新刷墙，导致时间刷新则将任务重新放入延时消息队列
      delay_queue.sortedAdd({
        room_num: job.room_num,
        page: job.page,
        status: 'delay',
        delay: Date.now() + parseInt(wait_time || 120) * 1000
      });

      clearInterval(interval_handle);
      page.close().then();
    }
  }, 500)
}