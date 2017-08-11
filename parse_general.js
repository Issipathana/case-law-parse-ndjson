const H = require ('highland')
const fs = require ('fs')

var path = '/Users/thisismattmiller/Downloads/Illcases.ndjson'
var count = 0

H(fs.createReadStream(path))
	.split()
	.compact()	
	.map(JSON.parse)
	.map((caseData)=>{
		process.stdout.write(`Progress: ${++count}\r`)
		if (!caseData.case) return '' // these are casemets without of any case data
		console.log(caseData)
	})
	.done(()=>{
		console.log('done')
	})
