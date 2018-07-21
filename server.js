var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var mongoose = require("mongoose");

var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// =============================================================================
//* MIDDLEWARE
// =============================================================================

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_ORANGE_URI || "mongodb://localhost:27017";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// =============================================================================
//* ROUTES
// =============================================================================

app.get("/scrape", function (req, res) {
  url = "https://newsapi.org/v2/everything?sources=cnn&apiKey=40545117cb354db0bfbd00f6b5b80451"

  request(url, function (err, response, html) {
    
    var $ = cheerio.load(response);
    
    if (!err) {
      // console.log(html);
    }

    let json = JSON.parse(html).articles
    // console.log(json)
  
    let collection = JSON.parse(html).articles.filter(article => article.title)
    console.log(collection);
    collection.forEach((element) => {
      // var link = $(element).children().attr("href");
      // var title = $(element).children("dt").children("a").text();
      // var link = $(element).children("dt").children("a").attr('href');
      // var summary = $(element).children('.intro').text();
      // console.log(summary);

      // Create a new Article using the `result` object built from scraping
      if(element) {
        console.log(element);
        db.Article.create({
        title: element.title
        // link: articles.url,
        // summary: articles.description
      })
        .then(function (dbArticle) {
        })
        .catch(function (err) {
          return res.json(err);
        });
      }
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    // res.send("Scrape Complete"); // << Success
    res.redirect("/");
  })


});


app.get("/", function (req, res) {

  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {

      var articleData = {
        data: dbArticle
      }

      res.render('index', articleData);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// =============================================================================
//* GET ROUTES FROM DATABASE
// =============================================================================

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {

  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {

      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("comment")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function (req, res) {
  // Create a new comment and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(function (dbComment) {
      // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});