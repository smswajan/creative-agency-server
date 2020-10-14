const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const morgan = require("morgan");
require("dotenv").config();

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());
const port = 4000;

const url = process.env.DB_URL;
const dbname = "creativeAgency";

MongoClient.connect(url, (err, client) => {
    console.log("connected db");
    const db = client.db(dbname);

});

app.get("/", (req, res) => {
    res.send("Hello world!");
});
app.listen(port, () => {
    console.log("Example app listening to localhost:4000");
});