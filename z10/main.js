const process = require('process')
const axios = require('axios')
const fs = require('fs')

const settings = {
	key: 'JGgaPanYuVZFyrtCuxNA',
	secret: 'nnxpeUxUccEBeZaDeMStCgIIhTEToRjD',
	chunkSize: '100',
	artistQuery: 'Budka Suflera',
}

async function main() {
	let res = await axios
		.get(`https://api.discogs.com/database/search`, {
			params: {
				artist: settings.artistQuery,
				key: settings.key,
				secret: settings.secret,
				per_page: settings.chunkSize,
			},
		})
		.catch((err) => {
			console.error(`Request failed: ${err}`)
			process.exit(0)
		})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	let { results } = res.data
	let chunksCount = 1

	while (res.data.pagination.urls?.next) {
		res = await axios.get(res.data.pagination.urls.next)
		results.push(...res.data.results)
		chunksCount++
	}

	let titles = results.map((el) => el.title)

	console.log(`Fetched ${titles.length} titles in ${chunksCount} requests:`, titles)
	fs.writeFileSync('./data.json', JSON.stringify(results))
}
main()
