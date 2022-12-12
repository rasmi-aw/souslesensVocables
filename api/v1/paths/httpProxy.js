const { processResponse } = require("./utils");
const httpProxy = require("../../../bin/httpProxy.");
const GraphTraversal = require("../../../bin/graphTraversal.");
const ExportGraph = require("../../../bin/exportGraph.");

module.exports = function () {
    let operations = {
        POST,
        GET,
    };

    async function POST(req, res, next) {
        try {
            httpProxy.setProxyForServerDomain(req.headers.host);

            if (req.body.POST) {
                var body = JSON.parse(req.body.body);

                if (body.getShortestPath) {
                    const GraphTraversal = require("../../../bin/graphTraversal.");
                    GraphTraversal.getShortestPath(body.sparqlServerUrl, body.graphUri, body.fromNodeUri, body.toNodeUri, body.options, function (err, result) {
                        processResponse(res, err, result);
                    });
                    return;
                }

                if (body.copyGraphToEndPoint) {
                    const GraphTraversal = require("../../../bin/graphTraversal.");
                    ExportGraph.copyGraphToEndPoint(body.source, body.toEndPointConfig, body.options, function (err, result) {
                        processResponse(res, err, result);
                    });
                    return;
                }
                if (body.importSourceFromUrl) {
                    const SourceIntegrator= require("../../../bin/sourceIntegrator.");
                    SourceIntegrator.importSourceFromTurtle(body.sourceUrl, body.sourceName,  body.options, function (err, result) {
                        processResponse(res, err, result);
                    });
                    return;
                }

                httpProxy.post(req.body.url, body.headers, body.params, function (err, result) {
                    processResponse(res, err, result);
                });
            } else {
                var options = {};
                if (req.body.options) {
                    if (typeof req.body.options == "string") options = JSON.parse(req.body.options);
                    else options = req.body.options;
                }
                options.host = req.headers.host;
                httpProxy.get(req.body.url, options, function (err, result) {
                    processResponse(res, err, result);
                });
            }
        } catch (err) {
            next(err);
        }
    }
    POST.apiDoc = {
        summary: "Send a request to a different domain",
        security: [{ loginScheme: [] }],
        operationId: "httpProxy",
        parameters: [],
        responses: {
            default: {
                description: "Response provided by the proxied server",
            },
        },
    };

    function GET(req, res, next) {
        try {
            httpProxy.get(req.query, function (err, result) {
                processResponse(res, err, result);
            });
        } catch (e) {
            next(e);
        }
    }

    return operations;
};
