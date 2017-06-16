module.exports = {
  normalizeCourtName: function(courtName) {
  	courtName = courtName.trim()
  	courtName = courtName.replace(/Court`|Court./gi,'Court')
  	courtName = courtName.replace(/Appellate Court Reports|Appellate CourtReports/gi,'Appellate Court')
  	return courtName
  }
}