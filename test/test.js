var fs = require("fs");
var path = require("path");
var https = require('https');
var should = require("should");
var shell = require('shelljs');

var getRepoFiles = function (done) {
	var options = {
	  host: 'api.github.com',
	  path: "/repos/s-a/beatproducer-projects/contents/projects",
	  method: 'GET',
      headers: {'user-agent': 'node.js'}
	};

	var callback = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {

	    done(JSON.parse(str));
	  });
	};
	https.get(options, callback).end();
};


function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
 //       	if (path.extname(name).toLowerCase() === ".json" ){
        		files_.push(name);
//        	}
        }
    }
    return files_;
}

function getFileOwner(filename){
	var res = filename.split(" ");
	res.pop();
	return res.join(" ");
}

var files = getFiles(path.join(__dirname, "..", "projects"));
var giturl,currentGitHubUser;

before(function  () {
	var s = shell.exec("git remote -v");
	giturl = s.output.split("\n")[0].split("(fetch)")[0].split("origin")[1].trim();
	console.log("remote:", giturl);
	currentGitHubUser = giturl.replace("https://github.com/", "").split("/")[0];
	console.log("user:", currentGitHubUser);
});

describe("validation", function() {
	this.timeout(15000);


	it("should contain only .json files", function() {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			path.extname(file).toLowerCase().should.be.equal(".json");
		}
	});

	it("should contain only valid project .json files", function() {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			require(file).bpm.should.be.above(0);
		}
	});

	it("should got git repo infos", function() {
		currentGitHubUser.length.should.be.above(1);
	});

	it("should not delete files from other users", function(done) {
		getRepoFiles(function(contents) {
			for (var i = 0; i < contents.length; i++) {
				var file = contents[i];
				var fn = "./" + file.path;
				if ( !fs.existsSync( fn ) && currentGitHubUser !== "s-a"){
					console.warn("checking deleted file", fn);
					getFileOwner(file.name).should.be.equal(currentGitHubUser);
				}
			}
			done();
		});
	});

});