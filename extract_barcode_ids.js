const H = require ('highland')
const fs = require ('fs')

var path = '/Users/thisismattmiller/Downloads/Illcases.ndjson'
var count = 0
var out = '/Users/thisismattmiller/Downloads/Ill_barcodes.json'
var barcodes = []

H(fs.createReadStream(path))
	.split()
	.compact()
	.map(JSON.parse)
	.map((caseData)=>{
		process.stdout.write(`Progress: ${++count}\r`)
		if (!caseData.case) return '' // these are casemets without of any case data
		
		if (caseData.case.caseId.search('_0001')>-1 && parseInt(caseData.case.decisionDate.substring(0,4)) <= 1923  && parseInt(caseData.caseBody.caseBodyFirstPage)>1){
			console.log(caseData)
			barcodes.push(
			{
				barcode: caseData.case.caseId.split('_')[0],
				year: parseInt(caseData.case.decisionDate.substring(0,4)),
				pageEnd: parseInt(caseData.caseBody.caseBodyFirstPage)-1,
				court: caseData.case.courtName

			}
			)
		}
	}).compact()
	.done(()=>{
		console.log('done')
		fs.writeFileSync(out,JSON.stringify(barcodes,null,2))
	})
