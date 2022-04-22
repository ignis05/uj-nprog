const https = require('https')
const axios = require('axios')

const customInstance = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})

customInstance
	.get('https://localhost:3000')
	.then((res) => {
		console.log(`statusCode: ${res.status}`)
		console.log(res)
	})
	.catch((error) => {
		console.error(error)
	})
