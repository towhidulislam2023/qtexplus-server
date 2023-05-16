const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const cors = require("cors")
const jwt = require("jsonwebtoken")
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Qtex Plus running ..................... ')
})

console.log(process.env.DB_ACCESS_ID);
console.log(process.env.DB_ACCESS_PASS);
//mongodb 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { JsonWebTokenError } = require('jsonwebtoken')
const uri = `mongodb+srv://${process.env.DB_ACCESS_ID}:${process.env.DB_ACCESS_PASS}@cluster0.w8zzyxt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const verifyJWt = (req, res, next) => {
    console.log("hitt");
    const authorization = req.headers.authorization
    if (!authorization) {
        res.status(401).send({ error: true, message: "Unauthorized access" })
        return
    }
    const token = authorization.split(" ")[1]
    console.log(token);
    jwt.verify(token, process.env.ACESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            res.status(401).send({ error: true, message: "Unauthorized access" })
        }
        req.decoded = decoded
        next()
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        //create datrabase collection

        const doctorsInfoCollection = client.db('qtexplus-doctor-db').collection("doctors-info-collection")

        const appiontmentInfoCollection = client.db('qtexplus-doctor-db').collection("appiontment-Info-Collection")



        // JsonWebToken
        app.post("/jwt", (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, { expiresIn: "3h" })
            res.send({ token })
        })

        //get

        app.get('/doctorsinfo', async (req, res) => {
            const cursor = doctorsInfoCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get("/doctorinfo/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                // sort matched documents in descending order by rating
                sort: { "doctorname.rating": -1 },
                // Include only the `title` and `imdb` fields in the returned document
                projection: { doctorname: 1, speciality: 1, image: 1, time: 1, visitfee: 1, speciality: 1 },
            };
            const result = await doctorsInfoCollection.findOne(query, options)
            res.send(result)
        })

        //appiontment collection

        app.post("/addedappiontmentinfo", async (req, res) => {
            const appiontmentInfo = req.body
            const result = await appiontmentInfoCollection.insertOne(appiontmentInfo)
            res.send(result)
        })

        app.get("/appiontmentinfo", verifyJWt, async (req, res) => {
            const decoded = req.decoded
            if (decoded.email !== req.query?.email){
                return res.send({error:true,message:"Unauthorize"})

             }
            let query = {}
            if (req.query?.email) {
                query = { email: req?.query.email }
            }
            const cursor = appiontmentInfoCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.patch("/updateappiontmentInfo/:id", async (req, res) => {
            const id = req.params.id
            const updateInfo = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateInfo.status
                }
            }
            const result = await appiontmentInfoCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete("/deleteappiontment/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await appiontmentInfoCollection.deleteOne(query)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


//  listen 
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})