var filePath = "D:\\NLP\\ontologies\\assets\\CLOV\\KG_tblTagAttribute.csv";
var lineIndex = 0;
var maxLines = 200;
var readStream = require("fs").createReadStream(filePath);
var lineReader = require("readline").createInterface({
    input: readStream,
});

lineReader.on("line", function (line) {
    if (lineIndex++ > maxLines) {
        readStream.destroy();
    } else {
        console.log(line);
    }
});
