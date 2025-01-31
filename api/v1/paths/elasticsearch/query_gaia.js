const path = require("path");
const elasticRestProxy = require(path.resolve("bin/elasticRestProxy..js"));

module.exports = function () {
    let operations = {
        POST,
    };

    function POST(req, res, next) {
        elasticRestProxy.executeGaiaQuery(req.body.query, req.body.indexes, null, function (err, result) {
            if (err) {
                next(err);
            } else {
                return res.status(200).json(result);
            }
        });
    }

    POST.apiDoc = {
        security: [{ loginScheme: [] }],
        summary: "Elasticsearch gaia query",
        description: "Elasticsearch gaia query",
        operationId: "Elasticsearch gaia query",
        parameters: [
            {
                name: "body",
                description: "body",
                in: "body",
                schema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "object",
                        },
                        url: {
                            type: "string",
                        },
                        indexes: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                    },
                },
            },
        ],

        responses: {
            200: {
                description: "Results",
                schema: {
                    type: "object",
                },
            },
        },
    };

    return operations;
};
