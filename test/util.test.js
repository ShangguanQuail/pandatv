const util = require('../util')

let a = [{b:1, c:3}]

console.log(a.hasItem({b:1, c:2}))

let list = []

let i = 0

setInterval(function () {
  let m = i
  console.log(list)
  if (!list.hasItem('id', m)) {
    list.sortedAdd({
      id: m,
      delay: Date.now() + (m - 6) * (m - 6)
    })
  }
  i++
  console.log(i)
  console.log(list)
}, 100)

  // console.log([ { id: 0, delay: 1505839611432 } ].hasItem({id:12}))
