const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const morgan = require("morgan");
const fileUpload = require('express-fileupload')
const admin = require('firebase-admin')
require("dotenv").config();

const serviceAccount = require("./creative-agency-live-firebase-adminsdk-ivh94-96ff1533e7.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://creative-agency-live.firebaseio.com"
});

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
    const adminsCollection = db.collection("admins");
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
    // add order
    app.post("/add-order", (req, res) => {
        const newOrder = req.body;
        ordersCollection.insertOne(newOrder).then(result => {
            res.send(result.insertedCount > 0)
        })
    })
    app.post("/add-admin", (req, res) => {
        const newAdmin = req.body;
        adminsCollection.insertOne(newAdmin).then(result => {
            res.send(result.insertedCount > 0)
        })
    })

    // Get Requests
    app.get('/services', (req, res) => {
        servicesCollection.find({}).toArray((err, documents) => {
            res.send(documents)
        })
    })
    app.get('/services/:id', (req, res) => {
        servicesCollection.find({ _id: ObjectId(req.params.id) }).toArray((err, documents) => {
            res.send(documents)
        })
    })
    // get reviews
    app.get('/reviews', (req, res) => {
        reviewsCollection.find({}).sort({ timeStamp: -1 }).limit(6).toArray((err, documents) => {
            res.send(documents)
        })
    })
    // get orders
    app.get('/orders', (req, res) => {
        ordersCollection.find({}).toArray((err, documents) => {
            res.send(documents)
        })
    })
    app.get('/admin-list', (req, res) => {
        adminsCollection.find({}).sort({ timeStamp: -1 }).toArray((err, documents) => {
            res.send(documents)
        })
    })
    app.get('/user/orders', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    let tokenEmail = decodedToken.email;
                    if (req.query.email === tokenEmail) {
                        ordersCollection.find({ email: req.query.email }).toArray((err, documents) => {
                            res.status(200).send(documents)
                        })
                    } else {
                        res.status(401).send('unauthorized access')
                    }
                }).catch(error => {
                    res.status(401).send('unauthorized access')

                })

        } else { res.status(401).send('unauthorized access') }
    })
    // update-order
    app.patch('/update-order/:id', (req, res) => {
        ordersCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: { status: req.body.currentStatus }
            }).then(result => {
                res.send(req.body.currentStatus)
            })
    })

});

app.get("/", (req, res) => {
    res.send("Hello world!");
});
app.listen(port, () => {
    console.log("Example app listening to localhost:4000");
});