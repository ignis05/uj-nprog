let dataObj = {
	XML: {
		'standard release date': 1998,
		'example libraries': [
			{ 'C++': ['rapidXML', 'tinyXML2'] },
			{ Python: ['xml.etree.ElementTree'] },
			{ Java: ['DOM Parser', 'SAX Parser'] },
		],
		'supports bool': true,
		'% of Stack Overflow questions in 2019': 0.79,
	},
	JSON: {
		'standard release date': 2017,
		'example libraries': [{ 'C++': ['rapidJSON'] }, { Python: ['json'] }, { Java: ['org.json', 'Google GSON'] }, { Fortran: null }],
		'supports bool': false,
		'% of Stack Overflow questions in 2019': 1.45,
	},
}

dataObj.JSON['example libraries'].push({ 'javascript': ['-'] })

require('fs').writeFileSync('data.json', JSON.stringify(dataObj, null, 4))
