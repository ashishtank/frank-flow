import PipeView from './PipeView.js';

export default class FlowGenerator {
  constructor(flowView) {
    this.flowView = flowView;
    this.pipeView = new PipeView(flowView);
  }

  addPipe(name = "pipe" + (this.flowView.windows), possitions, extra = "", isExit, descText) {
    return this.pipeView.addPipe(name, possitions, extra, isExit, descText);
  }

  /*
  # if the pipeline is not null empty the canvas
  # for pipe is not null generate each pipe
  # if there is only one pipe only generate that one
  # push all forwards to the forwards array and generate the forwards
  */
  generateFlow(xml, windows) {
    this.flowView.resetWindows();
    let possitions = null;
    let transformedXml = xml;
    if (transformedXml != null && transformedXml.Adapter != null &&
      transformedXml.Adapter.Pipeline != null) {
      instance.reset();
      $('#canvas').empty();
      if (transformedXml.Adapter.Pipeline.pipe != null) {
        $('#canvas').text("Adapter: " + transformedXml.Adapter['@name'] + ' ');
        let pipe = transformedXml.Adapter.Pipeline.pipe;
        let forwards = [];
        if (Array.isArray(pipe)) {
          for (let p in pipe) {
            let name = pipe[p]['@name'],
              xpos = pipe[p]['@x'],
              ypos = pipe[p]['@y'],
              extraText = "",
              descText = null;
            possitions = this.checkPossitions(xpos, ypos);
            if (pipe[p]['@xpathExpression'] != null) {
              extraText = pipe[p]['@xpathExpression'].slice(0, 15) + '...';
            } else if (pipe[p].FixedQuerySender != null && pipe[p].FixedQuerySender['@query'] != null) {
              extraText = pipe[p].FixedQuerySender['@query'].slice(0, 15) + '...';
            }
            if(pipe[p].description != null) {
              console.log(pipe[p].description);
              descText = pipe[p].description;
            }

            this.addPipe(name, possitions, extraText, null, descText);
            if (pipe[p].Forward != null) {
              let forwardData = null;
              if (Array.isArray(pipe[p].Forward)) {
                pipe[p].Forward.forEach(function(item, index) {
                  forwardData = {
                    sourcePipe: name,
                    targetPipe: item['@path'],
                    name: item['@name']
                  };
                  forwards.push(forwardData);
                });
              } else {
                forwardData = {
                  sourcePipe: name,
                  targetPipe: pipe[p].Forward['@path'],
                  name: pipe[p].Forward['@name']
                };
                forwards.push(forwardData);
              }
            } else {
              let nextPipe = parseInt(p) + 1;
              if (pipe[nextPipe] != null) {
                let forwardData = {
                  sourcePipe: name,
                  targetPipe: pipe[nextPipe]['@name'],
                  name: "success"
                }
                forwards.push(forwardData);
              }
            }
          }
        } else {
          let name = pipe['@name'];
          this.addPipe(name);
          if (pipe.Forward != null) {
            let forwardData = null;
            if (Array.isArray(pipe.Forward)) {
              pipe.Forward.forEach(function(item, index) {
                forwardData = {
                  sourcePipe: name,
                  targetPipe: item['@path'],
                  name: item['@name']
                };
                forwards.push(forwardData);
              });
            } else {
              forwardData = {
                sourcePipe: name,
                targetPipe: pipe.Forward['@path'],
                name: pipe.Forward['@name']
              };
              forwards.push(forwardData);
            }
          }
        }
        this.addExits(transformedXml.Adapter.Pipeline.Exit);
        if (possitions === null) {
          this.flowView.setOffsets(false);
        } else {
          this.flowView.setOffsets(true);
        }
        if (transformedXml.Adapter.Receiver != null) {
          let forwardData = this.addReceiver(transformedXml, forwards[0].sourcePipe);
          forwards.push(forwardData);
        }
        this.generateForwards(forwards);
      }
    } else {
      this.flowView.displayError(transformedXml);
    }
  }

  checkPossitions(xpos, ypos) {
    if (xpos == null && ypos != null) {
      xpos = ypos;
    } else if (ypos == null && xpos != null) {
      ypos = xpos;
    }
    if (xpos != null && ypos != null) {
      return {
        x: xpos,
        y: ypos
      }
    } else {
      return null;
    }
  }

  addReceiver(transformedXml, target) {
    this.addPipe('(receiver): ' + transformedXml.Adapter.Receiver['@name'], {
      x: "600",
      y: "400"
    });
    return {
      sourcePipe: '(receiver): ' + transformedXml.Adapter.Receiver['@name'],
      targetPipe: target,
      name: 'request'
    };
  }

  addExits(exits) {
    let exit = exits,
      possitions,
      name,
      ypos,
      xpos;
    if (exit == null) {
      return;
    }
    if (Array.isArray(exit)) {
      let cur = this;
      exit.forEach(function(item, index) {
        name = exit[index]['@path'],
          xpos = exit[index]['@x'],
          ypos = exit[index]['@y'];
        if (xpos != null && ypos != null) {
          possitions = {
            x: xpos,
            y: ypos
          }
        }
        cur.addPipe(name, possitions, "", true);
      });
    } else {
      name = exit['@path'],
        xpos = exit['@x'],
        ypos = exit['@y'];
      if (xpos != null && ypos != null) {
        possitions = {
          x: xpos,
          y: ypos
        }
      }
      this.addPipe(name, possitions, "", true);
    }
  }

  /*
  # a function to search all of the forwards in the transformed json.
  # bind to each connection and update code editor.
  # connect all of the pipes according to the forwards given in this method.
  # @param forwards: a json object with all of the forwards.
  */
  generateForwards(forwards) {
    //when generating set to true and after generating to false.
    let generated = true;
    let cur = this;

    instance.bind("connection", function(i, c) {
      let counter = 0;
      instance.getAllConnections().forEach(function(conn) {
        if (conn.sourceId == i.connection.sourceId && conn.targetId == i.connection.targetId) {
          if (counter < 2) {
            counter++;
          }
        }
      });

      let source = i.sourceEndpoint.element.lastChild.firstElementChild.textContent;
      let target = i.targetEndpoint.element.lastChild.firstElementChild.textContent;
      i.connection.bind("dblclick", function(conn) {
        instance.deleteConnection(conn);
        cur.flowView.modifyFlow('delete', {
          name: source,
          target: target
        });
      })
      //connection already exists so delete the first connection.
      if (counter > 1) {
        instance.getAllConnections().some(function(conn) {
          if (conn.sourceId == i.connection.sourceId && conn.targetId == i.connection.targetId) {
            instance.deleteConnection(conn);
            return true;
          }
        });
        return;
      }

      if (!generated) {
        cur.flowView.modifyFlow('connection', {
          source: source,
          target: target
        });
      }
    });

    //loop over and connect the forwards.
    let sourcePipe = "";
    let targetPipe = "";
    generated = true;
    $(forwards).each(function(index, f) {
      sourcePipe = "";
      targetPipe = "";
      if (f.targetPipe == null) {
        f.targetPipe = f.name;
      }
      $(".sourceWindow").each(function(i, element) {
        var $element = $(element)[0];
        let refactoredText = $element.lastChild.firstChild.innerHTML;
        if (refactoredText == f.sourcePipe) {
          sourcePipe = $($element).attr('id');
        } else if (refactoredText == f.targetPipe) {
          targetPipe = $($element).attr('id');
        }
      });
      let paintStyle = {
        stroke: "#000000",
        strokeWidth: 3
      }
      if (f.name == 'failure' || f.name == 'exception') {
        paintStyle.stroke = "#FF0000";
      } else if (f.name == 'success') {
        paintStyle.stroke = "#22bb33"
      } else if (f.name == "request" || f.name == 'response') {
        paintStyle.dashstyle = "2 4";
      }
      if (sourcePipe != "" && targetPipe != "") {
        instance.connect({
          source: sourcePipe,
          target: targetPipe,
          paintStyle: paintStyle,
          overlays: [
            ["Label", {
              label: f.name,
              id: "label",
              location: 0.1,
              padding: 100
            }]
          ],
          connector: [this.connectorType, {
            stub: [40, 60],
            gap: 10,
            cornerRadius: 5,
            alwaysRespectStubs: true,
            midpoint: 0.0001
          }]
        });
      }
    });
    generated = false;
  }
}