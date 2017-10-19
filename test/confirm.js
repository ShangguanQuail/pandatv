/**
 * Created by liuye on 2017/10/18.
 */
const puppeteer = require('puppeteer');
const util = require('../util');

(async() => {
  const browser = await puppeteer.launch({
    headless: false,
    // devtools : true
  });
  const page = await browser.newPage();

  await page.goto('https://www.panda.tv/628494');
  // await login(browser, page)
  console.log(`date--${Date.now()}`)
  await util.sleep(10000)
  console.log(`date--${Date.now()}`);
  await page.evaluate(()=>{
    $('.h5player-gift-fudai-pointer').click({
      clickCount: 30,
      delay: 100
    });
  });
  // let temp = page.click('.h5player-gift-fudai-pointer',{
  //   clickCount : 2,
  //   delay : 100
  // });
  // console.log( temp );
  // temp.then(( resolve )=>{
  //   console.log( 'resolve' );
  // },( reject )=>{
  //   console.log( 'reject' );
  // });
  // poll()
  // browser.close();
})();

let consumer = async function (job) {
  console.log(`come in consumer...`)
  console.log(job)

  let page = job.page;
  setInterval(async function () {
    let wait_time = await page.evaluate(() => {
      return Promise.resolve($(".h5player-gift-fudai-countdown-time").text())
    })
    console.log(`wait_time---${wait_time}`)
    if ('block' === page.$(".h5player-gift-fudai-pointer").css('display')) {
      await page.click('.h5player-gift-fudai-pointer')
    }
  }, 1000)
}


