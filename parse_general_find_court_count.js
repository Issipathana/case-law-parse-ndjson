const H = require ('highland')
const fs = require ('fs')
const normalize = require('./lib/normalize')

var path = '/Users/thisismattmiller/Downloads/Illcases.ndjson'

var courts = {}
var count = 0

H(fs.createReadStream(path))	
	.split()
	.compact()
	.map(JSON.parse)
	.map((caseData)=>{
		process.stdout.write(`Progress: ${++count}\r`)
		if (!caseData.case) return '' // these are casemets without of any case data
		caseData.case.courtName = normalize.normalizeCourtName(caseData.case.courtName)
		if (!courts[caseData.case.courtName]) courts[caseData.case.courtName] = 0
		courts[caseData.case.courtName]++
	})
	.done(()=>{
		console.log('done')
		console.dir(courts)
	})
