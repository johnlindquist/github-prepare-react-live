const prettier = require("prettier")
const fetch = require("isomorphic-fetch")
const query = require("micro-query")
const cors = require("micro-cors")()
const prepare = s =>
  s
    .replace(/^import.*[\s\S]*from\s\".*\"/gm, "")
    .replace(/\,[\s\S].*document.*/gm, "")
    .replace(/\n*/, "")

const cache = new Map()

module.exports = cors(async req => {
  const { user, repo, clear } = query(req)

  if (clear) {
    cache.clear()
  }

  if (user && repo) {
    const url = `https://raw.githubusercontent.com/${user}/${repo}/`

    if (cache.get(url)) {
      return cache.get(url)
    }

    const orderUrl = `${url}master/order.json`
    console.log(orderUrl)
    const branches = await fetch(orderUrl).then(async res => {
      const text = await res.text()
      console.log(text)
      return JSON.parse(text)
    })

    const examples = await Promise.all(
      branches.map(async branch => {
        const codeString = await fetch(`${url}${branch}/src/index.js`).then(
          res => res.text()
        )

        const prettyCode = prettier.format(codeString, {
          printWidth: 50,
          semi: false
        })

        const code = prepare(prettyCode)

        const markdown = await fetch(`${url}${branch}/src/README.md`).then(
          res => res.text()
        )

        return { branch, markdown, code }
      })
    )

    cache.set(url, examples)

    return cache.get(url)
  } else {
    return "'File not found'"
  }
})
