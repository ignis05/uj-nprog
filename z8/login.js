const axios = require('axios')

const instance = axios.create({ baseURL: 'http://sphinx.if.uj.edu.pl/techwww/httptest/' })

async function main() {
	let response = await instance.post('/login', { login: 'test', password: '0123' })
	console.log(`Response: ${response.data}`)

	let [cookie] = response.headers['set-cookie']
	console.log(`Cookie: ${cookie}`)

	instance.defaults.headers.Cookie = cookie

	let response2 = await instance.get('/private')
	console.log(`Response2: ${response2.data}`)
}
main()
