const H = require ('highland')
const fs = require ('fs')
const normalize = require('./lib/normalize')

var path = '/Users/thisismattmiller/Downloads/Illcases.ndjson'

var courts = {}
var count = 0
var marks = {}

H(fs.createReadStream(path))	
	.split()
	.compact()
	.map(JSON.parse)
	.map((caseData)=>{
		process.stdout.write(`Progress: ${++count}\r`)
		if (!caseData.case) return '' // these are casemets without of any case data

		if (caseData.caseBody.caseBodyHeader.footnote){
			caseData.caseBody.caseBodyHeader.footnote.forEach((f)=>{
				if (!marks[f.mark]) marks[f.mark] = 0
				marks[f.mark]++
			})
		}

		if (caseData.caseBody.caseBodyHeader.opinion){
			caseData.caseBody.caseBodyHeader.opinion.forEach((o)=>{
				if (o.footnote){
					o.footnote.forEach((f)=>{
						if (!marks[f.mark]) marks[f.mark] = 0
						marks[f.mark]++
						
					})
				}
			})
		}



	})
	.done(()=>{
		console.log('done')
		let entries = Object.entries(marks);
		let sorted = entries.sort((a, b) => b[1] - a[1]);
		console.log(sorted)

		sorted.forEach((el)=>{
			console.log(el[0],',',el[1])
		})

	})
