var processor = require("../bin/KG/CsvTripleBuilder.");
var sparqlServerUrl = "http://51.178.139.80:8890/sparql";

mappingsMap = {
    SYSTEMS: {
        type: "owl:Class",
        fileName: "D:\\NLP\\ontologies\\14224\\systems.txt",
        lookups: [],
        transform: {
            label2: function (value, role, prop) {
                if (prop == "skos:prefLabel") return value;
                else return "Syst-" + value;
            },
        },
        tripleModels: [
            { s: "id", p: "iso14224:hasCode", o: "id", isString: true },
            { s: "id", p: "rdfs:subClassOf", o: "http://rds.posccaesar.org/ontology/lis14/ont/core/1.0/System" },
            { s: "id", p: "rdf:type", o: "http://w3id.org/readi/z018-rdl/prod_SYS" },
            { s: "id", p: "rdf:type", o: "owl:Class" },
            { s: "id", p: "skos:prefLabel", o: "label2" },
            { s: "id", p: "rdfs:label", o: "label2" },
        ],
    },
    // package
    CLASSES_3: {
        type: "owl:Class",
        fileName: "D:\\NLP\\ontologies\\14224\\classes_3.txt",
        transform: {
            label2: function (value, _role, _prop) {
                return "Pack-" + value;
            },
        },
        lookups: [],
        tripleModels: [
            { s: "id", p: "part14:partOf", o: "system" },
            { s: "id", p: "iso14224:hasCode", o: "label1", isString: true },
            { s: "id", p: "skos:prefLabel", o: "label1" },
            { s: "id", p: "rdf:type", o: "owl:Class" },
            { s: "id", p: "rdf:type", o: "http://w3id.org/readi/rdl/CFIHOS-30000311" },
            { s: "id", p: "rdf:type", o: "http://rds.posccaesar.org/ontology/lis14/ont/core/1.0/PhysicalObject" },
            { s: "id", p: "rdfs:subClassOf", o: "system" },
            { s: "id", p: "rdfs:label", o: "label2" },
        ],
    },
    //equipment
    CLASSES_4: {
        type: "owl:Class",
        topClass: "<http://w3id.org/readi/rdl/CFIHOS-30000311>",
        fileName: "D:\\NLP\\ontologies\\14224\\classes_4.txt",
        lookups: [],
        transform: {
            label2: function (value, _role, _prop) {
                return "Equip-" + value;
            },
        },
        tripleModels: [
            { s: "id", p: "part14:partOf", o: "superClass" },
            { s: "id", p: "iso14224:hasCode", o: "label1", isString: true },
            { s: "id", p: "rdf:type", o: "owl:Class" },
            { s: "id", p: "rdf:type", o: "http://w3id.org/readi/z018-rdl/prod_EQUI" },
            { s: "id", p: "rdf:type", o: "http://rds.posccaesar.org/ontology/lis14/ont/core/1.0/PhysicalObject" },
            { s: "id", p: "skos:prefLabel", o: "label1" },
            { s: "id", p: "rdfs:label", o: "label2" },
        ],
    },

    //boundary
    FUNCTIONALOBJECT: {
        type: "owl:Class",
        fileName: "D:\\NLP\\ontologies\\14224\\functionalObjects.txt",
        lookups: [],
        transform: {
            xx: function (value, _role, _prop) {
                return "Class-" + value;
            },
        },

        //SubClass	SubClassCode	LEV	SubClassDescription	EquipmentClass
        tripleModels: [
            { s: "SubClass", p: "part14:partOf", o: "EquipmentClass" },
            { s: "SubClass", p: "iso14224:hasCode", o: "SubClass", isString: true },
            { s: "SubClass", p: "rdf:type", o: "owl:Class" },
            { s: "SubClass", p: "rdf:type", o: "http://rds.posccaesar.org/ontology/lis14/ont/core/1.0/FunctionalObject" },
            { s: "SubClass", p: "rdfs:label", o: "SubClassDescription" },
            { s: "SubClass", p: "skos:prefLabel", o: "SubClassCode" },
        ],
    },

    COMPONENTS: {
        type: "owl:Class",
        fileName: "D:\\NLP\\ontologies\\14224\\components.txt",
        lookups: [],
        transform: {
            xx: function (value, _role, _prop) {
                return "Class-" + value;
            },
        },
        //Component	ComponentCode	LEV	ComponentDescription	SubClass

        tripleModels: [
            { s: "ComponentCode", p: "part14:partOf", o: "SubClass" },
            { s: "ComponentCode", p: "iso14224:hasCode", o: "ComponentCode", isString: true },
            { s: "ComponentCode", p: "rdf:type", o: "owl:Class" },
            { s: "ComponentCode", p: "rdf:type", o: "http://w3id.org/readi/z018-rdl/prod_COMP" },
            { s: "ComponentCode", p: "rdf:type", o: "http://rds.posccaesar.org/ontology/lis14/ont/core/1.0/PhysicalObject" },
            { s: "ComponentCode", p: "rdfs:label", o: "ComponentDescription" },
            { s: "ComponentCode", p: "skos:prefLabel", o: "ComponentCode" },
        ],
    },
};

var graphUri = "http://data.total.com/resource/tsf/maintenance/romain_14224/";

if (true) {
    var mappingNames = ["SYSTEMS", "CLASSES_3", "CLASSES_4", "COMPONENTS", "FUNCTIONALOBJECT"];
    //var mappingNames = ["FUNCTIONALOBJECT"];

    var mappings = [];
    mappingNames.forEach(function (mappingName) {
        mappings.push(mappingsMap[mappingName]);
    });
    processor.processSubClasses(mappings, graphUri, sparqlServerUrl);
}
