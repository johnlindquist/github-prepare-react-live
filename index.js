const prettier = require("prettier")
const fetch = require("isomorphic-fetch")
const query = require("micro-query")
const cors = require("micro-cors")()
const prepare = s =>
  s
    .replace(/^import.*[\s\S]*from.*/gm, "")
    .replace(/\,[\s\S].*document.*/gm, "")
    .replace(/\n*/, "")

const cache = new Map()

module.exports = cors(async req => {
  const {
    user,
    repo,
    branch,
    file,
    clear
  } = query(req)

  if (clear) {
    cache.clear()
  }

  console.log(cache)

  if (user && repo && branch && file) {
    const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${file}`

    if (cache.get(url)) {
      return cache.get(url)
    }

    const res = await fetch(url)
    const text = await res.text()

    const code = prettier.format(text, {
      printWidth: 62,
      semi: false
    })

    cache.set(url, prepare(code))

    return cache.get(url)
  } else {
    return "'File not found'"
  }
})
