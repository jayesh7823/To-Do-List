const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const { MongoClient, ServerApiVersion } = require('mongodb');
const _ = require("lodash");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

// mongoose.connect(process.env.DB_LOCAL + process.env.DB_NAME);
const uri = "mongodb+srv://" + process.env.DB_USERNAME  + ":" + process.env.DB_PASSWORD + "@cluster0.xsjrbm0.mongodb.net/" + process.env.DB_NAME;
// const client = new MongoClient(uri);
mongoose.connect(uri);


const itemSchema = new mongoose.Schema ({
    name: String,

});
const Item = mongoose.model("Item", itemSchema);

const listSchema = new mongoose.Schema ({
    name: String,
    items: [itemSchema]
});
const List = mongoose.model("List", listSchema);

const item1 = new Item({
name: "welcome to your to do list"
});
const item2 = new Item({
    name: "Hit the + button to add a new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItem = [item1, item2, item3];


app.get("/", function(req, res) {

    Item.find()
    .then(function (foundItems){
        if (foundItems.length === 0) {
            Item.insertMany(defaultItem)
                .then(function (items){
                    // console.log(items)
                })
                .catch(function(err){
                    console.log(err);
                });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});   
            // console.log(foundItems)
        }
    })
    .catch(function(err){
        console.log(err);
    });

});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName})
        .then(function(foundLists){
            if (!foundLists) {
                const list = new List({
                    name: customListName,
                    items: defaultItem
                });
                list.save();
                res.redirect("/" + customListName);
            } else {

                res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items});   
            }
        })
        .catch(function(err){
            console.log(err);
        });
});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");        
    } else {
        List.findOne({name: listName})
            .then(function(foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(function(err){
                console.log(err);
            });
    }

});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({_id: checkedItemId})
        .then(function (){
            // console.log("succeed")
        })
        .catch(function(err){
            console.log(err);
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .then(function(foundList){
                res.redirect("/" + listName);
            })
            .catch(function(err){
                console.log(err);
            });

    }

});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log("Server is Ready at port " + port);
});
