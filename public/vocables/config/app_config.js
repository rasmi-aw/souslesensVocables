/**
 The MIT License
 The MIT License
 Copyright 2020 Claude Fauconnet / SousLesens Claude.fauconnet@gmail.com

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var Config = (function () {
    var self = {};

    self.apiUrl = "/api/v1";

    self.wikiCategoriesGraphUri = "http://souslesens.org/data/total/ep/";

    self.defaultNewUriRoot = "http://souslesens.org/resource/";
    self.linkedData_mappings_graph = "http://souslesens.org/resource/linkedData_mappings/";
    self.loginMode = "json";

    self.appName = "VOCABLES";
    self.debug = { query: 1 };
    self.enableCollections = false;
    self.showAssetQueyMenu = true;
    self.preferredSchemaType = "OWL";
    self.queryLimit = 10000;
    self.searchLimit = 500;
    self.searchDepth = 6;
    self.defaultGraphTheme = "white"; //dark
    self.predicatesSource = "TSF-PREDICATES";
    self.dictionarySource = "TSF-DICTIONARY";

    self.topLevelOntologies = {
        "ISO_15926-part-14_PCA": { uriPattern: "lis14", prefix: "part14", prefixtarget: "http://rds.posccaesar.org/ontology/lis14/rdl/" },
        BFO: { uriPattern: "obo", uriPatternXX: "BFO", prefix: "bfo", prefixtarget: "http://purl.obolibrary.org/obo/" },
        DOLCE: { uriPattern: "dul", prefix: "dul", prefixtarget: "http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#" },
    };

    self.namedSetsThesaurusGraphUri = "http://souslesens.org/resource/named-triple-sets/";

    (self.defaultSparqlPrefixes = {
        xs: "<http://www.w3.org/2001/XMLSchema#>",
        rdf: "<http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
        rdfs: "<http://www.w3.org/2000/01/rdf-schema#>",
        owl: "<http://www.w3.org/2002/07/owl#>",
        skos: "<http://www.w3.org/2004/02/skos/core#>",
        iso14224: "<http://data.total.com/resource/tsf/iso_14224#>",
        req: "<https://w3id.org/requirement-ontology/rdl/>",
        part14: "<http://rds.posccaesar.org/ontology/lis14/rdl/>",
        iso81346: "<http://data.total.com/resource/tsf/IEC_ISO_81346/>",
        bfo: "<http://purl.obolibrary.org/obo/bfo.owl>",
        dul: "<http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#>",
        slsv: "<http://souslesens.org/resource/vocabulary/>",
        dcterms: "<http://purl.org/dc/terms/>",
    }),
        (self.dictionaryMetaDataPropertiesMap = {
            prop: "http://www.w3.org/2002/07/owl#onProperty",
            range: "http://www.w3.org/2002/07/owl#someValuesFrom",
            domain: "http://www.w3.org/2000/01/rdf-schema#subClassOf",
            status: "https://www.dublincore.org/specifications/bibo/bibo/bibo.rdf.xml#status",
            domainSourceLabel: "http://data.souslesens.org/property#domainSourceLabel",
            rangeSourceLabel: "http://data.souslesens.org/property#rangeSourceLabel",
            author: "http://purl.org/dc/terms/creator",
            provenance: "http://purl.org/dc/terms/source",
            creationDate: "http://purl.org/dc/terms/created",
        });
    self.dictionaryStatusMap = {
        promote: "OK",
        unPromote: "Candidate",
        trash: "KO",
        delete: "DELETED",
    };

    self.Standardizer = {
        elasticIndexesSourcesMap: {
            readi: "CFIHOS_READI",
            pca: "ISO_15926-PCA",
            cfihos: "CFIHOS-ISO",
        },
    };

    self.Lineage = {
        showSourceNodesInGraph: false,
        basicObjectProperties: [
            { id: "http://www.w3.org/2002/07/owl#sameAs", label: "owl:sameAs", type: "ObjectProperty" },
            { id: "http://www.w3.org/2000/01/rdf-schema#label", label: "rdfs:label", type: "dataTypeProperty" },
            { id: "http://www.w3.org/2000/01/rdf-schema#comment", label: "rdfs:comment", type: "dataTypeProperty" },
            { id: "http://www.w3.org/2000/01/rdf-schema#subClassOf", label: "rdfs:subClassOf", type: "ObjectProperty" },
            { id: "http://rds.posccaesar.org/ontology/lis14/partOf", label: "part14:partOf", type: "ObjectProperty" },
            { id: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", label: "rdf:type", type: "ObjectProperty" },
            {
                id: "http://rds.posccaesar.org/ontology/lis14/representedBy",
                label: "part14:representedBy",
                type: "dataTypeProperty",
            },
            { id: "http://www.w3.org/2004/02/skos/core#prefLabel", label: "skos:prefLabel", type: "dataTypeProperty" },
        ],
    };

    /*****************************************************************************/
    self.sources = {};
    self.tools = {};

    return self;
})();
