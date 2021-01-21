var Sparql_OWL = (function () {

        var self = {};

        var filterCollectionsAncestorsDepth = 4
        self.ancestorsDepth = 6

        var elasticUrl = Config.serverUrl;

        self.getTopConcepts = function (sourceLabel, options, callback) {
            if (!options)
                options = {}
            var fromStr = ""

            var strFilterTopConcept;
            var topClassFilter = Config.sources[sourceLabel].topClassFilter
            if (topClassFilter)
                strFilterTopConcept = topClassFilter;
            else
                strFilterTopConcept = "?topConcept ?x ?y. filter(NOT EXISTS {?topConcept rdfs:subClassOf ?z}) "

            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;
            if (self.graphUri && self.graphUri != "")
                fromStr = " FROM <" + self.graphUri + ">"


            if (Config.sources[sourceLabel].topClass)
                self.topClass = Config.sources[sourceLabel].topClass;

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "prefix owl: <http://www.w3.org/2002/07/owl#>" +
                "select   distinct ?topConcept  ?topConceptLabel  " + fromStr + "  where {" +
                strFilterTopConcept +
                " OPTIONAL{?topConcept rdfs:label ?topConceptLabel.}"
            if (options.filterCollections)
                query += "?collection skos:member ?aConcept. ?aConcept rdfs:subClassOf+ ?topConcept." + Sparql_common.setFilter("collection", options.filterCollections)
            query += "}order by ?topConceptLabel "
            " }"
            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit
            var url = self.sparql_url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {
                if (err) {
                    return callback(err)
                }
                result.results.bindings = Sparql_generic.setBindingsOptionalProperties(result.results.bindings, "topConcept", {type: "http://www.w3.org/2002/07/owl#Class"})
                return callback(null, result.results.bindings);
            })
        }


        self.getNodeChildren = function (sourceLabel, words, ids, descendantsDepth, options, callback) {
            if (!options)
                options = {}

            var fromStr = ""


            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;
            var strFilter;
            if (words) {
                strFilter = Sparql_common.setFilter("concept", null, words, options)
            } else if (ids) {
                strFilter = Sparql_common.setFilter("concept", ids, null)
            }
            if (self.graphUri && self.graphUri != "")
                fromStr = " FROM <" + self.graphUri + ">"


            var owlPredicate = "subClassOf";
            if (options.owlType)
                owlPredicate = options.owlType

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "select   distinct * " + fromStr + " where {" +
                "?child1   rdfs:" + owlPredicate + " ?concept. " + strFilter +
                "OPTIONAL {?child1 rdfs:label ?child1Label.}"
            if(false  && options.skipRestrictions){
                query +=  " filter ( NOT EXISTS {?child1 rdfs:subClassOf ?superClass.?superClass rdf:type owl:Restriction}) "
            }

            for (var i = 1; i < descendantsDepth; i++) {

                query += "OPTIONAL { ?child" + (i + 1) + " rdfs:" + owlPredicate + " ?child" + i + "." +
                    "OPTIONAL {?child" + (i + 1) + " rdfs:label  ?child" + (i + 1) + "Label.}"


            }
            for (var i = 1; i < descendantsDepth; i++) {
                query += "} "
            }
            query += "} order by ?child1 ";
            " }"
            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit


            if (options.filterCollections) {
                var fromStr = ""
                if (self.graphUri && self.graphUri != "") {
                    if (!Array.isArray(self.graphUri))
                        self.graphUri = [self.graphUri]
                    self.graphUri.forEach(function (graphUri) {
                        fromStr = " FROM <" + graphUri + "> "
                    })
                }


                query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
                    "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
                    "PREFIX  skos:<http://www.w3.org/2004/02/skos/core#> " +
                    " select  distinct * " + fromStr + "   WHERE { " +
                    "  ?child1 rdfs:" + owlPredicate + " ?concept.   " + strFilter +
                    "   ?collection skos:member* ?acollection. " + Sparql_generic.Sparql_common.getUriFilter("collection", options.filterCollections) +
                    //"?acollection rdf:type skos:Collection.    ?acollection skos:member/(^rdfs:subClassOf+|rdfs:subClassOf*) ?child1.  " +
                    "?acollection rdf:type skos:Collection.    ?acollection skos:member/(rdfs:" + owlPredicate + "*) ?child1.  " +
                    "  " +
                    "   ?collection skos:prefLabel ?collectionLabel." +
                    "   ?acollection skos:prefLabel ?acollectionLabel." +
                    "   optional{?concept rdfs:label ?conceptLabel.}" +
                    "   ?child1 rdfs:label ?child1Label." +
                    "   ?child1 rdf:type ?child1Type." +

                    "}order by ?concept"
            }


            var url = self.sparql_url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {
                if (err) {
                    return callback(err)
                }
                result.results.bindings = Sparql_generic.setBindingsOptionalProperties(result.results.bindings, "child")
                return callback(null, result.results.bindings)

            })

        }

        self.getNodeInfos = function (sourceLabel, conceptId, options, callback) {
            if (!options)
                options = {}
            var fromStr = ""

            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;

            if (self.graphUri && self.graphUri != "") {
                if (!Array.isArray(self.graphUri))
                    self.graphUri = [self.graphUri]
                self.graphUri.forEach(function (graphUri) {
                    fromStr = " FROM <" + graphUri + "> "
                })
            }


            var query = "select * " + fromStr +
                " where {<" + conceptId + "> ?prop ?value. } ";
            " }"
            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit

            var url = self.sparql_url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }
        self.getNodeParents = function (sourceLabel, words, ids, ancestorsDepth, options, callback) {
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;
            if (!options)
                options = {}
            var strFilter;
            if (words) {
                strFilter = Sparql_common.setFilter("concept", null, words, options)
            } else if (ids) {
                strFilter = Sparql_common.setFilter("concept", ids, null)
            }

            var fromStr = ""
            if (self.graphUri && self.graphUri != "") {
                if (!Array.isArray(self.graphUri))
                    self.graphUri = [self.graphUri]
                self.graphUri.forEach(function (graphUri) {
                    fromStr = " FROM <" + graphUri + "> "
                })
            }
            var owlPredicate = "subClassOf";
            if (options.owlType)
                owlPredicate = options.owlType

            var query = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX  rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                " select distinct *  " + fromStr + "  WHERE {{"

            query += "?concept rdfs:label ?conceptLabel. " + strFilter;

            ancestorsDepth = Math.min(ancestorsDepth, self.ancestorsDepth);

            for (var i = 1; i <= ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept rdfs:" + owlPredicate + "  ?broader" + i + "."
                    if(options.skipRestrictions){
                        query +=  " filter ( NOT EXISTS {?broader" + (i)+" rdf:type owl:Restriction}) "
                    }


                } else {

                    query += "OPTIONAL { ?broader" + (i - 1) + " rdfs:" + owlPredicate + " ?broader" + i + "."
                 //   "?broader" + i + " rdf:type owl:Class."



                }
                query += "OPTIONAL{?broader" + (i) + " rdfs:label ?broader" + (i) + "Label.}"



            }


            for (var i = 1; i < ancestorsDepth; i++) {
                query += "} "

            }

            query += "  }}";

            if (options.filterCollections) {
                query += "MINUS {?collection skos:member* ?aCollection.?acollection skos:member ?broader" + Sparql_common.getUriFilter("collection", options.filterCollections)
            }

            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit


            var url = self.sparql_url + "?format=json&query=";
            var method = Config.sources[sourceLabel].server_method;
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {
                if (err) {
                    return callback(err)
                }
                result.results.bindings = Sparql_generic.setBindingsOptionalProperties(result.results.bindings, "broader")
                return callback(null, result.results.bindings)

            })
        }

        self.getItems = function (sourceLabel, options, callback) {

            if (!options) {
                options = {}
            }
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;


            var fromStr = ""
            if (self.graphUri && self.graphUri != "") {
                if (!Array.isArray(self.graphUri))
                    self.graphUri = [self.graphUri]
                self.graphUri.forEach(function (graphUri) {
                    fromStr = " FROM <" + graphUri + "> "
                })
            }


            var query = "";
            query += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX  rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>"


            query += " select distinct * " + fromStr + "  WHERE { "
            query += "?concept rdfs:label ?conceptLabel.";

            if (options.filter)
                query += options.filter;
            if (options.lang)
                query += "filter(lang(?conceptLabel )='" + lang + "')"

            query += "  } ";
            " }"
            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit

            var url = self.sparql_url + "?format=json&query=";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {


                if (err) {
                    return callback(err)
                }

                return callback(null, result.results.bindings)

            })
        }

        self.getObjectProperties = function (sourceLabel, ids, options, callback) {

            if (!options) {
                options = {}
            }

            var filterStr = Sparql_common.setFilter("domain", ids);
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;

            var fromStr = ""
            if (self.graphUri && self.graphUri != "") {
                if (!Array.isArray(self.graphUri))
                    self.graphUri = [self.graphUri]
                self.graphUri.forEach(function (graphUri) {
                    fromStr = " FROM <" + graphUri + "> "
                })
            }


            var query = "PREFIX type: <http://info.deepcarbon.net/schema/type#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "select distinct ?domain ?prop ?range ?domainLabel ?propLabel ?rangeLabel" + fromStr +
                " WHERE { ?domain ?prop ?range ." + filterStr +
                "?prop rdfs:subProperty* ?superProp.    ?superProp rdf:type owl:ObjectProperty"+
            " OPTIONAL {?domain rdfs:label ?domainLabel}"+
                " OPTIONAL {?prop rdfs:label ?propLabel}"+
                " OPTIONAL {?range rdfs:label ?rangeLabel}"+
                " }"
            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit



            var url = self.sparql_url + "?format=json&query=";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {


                if (err) {
                    return callback(err)
                }

                return callback(null, result.results.bindings)

            })
        }
        self.getObjectRestrictions = function (sourceLabel, ids, options, callback) {

            if (!options) {
                options = {}
            }

            var filterStr = Sparql_common.setFilter("id", ids);
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_server.url;

            var fromStr = ""
            if (self.graphUri && self.graphUri != "") {
                if (!Array.isArray(self.graphUri))
                    self.graphUri = [self.graphUri]
                self.graphUri.forEach(function (graphUri) {
                    fromStr = " FROM <" + graphUri + "> "
                })
            }


            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT * "+fromStr+" WHERE {" +
                "  ?id rdfs:subClassOf ?node. " +filterStr+
                " ?node owl:onProperty ?prop ." +
                " OPTIONAL {?prop rdfs:label ?propLabel}"+
                "  OPTIONAL {?node owl:allValuesFrom ?value}. " +
                "   OPTIONAL {?node owl:someValueFrom ?value}. " +
                "   OPTIONAL {?node owl:aValueFrom ?value}. " +
                "} "
            var limit = options.limit || Sparql_generic.queryLimit;
            query+=" limit "+limit



            var url = self.sparql_url + "?format=json&query=";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: sourceLabel}, function (err, result) {


                if (err) {
                    return callback(err)
                }

                return callback(null, result.results.bindings)

            })
        }



        return self;


    }
)()