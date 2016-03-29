/// <reference path="../main-parser.ts"/>

namespace Parsers {

  export class AMA {

    private _isManual: boolean = true;

    public parse(data: ReferencePayload): string[]|Error {
      let pmidArray: string[]|boolean = data.uids || false;

      if (pmidArray) {
        this._isManual = false;
        return this._fromPMID(data, (pmidArray as string[]));
      }

      return [this._fromManual(data)];
    }

    private _fromPMID(data: ReferencePayload, pmidArray: string[]): string[]|Error {
      let output: string[]|Error;
      try {
        output = pmidArray.map((PMID: string): string => {
          let ref: ReferenceObj = data[PMID];
          let year: string = ref.pubdate.substr(0, 4);
          let link  = MainParser.includeLink === true
                    ? ` PMID: <a href="http://www.ncbi.nlm.nih.gov/pubmed/${PMID}" target="_blank">${PMID}</a>`
                    : '';

          let authors: string|Error = this._parseAuthors(ref.authors);
          if ((authors as Error).name === 'Error') {
            throw authors;
          }

          return `${authors} ${ref.title} <em>${ref.source}.</em> ${year}; ` +
                 `${ref.volume === undefined || ref.volume === '' ? '' : ref.volume}` +
                 `${ref.issue === undefined || ref.issue === '' ? '' : '('+ref.issue+')'}:` +
                 `${ref.pages}.${link}`;
        });
      } catch(e) {
        return e;
      }
      return output;
    }

    private _fromManual(data: ReferencePayload): string {

      let payload: string;
      switch (MainParser.manualCitationType) {
        case 'journal':
          payload = this._parseJournal(data);
          break;
        case 'website':
          payload = this._parseWebsite(data);
          break;
        case 'book':
          payload = this._parseBook(data);
          break;
      }

      return payload;
    }

    private _parseAuthors(authorArr: Author[]): string|Error {
      let authors: string = '';
      switch (authorArr.length) {
        case 0:
          if (this._isManual === true) { break; }
          return new Error(`No authors were found for given reference`);
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
          authors = authorArr.map((author: Author) => author.name).join(', ') + '.';
          break;
        default:
          for (let i = 0; i < 3; i++) { authors+= authorArr[i].name + ', ' };
          authors += 'et al.';
      }
      return authors;
    }

    private _parseJournal(data: ReferencePayload): string {
      let authors = this._parseAuthors(data[0].authors);
      let year = (new Date(data[0].pubdate).getFullYear() + 1).toString();
      let source = data[0].source.toTitleCase();
      let issue = `(${data[0].issue})` || '';
      let volume = data[0].volume || '';

      return `${authors} ${data[0].title}. <em>${source}.</em> ${year}; ` +
             `${volume}${issue}:${data[0].pages}.`;
    }

    private _parseWebsite(data: ReferencePayload): string {
      let authors = data[0].authors.length > 0
        ? this._parseAuthors(data[0].authors) + ' '
        : '';
      let pubdate: string = `Published ${new Date(data[0].pubdate).toLocaleDateString('en-us', {month: 'long', year: 'numeric'})}. `;
      let updated: string = data[0].updated !== ''
      ? `Updated ${new Date(data[0].updated).toLocaleDateString('en-us', {month: 'long', day: 'numeric', year: 'numeric'})}. `
      : ''
      let accessed: string = data[0].accessdate !== ''
        ? `Accessed ${new Date(data[0].accessdate).toLocaleDateString('en-us', {month: 'long', day: 'numeric', year: 'numeric'})}. `
        : `Accessed ${new Date(Date.now()).toLocaleDateString('en-us', {month: 'long', day: 'numeric', year: 'numeric'})}`;

      return `${authors}${data[0].title}. <em>${data[0].source}</em>. Available at: ` +
      `<a href="${data[0].url}" target="_blank">${data[0].url}</a>. ${pubdate}${updated}${accessed}`;
    }

    private _parseBook(data: ReferencePayload): string {
      console.log(data)
      let authors = this._parseAuthors(data[0].authors);
      let title = data[0].title;
      let pubLocation = data[0].location !== ''
        ? `${data[0].location}:`
        : ``;
      let publisher = data[0].source;
      let year = data[0].pubdate;
      let chapter = data[0].chapter !== ''
        ? ` ${data[0].chapter}. In:`
        : ``;
      let pages = data[0].pages !== ''
        ? `: ${data[0].pages}.`
        : `.`;

      return `${authors}${chapter} <em>${title}</em>. ${pubLocation}${publisher}; ${year}${pages}`;
    }

  }

}