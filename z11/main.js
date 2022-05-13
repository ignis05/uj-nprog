const process = require('process')
const axios = require('axios')
const fs = require('fs')

const settings = {
	key: 'JGgaPanYuVZFyrtCuxNA',
	secret: 'nnxpeUxUccEBeZaDeMStCgIIhTEToRjD',
}

async function main() {
	let joinedArgs = process.argv.slice(2).join(' ')
	let id = parseInt(joinedArgs)
	let res

	// group name instead of id
	if (!/^\d+$/.test(joinedArgs) || isNaN(id)) {
		console.log('Parameter not a number, running database search')
		res = await axios
			.get(`https://api.discogs.com/database/search`, {
				params: {
					q: joinedArgs,
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

		id = res.data?.results?.[0]?.id
		if (!id) return console.log(`Failed to find artist id for name: ${joinedArgs}`)
	}

	// fetch group members
	res = await axios
		.get(`https://api.discogs.com/artists/${id}`, {
			params: {},
		})
		.catch((err) => {
			console.error(`Request failed: ${err}`)
			process.exit(0)
		})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	let origGroup = res.data
	let members = origGroup?.members
	if (!members) return console.log(`Failed to find members list for artist ${origGroup.resource_url}`)
	console.log(`Fetching members for group ${id}: ${origGroup.name}`)

	// check rate limits to avoid timeout
	let requestLimit = parseInt(res.headers['x-discogs-ratelimit-remaining']) - 1
	if (members.length > requestLimit) {
		console.log(`Reducing search to ${requestLimit}/${members.length} members as API limit won't allow more requests at the moment`)
		members = members.slice(0, requestLimit)
	}

	// fetch each member details
	let detailsPromises = members.map((member) => axios.get(member.resource_url))
	members = (await Promise.all(detailsPromises)).map((el) => el.data)

	// map member groups together
	let groupMap = {}
	for (let member of members) {
		for (let group of member.groups) {
			if (groupMap[group.id]) groupMap[group.id].members.push(member.name)
			else groupMap[group.id] = { ...group, members: [member.name] }
		}
	}

	// filter only groups with dupes, skip original group too
	let groups = Object.values(groupMap).filter((el) => el.members.length >= 2 && el.id != id)
	// strip unused data
	groups = groups.map(({ name, members }) => ({ name, members }))
	// sort
	groups.sort((a, b) => a.name.localeCompare(b.name))

	// print and save to json
	console.log(`Found ${groups.length} groups with matching members: `, groups)
	fs.writeFileSync(
		'./results.json',
		JSON.stringify({ originalGroup: { name: origGroup.name, members: members.map((m) => m.name) }, otherGroups: groups }, null, 4)
	)
}
main()
