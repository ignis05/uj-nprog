const process = require('process')
const axios = require('axios')
const cheerio = require('cheerio')

async function main() {
	// request
	let res = await axios.get('https://www.accuweather.com/en/pl/krakow/274455/current-weather/274455').catch((err) => {
		console.error(`Request failed`)
		console.error(err)
		process.exit(0)
	})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	// parse to dom
	const rootNode = cheerio.load(res.data)

	// details object, get temperature from separate place
	let details = [{ name: 'Temperature', value: rootNode('div.display-temp').text().trim() }]

	// get the rest of data
	let detailsElement = rootNode('div.current-weather-details')
	for (let detailNode of detailsElement.find('div.detail-item')) {
		details.push({ name: rootNode(detailNode.children[1]).text().trim(), value: rootNode(detailNode.children[3]).text().trim() })
	}
	console.log(details)
}
main()
