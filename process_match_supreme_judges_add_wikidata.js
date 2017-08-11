const breq = require('bluereq')
const H = require ('highland')
const fs = require ('fs')


var cache = {}
var counter = 0

var out = fs.createWriteStream('/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge_and_wikidata.ndjson')



var path = '/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge.ndjson'
var count = 0
var names = []


var downloadWikidata = function(data,callback){

	var wikiData = {}

	var get = function(qId, cb){

		if (cache[qId]){
			wikiData[qId] = cache[qId]
			cb(null,data)
			return false
		}

		breq.get(`https://query.wikidata.org/sparql?format=json&query=SELECT%20?s%20?item%20?itemLabel%20WHERE%20{wd:${qId}%20?s%20?item.%20SERVICE%20wikibase:label%20{%20bd:serviceParam%20wikibase:language%20%22[AUTO_LANGUAGE],en%22.%20}}`)
			.then((props) => {

				wikiData[qId] = props.body.results.bindings
				cache[qId] = props.body.results.bindings
				cb(null,data)
			})

	}


	H(data.qIds)
		.map(H.curry(get))
	    .nfcall([])
	    .parallel(1)
	    .done(()=>{
	    	data.wikiData = wikiData
	    	callback(null,data)
	    })			

}




H(fs.createReadStream(path))
	.split()
	.compact()
	.map(JSON.parse)
	.map((d)=>{

		process.stdout.write(`Progress: ${++count}\r`)

		var qIds = []
		if (!d.caseBody.caseBodyHeader.opinion){
			console.log(d)
			return ''
		}

		d.caseBody.caseBodyHeader.opinion.forEach((o)=>{
			if (o.authorLinked){
				o.authorLinked.forEach((a)=>{
					if (a && a.wikidata && qIds.indexOf(a.wikidata) == -1) qIds.push(a.wikidata)
				})
			}
		})

		d.qIds = qIds
		return d
		// console.log(d.caseBody.caseBodyHeader.opinion)
	})
	.compact()
	.map(H.curry(downloadWikidata))
    .nfcall([])
    .parallel(1)
    .map((data)=>{
    	// console.log(data)
    	return JSON.stringify(data) + '\n'
    })
	.pipe(out)

