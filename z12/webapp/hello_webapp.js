const http = require('http')
const process = require('process')
const host = 'localhost'
const port = 8001

const server = http.createServer((req, res) => {
	res.writeHead(200)

	res.write(`<h1>Request method and url:</h1>`)
	res.write(`${req.method}: ${req.url}`)
	res.write(`<h1>Request headers:</h1>`)
	res.write(Object.entries(req.headers).map(([key, value]) => `<b>${key}:</b> ${value}`).join('</br>'))
	res.write(`<h1>Environment:</h1>`)
	res.write(Object.entries(process.env).map(([key, value]) => `<b>${key}:</b> ${value}`).join('</br>'))
	res.end('')
})

server.listen(port, host, () => {
	console.log(`Server is running on http://${host}:${port}`)
})
