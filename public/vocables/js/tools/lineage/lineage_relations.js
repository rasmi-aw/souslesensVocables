// eslint-disable-next-line no-global-assign
Lineage_relations = (function () {
    var self = {};
    self.graphUriSourceMap = {};
    self.projectedGraphsMap = {};
    self.maxRelationToDraw = 5000;

    self.init = function () {
        var sources = [];
        for (var source in Config.sources) {
            if (Config.sources[source].schemaType == "OWL") sources.push(source);
        }
        sources.sort();
        if (!sources || sources.length == 0) return;
        if (Object.keys(visjsGraph.getExistingIdsMap().length == 0)) $("#LineageRelations_nodesSelectionSelect").val("All Nodes");

        common.fillSelectOptions("LineageRelations_setExactMatchSameAsSourceSelect", sources, true);
        common.fillSelectOptions("LineageRelations_property_select", [], true);
        var statusList = [
            { id: "http://data.souslesens.org/status/candidate", label: "candidate" },
            { id: "http://data.souslesens.org/status/reference", label: "reference" },
        ];
        common.fillSelectOptions("LineageRelations_statusSelect", statusList, true, "label", "id");
        var provenances = ["manual", " auto_exactMatch"];
        common.fillSelectOptions("LineageRelations_provenanceSelect", provenances, true);
        Sparql_OWL.getObjectRestrictions(
            Lineage_sources.activeSource,
            null,
            {
                withoutImports: 0,
                someValuesFrom: 1,
                listPropertiesOnly: 1,
            },
            function (err, result) {
                if (err) return alert(err);
                var props = [];
                var asSamAsProp = false;
                result.forEach(function (item) {
                    if (item.prop.value.indexOf("sameAs") > -1) asSamAsProp = true;
                    props.push({ id: item.prop.value, label: item.propLabel.value });
                });
                props.sort(function (a, b) {
                    if (a.label > b.label) return 1;
                    if (a.label < b.label) return -1;
                    return 0;
                });
                if (!asSamAsProp) props.splice(0, 0, { id: "http://www.w3.org/2002/07/owl#sameAs", label: "sameAs" });

                common.fillSelectOptions("LineageRelations_property_select", props, true, "label", "id");
                // self.initProjectedGraphs()
            }
        );
    };

    self.listAllRestrictions = function () {
        Sparql_OWL.getObjectRestrictions(Lineage_sources.activeSource, null, {}, function (err, _result) {
            if (err) return alert(err);
        });
    };

    self.graphAllRestrictions = function () {
        Lineage_classes.drawRestrictions(Lineage_sources.activeSource, "all");
    };

    self.exportRestrictions = function () {
        // pass
    };

    self.getUriSource = function (uri) {
        var source = Lineage_sources.activeSource;
        Object.keys(self.graphUriSourceMap).forEach(function (graphUri) {
            if (uri.indexOf(graphUri) == 0) {
                source = self.graphUriSourceMap[graphUri];
            }
        });
        // console.log(uri + "_" + source)
        return source;
    };

    self.getFromSourceSelection = function (callback) {
        var selectionMode = $("#LineageRelations_nodesSelectionSelect").val();
        var selectedNodes;
        if (selectionMode == "selectedNodeDescendants") {
            var selectedNode = Lineage_classes.currentGraphNode;
            if (!selectedNode) return callback("no node selected on graph");
            if (Config.sources[selectedNode.id]) {
                // selection of source in graph
                Lineage_sources.setCurrentSource(selectedNode.id);
                selectedNodes = null;
                return callback(null, selectedNodes);
            }
            selectedNodes = [selectedNode.id];
            Sparql_generic.getNodeChildren(Lineage_sources.activeSource, null, selectedNode.id, 3, null, function (err, result) {
                if (err) callback(err);
                result.forEach(function (item) {
                    selectedNodes.push(item.child1.value);
                });
                return callback(null, selectedNodes);
            });
        } else if (selectionMode == "currentGraphNodes") {
            selectedNodes = visjsGraph.data.nodes.getIds();
            return callback(null, selectedNodes);
        } else {
            selectedNodes = null;
            return callback(null, selectedNodes);
        }
    };
    self.getExistingRestrictions = function (currentSource, callback) {
        function formatResult(result) {
            restrictions = [];
            result.forEach(function (item) {
                var domain, range, domainLabel, rangeLabel, prop, propLabel, node, domainSourceLabel, rangeSourceLabel;
                if (item.concept) domain = item.concept.value;
                if (item.value) range = item.value.value;
                if (item.conceptLabel) domainLabel = item.conceptLabel.value;
                if (item.valueLabel) rangeLabel = item.valueLabel.value;
                if (item.prop) prop = item.prop.value;
                if (item.propLabel) propLabel = item.propLabel.value;
                if (item.node) node = item.node.value;
                /* if (item.g) {
             domainSourceLabel = Sparql_common.getLabelFromURI(item.g.value)
         }*/
                if (item.domainSourceLabel) {
                    domainSourceLabel = item.domainSourceLabel.value;
                }
                if (item.rangeSourceLabel) {
                    rangeSourceLabel = item.rangeSourceLabel.value;
                }

                var obj = {
                    domain: domain,
                    domainLabel: domainLabel,
                    range: range,
                    rangeLabel: rangeLabel,
                    prop: prop,
                    propLabel: propLabel,
                    node: node,
                    rangeSourceLabel: rangeSourceLabel,
                    domainSourceLabel: domainSourceLabel,
                };
                if (currentSource == Config.dictionarySource) {
                    obj.creator = item.creator ? item.creator.value : null;
                    obj.status = item.status ? item.status.value : null;
                    obj.provenance = item.provenance ? item.provenance.value : null;
                    obj.creationDate = item.creationDate ? item.creationDate.value : null;
                }
                restrictions.push(obj);
            });

            restrictions.sort(function (a, b) {
                return a.propLabel > b.prop;
            });

            return restrictions;
        }

        var restrictions = [];
        var filter = "";
        var propertyFilter = $("#LineageRelations_property_select").val();
        var creatorFilter = $("#LineageRelations_creatorSelect").val();
        var statusFilter = $("#LineageRelations_statusSelect").val();
        var provenanceFilter = $("#LineageRelations_provenanceSelect").val();

        // $("#LineageRelations_property_select").val("")
        if (propertyFilter && propertyFilter != "") filter += " filter (?prop=<" + propertyFilter + ">)";
        if (creatorFilter && creatorFilter != "") filter += " filter (?creator='" + creatorFilter + "')";
        if (statusFilter && statusFilter != "") filter += " filter (?status=<" + statusFilter + ">)";
        if (provenanceFilter && provenanceFilter != "") filter += " filter (?provenance='" + provenanceFilter + "')";

        var includeSources = null;
        //  if (propertyFilter == "http://www.w3.org/2002/07/owl#sameAs") includeSources = "TSF-DICTIONARY";
        self.getFromSourceSelection(function (err, selectedNodes) {
            if (err) return callback(err);

            if (selectedNodes == null) {
                Sparql_OWL.getObjectRestrictions(
                    currentSource,
                    null,
                    {
                        withoutImports: 0,
                        someValuesFrom: 1,
                        filter: filter,
                        selectGraph: true,
                        includeSources: includeSources,
                    },
                    function (err, result) {
                        if (err) return callback(err);

                        restrictions = formatResult(result);
                        callback(null, restrictions);
                    }
                );
            } else {
                var slices = common.array.slice(selectedNodes, 200);
                async.eachSeries(
                    slices,
                    function (slice, callbackEach) {
                        Sparql_OWL.getObjectRestrictions(
                            currentSource,
                            slice,
                            {
                                withoutImports: 0,
                                someValuesFrom: 1,
                                filter: filter,
                                selectGraph: true,
                                getMetadata: currentSource == Config.dictionarySource,
                            },
                            function (err, result) {
                                if (err) return callbackEach(err);
                                restrictions = restrictions.concat(formatResult(result));
                                callbackEach();
                            }
                        );
                    },
                    function (_err) {
                        callback(null, restrictions);
                    }
                );
            }
        });
    };

    self.showRestrictions = function (output, relations, toLabelsMap) {
        var currentSource = Lineage_sources.activeSource;

        async.series(
            [
                //get nodes to map
                function (callbackSeries) {
                    if (relations) return callbackSeries();
                    self.getExistingRestrictions(currentSource, function (err, restrictions) {
                        if (err) return callbackSeries(err);
                        relations = restrictions;
                        return callbackSeries();
                    });
                },
                function (callbackSeries) {
                    if (!relations || relations.length == 0) return callbackSeries("no relations found");
                    if (relations.length > self.maxRelationToDraw && output == "visjs")
                        return callbackSeries("Cannot draw : too many relations " + relations.length + " max " + self.maxRelationToDraw);
                    else return callbackSeries();
                },
                function (callbackSeries) {
                    var sources;
                    sources = Config.sources[currentSource].imports;
                    if (!sources) sources = [];
                    sources.push(currentSource);
                    sources.forEach(function (source) {
                        if (Config.sources[source].schemaType == "OWL") self.graphUriSourceMap[Config.sources[source].graphUri] = source;
                    });

                    callbackSeries();
                },

                function (callbackSeries) {
                    var existingNodes;
                    var jstreeData = [];
                    var visjsData = { nodes: [], edges: [] };
                    var tableData = { columns: [], data: [] };
                    var sameAsLevel = 1;
                    if (relations && toLabelsMap && output == "visjs") {
                        // get ancestors first if called by projectCurrrentSourceOnSource
                        existingNodes = visjsGraph.getExistingIdsMap();
                        visjsData = self.getRestrictionAncestorsVisjsData(relations, toLabelsMap, output);
                        visjsData.nodes.forEach(function (node) {
                            existingNodes[node.id] = 1;
                        });
                        visjsData.edges.forEach(function (edge) {
                            existingNodes[edge.id] = 1;
                        });
                        sameAsLevel = visjsData.maxLevel + 1;
                    } else existingNodes = {};

                    var shape = Lineage_classes.defaultShape;
                    var size = Lineage_classes.defaultShapeSize;

                    relations.forEach(function (item, index) {
                        var prop;
                        if (item.propLabel) prop = item.propLabel;
                        else prop = Sparql_common.getLabelFromURI(prop);

                        var domainSource, rangeSource;
                        if (item.domainSourceLabel) domainSource = item.domainSourceLabel;
                        else domainSource = self.getUriSource(item.domain);

                        if (item.rangeSourceLabel) rangeSource = item.rangeSourceLabel;
                        else rangeSource = self.getUriSource(item.range);

                        if (!existingNodes[domainSource]) {
                            existingNodes[domainSource] = 1;
                            if (output == "jstree") {
                                jstreeData.push({
                                    id: domainSource,
                                    text: domainSource,
                                    parent: "#",
                                });
                            } else if (output == "visjs") {
                                // pass
                            }
                        }
                        if (item.domain && !existingNodes[item.domain] && existingNodes[domainSource]) {
                            existingNodes[item.domain] = 1;
                            if (output == "jstree") {
                                jstreeData.push({
                                    id: item.domain,
                                    text: item.domainLabel,
                                    parent: domainSource,

                                    data: {
                                        id: item.domain,
                                        text: item.domainLabel,
                                        source: domainSource,
                                    },
                                });
                            } else if (output == "visjs") {
                                visjsData.nodes.push({
                                    id: item.domain,
                                    label: item.domainLabel,
                                    shadow: Lineage_classes.nodeShadow,
                                    shape: shape,
                                    size: size,
                                    level: sameAsLevel,
                                    color: Lineage_classes.getSourceColor(domainSource),
                                    data: {
                                        id: item.domain,
                                        label: item.domainLabel,
                                        source: domainSource,
                                    },
                                });
                            }
                        }

                        if (output == "table") {
                            if (index == 0) {
                                tableData.columns = [
                                    {
                                        title: "action",
                                        render: function (datum, type, row) {
                                            return (
                                                "<button class='btn btn-sm my-1 py-0 btn-outline-primary' onclick='  Lineage_relations.dictionaryValidation.validateSameAsCandidate (\"" +
                                                row[0] +
                                                "\")'>V</button>" +
                                                "<button class='btn btn-sm my-1 py-0 btn-outline-primary' onclick='   Lineage_relations.dictionaryValidation.rejectSameAsCandidate (\"" +
                                                row[0] +
                                                "\")'>R</button>"
                                            );
                                            //  "<button class='btn btn-sm my-1 py-0 btn-outline-primary' onclick='   Lineage_relations.dictionaryValidation.SameAsCandidateInfos (\"" + row[0] + "\")'>R</button>"
                                        },
                                        width: "75px",
                                    },

                                    { title: "domainSource", defaultContent: "" },
                                    { title: "domainLabel", defaultContent: "" },
                                    { title: "propLabel", defaultContent: "" },
                                    { title: "rangeSource", defaultContent: "" },
                                    { title: "rangeLabel", defaultContent: "" },
                                ];
                                if (currentSource == Config.dictionarySource) {
                                    tableData.columns.push({ title: "status", defaultContent: "" });
                                    tableData.columns.push({ title: "provenance", defaultContent: "" });
                                    tableData.columns.push({ title: "creator", defaultContent: "" });
                                    tableData.columns.push({ title: "creationDate", defaultContent: "" });
                                }
                            }

                            var line = [item.node, item.domainSourceLabel, item.domainLabel, item.propLabel, item.rangeSourceLabel, item.rangeLabel];
                            if (currentSource == Config.dictionarySource) {
                                line = line.concat([item.status, item.provenance, item.creator, item.creationDate]);
                            }

                            tableData.data.push(line);
                        } else if (output == "jstree") {
                            var nodeId = item.domain + "_" + prop + "_" + item.range;
                            if (!existingNodes[nodeId]) {
                                existingNodes[nodeId] = 1;
                                jstreeData.push({
                                    id: nodeId,
                                    text: prop + "_" + rangeSource + "." + item.rangeLabel,
                                    parent: item.domain,
                                    data: {
                                        id: nodeId,
                                        label: prop + "_" + rangeSource + "." + item.rangeLabel,
                                        source: rangeSource,
                                    },
                                });
                            }
                        } else if (output == "visjs") {
                            if (!existingNodes[item.range]) {
                                existingNodes[item.range] = 1;
                                visjsData.nodes.push({
                                    id: item.range,
                                    label: item.rangeLabel,
                                    shadow: Lineage_classes.nodeShadow,
                                    shape: shape,
                                    size: size,
                                    level: sameAsLevel,
                                    color: Lineage_classes.getSourceColor(rangeSource),
                                    data: {
                                        id: item.range,
                                        label: item.rangeLabel,
                                        source: rangeSource,
                                    },
                                });
                            }
                            var propSource = Lineage_sources.activeSource;
                            var edgeId = item.domain + "_" + item.prop + "_" + item.range;
                            if (!existingNodes[edgeId]) {
                                existingNodes[edgeId] = 1;
                                visjsData.edges.push({
                                    id: edgeId,
                                    from: item.range,
                                    to: item.domain,
                                    data: {
                                        propertyId: item.prop,
                                        source: propSource,
                                        bNodeId: item.node,
                                        from: item.range,
                                    },
                                    arrows: {
                                        from: {
                                            enabled: true,
                                            type: "bar",
                                            scaleFactor: 0.5,
                                        },
                                        length: 30,
                                    },

                                    width: 3,

                                    label: "<i>" + prop + "</i>",
                                    font: { multi: true, size: 10 },

                                    dashes: true,
                                    color: Lineage_classes.restrictionColor,
                                });
                            }
                        }

                        //********************************************
                    });
                    if (output == "jstree") {
                        $("#mainDialogDiv").dialog("open");
                        $("#mainDialogDiv").load("snippets/lineage/listRelationsDialog.html", function () {
                            var options = {
                                openAll: true,
                                selectTreeNodeFn: function () {
                                    //pass
                                },
                            };
                            common.jstree.loadJsTree("LineageRelation_listRelationDiv", jstreeData, options);
                        });
                    } else if (output == "table") {
                        if (relations.length <= self.maxRelationToDraw) {
                            Export.showDataTable(null, tableData.columns, tableData.data);
                        } else {
                            // write csv to clipBoard
                            var str = "";
                            tableData.columns.forEach(function (item, index) {
                                if (index > 0) str += "\t";
                                str += item.title;
                            });
                            str += "\n";
                            tableData.data.forEach(function (line) {
                                line.forEach(function (item, index) {
                                    if (index > 0) str += "\t";
                                    str += item;
                                });
                                str += "\n";
                            });

                            common.copyTextToClipboard(str);
                        }
                    } else if (output == "visjs") {
                        if (visjsGraph.isGraphNotEmpty()) {
                            visjsGraph.data.nodes.update(visjsData.nodes);
                            visjsGraph.data.edges.update(visjsData.edges);
                        } else {
                            var options = { layoutHierarchical: 1 };
                            Lineage_classes.drawNewGraph(visjsData, options);
                        }
                    }

                    callbackSeries();
                },
                function (callbackSeries) {
                    //  self.showRestrictionAncestors(relations, toLabelsMap, output)
                    callbackSeries();
                },
            ],
            function (err) {
                if (err) return alert(err);
                MainController.UI.message("DONE", true);
            }
        );
    };

    self.getRestrictionAncestorsVisjsData = function (restrictions, labelsMap, output) {
        var visjsData = { nodes: [], edges: [] };
        var existingNodes = visjsGraph.getExistingIdsMap();

        var shape = Lineage_classes.defaultShape;
        var size = Lineage_classes.defaultShapeSize;

        var maxLevel = 1;
        restrictions.forEach(function (restriction) {
            var parentsArray = restriction.parents.split("|");
            maxLevel = Math.max(maxLevel, parentsArray.length);

            var ancestorsSource = parentsArray[0];
            parentsArray.forEach(function (parentId, index) {
                if (output == "jstree") {
                    var nodeId = item.domain + "_" + prop + "_" + item.range;
                    if (!existingNodes[nodeId]) {
                        existingNodes[nodeId] = 1;
                        jstreeData.push({
                            id: nodeId,
                            text: prop + "_" + rangeSource + "." + item.rangeLabel,
                            parent: item.domain,
                            data: {
                                id: nodeId,
                                label: prop + "_" + rangeSource + "." + item.rangeLabel,
                                source: rangeSource,
                            },
                        });
                    }
                } else if (output == "visjs") {
                    if (!existingNodes[parentId]) {
                        existingNodes[parentId] = 1;
                        if (index == 0) {
                            //source Node
                            visjsData.nodes.push({
                                id: parentId,
                                label: parentId,
                                shadow: Lineage_classes.nodeShadow,
                                shape: "box",
                                level: index,

                                color: Lineage_classes.getSourceColor(ancestorsSource),
                                data: {
                                    id: parentId,
                                    label: parentId,
                                    source: parentId,
                                },
                            });
                        } else {
                            visjsData.nodes.push({
                                id: parentId,
                                label: labelsMap[parentId],
                                shadow: Lineage_classes.nodeShadow,
                                shape: shape,
                                size: size,
                                level: index,
                                color: Lineage_classes.getSourceColor(restriction.rangeSourceLabel),
                                data: {
                                    id: parentId,
                                    label: labelsMap[parentId],
                                    source: restriction.rangeSourceLabel,
                                },
                            });
                        }
                    }
                    if (index > 0) {
                        var fromId = parentsArray[index - 1];
                        var edgeId = parentId + "_" + fromId;
                        if (!existingNodes[edgeId]) {
                            existingNodes[edgeId] = 1;
                            visjsData.edges.push({
                                id: edgeId,
                                from: parentId,
                                to: fromId,
                            });
                        }
                    }
                }
            });
        });
        visjsData.maxLevel = maxLevel;
        return visjsData;
    };

    self.graphAllProperties = function () {
        Lineage_classes.drawObjectProperties(Lineage_sources.activeSource, "all");
    };

    self.exportProperties = function () {
        // pass
    };

    self.projectSameAsRestrictionsOnSource = function (orphans) {
        if (orphans) return alert("Coming soon...");
        if (!$("#LineageRelations_setExactMatchSameAsSourceInitUIcBX").prop("checked")) Lineage_classes.initUI();
        var fromSource = Lineage_sources.activeSource;
        var toSource = $("#LineageRelations_setExactMatchSameAsSourceSelect").val();
        if (!fromSource) return alert("select a start source");
        if (!toSource || toSource == "") return alert("select a target source ");
        if (fromSource == toSource) return alert("the two sources are the same");
        var fromIndex = fromSource.toLowerCase();
        var toIndex = toSource.toLowerCase();

        var restrictions = [];
        var toLabelsMap = {};
        var wordsMap = {};
        var fromNodesSelection = null;
        async.series(
            [
                function (callbackSeries) {
                    self.getFromSourceSelection(function (err, result) {
                        if (err) return callbackSeries(err);
                        fromNodesSelection = result;
                        callbackSeries();
                    });
                },
                function (callbackSeries) {
                    var resultSize = 1;
                    var size = 200;
                    var offset = 0;
                    var totalProcessed = 0;

                    async.whilst(
                        function (_test) {
                            return resultSize > 0;
                        },
                        function (callbackWhilst) {
                            MainController.UI.message("searching labels in " + fromSource);
                            Standardizer.listSourceLabels(fromIndex, offset, size, null, function (err, hits) {
                                if (err) return callbackWhilst(err);
                                resultSize = hits.length;
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                totalProcessed += resultSize;

                                offset += size;

                                hits.forEach(function (hit) {
                                    if (!fromNodesSelection || fromNodesSelection.indexOf(hit._source.id) > -1)
                                        wordsMap[hit._source.label] = {
                                            id: hit._source.id,
                                            label: hit._source.label,
                                            matches: [],
                                        };
                                });

                                SearchUtil.getElasticSearchMatches(Object.keys(wordsMap), toIndex, "exactMatch", 0, size, function (err, result) {
                                    if (err) return alert(err);
                                    Object.keys(wordsMap).forEach(function (word, index) {
                                        if (!result[index] || !result[index].hits) return;
                                        var hits = result[index].hits.hits;

                                        var sourceEntity = wordsMap[word];
                                        hits.forEach(function (hit) {
                                            if (sourceEntity.id == hit._source.id) return;
                                            var entity = {
                                                domain: sourceEntity.id,
                                                domainLabel: sourceEntity.label,
                                                range: hit._source.id,
                                                rangeLabel: hit._source.label,
                                                prop: "http://www.w3.org/2002/07/owl#sameAs",
                                                propLabel: "sameAs",
                                                parents: hit._source.parents,
                                                node: "_:b" + common.getRandomHexaId(10),
                                                domainSourceLabel: fromSource,
                                                rangeSourceLabel: toSource,
                                            };
                                            entity.parents += hit._source.id;

                                            restrictions.push(entity);
                                            MainController.UI.message("Matching labels in " + toSource + " : " + restrictions.length);
                                        });
                                    });
                                    callbackWhilst();
                                });
                            });
                        },
                        function (err) {
                            callbackSeries(err);
                        }
                    );
                },
                // get target source labels and add them to restriction
                function (callbackSeries) {
                    var resultSize = 1;
                    var size = 200;
                    var offset = 0;
                    async.whilst(
                        function (_test) {
                            return resultSize > 0;
                        },
                        function (callbackWhilst) {
                            MainController.UI.message("searching labels in " + toSource);
                            Standardizer.listSourceLabels(toIndex, offset, size, null, function (err, hits) {
                                if (err) return callbackWhilst(err);
                                resultSize = hits.length;
                                offset += size;

                                hits.forEach(function (hit) {
                                    toLabelsMap[hit._source.id] = hit._source.label;
                                });

                                callbackWhilst();
                            });
                        },
                        function (err) {
                            callbackSeries(err);
                        }
                    );
                },
            ],
            function (err) {
                if (err) return alert(err);
                MainController.UI.message("Drawing Graph");
                self.projectedGraphData = restrictions;
                self.showRestrictions("visjs", restrictions, toLabelsMap);
            }
        );
    };

    self.saveProjectedGraph = function () {
        return alert("coming soon...");
        //        var version = prompt("graph version name");
        //        if (!version || version == "") return;
        //        var triples = [];
        //        var uniqueIds = {};
        //        var imports = [];
        //        self.projectedGraphData.forEach(function (item) {
        //            var parentsArray = item.parents.split("|");
        //
        //            parentsArray.forEach(function (parentId, index) {
        //                if (index == 0) {
        //                    if (!uniqueIds[parentId]) {
        //                        uniqueIds[parentId] = 1;
        //                        imports.push(parentId);
        //                    }
        //                } else if (index == 1) {
        //                } else {
        //                    var id = parentId + "_" + parentsArray[index - 1];
        //                    if (!uniqueIds[parentId]) {
        //                        triples = triples.concat(Lineage_blend.getSubClassTriples(parentId, parentsArray[index - 1]));
        //                    }
        //                }
        //            });
        //            // leafNode create restrictions sameAs
        //            var propId = "http://www.w3.org/2002/07/owl#sameAs";
        //            var id = item.range + "_" + propId + "_" + item.domain;
        //            if (!uniqueIds[id]) {
        //                uniqueIds[id] = 1;
        //                triples = triples.concat(Lineage_blend.getRestrictionTriples(item.range, item.domain, propId));
        //            }
        //        });
        //
        //        var graphUri = Config.sources[Lineage_sources.activeSource].graphUri + "projected/" + version + "/";
        //
        //        var graphMetaDataOptions = { label: "" + Lineage_sources.activeSource + " projected " + version, comment: "" };
        //
        //        var graphMetaData = Lineage_blend.getProjectedGraphMetaDataTriples(graphUri, imports, graphMetaDataOptions);
        //        triples = triples.concat(graphMetaData);
        //        var commonMetaData = Lineage_blend.getCommonMetaDataTriples(graphUri, "exactMatch_projection", "draft");
        //        triples = triples.concat(commonMetaData);
        //
        //        var insertTriplesStr = "";
        //        triples.forEach(function (item, index) {
        //            insertTriplesStr += Sparql_generic.triplesObjectToString(item);
        //        });
        //
        //        var query = " WITH GRAPH  <" + graphUri + ">  " + "INSERT DATA" + "  {" + insertTriplesStr + "  }";
        //
        //        // console.log(query)
        //        var url = Config.sources[Lineage_sources.activeSource].sparql_server.url + "?format=json&query=";
        //        Sparql_proxy.querySPARQL_GET_proxy(url, query, null, { source: Lineage_sources.activeSource }, function (err, result) {
        //            return MainController.UI.message("Project Graph saved", true);
        //        });
    };

    self.loadProjectedGraph = function (graphUri) {
        //   var graphUri= $("#LineageRelations_projectedGraphsSelect").val()
        var query = " WITH GRAPH  <" + graphUri + ">  " + "INSERT DATA" + "  {" + insertTriplesStr + "  }";

        // console.log(query)
        var url = Config.sources[Lineage_sources.activeSource].sparql_server.url + "?format=json&query=";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, null, { source: Lineage_sources.activeSource }, function (_err, _result) {
            // pass
        });
    };

    self.dictionaryValidation = {
        validateSameAsCandidate: function (_nodeId) {
            // pass
        },
        rejectSameAsCandidate: function (_nodeId) {
            // pass
        },
        sameAsCandidateInfos: function (_nodeId) {
            // pass
        },
    };

    return self;
})();
