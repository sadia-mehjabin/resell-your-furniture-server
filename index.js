const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()
app.use(express.json())
app.use(cors())

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.get('/', async (req, res) => {
    res.send('hello')
})


const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.uzz7izn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(403).send('unauthorized')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_NEW, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'accesss forbidden' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        const resellProductCollections = client.db('resellProducts').collection('resellProductCollection');
        const usersCollections = client.db('resellProducts').collection('usersCollection');
        const bookedProductsCollections = client.db('resellProducts').collection('bookedProductsCollection');
        const reportedItemsCollections = client.db('resellProducts').collection('reportedItemsCollection');
        const paymentsCollections = client.db('resellProducts').collection('paymentsCollection');

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            console.log('admin', email)
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail }
            const user = await usersCollections.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden' })
            }
            next()
        }

        app.get('/products', async (req, res) => {
            const query = {}
            const result = await resellProductCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const query = {}
            const result = await usersCollections.find(query).toArray();
            res.send(result)
        })

        app.post('/create-payment-intent', async(req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
              });
              res.send({
                clientSecret: paymentIntent.client_secret,
              });
        });

        app.post('/payments', async(req, res) => {
            const payment = req.body;
            const result = await paymentsCollections.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)}
            const updatedDoc= {
                $set:{
                    paid:true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookedProductsCollections.updateOne(filter, updatedDoc)
        
            res.send(result)
        })

        app.get('/reportedItems', async (req, res) => {
            const query = {}
            const result = await reportedItemsCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/products1', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'unauthorised action' })
            }
            const query = { email: email }
            const result = await resellProductCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/myOrders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'unauthorised action' })
            }
            const query = { userEmail: email }
            const result = await bookedProductsCollections.find(query).toArray();
            res.send(result)
        })


        app.get('/products2/:id', async (req, res) => {
            const name = req.params.id;
            const query = { 'data.selectCategory': name }
            const result = await resellProductCollections.find(query).toArray();
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await resellProductCollections.insertOne(product);
            res.send(result)
        })

        app.post('/reportedItems', async (req, res) => {
            const product = req.body;
            const result = await reportedItemsCollections.insertOne(product);
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result)
        })

        app.post('/bookedProducts', async (req, res) => {
            const bookedProducts = req.body;
            const result = await bookedProductsCollections.insertOne(bookedProducts);
            res.send(result)
        })

        app.delete('/products/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await resellProductCollections.deleteOne(filter)
            res.send(result)
        })

        app.delete('/reportedItems/:id', verifyJWT,verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reportedItemsCollections.deleteOne(filter)
            res.send(result)
        })

        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollections.deleteOne(filter)
            res.send(result)
        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookedProductsCollections.findOne(filter)
            res.send(result)
        })


        app.put('/products/:id',verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail }
            const user = await usersCollections.findOne(query)
            if (user?.role !== 'Seller') {
                return res.status(403).send({ message: 'forbidden' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    status: 'advertised'
                }
            }
            const result = await resellProductCollections.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.put('/sellers/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const filter = { email: email}
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: 'true'
                }
            }
            const result = await resellProductCollections.updateMany(filter, updatedDoc, options)
            const result2 = await usersCollections.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollections.findOne(query)
            res.send({ isSeller: user?.role === 'Seller' })
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollections.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollections.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_NEW)
                return res.send({ newAccessToken: token })
            }
            res.status(403).send({ newAccessToken: '' })

        })
    }
    finally {

    }
}
run().catch(console.log)


app.listen(port, () => {
    console.log(`'hello '${port}`)
})