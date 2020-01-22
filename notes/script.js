"use strict";
window.$ = window.jQuery = require("jquery");
const fs = require("fs");

create();

// current match
let match = fs.readFileSync("match.txt").toString();

// match schedule
let schedule = JSON.parse(fs.readFileSync("schedule.json"));

// robots playing in this match
let this_match = schedule[parseInt(match)];

// unique id for this device
let device_id = Math.floor(Math.random() * 10000000);

// checks manifest and creates one if it doesn't exist
if (!fs.existsSync("./data/manifest.json")) {
  fs.writeFileSync("./data/manifest.json", "[]");
}
// manifest
let manifest = JSON.parse(fs.readFileSync("./data/manifest.json"));

// loc (int 0-5) represents which div we are putting the textarea into
// alliance is red or blue and dictates border color
function createTextArea(loc, alliance) {
  if (this_match === undefined || this_match === null) { return; } // in the case that there is no more matches
  // adds the text area
  $("#text-spot-" + loc).append(`
    <label for="text-area-` + loc + `">` + this_match[loc] + `</label>
    <input class="` + alliance + ` ` + `form-control textarea" id="text-area-` + loc + `"type="textarea" />
  `);
}

// for creating the app
function create() {
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }
  if (!fs.existsSync("./data/manifest.json")) {
    fs.writeFileSync("./data/manifest.json", "[]");
  }
  if (!fs.existsSync("./match.txt")) {
    fs.writeFileSync("./match.txt", "1");
  }
  if (!fs.existsSync("./schedule.json")) {
    alert("Please create a schedule.json file!")
  }
}

// generates an id for the device
if (!fs.existsSync("./device.txt")) {
  // some code from:
  // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  device_id = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for (let i = 0; i < 11; i++ ) {
    device_id += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  fs.writeFileSync("./device.txt", device_id);
} else {
  device_id = fs.readFileSync("device.txt").toString();
}

function saveJSON() {
  let JSONsave = {
    "info": {},
    "notes": {}
  }
  JSONsave["info"]["match"] = match
  JSONsave["info"]["device"] = device_id;
  JSONsave["info"]["time"] = new Date().getTime();
  JSONsave["info"]["filename"] = parseInt(match) + "-" + device_id + ".json";
  JSONsave["info"]["type"] = "notes";
  JSONsave["notes"]["0"] = $("#text-area-0").val();
  JSONsave["notes"]["1"] = $("#text-area-1").val();
  JSONsave["notes"]["2"] = $("#text-area-2").val();
  JSONsave["notes"]["3"] = $("#text-area-3").val();
  JSONsave["notes"]["4"] = $("#text-area-4").val();
  JSONsave["notes"]["5"] = $("#text-area-5").val();
  // writes the JSON file
  fs.writeFileSync("./data/" + parseInt(match) + "-" + device_id + ".json", JSON.stringify(JSONsave));
  // updates the match number
  fs.writeFileSync("./match.txt", parseInt(match) + 1);
  // earlier in the code we created this file if it did not already exist
  manifest.push(match + "-" + device_id + ".json");
  // writes the manifest
  fs.writeFileSync("./data/manifest.json", JSON.stringify(manifest));
}

$(document).ready(function() {
  // shows the match number
  $(".match-display").text("Match: " + match);
  // creates six textareas, one for each robot
  createTextArea(0, "red");
  createTextArea(1, "red");
  createTextArea(2, "red");
  createTextArea(3, "blue");
  createTextArea(4, "blue");
  createTextArea(5, "blue");
  // on submit, save match to JSON, like 5-1353493652110.json
  $(".submit").click(function() {
    saveJSON();
    window.location.reload();
  });
  // export to a flashdrive "/Volumes/1540", "D:/1540", "C:/1540", "G:/1540", or "K:/1540"
  $(".export").click(function() {
    console.log("you rock")
    // list of possible paths for the flashdrive
    const path_list = ["/Volumes/1540/companal/notes/", "K:/companal/notes/", "D:/companal/notes/", "G:/companal/notes/", "C:/companal/notes/"];
    // tries each path
    for (let path_index in path_list) {
      let path = path_list[path_index];
      // if the path exists
      if (fs.existsSync(path)) {
        // gets the manifest in the path
        let flash_manifest = [];
        if (fs.existsSync(path + "manifest.json")) {
          flash_manifest = JSON.parse(fs.readFileSync(path + "manifest.json"));
        }
        // loops through each file in local manifest
        for (let local_file_index in manifest) {
          // if local file exists on flash, go to next local file
          if (!fs.existsSync("./data/" + manifest[local_file_index])) {
            continue;
          }
          // writes local file to flashdrive
          let local_file_name = manifest[local_file_index];
          let local_file = fs.readFileSync("./data/" + local_file_name);
          fs.writeFileSync(path + local_file_name, local_file);
          if (flash_manifest.indexOf(local_file_name) < 0) {
            flash_manifest.push(local_file_name);
          }
        }
        // save manifest on flashdrive
        fs.writeFileSync(path + "manifest.json", JSON.stringify(flash_manifest));
        // break (won't run this code for any other possible paths)
        break;
      }
    }
  });
});
