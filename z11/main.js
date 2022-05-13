const process = require('process')
const axios = require('axios')
const fs = require('fs')

const settings = {
	key: 'JGgaPanYuVZFyrtCuxNA',
	secret: 'nnxpeUxUccEBeZaDeMStCgIIhTEToRjD',
	artistQuery: 'Budka Suflera',
}

async function main() {
	let res = await axios
		.get(`https://api.discogs.com/database/search`, {
			params: {
				q: settings.artistQuery,
				key: settings.key,
				secret: settings.secret,
				per_page: '1',
				type: 'artist',
			},
		})
		.catch((err) => {
			console.error(`Request failed: ${err}`)
			process.exit(0)
		})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	let id = res.data?.results?.[0]?.id
	if (!id) return console.log(`Failed to find artist id`)

	res = await axios
		.get(`https://api.discogs.com/artists/${id}`, {
			params: {},
		})
		.catch((err) => {
			console.error(`Request failed: ${err}`)
			process.exit(0)
		})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	let members = res.data?.members
	if (!members) return console.log(`Failed to find members list`)

	let requestLimit = parseInt(res.headers['x-discogs-ratelimit-remaining']) - 1

	if (members.length > requestLimit) {
		console.log(
			`Reducing cross-reference search to ${requestLimit}/${members.length} members as API limit won't allow more requests at the moment`
		)
		members = members.slice(0, requestLimit)
	}

	let detailsPromises = members.map((member) => axios.get(member.resource_url))
	members = (await Promise.all(detailsPromises)).map((el) => el.data)

	let groupMap = {}
	for (let member of members) {
		for (let group of member.groups) {
			if (groupMap[group.id]) groupMap[group.id].members.push(member.name)
			else groupMap[group.id] = { ...group, members: [member.name] }
		}
	}

	let groups = Object.values(groupMap).filter((el) => el.members.length >= 2 && el.id != id)

	console.log(`Found ${groups.length} groups with duplicate members: `, groups)
	fs.writeFileSync('./results.json', JSON.stringify({ membersList: members.map((m) => m.name), otherGroups: groups }, null, 4))
}
main()
