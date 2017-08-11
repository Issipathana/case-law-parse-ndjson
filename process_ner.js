const { exec } = require('child_process');
const H = require ('highland')
const fs = require ('fs')
const xpath = require('xpath')
const dom = require('xmldom').DOMParser


var out = fs.createWriteStream('/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge_and_wikidata_processed_and_ner.ndjson')


var path = '/Users/thisismattmiller/Downloads/Illcases_supreme_with_judge_and_wikidata_processed.ndjson'
var count = 0
var names = []



var counter = 0


var ner = function(data,callback){

	fs.writeFile(`/tmp/${data.case.caseId}.txt`,data.allText, (err,r)=>{
		exec(`/Users/thisismattmiller/Downloads/stanford-ner-2017-06-09/ner.sh /tmp/${data.case.caseId}.txt`, (error, stdout, stderr) => {
			console.log(stdout.toString())	
			fs.unlink(`/tmp/${data.case.caseId}.txt`, (err,r)=>{
				var people = []
				var locations = []
				var organizations = []
				var doc = new dom().parseFromString(stdout.toString())
				var nodes = xpath.select("//PERSON", doc)
				nodes.forEach((n)=>{
					Object.keys(n.childNodes).forEach((cn)=>{
						if (n.childNodes[cn].nodeValue && people.indexOf(n.childNodes[cn].nodeValue) === -1) people.push(n.childNodes[cn].nodeValue)
					})
				})

				var nodes = xpath.select("//ORGANIZATION", doc)
				nodes.forEach((n)=>{
					Object.keys(n.childNodes).forEach((cn)=>{
						if (n.childNodes[cn].nodeValue && organizations.indexOf(n.childNodes[cn].nodeValue) === -1) organizations.push(n.childNodes[cn].nodeValue)
					})
				})

				var nodes = xpath.select("//LOCATION", doc)
				nodes.forEach((n)=>{
					Object.keys(n.childNodes).forEach((cn)=>{
						if (n.childNodes[cn].nodeValue && locations.indexOf(n.childNodes[cn].nodeValue) === -1) locations.push(n.childNodes[cn].nodeValue)
					})
				})
				

				data.nerLocations = locations
				data.nerPeople = people
				data.nerOrganizations = organizations

				//ORGANIZATION
				// LOCATION
				callback(null,data)	
			})
		})
	})
	// results = execSync();


}

H(fs.createReadStream(path))
	.split()
	.compact()
	.map(JSON.parse)
	.map((d)=>{

		process.stdout.write(`Progress: ${++count}\r`)
		d.allText = ''		
		d.caseBody.caseBodyHeader.opinion.forEach((o)=>{
		
			if (o.p){
				o.p.forEach((p)=>{
					d.allText = d.allText + p.value +'\n'
				})
			}
			if (o.blockquote){
				o.blockquote.forEach((blockquote)=>{
					d.allText = d.allText + blockquote.value +'\n'
				})
			}			

		



			// console.log(results.toString().split(' words per second.\n')[1])
		})



		return d

	})
	.compact()
	.map(H.curry(ner))
    .nfcall([])
    .parallel(7)

    .map((data)=>{
    	// console.log(data)
    	return JSON.stringify(data) + '\n'
    })
    // .done(()=>{
    // 	console.log(JSON.stringify(propsUnique,null,3))
    // })
	.pipe(out)



// 
// console.log(code.toString())

