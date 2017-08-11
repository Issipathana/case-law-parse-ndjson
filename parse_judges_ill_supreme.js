const H = require ('highland')
const fs = require ('fs')

var path = '/Users/thisismattmiller/Downloads/Illcases.ndjson'
var count = 0
var names = []

H(fs.createReadStream(path))
	.split()
	.compact()
	.map(JSON.parse)
	.map((caseData)=>{
		process.stdout.write(`Progress: ${++count}\r`)
		if (!caseData.case) return '' // these are casemets without of any case data

		if (caseData.caseBody.caseBodyHeader && caseData.caseBody.caseBodyHeader.opinion){
			caseData.caseBody.caseBodyHeader.opinion.forEach((o)=>{
				if (o.author){
					o.author.forEach((a)=>{
						if (names.indexOf(a.value) === -1){
							names.push(a.value)
						}
					})
				}else{
					console.log("No Author?")
					console.log(JSON.stringify(o,null,2))

				}

			})
		}
		
	})
	.done(()=>{
		console.log('done')
		names.sort()
		fs.writeFileSync('/Users/thisismattmiller/Downloads/alljudges.json',JSON.stringify(names,null,2))

	})