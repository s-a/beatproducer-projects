var fs = require("fs");
var path = require("path");
var https = require('https');
var should = require("should");
var shell = require('shelljs');
// https://api.github.com/search/users?q=[stephan.ahlf@googlemail.com,agent.smith.26@gmail.com]
var githubRequest = function (path, done) {
	var options = {
	  host: 'api.github.com',
	  path: path,
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
    		files_.push(name);
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
var commitUsername, commitEmail;

before(function  (done) {
	commitEmail = shell.exec('git log -n 1 --pretty="%ae"',  {silent:true}).output.trim();

	githubRequest("/search/users?q=" + commitEmail, function(contents) {
		commitUsername = contents.items[0].login;
		done();
	});
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

	it("should got git commit user email", function() {
		commitEmail.length.should.be.above(1);
	});

	it("should resolve commit user email to git username", function() {
		commitUsername.length.should.be.above(1);
	});

	it("should not delete files from other users", function() {
		githubRequest("/repos/s-a/beatproducer-projects/contents/projects", function(contents) {
			for (var i = 0; i < contents.length; i++) {
				var file = contents[i];
				var fn = "./" + file.path;

				fs.existsSync( fn ).should.be.true;
				if ( !fs.existsSync( fn ) && commitUsername !== "s-a"){
					console.warn("checking deleted file", fn);
					getFileOwner(file.name).should.be.equal(commitUsername);
				}
			}
		});
	});

});