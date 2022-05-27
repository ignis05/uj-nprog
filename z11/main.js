const process = require('process')
const axios = require('axios')
const fs = require('fs')
const cliProgress = require('cli-progress')
const colors = require('colors')

const timoutWait = 5 // 5 seconds

try {
	var apiAuth = require('./auth.json')
	if (apiAuth.key === 'key_here') {
		console.error(`auth.json is a placeholder`.red)
		process.exit(0)
	}
} catch {
	fs.writeFileSync('./auth.json', JSON.stringify({ key: 'key_here', secret: 'secret_here' }, null, 4))
	console.log(`Created placeholder ${'auth.json'.green} file. Fill in discogs authentication data and launch again.`)
	process.exit(0)
}

async function main() {
	let joinedArgs = process.argv.slice(2).join(' ')

	// only digits
	if (/^\d+$/.test(joinedArgs)) {
		var id = parseInt(joinedArgs)
	} else {
		console.log('Argument is not a number: running database search')
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
				console.error(`Request failed: ${err}`.red)
				process.exit(1)
			})
		if (!resp.data) return console.log(`No data attached, response code: ${resp.code}`)

		id = resp.data?.results?.[0]?.id
		if (!id) return console.log(`Failed to find artist id for name: ${joinedArgs}`)
	}

	// fetch group members
	let res = await axios.get(`https://api.discogs.com/artists/${id}`, { params: apiAuth }).catch((err) => {
		console.error(`Request failed: ${err}`.red)
		process.exit(1)
	})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)

	let origGroup = res.data
	let members = origGroup?.members
	if (!members) return console.log(`Failed to find members list for artist ${origGroup.resource_url}`)
	console.log(`Fetching members for group ${id.toString().cyan}: ${origGroup.name.cyan}`)

	let totalMembersCount = members.length
	let memberDetails = []
	const pbarDisplay = new cliProgress.MultiBar({}, cliProgress.Presets.shades_classic)
	const pBar1 = pbarDisplay.create(totalMembersCount, 0, null, {
		format: ' Member details fetched: {bar} {percentage}% ({value}/{total}) | API Limit: {limit} | Status: {status1}',
	})
	pBar1.start(totalMembersCount, 0, null, {
		status1: 'Fetching member details',
		limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
	})

	let gotErr = false

	// fetch member details
	while (memberDetails.length !== totalMembersCount) {
		// API at limit
		if (res.headers['x-discogs-ratelimit-remaining'] == '1') {
			if (!gotErr)
				pBar1.update(memberDetails.length, {
					status1: 'Rate limit reached',
					limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
				})

			const pBar2 = pbarDisplay.create(timoutWait, 0, null, {
				format: ' API at limit. Waiting for cooldown: [{bar}] {percentage}% | {duration}s',
			})
			let timestamp = Date.now()
			pBar2.start(timoutWait, 0)
			while (timestamp + timoutWait * 1000 > Date.now()) {
				await new Promise((res) => setTimeout(res, 1000))
				pBar2.update((Date.now() - timestamp) / 1000)
			}

			pBar2.stop()
			pbarDisplay.remove(pBar2)
		}

		let member = members[0]
		try {
			res = await axios.get(member.resource_url, { params: apiAuth })
		} catch (err) {
			// "Too many requests"
			fs.writeFileSync('error.json', JSON.stringify(err))
			if (err.response.status == 429) {
				pBar1.update(memberDetails.length, {
					status1: `Code 429 received.`,
					limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
				})
				gotErr = true
				continue
			} else {
				console.error(`Request failed: ${err}`.red)
				process.exit(1)
			}
		}

		memberDetails.push(res.data)
		members.shift()
		pBar1.update(memberDetails.length, {
			status1: 'OK',
			limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
		})
		gotErr = false
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

	// print and save to json
	console.log(`Found ${groups.length} groups with matching members: `)
	for (let group of resultObject.otherGroups) {
		console.log(`${group.name}:`.underline.green)
		for (let member of group.members) console.log(`--- ${member}`.green)
		console.log(' ')
	}
	fs.writeFileSync(`./${origGroup.name}.json`, JSON.stringify(resultObject, null, 4))
	console.log(`Results saved in ${(origGroup.name + '.json').cyan}`)
}
main()
