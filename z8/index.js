const process = require('process')
const axios = require('axios')

const url = 'http://sphinx.if.uj.edu.pl/techwww/httptest/test'
const data = { przedmiot: 'programowanie sieciowe' }

async function main() {
	if (process.argv[2] == 'POST') {
		let response = await axios.post(url, data).catch(console.log)
		console.log(response?.data)
	} else {
		let response = await axios.get(url).catch(console.log)
		console.log(response?.data)
	}
}
main()
