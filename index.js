const express = require("express");
require("dotenv").config();
const app = express();

var cookieParser = require("cookie-parser");

// set up running port
const port = process.env.PORT || 3000;

// cors for of auto block when call data by other client site
const cors = require("cors");
const jwt = require("jsonwebtoken");
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ecofood-assignment-eleven.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// require mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// ===========================================
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// =============================================

// mongodb uri

const uri = `mongodb+srv://${process?.env?.DB_USER}:${process?.env?.DB_PASSWORD}@curd-operation-database.movqgwc.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middle were  for cookie verification ++++++++++++++++++++++++++++++++++++++++++++
const logger = (req, res, next) => {
  // console.log("log info", req.method);
  next();
};
const verified = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("token tok ", token);
  if (!token) {
    return res.status(401).send({ message: "unauthorize" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorize access" });
    }
    req.user = decoded;
    next();
  });
};

// ===================================================================================

//  main function for connect with mongodb
async function run() {
  try {
    // create data base
    const ecoFood = client.db("ecoFood");
    // daatabase collection
    const allFood = ecoFood.collection("allFood");
    const orders = ecoFood.collection("orders");
    const QNA = ecoFood.collection("QNA");
    const Team = ecoFood.collection("temMember");

    // json web token
    // ==================================================================
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({
          status: true,
        });
    });

    app.post("/logOut", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ status: true });
    });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("user hitten", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    // ======================================================================

    // get top ordered data
    app.get("/topOrder", async (req, res) => {
      const cursor = allFood.find({ totalOrder: { $gt: 1 } }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get for QNA
    app.get("/QNA", async (req, res) => {
      const cursor = QNA.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // send data to mongodb by post method
    app.post("/addItem", async (req, res) => {
      const food = req.body;
      // console.log("new post ", car);
      const result = await allFood.insertOne(food);
      // console.log(result);
      res.send(result);
    });

    // send data to database for store client order data
    app.post("/orders", async (req, res) => {
      const orderedItems = req.body;
      // console.log("new post ", car);
      const result = await orders.insertOne(orderedItems);
      // console.log(result);
      res.send(result);
    });

    // get  food items by  cetegoris
    app.get("/serch", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const serch = req.query.categoris;
      console.log({ page, size, serch });
      const query = { category: serch };
      const cursor = allFood
        .find(query)
        .skip(page * size)
        .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get all food items
    app.get("/allFood", async (req, res) => {
      console.log(req.query);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const cursor = allFood
        .find()
        .skip(page * size)
        .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });

    //  get total product count
    app.get("/productCount", async (req, res) => {
      const count = await allFood.estimatedDocumentCount();
      res.send({ count });
    });

    //  get single data by id for details
    app.get("/details/:_id", async (req, res) => {
      const find = req.params._id;
      const query = { _id: new ObjectId(find) };
      const cursor = allFood.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get multiple data by user email
    app.get("/addItem/:email", async (req, res) => {
      // console.log("owner ", req?.user.email);
      // console.log("requester  ", req?.query);
      const find = req.params.email;
      const query = { Addby: find };
      const cursor = allFood.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get multiple data by user email to order collection
    app.get("/order/:email", async (req, res) => {
      // console.log("owner ", req?.query);
      // console.log("requester  ", req?.query);
      const find = req.params.email;
      const query = { buyerEmail: find };
      const cursor = orders.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // delete user order item
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orders.deleteOne(query);
      // console.log(result);
      res.send(result);
    });

    // get temMember data
    app.get("/team", async (req, res) => {
      const cursor = Team.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //  get for update
    app.get("/allFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allFood.findOne(query);
      res.send(result);
    });

    // update ================================
    app.put("/addItem/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = req.body;
      const product = {
        $set: {
          name: updatedProduct.name,
          Image: updatedProduct.Image,
          Price: updatedProduct.Price,
          category: updatedProduct.category,
          ShortDescription: updatedProduct.ShortDescription,
          Addby: updatedProduct.Addby,
          Quantity: updatedProduct.Quantity,
          FoodOrigin: updatedProduct.FoodOrigin,
          totalOrder: updatedProduct.totalOrder,
        },
      };
      const result = await allFood.updateOne(filter, product, options);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
// ========================================
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
