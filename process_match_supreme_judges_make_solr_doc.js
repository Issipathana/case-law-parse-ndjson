const H = require ('highland')
const fs = require ('fs')

var out = fs.createWriteStream('/Users/thisismattmiller/Downloads/Illcases_solr_docs.ndjson')
var path = '/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge_and_wikidata_processed_and_ner.ndjson'
var count = 0
var keepProps = [
   "sex or gender",
   "occupation",
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

H(fs.createReadStream(path))
	.split()
	.compact()
	.map(JSON.parse)
	.map((caseData)=>{
		process.stdout.write(`Progress: ${++count}\r`)

		// console.log(caseData.caseBody.caseBodyHeader.opinion)
		var docs = []

		caseData.caseBody.caseBodyHeader.opinion.forEach((o)=>{

			if (!o.authorLinked) return 



			var solrDoc = {
				id : caseData.case.caseId,
				tital_display : caseData.case.caseAbbreviation,
				pub_date : caseData.case.decisionDate,
				format: o.type,
				language_facet: o.authorLinked.map((a)=> {return (a && a.name) ? a.name : ""}),
				wikipedia: o.authorLinked.map((a)=> {return (a && a.wikipedia_slug) ? a.wikipedia_slug : ""}),
				wikidata: o.authorLinked.map((a)=> {return (a && a.wikidata) ? a.wikidata : ""}),
				subject_topic_facet: caseData.nerOrganizations,
				subject_geo_facet: caseData.nerLocations,



			}


			o.authorLinked.forEach((a)=>{ 
				if (a && a.wikiDataTerms){
					a.wikiDataTerms.forEach((term)=>{
						if (keepProps.indexOf(term[0])>-1){
							term[0] = term[0].replace(/\s/g,'_')
							if (!solrDoc[term[0]]) solrDoc[term[0]] = []
							solrDoc[term[0]].push(term[1])
						}
					})
				}
			})



			solrDoc.text = caseData.allText
			docs.push(solrDoc)


		})

		var text = ''
		docs.forEach((d)=>{
			text = text + JSON.stringify(d) +'\n'
		})

		return text
	})
	.pipe(out)