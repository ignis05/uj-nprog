const process = require('process')
const axios = require('axios')
const fs = require('fs')

const auth = {
	key: 'JGgaPanYuVZFyrtCuxNA',
	secret: 'nnxpeUxUccEBeZaDeMStCgIIhTEToRjD',
}

async function main() {
	let res = await axios
		.get(`https://api.discogs.com/database/search`, {
			params: {
				artist: 'Budka Suflera',
				key: auth.key,
				secret: auth.secret,
				per_page: '100',
			},
		})
		.catch((err) => {
			console.error(`Request failed: ${err}`)
			process.exit(0)
		})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)
	let { results, pagination } = res.data
	let titles = results.map((el) => el.title)
	console.log(pagination)
	console.log('Fetched titls:', titles)
	fs.writeFileSync('./data.json', JSON.stringify(results))
}
main()
