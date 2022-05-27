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

		let id = res?.data?.results?.[0]?.id
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

		// attempt to fetch all available asynchronously
		if (res.headers['x-discogs-ratelimit-remaining'] > 1) {
			let partialMembers = members.slice(0, res.headers['x-discogs-ratelimit-remaining'] - 1)
			let detailsPromises = partialMembers.map((member) => axios.get(member.resource_url, { params: apiAuth }))
			var responses = await Promise.allSettled(detailsPromises)

			for (let response of responses) {
				// push details and remove from original list
				if (response.status === 'fulfilled') {
					res = response.value
					memberDetails.push(res.data)
					members = members.filter((m) => m.name != res.data.name)
				} else {
					// ignore error 429, exit on any other
					if (response.reason.response.status != 429) {
						return reject(response.value)
					}
				}
			}
			console.log(`Fetched ${memberDetails.length}/${totalMembersCount} members with bulk requests`)
		}

		// progressbar setup
		const barDisplay = new cliProgress.MultiBar({}, cliProgress.Presets.shades_classic)
		const bar_progress = barDisplay.create(totalMembersCount, 0, null, {
			format: ' Member details fetched: {bar} {percentage}% ({value}/{total}) | Status: {status1}',
		})
		bar_progress.start(totalMembersCount, 0)
		bar_progress.update(memberDetails.length, { status1: 'OK' })

		const bar_ratelimit = barDisplay.create(0, 0, null, { format: ' API Rate limit: {bar} {percentage}% ({value}/{total})' })
		bar_ratelimit.start(parseInt(res.headers['x-discogs-ratelimit']), parseInt(res.headers['x-discogs-ratelimit-remaining']))
		bar_ratelimit.update(parseInt(res.headers['x-discogs-ratelimit-remaining']))

		// fetch one by one watching rate limits
		let gotErr = true
		while (memberDetails.length !== totalMembersCount) {
			// API at limit
			if (res.headers['x-discogs-ratelimit-remaining'] == '1' || gotErr) {
				// update progress bars
				bar_progress.update(memberDetails.length, { status1: gotErr ? `Code 429 received.` : 'Rate limit reached' })
				bar_ratelimit.update(0)
				const bar_waiting = barDisplay.create(timoutWait, 0, null, {
					format: ' API at limit. Waiting for cooldown: [{bar}] {percentage}% | {duration}s',
				})

				// wait 5 seconds
				let timestamp = Date.now()
				bar_waiting.start(timoutWait, 0)
				while (timestamp + timoutWait * 1000 > Date.now()) {
					await new Promise((res) => setTimeout(res, 1000))
					bar_waiting.update((Date.now() - timestamp) / 1000)
				}
				bar_waiting.stop()
				barDisplay.remove(bar_waiting)
			}

			// get member details
			let member = members[0]
			try {
				res = await axios.get(member.resource_url, { params: apiAuth })
			} catch (err) {
				// "Error 429"
				if (err.response.status == 429) {
					gotErr = true
					continue
				} else return reject(err)
			}

			// push details to result array
			memberDetails.push(res.data)
			members.shift()
			bar_progress.update(memberDetails.length, { status1: 'OK' })
			bar_ratelimit.update(parseInt(res.headers['x-discogs-ratelimit-remaining']))
			gotErr = false
		}
		bar_progress.update(memberDetails.length)
		bar_ratelimit.update(parseInt(res.headers['x-discogs-ratelimit-remaining']))
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
		.sort((a, b) => a.name.localeCompare(b.name, 'pl')) // sort groups

	for (let g of filteredGroups) g.members.sort((a, b) => a.localeCompare(b, 'pl')) // sort members

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
		var { id, res } = await getIdFromName(joinedArgs).catch(async (reason) => {
			if (reason.type === 'empty') {
				console.log(`Failed to resolve artist name: ` + `API returned empty list`.red)
				process.exit(0)
			} else {
				console.error(`Failed to resolve artist name: ${reason.error}`)
				process.exit(1)
			}
		})
	} else id = parseInt(joinedArgs)

	// fetch group members
	res = await axios.get(`https://api.discogs.com/artists/${id}`, { params: apiAuth }).catch(async (err) => {
		console.error(`Failed to fetch group details: ${err}`.red)
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
