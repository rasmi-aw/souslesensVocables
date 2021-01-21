var Lineage_classes = (function () {

        var expandedLevels = {};
        var sourceColors = {}
        var orphanShape = "square";
        var defaultShape = "dot";
        var defaultShapeSize = 5;
        var objectPropertyColor = "red"
        var restrictionColor="orange"
        var maxChildrenDrawn = 15



        var self = {}
        self.maxClusterOpeningLength = 50
        self.currentSource;

        self.onLoaded = function () {
            MainController.UI.message("");


            $("#accordion").accordion("option", {active: 2});
            $("#actionDivContolPanelDiv").load("snippets/lineage/lineage.html")
            //   MainController.UI.toogleRightPanel("open");
            $("#rightPanelDiv").load("snippets/lineage/lineageRightPanel.html")
            ThesaurusBrowser.currentTargetDiv = "LineagejsTreeDiv"


            var w = $(document).width() - leftPanelWidth
            var h = $(document).height() - 30;
            // $("#centralPanel").width(w)
            $("#centralPanelDiv").width(w - rightPanelWidth)
            $("#rightPanelToogleButton").css("display", "block")
            $("#rightPanelDiv").width(rightPanelWidth)


            setTimeout(function () {
                var sourceLabels = []


                for (var key in Config.sources) {
                    if (Config.currentProfile.allowedSourceSchemas.indexOf(Config.sources[key].schemaType) > -1)
                        sourceLabels.push(key)
                }
                sourceLabels.sort()
                //  common.fillSelectOptions("Lineage_toSource", sourceLabels, true)
                $("#Lineage_Tabs").tabs({
                    activate: function (e, ui) {
                        self.currentOwlType = "Class"
                        var divId = ui.newPanel.selector;
                        if (divId == "#LineageTypesTab") {
                            self.currentOwlType = "Type"
                            Lineage_types.init()
                        } else if (divId == "#LineagePropertiesTab") {
                            self.currentOwlType = "ObjectProperty"
                            Lineage_properties.init()
                        }
                    }

                });
                $("#GenericTools_searchSchemaType").val("OWL")
                MainController.UI.showSources("Lineage_sources", false)
                /* if (sourceLabel) {
                     ThesaurusBrowser.showThesaurusTopConcepts(sourceLabel, {targetDiv: "LineagejsTreeDiv"})
                     Lineage_classes.drawTopConcepts(sourceLabel)

                 }*/

            }, 200)

        }


        self.onSourceSelect = function (sourceLabel) {


            if(sourceLabel && !self.currentSource) {
                ThesaurusBrowser.showThesaurusTopConcepts(sourceLabel, { targetDiv: "LineagejsTreeDiv"})
                Lineage_classes.drawTopConcepts(sourceLabel)
            }
            self.currentSource = sourceLabel
            MainController.currentSource=sourceLabel
            $("#GenericTools_onSearchCurrentSourceInput").css("display","block")

        }
        self.jstreeContextMenu = function () {
            var items = {}

            items.drawTopConcepts = {
                label: "draw taxonomy",
                action: function (e) {// pb avec source
                    $("#Lineage_topClassesRadio").prop("checked", true)
                    Lineage_classes.drawTopConcepts()
                 //   self.showThesaurusTopConcepts()
                    ThesaurusBrowser.showThesaurusTopConcepts(self.currentSource, {targetDiv: "LineagejsTreeDiv"})

                }
            }
                , items.addSimilarlabels = {
                label: "add similars (label)",
                action: function (e) {// pb avec source
                    $("#Lineage_similarTypeRadio_Labels").prop("checked", true)
                    Lineage_classes.drawSimilarsNodes()

                }
            },
                items.addSameAs = {
                    label: "add similars (sameAs)",
                    action: function (e) {// pb avec source
                        $("#Lineage_similarTypeRadio_SameAs").prop("checked", true)
                        Lineage_classes.drawSimilarsNodes()

                    }
                }

            return items;

        }

        self.selectTreeNodeFn = function (event, propertiesMap) {
           ThesaurusBrowser.currentTreeNode= propertiesMap.node;
            var data = propertiesMap.node.data;

            if (propertiesMap.event.ctrlKey)
                self.addArbitraryNodeToGraph(data)
            ThesaurusBrowser.openTreeNode(ThesaurusBrowser.currentTargetDiv, data.source, propertiesMap.node, {ctrlKey: propertiesMap.event.ctrlKey})
        }
        self.initUI = function () {
            MainController.UI.message("")
            visjsGraph.clearGraph()
            expandedLevels = {}
          //  self.currentSource = null;
            $("#lineage_drawnSources").html("");
            // $("#Lineage_toSource").val("")
        }


        self.drawTopConcepts = function (source) {
            self.initUI();

            if (!source)
                source = MainController.currentSource
            if (!source)
                return;
            if (source == "QUANTUM_MODEL")
                self.QuantumModelMapping = true
            self.currentSource = source

            self.registerSource(source)


            var depth = parseInt($("#Lineage_topDepth").val())
            Sparql_generic.getTopConcepts(source, null, function (err, result) {
                if (err)
                    return MainController.UI.message(err);
                if (result.length == 0) {
                    $("#waitImg").css("display", "none");
                    return MainController.UI.message("No data found")

                }
                var ids = []
                result.forEach(function (item) {
                    ids.push(item.topConcept.value)
                })
                expandedLevels[source].push(ids);
                $("#Lineage_levelDepthSpan").html("level :" + expandedLevels[source].length)
                var color = self.getSourceColor(source)
                var shape = defaultShape
                var visjsData = GraphController.toVisjsData(null, result, null, "#", "topConcept",
                    {
                        from: {
                            shape: "box",
                            color: color,
                            size: defaultShapeSize
                        },
                        to: {
                            shape: shape,
                            color: color,
                            size: defaultShapeSize
                        },
                        data: {source: MainController.currentSource},
                        rootLabel: source,
                        arrows: {
                            to: {
                                enabled: true,
                                type: "arrow",
                                scaleFactor: 0.5
                            },
                        },
                    })


                self.drawNewGraph(visjsData)


            })

        }
        self.drawNewGraph = function (visjsData) {
            var options = {

                onclickFn: Lineage_classes.graphActions.onNodeClick,
                onRightClickFn: Lineage_classes.graphActions.showGraphPopupMenu,
                "physics": {
                    "barnesHut": {
                        "springLength": 0,
                        "damping": 0.15
                    },
                    "minVelocity": 0.75
                }
                //   layoutHierarchical: {direction: "LR", sortMethod: "directed"}

            }


            visjsGraph.draw("graphDiv", visjsData, options)
            $("#waitImg").css("display", "none");
        }


        self.getGraphIdsFromSource = function (source) {

            var existingNodes = visjsGraph.data.nodes.get();
            var sourceNodes = []
            existingNodes.forEach(function (item) {
                if (item.id != "#" && item.data && item.data.source == source) {
                    sourceNodes.push(item.data.id || item.id)
                }
            })
            return sourceNodes;
        }


        self.addSourceChildrenToGraph = function () {
            var source = self.currentSource;
            if (source == "")
                return alert("select a source");
            var sourceNodes = self.getGraphIdsFromSource(source)
            self.addChildrenToGraph(sourceNodes, source)

        }

        self.addChildrenToGraph = function (nodeIds, source) {
            var parentIds
            if (!source) {
                source = self.currentSource;
            }
            if (nodeIds) {
                parentIds = nodeIds
            } else {
                var sourcesIdsMap = Lineage_classes.getGraphSourcesIdsMap(nodeIds)
                parentIds = sourcesIdsMap[source]
                if (!parentIds || parentIds.length == 0)
                    parentIds = expandedLevels[source][expandedLevels[source].length - 1];
            }
            MainController.UI.message("")
            var options = {}
            if (self.currentOwlType == "ObjectProperty")
                options.owlType = "ObjectProperty"
            Sparql_generic.getNodeChildren(source, null, parentIds, 1, {skipRestrictions:1}, function (err, result) {
                if (err)
                    return MainController.UI.message(err);
                var map = [];
                var ids = [];

                if (result.length == 0) {
                    $("#waitImg").css("display", "none");
                    return MainController.UI.message("No data found")

                }
                var color = self.getSourceColor(source)

                result.forEach(function (item) {

                    if (!map[item.concept.value])
                        map[item.concept.value] = []
                    map[item.concept.value].push(item)
                    ids.push(item.child1.value)


                    /*   if (self.QuantumModelMapping) {
                           var nodeSource = common.quantumModelmappingSources[item.child1.value]
                           if (nodeSource) {
                              color = self.getSourceColor(nodeSource)

                           }
                       }*/
                })


                var existingNodes = visjsGraph.getExistingIdsMap();
                var visjsData = {nodes: [], edges: []}

                var expandedLevel = []
                for (var key in map) {


                    if (map[key].length > maxChildrenDrawn) {
                        //on enleve les cluster du dernier bootomIds dsiono on cree des orphelins au niveau suivant

                        var nodeId = key + "_cluster"
                        if (!existingNodes[nodeId]) {
                            existingNodes[nodeId] = 1
                            visjsData.nodes.push({
                                id: key + "_cluster",
                                label: map[key].length + "children",
                                shape: "star",
                                size: defaultShapeSize,
                                value: map[key].length,
                                color: color,
                                data: {cluster: map[key], source: source, parent: key}
                            })
                        }
                        var edgeId = key + "_" + key + "_cluster"
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1
                            visjsData.edges.push({
                                id: edgeId,
                                from: key,
                                to: key + "_cluster",
                                arrows: {
                                    to: {
                                        enabled: true,
                                        type: "arrow",
                                        scaleFactor: 0.5
                                    },
                                },
                                data: {source: source}
                            })
                        }


                    } else {
                        var existingIds = visjsGraph.getExistingIdsMap()
                        var visjsData2 = {nodes: [], edges: []}

                        map[key].forEach(function (item) {

                            var nodeSource = source;
                            var shape = defaultShape
                            var shapeSize = defaultShapeSize

                            if (self.QuantumModelMapping) {

                                var nodeSource2 = common.quantumModelmappingSources[item.child1.value]
                                if (nodeSource2) {
                                    nodeSource = nodeSource2
                                    color = self.getSourceColor(nodeSource2)
                                    shape = "triangle"
                                    shapeSize = 6
                                    self.registerSource(nodeSource)
                                } else {
                                    shape = "box"

                                }


                            }
                            var data = {id: item.child1.value, label: item.child1Label.value, source: nodeSource}
                            expandedLevel.push(item.child1.value)


                            if (!existingIds[item.child1.value]) {
                                existingIds[item.child1.value] = 1;
                                visjsData2.nodes.push({
                                    id: item.child1.value,
                                    label: item.child1Label.value,
                                    shape: shape,
                                    size: shapeSize,
                                    color: self.getSourceColor(nodeSource),

                                    data: data
                                })
                            }
                            var edgeId = item.concept.value + "_" + item.child1.value
                            var inverseEdge = item.child1.value + "_" + item.concept.value
                            if (!existingIds[edgeId] && !existingIds[inverseEdge]) {
                                existingIds[edgeId] = 1
                                visjsData2.edges.push({
                                    id: edgeId,
                                    from: item.concept.value,
                                    to: item.child1.value,
                                    arrows: {
                                        from: {
                                            enabled: true,
                                            type: "arrow",
                                            scaleFactor: 0.5
                                        },
                                    },
                                    data: {source: nodeSource}
                                })

                            }

                        })


                        visjsData.nodes = visjsData.nodes.concat(visjsData2.nodes)
                        visjsData.edges = visjsData.edges.concat(visjsData2.edges)


                    }

                }

                expandedLevels[source].push(expandedLevel)
                visjsData.nodes = common.removeDuplicatesFromArray(visjsData.nodes, "id")
                visjsGraph.data.nodes.add(visjsData.nodes)
                visjsGraph.data.edges.add(visjsData.edges)
                visjsGraph.network.fit()
                $("#Lineage_levelDepthSpan").html("level :" + expandedLevels[source].length)


// on cherche les parents qui n'ont pas trouvé d'enfant (I.E concept de SPARQL.getChildren
                if (false) {
                    var keys = Object.keys(map)
                    var orphans = []
                    parentIds.forEach(function (parentId) {
                        if (keys.indexOf(parentId) < 0)
                            orphans.push({id: parentId, shape: "text"})
                    })
                    visjsGraph.data.nodes.update(orphans)
                }


                $("#waitImg").css("display", "none");


            })
        }

        self.listClusterToClipboard = function (clusterNode) {
            var text = "";
            clusterNode.data.cluster.forEach(function (item, index) {
                text += item.child1.value + "," + item.child1Label.value + "\n"
            })

            var result = common.copyTextToClipboard(text)
            MainController.UI.message(result);
        }

        self.listClusterContent = function (clusterNode) {
            var text = "";
            var jstreeData = []
            clusterNode.data.cluster.forEach(function (item, index) {
                jstreeData.push({id: item.child1.value, text: item.child1Label.value, parent: "#",
                    data:{source:self.currentSource,id:item.child1.value, label: item.child1Label.value}})
            })

            var jstreeOptions = {
                openAll: true, selectTreeNodeFn: function (event, propertiesMap) {

                    return Lineage_classes.selectTreeNodeFn(event, propertiesMap);


                },
                contextMenu :ThesaurusBrowser.getJstreeConceptsContextMenu()
            }

            common.loadJsTree(ThesaurusBrowser.currentTargetDiv, jstreeData, jstreeOptions)
        }

        self.openCluster = function (clusterNode) {
            MainController.UI.message("")
            if (clusterNode.data.cluster.length > self.maxClusterOpeningLength) {
                self.listClusterToClipboard(clusterNode)
                return alert("cluster content copied to clipboard( too large to draw)")
            }

            var color = self.getSourceColor(clusterNode.data.source)
            var visjsData = GraphController.toVisjsData(null, clusterNode.data.cluster, clusterNode.data.parent, "concept", "child1", {
                from: {
                    shape: defaultShape,
                    size: defaultShapeSize,
                    color: color
                },
                to: {
                    shape: defaultShape,
                    size: defaultShapeSize,
                    color: color
                },
                data: {source: clusterNode.data.source}
            })

            visjsGraph.data.nodes.add(visjsData.nodes)
            visjsGraph.data.edges.add(visjsData.edges)
            visjsGraph.network.fit()
            visjsGraph.data.nodes.remove(clusterNode.id)
            $("#waitImg").css("display", "none");
            MainController.UI.message("")


        }


        self.drawSimilarsNodes = function (node, sources) {
            MainController.UI.message("")
            //    $("#Lineage_toSource").val("")

            var similarType
            if ($("#Lineage_similarTypeRadio_Labels").prop("checked"))
                similarType = "labels";
            else if ($("#Lineage_similarTypeRadio_SameAs").prop("checked"))
                similarType = "sameAs";

            var similars = [];
            if (!sources)
                sources = self.currentSource;// common.getAllsourcesWithType("OWL")
            if (!Array.isArray(sources))
                sources = [sources]

            var words = []
            var sourceItemsMap = {}
            var ids = [];
            var slices;
            async.series([
                function (callbackSeries) {
                    if (similarType != "labels")
                        return callbackSeries()
                    if (!node) {
                        if (!sources)
                            return callbackSeries("select a source")

                        var nodeObjs = visjsGraph.data.nodes.get()
                        nodeObjs.forEach(function (item) {
                            if (item.label && item.label.toLowerCase) {
                                words.push(item.label)
                                sourceItemsMap[item.label.toLowerCase()] = item.id
                            }
                        })
                    } else {
                        words = [node.label]
                        sourceItemsMap[node.label.toLowerCase()] = node.id

                    }
                    slices = common.sliceArray(words, Sparql_generic.slicesSize);

                    return callbackSeries()
                },

                function (callbackSeries) {
                    if (similarType != "sameAs")
                        return callbackSeries()
                    if (!node) {
                        if (!sources)
                            return alert("select a source")

                        ids = visjsGraph.data.nodes.getIds()


                    } else {

                    }

                    var idsSlices = common.sliceArray(ids, Sparql_generic.slicesSize);
                    var similarIds = []
                    async.eachSeries(idsSlices, function (ids, callbackEachSlice) {
                        var filter = Sparql_common.setFilter("concept", ids, null)
                        filter = " ?prop  rdfs:subClassOf* owl:sameAs.\n" +
                            "  ?concept ?prop ?similar " + filter

                        var options = {filter: filter}
                        Sparql_generic.getItems("QUANTUM", options, function (err, result) {
                            if (err) {
                                return callbackEachSlice(err);
                            }

                            var ids = []

                            result.forEach(function (item) {
                                similarIds.push(item.similar.value)

                                sourceItemsMap[item.similar.value] = item.concept.value
                            })
                            return callbackEachSlice()

                        })
                    }, function (err) {

                        slices = common.sliceArray(similarIds, Sparql_generic.slicesSize);
                        return callbackSeries(err);
                    })


                },
                function (callbackSeries) {


                    async.eachSeries(sources, function (source, callbackEachSource) {

                        async.eachSeries(slices, function (items, callbackEachSlice) {
                            if (items.length == 0) {
                                $("#waitImg").css("display", "none");
                                MainController.UI.message("No data found")
                                return callbackSeries()

                            }
                            var filter
                            if (similarType == "labels") {
                                filter = Sparql_common.setFilter("concept", null, items, {exactMatch: true})
                            } else if (similarType == "sameAs") {
                                filter = Sparql_common.setFilter("concept", items, null)

                            }
                            var options = {filter: filter}
                            Sparql_generic.getItems(source, options, function (err, result) {
                                if (err) {
                                    return callbackEachSlice(err);
                                }

                                var ids = []
                                result.forEach(function (item) {
                                    similars.push({
                                        id: item.concept.value,
                                        label: item.conceptLabel.value,
                                        source: source
                                    });
                                    ids.push(item.concept.value)
                                })

                                if (!expandedLevels[source]) {

                                    self.registerSource(source)


                                }
                                expandedLevels[source].push(ids)


                                callbackEachSlice();
                            })
                        }, function (err) {
                            callbackEachSource(err)
                        })
                    }, function (err) {
                        if (err)
                            return callbackSeries()
                        var visjsData = {nodes: [], edges: []}
                        var existingNodes = visjsGraph.getExistingIdsMap()
                        if (similars.length == 0) {
                            $("#waitImg").css("display", "none");
                            MainController.UI.message("No data found")
                            return callbackSeries()

                        }
                        var newEdges = []
                        if (true) {
                            similars.forEach(function (item) {
                                    if (!existingNodes[item.id]) {
                                        existingNodes[item.id] = 1
                                        var color = self.getSourceColor(item.source)
                                        visjsData.nodes.push({
                                            id: item.id,
                                            label: item.label,
                                            color: color,
                                            shape: "dot",
                                            size: defaultShapeSize,
                                            data: item
                                        })
                                    }


                                    var from;
                                    var width, arrows;
                                    if (similarType == "labels") {
                                        from = sourceItemsMap[item.label.toLowerCase()]
                                        width = 1
                                        arrows = {
                                            to: {
                                                enabled: true,
                                                type: "curve",
                                            },
                                        }
                                    } else if (similarType == "sameAs") {
                                        from = sourceItemsMap[item.id]
                                        width = 2
                                        arrows = null

                                    }
                                    if (from == item.id)
                                        return;
                                    var edgeId = from + "_" + item.id + "_" + item.source + "_" + similarType

                                    if (!existingNodes[edgeId]) {
                                        existingNodes[edgeId] = 1
                                        newEdges.push({id: edgeId, length: 45, color: "blue"})
                                        visjsData.edges.push({
                                            id: edgeId,
                                            from: from,
                                            to: item.id,
                                            color: color,
                                            width: width,
                                            //   label: item.source,
                                            arrows: arrows,
                                            data: {source: item.source},
                                            length: 30,
                                            //     physics:false
                                        })

                                    }
                                }
                            )
                        } else {


                        }


                        visjsGraph.data.nodes.add(visjsData.nodes)
                        visjsGraph.data.edges.add(visjsData.edges)
                        visjsGraph.network.fit()
                        /*   setTimeout(function() {
                               visjsGraph.data.edges.update(newEdges)
                           },1000)*/
                        $("#waitImg").css("display", "none");


                    })


                }


            ], function (err) {

            })
        }


        self.drawObjectProperties = function (classIds) {
            var source = self.currentSource
            if (!source)
                return alert("select a source");
            if (!classIds) {
                classIds = self.getGraphIdsFromSource(source)

            }
            MainController.UI.message("")

                    Sparql_OWL.getObjectProperties(source,classIds,null,function (err, result) {
                    if (err)
                        return MainController.UI.message(err)
                    if (result.length == 0) {
                        $("#waitImg").css("display", "none");
                        Lineage_classes.drawRestrictions(classIds)
                        return MainController.UI.message("No data found")

                    }
                    var visjsData = {nodes: [], edges: []}
                    var existingNodes = visjsGraph.getExistingIdsMap()
                    var color = self.getSourceColor(source)

                    result.forEach(function (item) {

                        if (!item.range) {
                            item.range = {value: "?_" + item.property.value}
                        }
                        if (!item.rangeLabel) {
                            item.rangeLabel = {value: "?"}
                        }
                        if (!existingNodes[item.range.value]) {
                            existingNodes[item.range.value] = 1;
                            visjsData.nodes.push({
                                id: item.range.value,
                                label: item.rangeLabel.value,
                                shape: defaultShape,
                                size: defaultShapeSize,
                                color: color,
                                data: {source: source}
                            })

                        }
                        var edgeId = item.domain.value + "_" + item.range.value+"_"+item.prop.value
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1

                            visjsData.edges.push({
                                id: edgeId,
                                from: item.domain.value,
                                to: item.range.value,
                                label: "<i>" + item.propLabel.value + "</i>",
                                data: {propertyId: item.prop.value, source: source},
                                font: {multi: true, size: 10},
                                // font: {align: "middle", ital: {color:objectPropertyColor, mod: "italic", size: 10}},
                                //   physics:false,
                                arrows: {
                                    to: {
                                        enabled: true,
                                        type: "bar",
                                        scaleFactor: 0.5
                                    },
                                },
                                dashes: true,
                                color: objectPropertyColor

                            })
                        }

                    })

                    visjsGraph.data.nodes.add(visjsData.nodes)
                    visjsGraph.data.edges.add(visjsData.edges)
                    visjsGraph.network.fit()
                    $("#waitImg").css("display", "none");

                    Lineage_classes.drawRestrictions(classIds)

                })

        }
        self.drawRestrictions = function (classIds) {
            var source = self.currentSource
            if (!source)
                return alert("select a source");
            if (!classIds) {
                classIds = self.getGraphIdsFromSource(source)

            }
            MainController.UI.message("")

            Sparql_OWL.getObjectRestrictions(source,classIds,null,function (err, result) {
                if (err)
                    return MainController.UI.message(err)
                if (result.length == 0) {
                    $("#waitImg").css("display", "none");
                    return MainController.UI.message("No data found")

                }
                var visjsData = {nodes: [], edges: []}
                var existingNodes = visjsGraph.getExistingIdsMap()
                var color = self.getSourceColor(source)
                result.forEach(function (item) {

                    if (!item.value) {
                        item.value = {value: "?_" + item.prop.value}
                        item.valueLabel = {value: "?"}
                    }
                    if (!item.valueLabel) {
                        item.valueLabel = {value: "?"}
                    }
                    if (!existingNodes[item.value.value]) {
                        existingNodes[item.value.value] = 1;
                        visjsData.nodes.push({
                            id: item.value.value,
                            label: item.valueLabel.value,
                            shape: defaultShape,
                            size: defaultShapeSize,
                            color: color,
                            data: {source: source}
                        })

                    }
                    var edgeId = item.id.value + "_" + item.value.value+"_"+item.prop.value
                    if (!existingNodes[edgeId]) {
                        existingNodes[edgeId] = 1

                        visjsData.edges.push({
                            id: edgeId,
                            from: item.id.value,
                            to: item.value.value,
                            label: "<i>" + item.propLabel.value + "</i>",
                            data: {propertyId: item.prop.value, source: source},
                            font: {multi: true, size: 10},
                            // font: {align: "middle", ital: {color:objectPropertyColor, mod: "italic", size: 10}},
                            //   physics:false,
                            arrows: {
                                to: {
                                    enabled: true,
                                    type: "bar",
                                    scaleFactor: 0.5
                                },
                            },
                            dashes: true,
                            color: restrictionColor

                        })
                    }

                })

                visjsGraph.data.nodes.add(visjsData.nodes)
                visjsGraph.data.edges.add(visjsData.edges)
                visjsGraph.network.fit()
                $("#waitImg").css("display", "none");

            })

        }

        self.addParentsToGraph = function (nodeIds) {

            if (self.QuantumModelMapping) {
                var nodes = visjsGraph.data.nodes.getIds();
                var fixedNodes = []
                nodes.forEach(function (id) {
                    fixedNodes.push({id: id, fixed: true})
                })
                visjsGraph.data.nodes.update(fixedNodes);
            }

            MainController.UI.message("");

            var sourcesIdsMap = Lineage_classes.getGraphSourcesIdsMap(nodeIds)


            var sources = Object.keys(sourcesIdsMap)

            async.eachSeries(sources, function (source, callbackEach) {
                if (source == MainController.currentSource)
                    return callbackEach();


                Sparql_generic.getNodeParents(source, null, sourcesIdsMap[source], 1, {exactMatch: 1}, function (err, result) {
                    if (err)
                        return callbackEach(err)
                    var map = [];
                    var ids = [];

                    if (result.length == 0) {

                        $("#waitImg").css("display", "none");
                        return MainController.UI.message("No data found")

                    }

                    var color = self.getSourceColor(source)
                    var visjsData = GraphController.toVisjsData(null, result, null, "concept", "broader1", {
                        from: {
                            shape: defaultShape,
                            size: defaultShapeSize,
                            color: color
                        },
                        to: {
                            shape: defaultShape,
                            size: defaultShapeSize,
                            color: color
                        },
                        data: {source: source},
                        arrows: {
                            from: {
                                enabled: true,
                                type: "arrow",
                                scaleFactor: 0.5
                            },
                        },

                    })


                    visjsGraph.data.nodes.add(visjsData.nodes)
                    visjsGraph.data.edges.add(visjsData.edges)


                })
                callbackEach();
            }, function (err) {
                $("#waitImg").css("display", "none");
                if (err)
                    return MainController.UI.message("No data found")
                self.QuantumModelMapping = false;
                visjsGraph.network.fit()
                return MainController.UI.message("")
            })

        }


        self.removeLastChildrenFromGraph = function (nodeId) {


            if (nodeId) {
                var children = visjsGraph.network.getConnectedNodes(nodeId, "to");
                visjsGraph.data.nodes.remove(children)


            } else {
                var source = self.currentSource;
                if (expandedLevels[source].length > 0)
                    visjsGraph.data.nodes.remove(expandedLevels[source][expandedLevels[source].length - 1])
                expandedLevels[source].splice(expandedLevels[source].length - 1, 1)
                $("#Lineage_levelDepthSpan").html("level :" + expandedLevels[source].length)
            }

        }

        self.setGraphPopupMenus = function (node) {
            if (!node)
                return;

            var html = "    <span class=\"popupMenuItem\" onclick=\"Lineage_classes.graphActions.drawChildren();\"> draw children</span>" +
                "<span class=\"popupMenuItem\" onclick=\"Lineage_classes.graphActions.drawParents();\"> draw parents</span>" +
                "    <span class=\"popupMenuItem\" onclick=\"Lineage_classes.graphActions.drawSimilars();\"> draw similars</span>" +
                "    <span  class=\"popupMenuItem\"onclick=\"Lineage_classes.graphActions.hideChildren();\">hide children</span>" +
                "    <span  class=\"popupMenuItem\"onclick=\"Lineage_classes.graphActions.showNodeInfos();\">show node infos</span>"
           + "    <span  class=\"popupMenuItem\"onclick=\"Lineage_classes.graphActions.showProperties();\">show Properties</span>"


            if (node.id.indexOf("_cluster") > 0) {
                var html=""
                if (node.data.cluster.length <=Lineage_classes.maxClusterOpeningLength)
                    html = "    <span class=\"popupMenuItem\" onclick=\"Lineage_classes.graphActions.openCluster();\"> open cluster</span>"
                html += "    <span class=\"popupMenuItem\" onclick=\"Lineage_classes.graphActions.listClusterContent();\"> list cluster content</span>"
                html += "    <span class=\"popupMenuItem\" onclick=\"Lineage_classes.graphActions.listClusterToClipboard();\"> list to clipboard</span>"
            }

            if(Config.showAssetQueyMenu){
                html += "    <span class=\"popupMenuItem\" onclick=\"AssetQuery.showNodeProperties();\"> add to Asset Query</span>"
            }
            $("#graphPopupDiv").html(html);

        }
        self.zoomGraphOnNode = function (nodeId) {


            var nodes = visjsGraph.data.nodes.getIds();
            if (nodes.indexOf(nodeId) < 0)
                return;
            visjsGraph.network.focus(nodeId, {
                scale: 1,
                locked: false,
                animation: true
            })


            var newNodes = []
            var nodes = visjsGraph.data.nodes.get();
            nodes.forEach(function (node) {
                if (!node.data)
                    return;
                if (!node.data.initialParams) {
                    node.data.initialParams = {
                        shape: node.shape,
                        size: node.size,
                    }
                }
                var size, shape;
                var font = {color: "black"}
                if (node.id == nodeId) {
                    size = node.data.initialParams.size * 2
                    shape = "hexagon"
                    font = {color: "red"}
                } else {
                    size = node.data.initialParams.size;
                    shape = node.data.initialParams.shape;
                }
                newNodes.push({id: node.id, size: size, shape: shape, font: font})
                //  newNodes.push({id: id, opacity:opacity})
            })
            visjsGraph.data.nodes.update(newNodes)
        }

        self.addArbitraryNodeToGraph = function (nodeData) {
            var existingNodes = visjsGraph.getExistingIdsMap()
            if (existingNodes[nodeData.id])
                return self.zoomGraphOnNode(nodeData.id)

            MainController.UI.message("")
            var ancestorsDepth = 7
            Sparql_generic.getNodeParents(nodeData.source, null, nodeData.id, ancestorsDepth, {skipRestrictions:1}, function (err, result) {
                if (err)
                    return MainController.UI.message(err);
                var map = [];
                var ids = [];

                if (result.length == 0) {
                    $("#waitImg").css("display", "none");
                    return MainController.UI.message("No data found")
                }


                var visjsData = {nodes: [], edges: []}
                var color = self.getSourceColor(nodeData.source)
                var nodesToDraw = []
                var newNodeIds = []
                var upperNodeIds = [];
                var existingNodes = visjsGraph.getExistingIdsMap()
                result.forEach(function (item) {
                    if (!existingNodes[item.concept.value]) {
                        existingNodes[item.concept.value] = 1
                        visjsData.nodes.push({
                            id: item.concept.value,
                            label: item.conceptLabel.value,
                            data: nodeData,
                            shape: defaultShape,
                            color: color,
                            size: defaultShapeSize
                        })
                    }
                    newNodeIds.push(item.concept.value)

                    var edgeId
                    for (var i = 1; i < ancestorsDepth; i++) {
                        if (item["broader" + i]) {
                            if (!existingNodes[item["broader" + i].value]) {
                                existingNodes[item["broader" + i].value] = 1
                                visjsData.nodes.push({
                                    id: item["broader" + i].value,
                                    label: item["broader" + i + "Label"].value,
                                    data: {source: nodeData.source, label: item["broader" + i + "Label"].value, id: item["broader" + i].value},
                                    shape: defaultShape,
                                    color: color,
                                    size: defaultShapeSize
                                })
                                newNodeIds.push(item["broader" + i].value)
                                var fromId;
                                if (i == 1)
                                    fromId = item.concept.value
                                else
                                    fromId = item["broader" + (i - 1)].value


                                edgeId = fromId + "_" + item["broader" + i].value;
                                if (!existingNodes[edgeId]) {
                                    existingNodes[edgeId] = 1

                                    visjsData.edges.push({
                                        id: edgeId,
                                        from: fromId,
                                        to: item["broader" + i].value,
                                        data: {source: nodeData.source},
                                        arrows: {
                                            to: {
                                                enabled: true,
                                                type: "arrow",
                                                scaleFactor: 0.5
                                            },
                                        },
                                    })
                                }
                            } else {  //join an existing node
                                if (i == 1)
                                    fromId = item.concept.value
                                else
                                    fromId = item["broader" + (i - 1)].value

                                edgeId = fromId + "_" + item["broader" + i].value
                                if (!existingNodes[edgeId]) {
                                    existingNodes[edgeId] = 1
                                    visjsData.edges.push({
                                        id: edgeId,
                                        from: fromId,
                                        to: item["broader" + i].value,
                                        data: {source: nodeData.source},
                                        arrows: {
                                            to: {
                                                enabled: true,
                                                type: "arrow",
                                                scaleFactor: 0.5
                                            },
                                        },
                                    })
                                }
                                break;
                            }
                        } else {
                            /*    var id=item["broader" + (i-1)].value;
                                if(upperNodeIds.indexOf(id)<0) {
                                    upperNodeIds.push(id);

                                }*/
                        }
                    }
                })

                var existingNodes = visjsGraph.getExistingIdsMap()
                if (!existingNodes[nodeData.source]) {
                    visjsData.nodes.forEach(function (item) {

                    })

                }

                self.registerSource(nodeData.source)
                /*  expandedLevels[nodeData.source][expandedLevels[nodeData.source].length ].push(newNodeIds);*/

                if (!visjsGraph.data.nodes) {
                    self.drawNewGraph(visjsData)
                } else {
                    visjsGraph.data.nodes.add(visjsData.nodes)
                    visjsGraph.data.edges.add(visjsData.edges)
                }


                setTimeout(function () {
                    self.zoomGraphOnNode(nodeData.id)
                }, 500)
                $("#waitImg").css("display", "none");
                return MainController.UI.message("No data found")
            })
        }

        self.drawCfihosQuantumMapping = function (node, sources) {

            MainController.UI.message("")
            //   $("#Lineage_toSource").val("")

            var similars = [];
            if (!sources)
                sources = common.getAllsourcesWithType("OWL")
            if (!Array.isArray(sources))
                sources = [sources]


            var words = []
            var sourceItemsMap = {}
            var sourceIds = []
            if (!node) {


                var nodeObjs = visjsGraph.data.nodes.get()
                nodeObjs.forEach(function (item) {
                    sourceIds.push(item.id)//.replace("vocab#",""));
                    if (item.label && item.label.toLowerCase) {
                        words.push(item.label)
                        sourceItemsMap[item.label.toLowerCase()] = item.id

                    }
                })
            } else {
                words = [node.label]
                sourceIds.push(node.id)//.replace("vocab#",""));
            }

            var wordSlices = common.sliceArray(words, Sparql_generic.slicesSize);

            async.eachSeries(sources, function (source, callbackEachSource) {

                async.eachSeries(wordSlices, function (words, callbackEachSlice) {
                    var filter = Sparql_common.setFilter("concept", null, words, {exactMatch: true})
                    var options = {filter: filter, graphUri: ["http://data.total.com/resource/quantum/mappings/"]}
                    Sparql_generic.getItems(source, options, function (err, result) {
                        if (err) {
                            return callbackEachSlice(err);
                        }

                        var ids = []
                        result.forEach(function (item) {
                            similars.push({
                                id: item.concept.value,
                                label: item.conceptLabel.value,
                                source: source
                            });
                            ids.push(item.concept.value)
                        })

                        if (!expandedLevels[source]) {
                            expandedLevels[source] = []
                            self.registerSource(source)


                        }
                        expandedLevels[source].push(ids)


                        callbackEachSlice();
                    })
                }, function (err) {
                    callbackEachSource(err)
                })
            }, function (err) {
                if (err)
                    return MainController.UI.message(err);
                var visjsData = {nodes: [], edges: []}
                var existingNodes = visjsGraph.getExistingIdsMap()
                if (similars.length == 0) {
                    $("#waitImg").css("display", "none");
                    return MainController.UI.message("No data found")

                }
                similars.forEach(function (item) {
                    if (!existingNodes[item.id]) {
                        existingNodes[item.id] = 1
                        var color = self.getSourceColor(item.source)
                        visjsData.nodes.push({
                            id: item.id,
                            label: item.label,
                            color: color,
                            shape: "dot",
                            size: defaultShapeSize,
                            data: item
                        })
                        visjsData.edges.push({
                            from: sourceItemsMap[item.label.toLowerCase()],
                            to: item.id,
                            color: color,
                            width: 3,
                            //   label: item.source,
                            arrows: {
                                to: {
                                    enabled: true,
                                    type: "curve",
                                },
                            },
                        })
                    }
                })


                visjsGraph.data.nodes.add(visjsData.nodes)
                visjsGraph.data.edges.add(visjsData.edges)
                visjsGraph.network.fit()
                $("#waitImg").css("display", "none");


            })


        }

        self.getGraphSourcesIdsMap = function (nodeIds) {
            var nodes = visjsGraph.data.nodes.get();
            var sourcesIdsMap = {}
            nodes.forEach(function (node) {
                if (!nodeIds || nodeIds.indexOf(node.id)) {
                    if (self.QuantumModelMapping) {

                        var source = common.quantumModelmappingSources[node.id]
                        if (!source)
                            return;
                        if (!sourcesIdsMap[source]) {
                            sourcesIdsMap[source] = []
                        }
                        sourcesIdsMap[source].push(node.id)

                    } else if (node.data && node.data.source) {
                        var source = node.data.source
                        if (!source)
                            return;
                        if (!sourcesIdsMap[source]) {
                            sourcesIdsMap[source] = []
                        }
                        sourcesIdsMap[source].push(node.id)
                    } else {

                        ;//  console.log ("no source ")
                    }

                }

            })

            return sourcesIdsMap;

        }


        self.graphActions = {

            showGraphPopupMenu: function (node, point, event) {
                if (node.from) {
                    self.currentGraphEdge = node;
                    if (!self.currentGraphEdge.data.propertyId)
                        return;
                    MainController.UI.showNodeInfos(self.currentGraphEdge.data.source, self.currentGraphEdge.data.propertyId, "mainDialogDiv")
                } else {
                    self.setGraphPopupMenus(node)
                    self.currentGraphNode = node;
                    MainController.UI.showPopup(point, "graphPopupDiv")
                }

            },

            onNodeClick: function (node, point, options) {
                if(!node)
                    return MainController.UI.hidePopup("graphPopupDiv")

                self.currentGraphNode=node;
                if(options.ctrlKey){
                    MainController.UI.showNodeInfos(self.currentGraphNode.data.source, self.currentGraphNode.id, "mainDialogDiv")
                }
                if(options.dbleClick){
                    Lineage_classes.addChildrenToGraph([self.currentGraphNode.id], self.currentGraphNode.data.source)
                }



            },
            drawChildren: function () {

                Lineage_classes.addChildrenToGraph([self.currentGraphNode.id], self.currentGraphNode.data.source)
            },
            drawParents: function () {
                Lineage_classes.addParentsToGraph([self.currentGraphNode.id])
            },

            drawSimilars: function () {
                Lineage_classes.drawSimilarsNodes(self.currentGraphNode)
            },
            hideChildren: function () {
                Lineage_classes.removeLastChildrenFromGraph(self.currentGraphNode.id)
            }
            , openCluster: function () {
                Lineage_classes.openCluster(self.currentGraphNode)

            },
            listClusterToClipboard: function () {
                Lineage_classes.listClusterToClipboard(self.currentGraphNode)

            },
            listClusterContent: function () {
                Lineage_classes.listClusterContent(self.currentGraphNode)

            },


            showNodeInfos: function () {
                MainController.UI.showNodeInfos(self.currentGraphNode.data.source, self.currentGraphNode.id, "mainDialogDiv")
            },
            showProperties: function () {
               Lineage_classes.drawObjectProperties([self.currentGraphNode.id])
            }
        }

        self.getSourceColor = function (source, palette) {
            if (!palette)
                palette = "paletteIntense"
            if (!sourceColors[source])
                sourceColors[source] = common[palette][Object.keys(sourceColors).length]
            return sourceColors[source];
        }


        self.registerSource = function (source) {

            var id = "Lineage_source_" + encodeURIComponent(source)
            if (document.getElementById(id) !== null)
                return;

            expandedLevels[source] = []
            var html = "<div  id='" + id + "' style='color: " + self.getSourceColor(source) + "'" +
                " class='Lineage_sourceLabelDiv' " +
                "onclick='Lineage_classes.setCurrentSource(\"" + encodeURIComponent(source) + "\")'>" + source + "</div>"
            $("#lineage_drawnSources").append(html)
            //  self.setCurrentSource(encodeURIComponent(source))


        }
        self.setCurrentSource = function (sourceId) {

            $(".Lineage_sourceLabelDiv").removeClass("Lineage_selectedSourceDiv")
            $("#Lineage_source_" + sourceId).addClass("Lineage_selectedSourceDiv")
            Lineage_classes.currentSource = encodeURIComponent(sourceId)


        }
        self.drawGraph = function (typeId) {


        }

        self.onPlusButton = function () {


        }

        return self;


    }
)()

Lineage_properties = (function () {
    var self = {}
    sourceColors = {}
    self.propertyDefaultShape = "triangle";
    self.classDefaultShape = "dot";
    self.subPropertyDefaultShape = "square";
    self.defaultShapeSize = 8
    self.init = function () {
        self.graphInited = false
        self.currentSource = MainController.currentSource
        OwlSchema.initSourceSchema(self.currentSource, function (err, schema) {
            if (err)
                return MainController.UI.message(err);
            Sparql_schema.getPropertiesRangeAndDomain(schema, null, null, function (err, result) {
                if (err)
                    return MainController.UI.message(err);
                var propertiesTypes = {
                    orphans: [],
                    rangeOnly: [],
                    domainOnly: [],
                    rangeAndDomain: [],
                }
                self.properties = {};

                result.forEach(function (item) {
                    if (!self.properties[item.property.value]) {
                        var obj = {
                            id: item.property.value,
                            label: item.propertyLabel.value,
                            subProperties: []

                        }
                        if (item.range) {
                            obj.range = item.range.value
                            obj.rangeLabel = item.rangeLabel.value
                        }
                        if (item.label) {
                            obj.label = item.label.value
                            obj.labelLabel = item.labelLabel.value
                        }
                        self.properties[item.property.value] = obj
                    }
                    if (item.subProperty) {
                        self.properties[item.property.value].subProperties.push({id: item.subProperty.value, label: item.subPropertyLabel.value})
                    }


                })

                var jsTreeData = []
                for (var key in self.properties) {
                    jsTreeData.push({
                        parent: "#",
                        id: key,
                        text: self.properties[key].label,
                        data: self.properties[key]
                    })
                    self.properties[key].subProperties.forEach(function (item) {
                        jsTreeData.push({
                            parent: key,
                            id: item.id,
                            text: item.label,
                            data: self.properties[key]
                        })
                    })

                }

                var options = {selectTreeNodeFn: Lineage_properties.onTreeNodeClick}
                common.loadJsTree("Lineage_propertiesTree", jsTreeData, options);


                // common.fillSelectOptions("LineageProperties_properties_Select", propertiesTypes.rangeAndDomain, true, "propertyLabel", "property")


            })
        })
        self.showPropInfos = function (event, obj) {
            var id = obj.node.id
            var html = JSON.stringify(self.properties[id])
            $("#graphDiv").html(html)
        }
    }

    self.onTreeNodeClick = function (event, obj) {
        self.drawGraph(obj.node.id)
    }

    self.drawGraph = function (propertyId) {

        OwlSchema.initSourceSchema(self.currentSource, function (err, schema) {
            if (err)
                return MainController.UI.message(err);
            //  var options={filter:"Filter (NOT EXISTS{?property rdfs:subPropertyOf ?x})"}
            var options = {}

            Sparql_schema.getPropertiesRangeAndDomain(schema, propertyId, options, function (err, result) {
                if (err)
                    return MainController.UI.message(err);
                var visjsData = {nodes: [], edges: []}
                var existingNodes = {}
                if (self.graphInited)
                    existingNodes = visjsGraph.getExistingIdsMap()
                var color = Lineage_classes.getSourceColor(self.currentSource, "palette")

                result.forEach(function (item) {


                    if (!existingNodes[item.property.value]) {
                        existingNodes[item.property.value] = 1
                        visjsData.nodes.push({
                            id: item.property.value,
                            label: item.propertyLabel.value,
                            data: {
                                id: item.property.value,
                                label: item.propertyLabel.value,
                                subProperties: [],
                                source: self.currentSource

                            },
                            size: self.defaultShapeSize,
                            color: color,
                            shape: self.propertyDefaultShape
                        })
                    }
                    if (item.range) {
                        if (!existingNodes[item.range.value]) {
                            var shape = "text"
                            if (item.rangeType) {
                                if (item.rangeType.value.indexOf("Class") > -1)
                                    shape = self.classDefaultShape
                                if (item.rangeType.value.indexOf("property") > -1)
                                    shape = self.propertyDefaultShape
                            }
                            existingNodes[item.range.value] = 1

                            visjsData.nodes.push({
                                id: item.range.value,
                                label: item.rangeLabel.value,
                                data: {
                                    id: item.range.value,
                                    label: item.rangeLabel.value,
                                    source: self.currentSource

                                },
                                size: self.defaultShapeSize,
                                color: color,
                                shape: shape
                            })
                        }
                        var edgeId = item.property.value + "_" + item.range.value
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1
                            visjsData.edges.push({
                                id: edgeId,
                                from: item.property.value,
                                to: item.range.value,
                                // label: "range"
                                color: "brown",
                                dashes: true,
                                arrows: {
                                    to: {
                                        enabled: true,
                                        type: "arrow",
                                        scaleFactor: 0.5
                                    },
                                },
                            })
                        }

                    }
                    if (item.domain) {
                        if (!existingNodes[item.domain.value]) {
                            existingNodes[item.domain.value] = 1
                            var shape = "text"
                            if (item.domainType) {
                                if (item.domainType.value.indexOf("Class") > -1)
                                    shape = self.classDefaultShape
                                if (item.domainType.value.indexOf("property") > -1)
                                    shape = self.propertyDefaultShape
                            }

                            visjsData.nodes.push({
                                id: item.domain.value,
                                label: item.domain.value,
                                data: {
                                    id: item.domain.value,
                                    label: item.domain.value,
                                    source: self.currentSource

                                },
                                color: color,
                                size: self.defaultShapeSize,
                                shape: shape
                            })
                        }
                        var edgeId = item.property.value + "_" + item.domain.value
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1
                            visjsData.edges.push({
                                id: edgeId,
                                from: item.property.value,
                                to: item.domain.value,
                                // label: "domain",
                                color: "green",
                                dashes: true,
                                arrows: {
                                    from: {
                                        enabled: true,
                                        type: "arrow",
                                        scaleFactor: 0.5
                                    },
                                },
                            })
                        }

                    }
                    if (item.range) {
                        if (!existingNodes[item.range.value]) {
                            var shape = "text"
                            if (item.rangeType) {
                                if (item.rangeType.value.indexOf("Class") > -1)
                                    shape = self.classDefaultShape
                                if (item.rangeType.value.indexOf("property") > -1)
                                    shape = self.propertiesDefaultShape
                            }
                            existingNodes[item.range.value] = 1

                            visjsData.nodes.push({
                                id: item.range.value,
                                label: item.rangeLabel.value,
                                data: {
                                    id: item.range.value,
                                    label: item.rangeLabel.value,
                                    source: self.currentSource

                                },
                                color: color,
                                size: self.defaultShapeSize,
                                shape: shape
                            })
                        }
                        var edgeId = item.property.value + "_" + item.range.value
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1
                            visjsData.edges.push({
                                id: edgeId,
                                from: item.property.value,
                                to: item.range.value,
                                color: "brown",
                                dashes: true,
                                arrows: {
                                    to: {
                                        enabled: true,
                                        type: "arrow",
                                        scaleFactor: 0.5
                                    },
                                },
                            })
                        }

                    }


                })
                if (false) {
                    result.forEach(function (item) {
                        if (item.subProperty) {
                            if (!existingNodes[item.subProperty.value]) {

                                existingNodes[item.subProperty.value] = 1

                                visjsData.nodes.push({
                                    id: item.subProperty.value,
                                    label: item.subPropertyLabel.value,
                                    data: {
                                        id: item.subProperty.value,
                                        label: item.subProperty.value,
                                        source: self.currentSource

                                    },
                                    color: color,
                                    size: self.defaultShapeSize,
                                    shape: self.subPropertyDefaultShape
                                })
                            }
                            var edgeId = item.property.value + "_" + item.subProperty.value
                            if (!existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1
                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.property.value,
                                    to: item.subProperty.value,
                                    dashes: true,
                                    arrows: {
                                        to: {
                                            enabled: true,
                                            type: "arrow",
                                            scaleFactor: 0.5
                                        },
                                    },
                                    //label: "subProperty"
                                })
                            }
                        }
                    })
                }

                if (!self.graphInited) {
                    var options = {
                        onclickFn: Lineage_classes.graphActions.onNodeClick,
                        onRightClickFn: Lineage_classes.graphActions.showGraphPopupMenu,
                    }
                    visjsGraph.draw("graphDiv", visjsData, options)
                } else {
                    visjsGraph.data.nodes.add(visjsData.nodes)
                    visjsGraph.data.edges.add(visjsData.edges)
                    visjsGraph.network.fit()
                }

                self.graphInited = true
                /*  var html = JSON.stringify(self.properties[propertyId], null, 2)
                  $("#LineageProperties_propertyInfosDiv").html(html);*/
            })
        })
    }
    self.graphActions = {


        expandNode: function (node, point, event) {
            self.drawGraph(node.id)
        },
        showNodeInfos: function () {
            MainController.UI.showNodeInfos(self.currentGraphNode.data.source, self.currentGraphNode.id, "mainDialogDiv")
        }

    }
   /* self.setGraphPopupMenus = function (node) {
        if (!node)
            return;

        var html = "    <span  class=\"popupMenuItem\"onclick=\"Lineage_properties.graphActions.showNodeInfos();\">show node infos</span>" +
            "    <span  class=\"popupMenuItem\"onclick=\"Lineage_properties.graphActions.expandNode();\">expand node</span>"

        $("#graphPopupDiv").html(html);

    }*/


    return self;

})()


Lineage_types = (function () {
    var self = {}
    self.currenttypesMap = {}
    self.init = function () {
        self.currentSource = MainController.currentSource
        Sparql_schema.getAllTypes(self.currentSource, function (err, result) {
            if (err)
                return MainController.UI.message(err)
            self.currenttypesMap = {}
            result.forEach(function (item) {
                self.currenttypesMap[item.type.value] = item.typeLabel.value
            })
            common.fillSelectOptions("LineageTypes_typesSelect", result, true, "typeLabel", "type")

        })

    }

    self.drawGraph = function (typeId) {
        var filter = " ?concept rdf:type <" + typeId + ">"


        var options = {filter: filter, limit: 50}
        Sparql_generic.getItems(Lineage_classes.currentSource, options, function (err, result) {
                if (err) {
                    return MainController.UI.message(err)
                }


                var color = Lineage_classes.getSourceColor(Lineage_classes.currentSource)
                var visjsData = GraphController.toVisjsData(null, result, typeId, null, "concept", {
                    from: {
                        shape: Lineage_classes.classDefaultShape,
                        size: Lineage_classes.defaultShapeSize,
                        color: color
                    },
                    to: {
                        shape: Lineage_classes.classDefaultShape,
                        size: Lineage_classes.defaultShapeSize,
                        color: color
                    },
                    data: {source: Lineage_classes.currentSource}
                })
                var existingNodes = visjsGraph.getExistingIdsMap()
                if (!existingNodes[typeId]) {
                    existingNodes[typeId] = 1
                    visjsData.nodes.push({
                        id: typeId,
                        label: self.currenttypesMap[typeId]

                    })
                }

                if (!visjsGraph.data.nodes) {
                    visjsGraph.draw("graphDiv", visjsData)
                } else {

                    visjsGraph.data.nodes.add(visjsData.nodes)
                    visjsGraph.data.edges.add(visjsData.edges)
                    visjsGraph.network.fit()
                }


            }
        )

    }


    return self;

})()