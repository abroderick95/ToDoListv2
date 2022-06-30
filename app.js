const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(
  "mongodb+srv://abroderickMongo:Daffodil2018MongoDB@cluster0.xg2ms.mongodb.net/todolistDB"
);

const day = new Date().toLocaleString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to Daily Softwaring Checklist",
});
const item2 = new Item({
  name: "Check off the boxes below and get your day started!",
});

const defaultItems = [item1, item2];

const userListsSchema = {
  name: String,
  items: [itemsSchema],
  whichList: String,
};
const UserList = mongoose.model("UserList", userListsSchema);

async function findAllItems() {
  const toDoListItems = await Item.find({});
  return toDoListItems;
}

app.get("/", async function (req, res) {
  let toDoListItems = await findAllItems();
  if (toDoListItems.length === 0) {
    Item.insertMany(defaultItems, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Success! Items inserted.");
        toDoListItems = defaultItems;
      }
    });
  }

  res.render("list", {
    listTitle: day,
    newListItems: toDoListItems,
    whichList: "Home",
  });
});

app.get("/UserList/:newListRoute", function (req, res) {
  const existingUserRoute = _.capitalize(req.params.newListRoute);
  let userCreatedList;

  UserList.findOne({ name: existingUserRoute }, function (err, listFound) {
    if (err) {
      console.log(err);
    } else if (listFound === null) {
      const userList = new UserList({
        name: existingUserRoute,
        items: defaultItems,
        whichList: existingUserRoute,
      });
      userList.save();
      userCreatedList = userList;
      console.log(userCreatedList.name + " created.");
    } else {
      userCreatedList = listFound;
      console.log("Found " + userCreatedList.name);
    }
    res.render("list", {
      listTitle: existingUserRoute,
      newListItems: userCreatedList.items,
      whichList: existingUserRoute,
    });
  });
});

app.post("/", function (req, res) {
  const userThingToDo = req.body.newItem;
  const whichList = req.body.list;
  const item = new Item({
    name: userThingToDo,
  });

  if (whichList === "Home") {
    item.save();
    res.redirect("/");
  } else {
    UserList.findOne({ name: whichList }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + whichList);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const checkWhichList = req.body.whichList;

  if (checkWhichList === "Home") {
    Item.findByIdAndRemove(checkItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(checkItemId + " removed successfully.");
        res.redirect("/");
      }
    });
  } else {
    UserList.findOneAndUpdate(
      { name: checkWhichList },
      { $pull: { items: { _id: checkItemId } } },
      function (err, listFound) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + checkWhichList);
          console.log("Item deleted from " + listFound.name);
        }
      }
    );
  }
});

// eslint-disable-next-line no-undef
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server service has been served.");
});

// Create code that, whenever an item is crossed off, put a subheading at the top
// that says, "Way to go! Click check box again to delete, or click list item to undo."
// Obviously the message should go away if the item is either deleted or undone,
// but at the same time it should stay as long as another box is checked. In that case, it
// should flash to a different color but still stay there.
// Would be even cooler if check box could turn to red and text could read "Item deleted"
// briefly before list item disappears.
//
// Reference Code
//

// app.get("/about", function (req, res) {
//   res.render("about");
// });

// From inside home "post" route
// if (req.body.list === "Work") {
//   workItems.push(item);
//   res.redirect("/work");
// } else {
//   items.push(item);
//   res.redirect("/");
// }

// Item.find(function (err, allItems) {
//   if (err) {
//     console.log(err);
//   } else {
//     allItems.forEach(function (item) {
//       console.log(item.name, item.id);
//     });
//   }
// });
