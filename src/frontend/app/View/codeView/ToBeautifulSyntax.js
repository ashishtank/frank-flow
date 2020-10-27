export default class ToBeautifulSyntax {

  constructor() {
  }

  //convert ugly ibis code to beautiful syntax.
  toBeautifulSyntax(xml) {

    let matches = xml.match(/<pipe(\n\t*)?(\s\w*="(\s?\S)*"(\n\t*)?)*>[^]*?<\/pipe>/g),
      doc = xml,
      exits;

    if (matches == null) return xml;

    matches.forEach(function(item, index) {

      let oldPipe = item,
        newPipe = "";

      let className = oldPipe.match(/className=".*?"/)[0].match(/\.[^.]*?"/)[0].replace(/[".]/g, '');

      if (className.match(/.*?Pipe/) == null) {
        className = className + 'Pipe';
      }

      newPipe = oldPipe.replace(/className=".*?"/g, '');
      newPipe = newPipe.replace(/<pipe/g, '<' + className)
                       .replace(/<\/pipe>/, '</' + className + '>')

      doc = doc.replace(oldPipe, newPipe);
    });

    doc = doc.replace(/<listener[^]*?className=".*?"[^]*?\/>/g, function(txt) {

        let className = txt.match(/className=".*?"/)[0].match(/\.[^.]*?"/)[0].replace(/[".]/g, '');

        txt = txt.replace(/className=".*?"/g, '');
        txt = '<' + txt.replace(/<.*? /g, className + " ");
        return txt;
      })
      
      .replace(/<[\/]?[a-zA-Z]/g, function(txt) {
        return txt.toUpperCase()
      });

    exits = doc.match(/<Exits>[^]*?<\/Exits>/)[0].replace(/<\/?Exits>/g, '').replace(/\t/, '');
    doc = doc.replace(/<Exits>[^]*?<\/Exits>/g, '')
      .replace(/<\/Pipeline>/g, exits + '\n \t\t</Pipeline>')
      .replace(/className=".*?"/g, "");
    
    return doc;
  }
}