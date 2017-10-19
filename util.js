
module.exports = util = {};


if (!Array.prototype.hasItem) {
  Array.prototype.hasItem = function (key, value) {
    for (let i = 0, len = this.length; i < len; i++) {
      if (value === this[i][key]) {
        return true;
      }
    }
    return false;
  }
}

/**
 * 将job插入按delay排序好的队列
 *
 * */
if (!Array.prototype.sortedAdd) {
  Array.prototype.sortedAdd = function (item) {
    if (this.hasItem('room_num', item.room_num)) return

    if (!this[0] || item.delay >= this[this.length - 1].delay) {
      this.push(item);
      return
    }

    if (item.delay <= this[0].delay) {
      this.splice(0, 0, item);
      return
    }

    // 二分法将item插入队列
    let left = 0, right = this.length - 1;
    let mid = parseInt((left + right) / 2);
    while(true) {
      if (left === mid) {
        this.splice(mid, 0, item);
        break
      }
      if (item.delay < this[mid - 1].delay) {
        right = mid - 1;
        mid = parseInt((left + right) / 2)
      } else if (item.delay > this[mid].delay) {
        left = mid;
        mid = parseInt((left + right) / 2)
      } else {
        this.splice(mid, 0, item);
        break
      }
    }
  }
}

/**
 * 等待
 *
 * */
util.sleep = function (seconds) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve('sleep over')
    }, seconds)
  })
};
