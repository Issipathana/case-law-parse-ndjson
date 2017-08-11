
Object.keys(require.cache).forEach(function(key) {
delete require.cache[key];
}); 


const humanname = require('humanname')
const H = require ('highland')
const fs = require ('fs')
const judgesRegex = require('../case-law-regex-lib/judges')
const illSupremeJudges = require('../case-law-judge-directory/il_supreme/output.json')
const dice = require('talisman/metrics/distance/dice')

var PImage = require('pureimage');
var imageCounter = 0
var crypto = require('crypto');

// build a lookup by year of the judges
var lookUpByYear = {}
Object.keys(illSupremeJudges).forEach((k)=>{
	var start = parseInt(illSupremeJudges[k].start)
	if (illSupremeJudges[k].end === '') illSupremeJudges[k].end = 2017
	var end = parseInt(illSupremeJudges[k].end)
	
	var diff = end - start;
	const res = [...Array(diff)].map((_, i) => {
	  	if (!lookUpByYear[start+i]) lookUpByYear[start+i] = []
	  	lookUpByYear[start+i].push(illSupremeJudges[k])


	});
	if (!lookUpByYear[end]) lookUpByYear[end] = []
	lookUpByYear[end].push(illSupremeJudges[k])

})


var diceCheck = function(possibleJudgesNames, judge){


	// let's try to match with dice algo
	var best = null
	var bestScore = null
	possibleJudgesNames.forEach((n)=>{
		var nParts = humanname.parse(n)
		var score = dice(judge.last.toLowerCase(),nParts.lastName.toLowerCase())
		if (score>bestScore){
			bestScore = score
			best = n
		}
	})

	return [best,bestScore]

}



var path = '/Users/thisismattmiller/Downloads/Illcases.ndjson'
var count = 0
var badNameLookup = {}

var fnt = PImage.registerFont('/Users/thisismattmiller/Downloads/sourcesanspro-regular.ttf','Source Sans Pro');
fnt.load(function() {
		H(fs.createReadStream(path))
			.split()
			.compact()	
			.map(JSON.parse)
			.map((caseData)=>{
				// process.stdout.write(`Progress: ${++count}\r`)
				if (!caseData.case) return '' // these are casemets without of any case data

				if (caseData.case.courtName.search(/supreme/i)==-1) return ''

				var year = caseData.case.decisionDate.match(/^[0-9]{4}/)
				if (!year) return ''
				year = parseInt(year[0]	)

				if (!lookUpByYear[year]){
					console.log('No judge data for year',year)
					console.log(caseData.case)
					return ''
				}
				

				if (caseData && caseData.caseBody && caseData.caseBody.caseBodyHeader && caseData.caseBody.caseBodyHeader.opinion){
					caseData.caseBody.caseBodyHeader.opinion.forEach((o)=>{
						if (o && o.author && o.author[0].value){
							
							o.author[0].value = o.author[0].value.replace('{footnotemarkstart}','').replace('{footnotemarkend}','')

							var judge = judgesRegex.normalizeNameField(o.author[0].value)
							judge = judgesRegex.extractJudgeNames(judge)



							if (judge.length!=0){

								var alludgesForThisOpinion = []

								judge.forEach((j)=>{

									var useJudge = []




									// var result= string.search(new RegExp(searchstring, "i"));

									var localLookUp = {}

									var possibleJudgesNames = lookUpByYear[year].map((x)=>{
										localLookUp[x.name] = x;
										return x.name}
									)

									// first match on last name
									possibleJudgesNames.forEach((n)=>{
										var nParts = humanname.parse(n)
										if (nParts.lastName.search(new RegExp(j.last, "i")) > -1){
											useJudge.push(localLookUp[n])
										}								
										

									})


									if (j.last.search(/curiam|court/i)>-1){
										useJudge = lookUpByYear[year]
									}

									if (useJudge.length==0){

										// // let's try to match with dice algo
										// var best = null
										// var bestScore = null
										// possibleJudgesNames.forEach((n)=>{
										// 	var nParts = humanname.parse(n)
										// 	// console.log(nParts.lastName)
										// 	var score = dice(j.last.toLowerCase(),nParts.lastName.toLowerCase())
										// 	if (score>bestScore){
										// 		bestScore = score
										// 		best = n
										// 	}
										// })

										var [best, bestScore] = diceCheck(possibleJudgesNames,j)

										//check the year before
										if (best == null){
											var [best, bestScore] = diceCheck(lookUpByYear[year-1].map((x)=>{return x.name}),j)
											if (bestScore >= 0.25) possibleJudgesNames = lookUpByYear[year-1].map((x)=>{return x.name})
										}
										// check the year after
										if (best == null || bestScore < 0.25){
											var [best, bestScore] = diceCheck(lookUpByYear[year+1].map((x)=>{return x.name}),j)
											if (bestScore >= 0.25) possibleJudgesNames = lookUpByYear[year+1].map((x)=>{return x.name})
										}

										


										if (best == null || bestScore < 0.25){								
											console.log(o.author[0].value)
											console.log(year)
											console.log(j)
											console.log(j.last)
											console.log(best,bestScore)
											console.log(possibleJudgesNames)
											// console.log(lookUpByYear[year+1].map((x)=>{return x.name}))
											// console.log(lookUpByYear[year-1].map((x)=>{return x.name}))
											console.log('-----')
										}

										if (!badNameLookup[o.author[0].value]){

												badNameLookup[o.author[0].value] = true

										        var img = PImage.make(800,500);
										        var ctx = img.getContext('2d');
										        ctx.fillStyle = '#ffffff';
										        ctx.font = "38pt 'Source Sans Pro'";
										        ctx.fillText(o.author[0].value, 10, 40);
										        ctx.fillText(year.toString(), 10, 480);

												PImage.encodePNGToStream(img, fs.createWriteStream(`/Users/thisismattmiller/Downloads/judge_gif/${crypto.createHash('md5').update(o.author[0].value).digest("hex")}_1.png`)).then(()=> {
												    console.log("wrote out the png file to out.png");

											        ctx.font = "38pt 'Source Sans Pro'";
											        ctx.fillText(j.last, 10, 250);
													PImage.encodePNGToStream(img, fs.createWriteStream(`/Users/thisismattmiller/Downloads/judge_gif/${crypto.createHash('md5').update(o.author[0].value).digest("hex")}_2.png`)).then(()=> {
													    console.log("wrote out the png file to out.png");
													    
													    var y = 120
													    possibleJudgesNames.forEach((n)=>{
													    	ctx.fillText(n, 350, y);
													    	y = y + 40;

													    })

														PImage.encodePNGToStream(img, fs.createWriteStream(`/Users/thisismattmiller/Downloads/judge_gif/${crypto.createHash('md5').update(o.author[0].value).digest("hex")}_3.png`)).then(()=> {
														    console.log("wrote out the png file to out.png");
														    
														    var y = 120
														    
														    possibleJudgesNames.forEach((n)=>{
														    	console.log(n,best)
														    	if (n == best){
														    		ctx.fillStyle = '#00ff00';
														    		ctx.fillText(n + ` (%${Math.floor(bestScore*100)})`, 350, y);
														    	}else{
														    		ctx.fillStyle = '#ffffff';
														    		ctx.fillText(n, 350, y);
														    	}
														    	
														    	y = y + 40;

														    })

															PImage.encodePNGToStream(img, fs.createWriteStream(`/Users/thisismattmiller/Downloads/judge_gif/${crypto.createHash('md5').update(o.author[0].value).digest("hex")}_4.png`)).then(()=> {
															    console.log("wrote out the png file to out.png");
															    // process.exit()
															}).catch((e)=>{
															    console.log("there was an error writing");
															});	


														}).catch((e)=>{
														    console.log("there was an error writing");
														});	


													}).catch((e)=>{
													    console.log("there was an error writing");
													});	



												}).catch((e)=>{
												    console.log("there was an error writing");
												});								        
										    							



										}

										// console.log(possibleJudgesNames)	
									}
									// console.log(o.author[0].value)
									// console.log(useJudge)
									// console.log()
									// console.log('-----')


								})

							}else{

							}
							// console.log(judge)

						}
						
					})	
				}
				

			})
			.done(()=>{
				console.log('done')
			})
})