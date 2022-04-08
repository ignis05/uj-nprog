let data = {
	XML: {
		standard_release_date: 1998,
		example_libraries: [{ 'Cpp': ['rapidXML', 'tinyXML2'] }, { Python: ['xml.etree.ElementTree'] }, { Java: ['DOM Parser', 'SAX Parser'] }],
		supports_bool: true,
		percent_of_Stack_Overflow_questions_in_2019: 0.79,
	},
	JSON: {
		standard_release_date: 2017,
		example_libraries: [{ 'Cpp': ['rapidJSON'] }, { Python: ['json'] }, { Java: ['org.json', 'Google GSON'] }, { Fortran: null }],
		supports_bool: false,
		percent_of_Stack_Overflow_questions_in_2019: 1.45,
	},
}

const toXML = require('object-to-xml')

let xmlString = toXML({ data })
console.log(xmlString)
require('fs').writeFileSync('data.xml', xmlString)
