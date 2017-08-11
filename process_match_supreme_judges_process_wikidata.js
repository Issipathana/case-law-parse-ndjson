const breq = require('bluereq')
const H = require ('highland')
const fs = require ('fs')


var props = {}
var cache = {}
var counter = 0
var propsUnique = []
var keepProps = [
   "sex or gender",
   "country of citizenship",
   "occupation",
   "date of birth",
   "date of death",
   "educated at",
   "place of birth",
   "place of death",
   "position held",
   "member of political party",
   "conflict",
   "member of sports team",
   "position played on team / speciality",
   "military branch",
   "medical condition",
   "religion",
   "award received"
   ]

var out = fs.createWriteStream('/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge_and_wikidata_processed.ndjson')


breq.get('https://quarry.wmflabs.org/run/45013/output/1/json')
.then((props) => {
	props.body.rows.forEach((p)=>{
		props[p[0]] = p[1]
	})


	var path = '/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge_and_wikidata.ndjson'
	var count = 0
	var names = []




	H(fs.createReadStream(path))
		.split()
		.compact()
		.map(JSON.parse)
		.map((d)=>{

			var lookup = {}
			process.stdout.write(`Progress: ${++count}\r`)
			Object.keys(d.wikiData).forEach((k)=>{
				d.wikiData[k].forEach((s)=>{
					var pId = s.s.value.match(/http:\/\/www.wikidata.org\/prop\/direct\/(P[0-9]+)/)
					if (pId){
						// to create the list
						// if (propsUnique.indexOf(props[pId[1]]) === -1) propsUnique.push(props[pId[1]])
						if (!lookup[k]) lookup[k] = []

						if (keepProps.indexOf(props[pId[1]])!==-1) lookup[k].push([props[pId[1]], s.itemLabel.value ])

						
					}
				})
				
			})

			d.caseBody.caseBodyHeader.opinion.forEach((o)=>{
				if (o.authorLinked){
					o.authorLinked.forEach((al)=>{
						if (al && al.wikidata) al.wikiDataTerms = lookup[al.wikidata]
					})

				}
			})

			return d

		})
		.compact()
	    .map((data)=>{
	    	// console.log(data)
	    	return JSON.stringify(data) + '\n'
	    })
	    // .done(()=>{
	    // 	console.log(JSON.stringify(propsUnique,null,3))
	    // })
		.pipe(out)

	
})




