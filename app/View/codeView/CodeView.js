import ValidateConfigurationView from './ValidateConfigurationView.js';
import CodeCompletionView from './CodeCompletionView.js';

export default class CodeView {

  constructor() {
    this.listeners = [];
    this.ibisdocJson = null;
    this.decorations = null;
    this.decorations = null;
    this.validateConfigurationView;
    this.CodeCompletionView = new CodeCompletionView(this);
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach(l => l.notify(data));
  }

  //make the editor.
  makeEditor(adapter) {
    this.editor = monaco.editor.create(document.getElementById('monacoContainer'), {
      value: adapter,
      language: 'xml',
      theme: "vs-dark",
      glyphMargin: true,
      automaticLayout: true
    });
    this.selectPipe("SwitchInput");
    this.validateConfigurationView = new ValidateConfigurationView(this.editor);
  }

  //function to edit the code in the editor.
  edit(range, name) {
    this.editor.executeEdits("monacoContainer", [{
      range: range,
      text: name
    }]);
  }

  //add options to the dropdown.
  addOptions(adapters) {
    let select = $('#adapterSelect'),
      option,
      name;
    adapters.forEach(function(item, index) {
      name = item.match(/<Configuration[^]*?name=".*?"/g);
      if (name != null) {
        name = name[0].match(/".*?"/g)[0].replace(/"/g, '');
        option = $('<option></option>').attr('value', index).text(name);
        $(select).append(option);
      }
    });
    this.editor.setValue(localStorage.getItem("0"));
  }

  //select a pipe.
  selectPipe(name) {
    let cur = this,
      attributeObjectRegex = '<[\\S]*?[^"/][pP]ipe[\\s\\t\\n][^]*?>[^]*?<[/][\\S]*?[^"/]Pipe>',
      selectPipe = null,
      matches = this.editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);

    matches.forEach(function(item, index) {
      let pipe = cur.editor.getModel().getValueInRange(item.range);
      if (pipe.match('name="' + name + '"', 'g') !== null) {
        selectPipe = item.range;
      }
    });
    if (selectPipe == null) {
      return selectPipe;
    }
    this.decorations = this.editor.deltaDecorations([], [{
      range: selectPipe,
      options: {
        inlineClassName: 'myContentClass'
      }
    }]);
  }

  //change the name.
  changeName(oldWord, newWord) {
    let changed = this.changeNameCode('<[\\S]*?[^"/][pP]ipe(\\n\\t*)?\\s?name="\\w*"', oldWord, newWord);
    if (changed) {
      this.changeNameCode('<forward(\\n\\t*)?(\\s\\w*="(\\s?\\S)*"(\\n\\t*)?)*\\/>', oldWord, newWord);
    }
  }

  //change possition for pipes
  changePossition(name, newX, newY) {
    let cur = this;
    let attributeObjectRegex = '<[\\S]*?[^"/][pP]ipe[\\s\\t\\n][^]*?>';
    let matches = this.editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);
    matches.forEach(function(item, index) {
      let pipe = cur.editor.getModel().getValueInRange(item.range);
      if (pipe.split('"').find(word => word === name)) {
        let newPipe = "";
        if (pipe.split(/[\s=]/).find(word => word == 'x')) {
          pipe = pipe.replace(new RegExp('x="[0-9]*"', 'g'), 'x="' + newX + '"');
          pipe = pipe.replace(new RegExp('y="[0-9]*"', 'g'), 'y="' + newY + '"');
        } else {
          let str = ' x="' + newX + '" y="' + newY + '"';
          if (pipe.indexOf('/>') != -1) {
            pipe = pipe.slice(0, pipe.indexOf('/')) + str + pipe.slice(pipe.indexOf('/'));
          } else {
            pipe = pipe.slice(0, pipe.indexOf('>')) + str + pipe.slice(pipe.indexOf('>'));
          }
        }
        cur.edit(item.range, pipe);
      }
    });
  }

  //change the possitions for the exits
  changeExitPossition(name, newX, newY) {
    let cur = this;
    let adapterName = $('#canvas').text().match(/Adapter:\s.*?\s/g)[0].replace(/Adapter:\s/g, '').replace(' ', '');
    let attributeObjectRegex = '<Adapter name="' + localStorage.getItem("currentAdapter") + '"[\\s\\S\\n]*?<Exit [^]*?\\/>';
    let matches = this.editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);

    matches.forEach(function(item, index) {
      let exit = cur.editor.getModel().getValueInRange(item.range);
      exit = exit.match('<Exit [^]*?\\/>')[0];
      if (exit.indexOf('path="' + name + '"') != -1) {
        if (exit.indexOf('x="') != -1) {
          exit = '\t\t' + exit.replace(/x="[0-9]*?"/g, 'x="' + newX + '"')
            .replace(/y="[0-9]*?"/g, 'y="' + newY + '"');
        } else {
          let str = ' x="' + newX + '" y="' + newY + '"'
          exit = '\t\t' + exit.slice(0, exit.indexOf('/')) + str + exit.slice(exit.indexOf('/'));
        }
        item.range.startLineNumber = item.range.endLineNumber;
        cur.edit(item.range, exit);
      }
    });
  }

  //change the name of an pipe
  changeNameCode(reg, oldWord, newWord) {
    let cur = this;
    let editor = this.editor;
    let changed = false;
    let attributeObjectRegex = reg;
    let matches = editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);
    matches.forEach(function(item, index) {
      let pipe = editor.getModel().getValueInRange(item.range);
      if (pipe.split('"').find(word => word === oldWord)) {
        let newPipe = pipe.replace(new RegExp(oldWord, 'g'), newWord);
        changed = true;
        cur.edit(item.range, newPipe);
      }
    });
    return changed;
  }

  //add a forward
  changeAddForward(name, path) {
    let cur = this;
    let attributeObjectRegex = '<[\\S]*?[^"/][pP]ipe[\\s\\t\\n][^]*?>[^]*?<[/][\\S]*?[^"/]Pipe>';
    let matches = this.editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);
    matches.forEach(function(item, index) {
      let pipe = cur.editor.getModel().getValueInRange(item.range);
      if (pipe.split(/[\s>]/).find(word => word === 'name="' + name + '"')) {
        pipe = pipe.slice(0, pipe.search(/<[/][\S]*?[^"/]Pipe/)) + '\t<Forward name="success" path="' + path + '"/>';
        let newLineRange = {
          endColumn: 1,
          endLineNumber: item.range.endLineNumber,
          startColumn: 1,
          startLineNumber: item.range.endLineNumber
        }
        cur.edit(newLineRange, '\n');
        cur.edit(item.range, pipe);
      }
    });
  }

  //delete a forward to an pipe.
  deleteForward(name, path) {
    let cur = this;
    let attributeObjectRegex = '<[\\S]*?[^"/][pP]ipe[\\s\\t\\n][^]*?>[^]*?<[/][\\S]*?[^"/]Pipe>';
    let matches = this.editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);
    matches.forEach(function(item, index) {
      let pipe = cur.editor.getModel().getValueInRange(item.range);
      if (pipe.split(/[\s>]/).find(word => word === 'name="' + name + '"')) {
        path.toLowerCase() == "exit" ? path = "Exit" : path = path;
        let newPipe = pipe.replace(new RegExp('<Forward[^/]*?path="' + path + '"[^]*?/>', 'gi'), "");
        cur.edit(item.range, newPipe);
      }
    });
  }

  // a method to add a pipe by hand.
  changeAddPipe(name, possitions, className = "customPipe") {
    let cur = this;
    let adapterName = $('#canvas').text().match(/Adapter:\s.*?\s/g)[0].replace(/Adapter:\s/g, '').replace(' ', '');
    let attributeObjectRegex = '<Adapter name="' + localStorage.getItem("currentAdapter") + '"[\\s\\S\\n]*?<Exit';
    let matchString = this.editor.getModel().getValue().match(attributeObjectRegex);

    //'<Exit';
    let matches = this.editor.getModel().findMatches(attributeObjectRegex, false, true, false, false);
    matches.some(function(item, index) {
      let range = item.range;
      range.startColumn = 1;
      range.endColumn = 1;
      range.startLineNumber = range.endLineNumber
      cur.edit(range, '\n');

      let newPipe = '\t\t\t<' + className + ' name="' + name + '" x="' + possitions.x + '" y="' + possitions.y + '">\n\n\t\t\t</' + className + '>\n';
      cur.edit(range, newPipe);
      return true;
    });
  }

  //gives back the types of pipes with the name of the pipe.
  getTypes() {
    let types = {};
    let value = this.editor.getValue();
    let occurences = value.split(/[<>]/);
    let name, type = null;
    let receiver = value.match(/<Receiver[^]*?name=".*?"[^]*?>/g);
    if (receiver != null) {
      receiver = receiver[0].match(/".*?"/g)[0].replace(/"/g, '');
    } else {
      receiver = 'NO_RECEIVER_FOUND'
    }
    types['"receiver" ' + receiver] = "Receiver"
    occurences.forEach(function(item, index) {
      if (item.search(/[^/][\S]*?[^"/]Pipe[^]*?name=".*?"/) > -1) {
        if (item.charAt(0) != '/') {
          let tag = item.slice(item.search(/[^/][\S]*?[^"/]Pipe[^]*?name=".*?"/));
          if (tag.match(/name=".*?"/) != null) {
            name = tag.match(/name=".*?"/)[0].match(/".*?"/)[0].replace(/"/g, '');
          }
          if (tag.match(/[^]*?Pipe/) != null) {
            type = tag.match(/[^]*?Pipe/)[0];
          }
          if (type !== null && name !== null) {
            types[name] = type;
          }
        }
      }
    })
    return types;
  }
}