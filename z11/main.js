const process = require('process')
const axios = require('axios')
const fs = require('fs')
const cliProgress = require('cli-progress')
const colors = require('colors')
const { resolve } = require('path')

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

/**
 * Runs database query to get artist id from name
 * @param {string} bandName
 * @returns {Promise<{id:number,res:Object}>}
 */
function getIdFromName(bandName) {
	return new Promise(async (resolve, reject) => {
		console.log(`Searching database for artist named ${bandName.cyan}`)
		let res = await axios
			.get(`https://api.discogs.com/database/search`, {
				params: {
					q: bandName,
					per_page: '1',
					type: 'artist',
					...apiAuth,
				},
			})
			.catch((err) => reject({ type: 'error', error: err }))

		let id = res.data?.results?.[0]?.id
		if (!id) reject({ type: 'empty' })
		resolve({ id, res })
	})
}

/**
 * Takes array of member objects and fetches details for each of them
 * @param {Array} members
 * @param {Object} previousResponse
 * @returns {Promise<Array>}
 */
function fetchMembersDetails(members, previousResponse) {
	return new Promise(async (resolve, reject) => {
		let res = previousResponse
		let totalMembersCount = members.length
		let memberDetails = []

		// progressbar setup
		const barDisplay = new cliProgress.MultiBar({}, cliProgress.Presets.shades_classic)
		const bar1 = barDisplay.create(totalMembersCount, 0, null, {
			format: ' Member details fetched: {bar} {percentage}% ({value}/{total}) | API Limit: {limit} | Status: {status1}',
		})
		bar1.start(totalMembersCount, 0, null, {
			status1: 'Fetching member details',
			limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
		})

		let gotErr = false

		// fetch member details
		while (memberDetails.length !== totalMembersCount) {
			// API at limit
			if (res.headers['x-discogs-ratelimit-remaining'] == '1') {
				// update progress bars
				if (!gotErr)
					bar1.update(memberDetails.length, {
						status1: 'Rate limit reached',
						limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
					})
				const bar2 = barDisplay.create(timoutWait, 0, null, {
					format: ' API at limit. Waiting for cooldown: [{bar}] {percentage}% | {duration}s',
				})

				// wait 5 seconds
				let timestamp = Date.now()
				bar2.start(timoutWait, 0)
				while (timestamp + timoutWait * 1000 > Date.now()) {
					await new Promise((res) => setTimeout(res, 1000))
					bar2.update((Date.now() - timestamp) / 1000)
				}
				bar2.stop()
				barDisplay.remove(bar2)
			}

			// get member details
			let member = members[0]
			try {
				res = await axios.get(member.resource_url, { params: apiAuth })
			} catch (err) {
				// "Too many requests"
				fs.writeFileSync('error.json', JSON.stringify(err))
				if (err.response.status == 429) {
					bar1.update(memberDetails.length, {
						status1: `Code 429 received.`,
						limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
					})
					gotErr = true
					continue
				} else return reject(err)
			}

			// push details to result array
			memberDetails.push(res.data)
			members.shift()
			bar1.update(memberDetails.length, {
				status1: 'OK',
				limit: `${res.headers['x-discogs-ratelimit-remaining']}/${res.headers['x-discogs-ratelimit']}`,
			})
			gotErr = false
		}
		bar1.update(memberDetails.length)
		bar1.stop()
		barDisplay.stop()
		resolve(memberDetails)
	})
}

/**
 * Processes detailed members list to extract duplicate bands
 * @param {Array} members
 * @param {Object} originalGroup
 * @returns {Object} object with results
 */
function processData(members, originalGroup) {
	// map member groups together
	let groupMap = {}
	for (let member of members) {
		for (let group of member.groups) {
			if (groupMap[group.id]) groupMap[group.id].members.push(member.name)
			else groupMap[group.id] = { ...group, members: [member.name] }
		}
	}

	let filteredGroups = Object.values(groupMap)
		.filter((el) => el.members.length >= 2 && el.id != originalGroup.id) // strip groups with one members and the original group
		.map(({ name, members }) => ({ name, members })) // strip unused member details
		.sort((a, b) => a.name.localeCompare(b.name, 'pl')) // sort

	// prepare results object
	return {
		originalGroup: { name: originalGroup.name, members: members.map((m) => m.name) },
		otherGroups: filteredGroups,
	}
}

//* main
async function main() {
	let joinedArgs = process.argv.slice(2).join(' ')

	// parse id from args, or fetch it from database
	if (!/^\d+$/.test(joinedArgs)) {
		var { id, res } = await getIdFromName(joinedArgs).catch((reason) => {
			if (reason.type === 'empty') {
				console.log(`Failed to resolve artist name: ` + `API returned empty list`.red)
				process.exit(0)
			}
			console.error(`Failed to resolve artist name: ${reason.error}`)
			process.exit(1)
		})
	} else id = parseInt(joinedArgs)

	// fetch group members
	res = await axios.get(`https://api.discogs.com/artists/${id}`, { params: apiAuth }).catch((err) => {
		console.error(`Request failed: ${err}`.red)
		process.exit(1)
	})
	if (!res.data) return console.log(`No data attached, response code: ${res.code}`)
	let origGroup = res.data
	let members = origGroup?.members
	if (!members) return console.log(`Failed to find members list for artist ${origGroup.resource_url}`)

	console.log(`Fetching members for group ${id.toString().cyan}: ${origGroup.name.cyan}`)

	// fetch details of members
	let memberDetails = await fetchMembersDetails(members, res).catch((err) => {
		console.error(`Failed to fetch member details: ${err}`)
		process.exit(1)
	})

	// process details
	let resultObject = processData(memberDetails, origGroup)

	// print and save to json
	console.log(`Found ${resultObject.otherGroups.length} groups with matching members: `)
	for (let group of resultObject.otherGroups) {
		console.log(`${group.name}:`.underline.green)
		for (let member of group.members) console.log(`--- ${member}`.green)
		console.log(' ')
	}
	fs.writeFileSync(`./${origGroup.name}.json`, JSON.stringify(resultObject, null, 4))
	console.log(`Results saved in ${(origGroup.name + '.json').cyan}`)
}
main()
