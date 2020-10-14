const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const morgan = require("morgan");
const fileUpload = require('express-fileupload')
require("dotenv").config();

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload())

const port = 4000;

const url = process.env.DB_URL;
const dbname = "creativeAgency";

MongoClient.connect(url, (err, client) => {
    console.log("connected db");
    const db = client.db(dbname);
    const servicesCollection = db.collection("services");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");
    // post services
    app.post("/add-service", (req, res) => {
        const icon = req.files.icon;
        const title = req.body.title;
        const description = req.body.description;
        icon.mv(`${__dirname}/services/${icon.name}`, err => {
            if (err) {
                console.log(err);
                return res.status(500).send({ msg: "Failed to upload image" })
            }
            servicesCollection.insertOne({ icon: icon.name, title, description }).then(
                result => {
                    res.send(result.insertedCount > 0)
                }
            )
        })
    })
    // add review
    app.post("/add-review", (req, res) => {
        const newReview = req.body;
        reviewsCollection.insertOne(newReview).then(result => {
            res.send(result.insertedCount > 0)
        })
    })

    // Get Requests
    app.get('/services', (req, res) => {
        servicesCollection.find({}).toArray((err, documents) => {
            res.send(documents)
        })
    })
    app.get('/reviews', (req, res) => {
        reviewsCollection.find({}).toArray((err, documents) => {
            res.send(documents)
        })
    })

});

app.get("/", (req, res) => {
    res.send("Hello world!");
});
app.listen(port, () => {
    console.log("Example app listening to localhost:4000");
});