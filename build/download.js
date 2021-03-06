const fs = require('fs')
const path = require('path')
const axios = require('axios')
const targetPath = path.join(process.cwd(), 'icons.json')
const targetImagePath = path.join(process.cwd(), 'svg')
const eachLimit = require('async/eachLimit')

const url = process.env.API_DOWNLOAD

console.log(`Download SVGs in ${process.cwd()}`)

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.withCredentials = true

const requestHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.api.v2+json'
}

async function downloadImage(url, path) {
  console.log(`Downloading Image: ${url}`)
  // axios image download with response type "stream"
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    headers: requestHeaders
  })

  // pipe the result stream into a file on disc
  response.data.pipe(fs.createWriteStream(path))

  // return a promise and resolve when download finishes
  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      resolve(url)
    })

    response.data.on('error', () => {
      reject(url)
    })
  })
}

const response = axios
  .get(
    url
  )
  .then(response => {
    const data = []

    // Download All the icons from Iconscout
    eachLimit(response.data.response.unicons, 20, async (row) => {
      const url = row.svg
      // const ext = url.indexOf('.gif') === -1 ? 'jpg' : 'gif'
      const name = row.tags[row.tags.length - 1]
      const fileName = `${name}.svg`
      const filePath = path.resolve(targetImagePath, fileName)

      data.push({
        id: row.id,
        name: name,
        svg: `svg/${fileName}`,
        category: row.category,
        style: row.style,
        tags: row.tags
      })
      return downloadImage(url, filePath)
    }, (err, results) => {
      if (err) {
        console.log(results)
        throw err
      }

      console.log(`${data.length} Images Downloaded!`)
      // Save the Airtable data as json
      fs.writeFileSync(targetPath, JSON.stringify(data), 'utf-8')

      // console.log(`New Data saved from Airtable to ${targetPath}!`)
    })
  })
  .catch(e => {
    console.error(e)
  })
