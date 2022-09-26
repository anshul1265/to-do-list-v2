const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");
const path = require("path");
const dotenv = require("dotenv").config();
var favicon = require('serve-favicon');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/1662715396.ico'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// connecting the mongoose to the mongodb using localhost
// mongoose.connect(process.env.MONGO_DB_URL);
mongoose.connect(process.env.MONGO_DB_URL).then((c) => {
	console.log(`mongo connected : ${c.connection.host}`);
}).catch(e => {
	console.log(e);
});

// making the schema for the items
const itemsSchema = {
	name: String
};

// making an collection item for the diff. items
const Item = mongoose.model("Item", itemsSchema);

// by default this is the first task.
const task1 = new Item({
	name: "Add using + button"
});

// making a schema for the diff. lists
const listSchema = {
	name: String,
	item: [itemsSchema]
};

// making a collection list for the diff. lists
const list = mongoose.model("list", listSchema);

// array of default tasks
const defaultItems = [task1];

// get to the home route
app.get("/", function (req, res) {
	Item.find({}, function (err, foundItems) {
		// inserting default tasks to the collection/model
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) console.log(err);
			});
		}
		res.render("list", { listTitle: "Today", newListItems: foundItems });
	});
});

// about page of the todo List app
app.get("/about", function (req, res) {
	res.render("about");
});

// extra to manage diff. kinds of lists dynamically use dynamic routes
app.get("/:customListName", function (req, res) {
	const customListName = _.capitalize(req.params.customListName);
	list.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				// create a new list
				const list1 = new list({
					name: customListName,
					item: defaultItems
				});
				list1.save();
				res.render("list", { listTitle: list1.name, newListItems: list1.item });
			}
			else {
				// show the existing list
				res.render("list", { listTitle: foundList.name, newListItems: foundList.item });
			}
		}
	});
});

// making post request by clicking the + button
app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;
	if (listName == "Today") {
		if (itemName != "") {
			const item = new Item({
				name: itemName
			});
			item.save();
		}
		res.redirect("/");
	}
	else {
		if (itemName != "") {
			const item = new Item({
				name: itemName
			});
			list.findOne({ name: listName }, function (err, foundList) {
				if (err) console.log(err);
				foundList.item.push(item);
				foundList.save();
			});
		}
		res.redirect("/" + listName);
	}
});

// making post request to delete by clicking the checkbox
app.post("/delete", function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;
	if (listName == "Today") {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (err) console.log(err);
			res.redirect("/");
		});
	}
	else { // refer to google to know about $pull in mongoose
		list.findOneAndUpdate({ name: listName }, { $pull: { item: { _id: checkedItemId } } }, function (err, foundList) {
			if (err) console.log(err);
			res.redirect("/" + listName);
		});
	}
});

// listens to the port no.
app.listen(port, function () {
	console.log(`Server is serving on the port.${port}`);
});