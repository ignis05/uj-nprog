const process = require('process')
const axios = require('axios')
const fs = require('fs')
const cliProgress = require('cli-progress')


const apiAuth = {
	key: 'JGgaPanYuVZFyrtCuxNA',
	secret: 'nnxpeUxUccEBeZaDeMStCgIIhTEToRjD',
}

async function main() {
	let joinedArgs = process.argv.slice(2).join(' ')

	// only digits
	if (/^\d+$/.test(joinedArgs)) {
		var id = parseInt(joinedArgs)
	} else {
		console.log('Parameter not a number, running database search')
		let resp = await axios
			.get(`https://api.discogs.com/database/search`, {
				params: {
					q: joinedArgs,
					per_page: '1',
					type: 'artist',
					...apiAuth,
				},
			})
			.catch((err) => {
				console.error(`Request failed: ${err}`)
				process.exit(0)
			})
		if (!resp.data) return console.log(`No data attached, response code: ${resp.code}`)

		id = resp.data?.results?.[0]?.id
		if (!id) return console.log(`Failed to find artist id for name: ${joinedArgs}`)
	}

	// fetch group members
	let res = await axios.get(`https://api.discogs.com/artists/${id}`, { params: apiAuth }).catch((err) => {
		console.error(`Request failed: ${err}`)
		process.exit(0)
	})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	let origGroup = res.data
	let members = origGroup?.members
	if (!members) return console.log(`Failed to find members list for artist ${origGroup.resource_url}`)
	console.log(`Fetching members for group ${id}: ${origGroup.name}`)

	let totalMembersCount = members.length
	let memberDetails = []
	const pbarDisplay = new cliProgress.MultiBar({}, cliProgress.Presets.shades_classic)
	const pBar1 = pbarDisplay.create(totalMembersCount, 0, null, {
		format: 'Member details fetched: {bar} {percentage}% ({value}/{total})  |  {message}',
	})
	pBar1.start(totalMembersCount, 0, null, { message: 'Fetching member details' })

	// check rate limits to avoid timeout
	let breakLoop = false
	while (true) {
		let totalrequestLimit = parseInt(res.headers['x-discogs-ratelimit'])
		let requestLimit = parseInt(res.headers['x-discogs-ratelimit-remaining']) - 1
		let partialMembers = null
		if (members.length > requestLimit) {
			var rateLimit = `${requestLimit}/${members.length}`
			pBar1.update(memberDetails.length, {
				message: `Fetching details of ${rateLimit} members as API's limit is currently at ${requestLimit}/${totalrequestLimit}`,
			})
			partialMembers = members.slice(0, requestLimit)
		} else {
			pBar1.update(memberDetails.length, {
				message: `Members count: ${members.length}, API limit at ${requestLimit}/${totalrequestLimit}. Fetching in one batch...`,
			})
			breakLoop = true
		}

		partialMembers ||= members
		let detailsPromises = partialMembers.map((member) => axios.get(member.resource_url, { params: apiAuth }))
		// fetch each member details
		let responses = await Promise.all(detailsPromises).catch((err) => {
			console.error(`Request failed: ${err}`)
			process.exit(0)
		})
		memberDetails.push(...responses.map((res) => res.data))
		res = responses[responses.length - 1]
		if (breakLoop) break
		// else: prepare for next data chunk in one minute
		members = members.slice(requestLimit) // slice members list for next request
		pBar1.update(memberDetails.length)

		// 1 minute timeout
		let pBar2 = pbarDisplay.create(60, 0, null, {
			format: 'API at limit. Waiting 1 minute for cooldown: [{bar}] {value}/{total} sec',
		})
		pBar2.start(60)
		let timeout = 0
		let step = 1
		let interval = setInterval(() => {
			timeout += step
			pBar2.update(timeout)
			if (timeout >= 60) clearInterval(interval)
		}, step * 1000)
		pBar2.stop()
		pbarDisplay.remove(pBar2)
	}
	pBar1.update(memberDetails.length)
	pBar1.stop()
	pbarDisplay.stop()

	// map member groups together
	let groupMap = {}
	for (let member of memberDetails) {
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
	groups.sort((a, b) => a.name.localeCompare(b.name, 'pl'))

	// prepare results object
	let resultObject = {
		originalGroup: {
			name: origGroup.name,
			members: memberDetails.map((m) => m.name),
		},
		otherGroups: groups,
	}
	if (rateLimit) resultObject.originalGroup.rateLimit = `${rateLimit} members processed`

	// print and save to json
	console.log(`Found ${groups.length} groups with matching members: `)
	for (let group of resultObject.otherGroups) {
		console.log(`${group.name}:`)
		for (let member of group.members) console.log(`--- ${member}`)
		console.log(' ')
	}
	fs.writeFileSync(`./${origGroup.name}.json`, JSON.stringify(resultObject, null, 4))
	console.log(`Results saved in "${origGroup.name}.json"`)
}
main()
