var ADLassetGraph = (function () {
    var self = {}
    self.currentADLgraphURI = null;

    self.getAssetGlobalMappings = function (assetLabel, callback) {


        if (!assetLabel)
            assetLabel = $("#ADLmappings_DatabaseSelect").val();

        var assetMappings = {}
        var builtClasses = {}
        var visjsData = {nodes: [], edges: []}
        var predicates = {}
        var classes = {}
        var mappingsData
        async.series([
            function (callbackSeries) {
                ADLassetGraph.getBuiltMappingsStats(assetLabel, function (err, result) {
                    if (err)
                        return callbackSeries(err)
                    builtClasses = result
                    return callbackSeries();
                })

            },

            //load mappings
            function (callbackSeries) {
                $.ajax({
                    type: "POST",
                    url: Config.serverUrl,
                    data: {getAssetGlobalMappings: assetLabel},
                    dataType: "json",

                    success: function (data, textStatus, jqXHR) {
                        mappingsData = data;
                        return callbackSeries();
                    },
                    error: function (err) {
                        return callbackSeries(err);

                    }
                })
            },
            //draw graph
            function (callbackSeries) {
                var relationalKeys = {}
                for (var key in mappingsData.relationalKeysMap) {
                    relationalKeys[key.toLowerCase()] = mappingsData.relationalKeysMap[key].toLowerCase()
                }


                var existingNodes = {}

                mappingsData.mappings.sort(function (a, b) {
                    var subjectA = common.deconcatSQLTableColumn(a.subject, true).column
                    var subjectB = common.deconcatSQLTableColumn(b.subject, true).column
                    if (subjectA = "id" && subjectB != "id")
                        return -1
                    if (subjectA != "id" && subjectB == "id")
                        return 1
                    return 0;
                })


                mappingsData.mappings.forEach(function (mapping) {

                    if (mapping.predicate == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                        if (!classes[mapping.subject])
                            classes[mapping.subject] = mapping.object
                    }


                    //mark table in tables tree
                    var anchor = $("#" + common.deconcatSQLTableColumn(mapping.subject).table.replace(/\./g, "_") + "_anchor")
                    anchor.css("color", "#86d5f8")

                    var subjectObj = common.deconcatSQLTableColumn(mapping.subject, true)
                    var subjectId = subjectObj.table + "." + subjectObj.column

                    if (subjectObj.column != "id" && (subjectObj.column.indexOf("id") == subjectObj.column.length - 2)) {

                        var subjectBis = relationalKeys[subjectId]

                        if (!subjectBis)
                            return console.log("Missing primary key to" + mapping.subject);


                        var edgeId = subjectId + "_" + "join" + "_" + subjectBis
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1
                            visjsData.edges.push({
                                id: edgeId,
                                from: subjectId,
                                to: subjectBis,
                                dashes: true,
                                color: "blue"
                            })
                        }
                        subjectId = subjectBis;
                    } else {

                    }


                    var borderWidth = 1;
                    var objectId = mapping.object
                    if (true && subjectId.column == "id") {


                        borderWidth = 6
                        var label = objectId
                        var modelObj = mappingsData.model[objectId];
                        if (modelObj)
                            label = modelObj.label
                        var shape = "box"
                        var color = "#eee8dd"
                        var colorKey = ""
                        if (mappingsData.model[objectId] && mappingsData.model[objectId].parents.indexOf("ONE-MODEL") > -1) {
                            colorKey = "ADLmappings_OneModelTree"
                        } else {

                            colorKey = "ADLmappingsjsOtherOntologiesTreeDiv"

                        }
                        color = ADLmappings.sourceTypeColors[colorKey]

                        if (builtClasses[objectId])
                            shape = "ellipse"
                        label = subjectId + " -> " + label
                        if (!existingNodes[subjectId]) {
                            existingNodes[subjectId] = 1
                            visjsData.nodes.push({
                                id: subjectId,
                                label: label,
                                data: {},
                                shape: shape,
                                color: color,
                                widthConstraint: true

                            })
                        }

                        return

                    } else {
                        if (!predicates[mapping.predicate])
                            predicates[mapping.predicate] = {}
                        if (!predicates[mapping.predicate][mapping.subject])
                            predicates[mapping.predicate][mapping.subject] = []
                        predicates[mapping.predicate][mapping.subject].push(mapping.object)
                    }


                    var color = "#eee8dd"

                    if (mapping.predicate.indexOf("DataTypeProperty") > -1)
                        color = "red"
                    if (subjectObj.column == "id")
                        borderWidth = 6
                    //   var subjectId = subjectObj.table + "." + subjectObj.column
                    if (!existingNodes[subjectId]) {

                        existingNodes[subjectId] = 1
                        visjsData.nodes.push({
                            id: subjectId,
                            label: subjectId,
                            shape: "box",
                            color: color,
                            borderWidth: borderWidth,
                            widthConstraint: true,
                            data: {}

                        })

                    }

                    var objectObj = common.deconcatSQLTableColumn(mapping.object, true)
                    if (objectObj)
                        objectId = objectObj.table + "." + objectObj.column

                    if (!existingNodes[objectId] || objectId.indexOf("xsd") > -1) {
                        existingNodes[objectId] = 1
                        var label = objectId
                        var modelObj = mappingsData.model[objectId];
                        if (modelObj)
                            label = modelObj.label
                        var shape = "box"
                        var color = "#eee8dd"

                        if (mapping.predicate == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                            shape = "box"
                            var colorKey = ""
                            if (mappingsData.model[objectId] && mappingsData.model[objectId].parents.indexOf("ONE-MODEL") > -1) {
                                colorKey = "ADLmappings_OneModelTree"
                            } else if (objectId.indexOf("xsd") > -1) {
                                colorKey = "ADLmappings_LiteralsTree"
                                shape = "star"
                                objectId = objectId + common.getRandomHexaId(3)
                            } else {

                                colorKey = "ADLmappingsjsOtherOntologiesTreeDiv"

                            }
                            color = ADLmappings.sourceTypeColors[colorKey]
                        }
//console.log(mapping.predicate)
                        if (mapping.predicate.indexOf("DatatypeProperty") > -1)
                            color = "#dac"

                        visjsData.nodes.push({
                            id: objectId,
                            label: label,
                            data: {},
                            shape: shape,
                            color: color,
                            widthConstraint: true,

                        })

                    }
                    var edgeId = subjectId + "_" + mapping.predicate + "_" + objectId
                    if (!existingNodes[edgeId]) {
                        existingNodes[edgeId] = 1
                        var label = null
                        if (mapping.predicate != "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                            label = mapping.predicate
                            var modelObj = mappingsData.model[mapping.predicate];
                            if (modelObj)
                                label = modelObj.label
                            else {
                                var p = label.lastIndexOf("#")
                                if (p > -1)
                                    label = label.substring(p + 1)
                            }
                        }
                        visjsData.edges.push({
                            id: edgeId,
                            from: subjectId,
                            to: objectId,
                            label: label,
                            length: 2,
                            color: color,
                            width: 3


                        })

                    }

                })

                callbackSeries()


            }

        ], function (err) {
            if (err)
                callback(err)
            var predicates2 = {}
            for (var predicate in predicates) {
                predicates2[predicate] = {}
                for (var subject in predicates[predicate]) {
                    if (!predicates2[predicate][classes[subject]])
                        predicates2[predicate][classes[subject]] = [];
                    predicates[predicate][subject].forEach(function (object) {
                        predicates2[predicate][classes[subject]].push(classes[object])
                    })

                }
            }
            return (callback(null, {visjsData: visjsData, predicates: predicates2, model: mappingsData.model}))
        })


    }
    self.getBuiltMappingsStats = function (assetLabel, callback) {
        //  filterClassesStr = Sparql_common.setFilter("sub", node.data.id)
        var fromStr = Sparql_common.getFromStr(assetLabel)
        var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
            "SELECT (COUNT(?sub) AS ?count) ?type " + fromStr + " WHERE {\n" +
            "  ?sub rdf:type ?type\n" +
            "} group by ?type"

        var url = Config.sources[assetLabel].sparql_server.url + "?format=json&query=";

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: assetLabel}, function (err, result) {
            if (err) {
                return callback(err)
            }
            var buildClasses = {}
            result.results.bindings.forEach(function (item) {
                buildClasses[item.type.value] = {
                    count: item.count.value,
                    color: Lineage_classes.getPropertyColor(item.type.value)
                }
            })
            callback(null, buildClasses)
        })
    }


    self.drawAssetTablesMappingsGraph = function (assetLabel) {
        self.getAssetGlobalMappings(assetLabel, function (err, result) {
            if (err)
                return MainController.UI.message(err);
            var visjsData = result.visjsData
            var options = {
                selectNodeFn: function (node, event) {
                    if (node)
                        self.currentNode = node;
                },
                //  onRightClickFn: self.graphActions.showGraphPopupMenu,
                keepNodePositionOnDrag: 1,
                simulationTimeOut: 10000

                /*    "physics": {
                        "barnesHut": {
                            "gravitationalConstant": -34200,
                            "centralGravity": 0.35,
                            "springLength": 400
                        },
                        "minVelocity": 0.75
                    }*/
            }
            $("#ADLassetGraphDiv").dialog("option", "title", "Global Tables mappings");
            $("#ADLassetGraphDiv").dialog("open")
            setTimeout(function () {

                $("#ADLassetGraphDiv").html("<div id='ADLmappings_GlobalGraph' style='width:100%;height:90%'></div>")
                // $("#mainDialogDiv").height()
                visjsGraph.draw("ADLmappings_GlobalGraph", visjsData, options)
                visjsGraph.network.fit()
            })
        })
    }

    self.drawClassesAndPropertiesGraph = function (source, graphDiv, options, callback) {
        if (!source)
            source = ADLmappingData.currentSource
        if (!source) {
            return alert("select a source")
        }


        self.classes = {}
        var visjsData = {nodes: [], edges: []}


        async.series([
                //get adl types Stats
                function (callbackSeries) {

                    var filterClassesStr = ""

                    self.buildClasses = {}
                    ADLassetGraph.getBuiltMappingsStats(source, function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        self.buildClasses = result
                        return callbackSeries();
                    })


                },
                //get classes from mappings
                function (callbackSeries) {

                    ADLassetGraph.getAssetGlobalMappings(source, function (err, result) {
                        self.model = result.model;
                        for (var predicate in result.predicates) {
                            if (predicate.indexOf("REQ") > -1)
                                var x = 0;
                            for (var subject in result.predicates[predicate]) {
                                if (!self.buildClasses[subject]) {
                                    self.buildClasses[subject] = {
                                        count: 0,
                                        color: Lineage_classes.getPropertyColor(subject)
                                    }
                                }

                                if (!self.classes[subject])
                                    self.classes[subject] = {}
                                if (!self.classes[subject][predicate])
                                    self.classes[subject][predicate] = []
                                result.predicates[predicate][subject].forEach(function (object) {
                                    // if (self.buildClasses[object])
                                    if (object)
                                        self.classes[subject][predicate].push(object)
                                })


                            }

                        }
                        return callbackSeries();
                    })
                },
                function (callbackSeries) {

                    /*  var objectsMap = {}
                      for (var subject in self.classes) {
                          for (var predicate in self.classes[subject]) {

                              self.classes[subject][predicate].forEach(function (object) {
                                  if (!objectsMap[object]) {
                                      objectsMap[object] = {}
                                  }
                                  if (!objectsMap[object][predicate])
                                      objectsMap[object][predicate] = []
                                  if (objectsMap[object][predicate].indexOf(subject) < 0)
                                      objectsMap[object][predicate].push(subject)


                              })

                          }
                      }*/

                    var existingNodes = {}
                    var newParents = []
                    var topNodeId
                    for (var subject in self.classes) {
                        console.log(subject);
                        if (subject.indexOf("1053") > -1)
                            var x = 5
                        if (subject.indexOf("xsd:") < 0) {

                            if (!existingNodes[subject]) {
                                existingNodes[subject] = 1
                                var countStr = ""
                                if (self.buildClasses[subject])
                                    countStr = " (" + self.buildClasses[subject].count + ")"
                                var label = self.model[subject].label+countStr;
                                var color = self.buildClasses[subject].color
                                var shape = "box"
                                if (subject.indexOf("xsd:") > -1) {
                                    shape = "star"
                                    color = "#ffe0aa"
                                }

                               var obj={
                                    id: subject,
                                    label: label,
                                    shape: shape,
                                    color: color,

                                    data: {
                                        id: subject,
                                        type: "subject",
                                        label: self.model[subject].label,
                                        count: self.buildClasses[subject] ? self.buildClasses[subject].count : 0,


                                    }
                                }

                                visjsData.nodes.push(obj)

                            }
                            for (var predicate in self.classes[subject]) {


                                self.classes[subject][predicate].forEach(function (object) {
                                    if (object.indexOf("xsd:") > -1)
                                        return

                                    var edgeId = subject + "_" + predicate + "_" + object
                                    if (!existingNodes[edgeId]) {
                                        existingNodes[edgeId] = 1
                                        var predicateLabel = predicate;
                                        if (self.model[predicate])
                                            predicateLabel = self.model[predicate].label


                                        visjsData.edges.push({
                                            id: edgeId,
                                            from: subject,
                                            to: object,
                                            label: predicateLabel,


                                        })
                                    }

                                    if (!existingNodes[object]) {
                                        existingNodes[object] = 1
                                        var label = self.model[object].label;
                                        var countStr = ""
                                        if (self.buildClasses[subject])
                                            countStr = " (" + self.buildClasses[subject].count + ")"
                                        label=label+countStr
                                        var color = self.buildClasses[object].color
                                        var shape = "box"
                                        if (object.indexOf("xsd:") > -1) {
                                            shape = "star"
                                            color = "#ffe0aa"
                                        }
                                        visjsData.nodes.push({
                                            id: object,
                                            label: label,
                                            shape: shape,
                                            color: color,
                                            data: {
                                                id: object,
                                                type: "subject",
                                                label: label,


                                            }
                                        })
                                    }
                                })


                            }
                        }
                    }


                    return callbackSeries();


                }],
            function (err) {
                if (err)
                    return alert(err)

                if (!graphDiv) {
                    graphDiv = "ADLmappings_GlobalGraph"
                    $("#ADLassetGraphDiv").dialog("option", "title", "Asset Classes and properties");
                    $("#ADLassetGraphDiv").dialog("open")
                    setTimeout(function () {

                        $("#ADLassetGraphDiv").html("<div id='ADLmappings_GlobalGraph' style='width:100%;height:90%'></div>")
                        // $("#mainDialogDiv").height()
                        if (!options)
                            options = {}
                        visjsGraph.draw(graphDiv, visjsData, options)
                        visjsGraph.network.fit()
                    })
                } else {
                    //  $("#ADLassetGraphDiv").html("<div id='ADLmappings_GlobalGraph' style='width:100%;height:90%'></div>")
                    // $("#mainDialogDiv").height()
                    if (!options)
                        options = {}
                    visjsGraph.draw(graphDiv, visjsData, options)
                    visjsGraph.network.fit()

                }
                if (callback)
                    return callback(null, {model: self.model, classes: self.classes})


            })


    }

    self.zoomOnTable = function (nodeData) {
        var visjsId = nodeData.id + ".id"
        var obj = common.deconcatSQLTableColumn(visjsId, true)
        visjsId = obj.table + "." + obj.column
        visjsGraph.network.focus(visjsId, {
            scale: 1,
            animation: true

        })
    }


    return self;


})
()