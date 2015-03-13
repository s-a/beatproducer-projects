var fs = require("fs");
var path = require("path");
var should = require("should");

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
        	if (path.extname(name).toLowerCase() === ".json" ){
        		files_.push(name);
        	}
        }
    }
    return files_;
}


var files = getFiles(path.join(__dirname, "..", "projects"));
	console.log(files);

describe("validation", function() {

	it("should contain only valid project .json files", function() {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			require(file).bpm.should.be.above(0);
		}
	});
});