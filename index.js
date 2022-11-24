const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

require('dotenv').config()
app.use(express.json())
app.use(cors())


app.get('/', async(req, res) => {
    res.send('hello')
})


const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.uzz7izn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        const resellProductCollections = client.db('resellProducts').collection('resellProductCollection');
        const usersCollections = client.db('resellProducts').collection('usersCollection');
        const bookedProductsCollections = client.db('resellProducts').collection('bookedProductsCollection');

        app.get('/products', async(req, res) => {
            const query = {}
            const result = await resellProductCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/products/:email', async(req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const result = await resellProductCollections.find(query).toArray();
            res.send(result)
        })

        app.get('/products/:id', async(req, res) => {
            const name = req.params.id;
            const query = {'data.selectCategory': name}
            const result = await resellProductCollections.find(query).toArray();
            res.send(result)
        })

        app.post('/products', async(req, res) => {
            const product = req.body;
            const result = await resellProductCollections.insertOne(product);
            res.send(result)
        })

        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result)
        })

        app.post('/bookedProducts', async(req, res) => {
            const bookedProducts = req.body;
            const result = await bookedProductsCollections.insertOne(bookedProducts);
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(console.log)


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if(!authHeader){
        res.status(403).send('unauthorized')
    }
    const token = authHeader.split(' ')[1];
    // console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'accesss forbidden'})
        }
        req.decoded = decoded;
        next()
    })
}

// async function run(){
//     try{
//         const appointOptions = client.db('doctor').collection('doctorCollection');
//         const bookingsCollections = client.db('doctor').collection('bookingCollection');
//         const usersCollections = client.db('doctor').collection('users');
//         const doctorsCollections = client.db('doctor').collection('doctors');


//         const verifyAdmin = async(req, res, next) => {
//             const email = req.decoded.email;
//             console.log('admin' , email)
//             const decodedEmail = req.decoded.email;
//             const query = {email: decodedEmail}
//             const user = await usersCollections.findOne(query)
//             if(user?.role !== 'admin'){
//                 return res.status(403).send({message: 'forbidden'})
//             }
//             next()
//         }


//         app.get('/appoinmentOptions', async(req, res) => {
//             const date = req.query.date;
//             const query = {};
//             const options = await appointOptions.find(query).toArray();
//             const bookingQuery = {appointedDate : date}
//             const alreadyBooked = await bookingsCollections.find(bookingQuery).toArray();
//             options.forEach(option => {
//                 const bookedOption = alreadyBooked.filter(book => book.treatment === option.name)
//                 const bookedSlot = bookedOption.map(book => book.slot)
//                 const remainingSlots = option.slots.filter(slot => !bookedSlot.includes(slot))
//                 option.slots = remainingSlots;
//             })
//             res.send(options)
//         } )

//         app.get('/appoinmentspeciality', async(req, res) => {
//             const query = {};
//             const data = await appointOptions.find(query).project({name: 1}).toArray()
//             res.send(data)
//         })

//         app.get('/bookings', verifyJWT, async(req, res) => {
//             const email = req.query.email;
//             const decodedEmail = req.decoded.email;
//             if(email !== decodedEmail){
//                 return res.status(403).send({message : 'unauthorised action'})
//             }
//             const query = {email: email}
//             const bookings = await bookingsCollections.find(query).toArray();
//             res.send(bookings)
//         })
        

//         app.get('/bookings/:id', async(req, res) => {
//             const id = req.params.id;
//             const query = {_id: ObjectId(id)};
//             const booking = await bookingsCollections.findOne(query)
//             res.send(booking)
//         })


//         app.post('/bookings', async(req, res) => {
//             const booking = req.body;
//             const query = {
//                 appointedDate: booking.appointedDate,
//                 email: booking.email,
//                 treatment: booking.treatment
//             }
           
//             const alreadyBooked = await bookingsCollections.find(query).toArray()
            
//             if(alreadyBooked.length){
//                 const message = 'you have a booking'
//                 return res.send({acknowledged: false, message})
//             }
//             const result = await bookingsCollections.insertOne(booking)
//             res.send(result)
//         })

//         app.get('/jwt', async(req, res) => {
//             const email = req.query.email;
//             const query = {email: email}
//             const user = await usersCollections.findOne(query);
//             if(user){
//                 const token = jwt.sign({email}, process.env.ACCESS_TOKEN)
//                 return res.send({accessToken: token})
//             }
//             res.status(403).send({accessToken: ''})
//         })
        
//         app.get('/users', async(req, res) => {
//             const query = {};
//             const users = await usersCollections.find(query).toArray()
//             res.send(users)
//         })

//          app.get('/users/admin/:email', async(req, res) => {
//             const email = req.params.email;
//             const query = {email}
//             const user = await usersCollections.findOne(query)
//             res.send({isAdmin: user?.role === 'admin'})
//         })


        

//         app.post('/users', async(req, res) => {
//             const user = req.body;
//             const result = await usersCollections.insertOne(user)
//             res.send(result)
//         })

//         app.put('/users/admin/:id',verifyJWT, verifyAdmin, async(req, res) => {
//             // const decodedEmail = req.decoded.email;
//             // const query = {email: decodedEmail}
//             // const user = await usersCollections.findOne(query)
//             // if(user?.role !== 'admin'){
//             //     return res.status(403).send({message: 'forbidden'})
//             // }
//             const id = req.params.id;
//             const filter = {_id: ObjectId(id)}
//             const options = {upsert: true}
//             const updatedDoc = {
//                 $set: {
//                     role: 'admin'
//                 }
//             }
//             const result = await usersCollections.updateOne(filter, updatedDoc, options)
//             res.send(result)
//         })

//         // app.get('/addPrice', async(req, res) => {
//         //     const filter = {}
//         //     const options = {upsert: true}
//         //     const updatedDoc = {
//         //         $set: {
//         //             price: 99
//         //         }
//         //     }
//         //     const result = await appointOptions.updateMany(filter, updatedDoc, options)
//         //     res.send(result)
//         // })

//         app.get('/doctors', verifyJWT, verifyAdmin, async(req, res) => {
//             const query = {};
//             const doctors = await doctorsCollections.find(query).toArray()
//             res.send(doctors)
//         })

//         app.post('/doctors', verifyJWT, verifyAdmin, async(req, res) => {
//             const doctor = req.body;
//             const result = await doctorsCollections.insertOne(doctor)
//             res.send(result)
//         })

//         app.delete('/doctors/:id', verifyJWT, verifyAdmin, async(req, res) => {
//             const id = req.params.id;
//             const filter = {_id: ObjectId(id)};
//             const result = await doctorsCollections.deleteOne(filter)
//             res.send(result)
//         })
//     }
//     finally{

//     }
// }
// run().catch(console.log)

app.listen(port, () => {
    console.log(`'hello '${port}`)
})