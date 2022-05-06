const process = require('process')
const axios = require('axios')
const cheerio = require('cheerio')

/** *
 * @typedef {Object} DetailDataNode
 * @property {String} name
 * @property {String} value
 */

async function main() {
	// request
	let res = await axios.get('https://www.accuweather.com/en/pl/krakow/274455/current-weather/274455').catch((err) => {
		console.error(`Request failed: ${err}`)
		process.exit(0)
	})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	// parse to dom
	const rootNode = cheerio.load(res.data)

	/** * @type {Array<DetailDataNode>}*/
	let details = []

	// details object, get temperature from separate place
	let tempElement = rootNode('div.display-temp')
	if (!tempElement.text()) console.warn('temperature data not found')
	else details.push({ name: 'Temperature', value: tempElement.text().trim() })

	// get the rest of data
	let detailsElement = rootNode('div.current-weather-details')
	for (let detailNode of detailsElement.find('div.detail-item')) {
		details.push({ name: rootNode(detailNode.children[1]).text().trim(), value: rootNode(detailNode.children[3]).text().trim() })
	}

	if (Object.keys(details).length < 11) {
		console.log(`Warning: some data was not accessible`)
	}
	console.log(details)
}
main()
