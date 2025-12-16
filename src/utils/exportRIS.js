export function exportToRIS (references) {
  const _refs = JSON.parse(JSON.stringify(references))
  let content = ''
  for (let ref of _refs) {
    content += processRIS(ref)
  }

  var element = document.createElement('a')
  element.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURI(content))
  element.setAttribute('download', 'references.ris')
  element.click()
}

function processRIS (reference = {}) {
  let txt = ''

  if (Object.prototype.hasOwnProperty.call(reference, 'type')) {
    txt += 'TY  - ' + reference.type + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'abstract')) {
    txt += 'AB  - ' + reference.abstract + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'title')) {
    txt += 'TI  - ' + reference.title + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
    var cnt = 1
    for (let a of reference.authors) {
      txt += `A${cnt}  - ` + a + '\r\n'
      cnt++
    }
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'publication_year')) {
    txt += 'PY  - ' + reference.publication_year + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'database')) {
    txt += 'DB  - ' + reference.database + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'volume_number')) {
    txt += 'VL  - ' + reference.volume_number + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'url')) {
    txt += 'UR  - ' + reference.url + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'start_page')) {
    txt += 'SP  - ' + reference.start_page + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'isbn_issn')) {
    txt += 'SN  - ' + reference.isbn_issn + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'date')) {
    txt += 'DA  - ' + reference.date + '\r\n'
  }
  if (Object.prototype.hasOwnProperty.call(reference, 'user_definable')) {
    var count = 1
    for (let c of reference.user_definable) {
      txt += `C${count} - ` + c + '\r\n'
      count++
    }
  }
  txt += 'ER  - ' + '\r\n'
  return txt
}
