const express = require("express");
const app = express();
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");
const cors = require("cors");
const Jwt = require("jsonwebtoken");
const roles = require("./utils/constants");
const config = require("./config/config");
require("dotenv").config();
app.use(express.json());
app.use(cors());






const ensureAdmin = async (req, res, next) => {
  req.userdata = await User.find({
    _id: req.params.id,
    email: process.env.ADMIN_EMAIL,
  });
  let checkblank = JSON.stringify(req.userdata);
  if (checkblank === "{}" || checkblank === "[]") {
    console.log("not found");
    return res.send({ result: "no data , not allowed!!" });
  } else {
    let userRoleforcheck = req.userdata[0].role;
    if (userRoleforcheck === "ADMIN") {
      next();
    } else {
      return res
        .status(401)
        .json({ result: "cannot allow to acess this page" });
    }
  }
};

// register api for reactjs
app.post("/register", async (req, res) => {
  try {
    if (req.body.email === process.env.ADMIN_EMAIL) {
      req.body.role = roles.roles.admin;
    }
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign(
      { result },
      config.secret_jwt,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) {
          res.send({ message: "Something went Wrong" });
        }
        res.send({ result, auth: token });
      }
    );
  } catch (err) {
    res.send({ message: "Email Already Exists..", err: err.code });
  }
});

// login api for reactjs

app.post("/login", async (req, res) => {
  let user = await User.findOne(req.body).select("-password").select("-myFile");
  if (req.body.password && req.body.email) {
    if (user) {
      Jwt.sign(
        { user },
        config.secret_jwt,
        { expiresIn: "24h" },
        (err, token) => {
          if (err) {
            res.send({ message: "Something went Wrong" });
          }
          res.send({ user, auth: token });
        }
      );
    } else {
      res.send({ message: "nouser" });
    }
  } else {
    res.send("Please fill all fields");
  }
});

// Delete a User from database

app.delete("/api/user/delete/:id", verifytoken, async (req, res) => {
  let result = await User.deleteOne({ _id: req.params.id });
  let productresult = await Product.deleteMany({ _id: req.params.id });
  res.send(result);
});

// update User Data in database

app.put("/api/upload/update/:id", verifytoken, async (req, res) => {
  const body = req.body.objects[1];
  const name = req.body.objects[2];
  try {
    const newImage = await User.updateOne(
      { _id: req.params.id },
      {
        $set: {
          name: name,
          uid: req.params.id,
          myFile: body.myFile,
        },
      }
    );
    res.status(201).json({ message: " new image uploaded", newImage });
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
});

// get image data and render Image

app.get("/api/upload/:id", verifytoken, async (req, res) => {
  try {
    let imagedata = await User.find({ _id: req.params.id });
    res.send(imagedata);
  } catch (err) {
    console.log(err.message);
  }
});

// delete Image of User

app.put("/api/delete/photo/:id", verifytoken, async (req, res) => {
  try {
    let defaultImage =
      "https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png";
    let imagedata = await User.updateOne(
      { _id: req.params.id },
      { $set: { myFile: defaultImage } }
    );
    res.send(imagedata);
  } catch (err) {
    console.log("Error : ", err.message);
  }
});

// get product with client or admin ---

app.get("/api/:uid/product", verifytoken, async (req, res) => {
  let result = await Product.find({
    userId: req.params.uid,
  });
  res.send(result);
});

//product adding api for react js
app.post("/api/add-product", verifytoken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

// product getting api for reactjs

app.get("/api/product", verifytoken, async (req, res) => {
  let product = await Product.find({});
  if (product.length > 0) {
    let result = product;
    res.send(result);
  } else {
    res.send({ result: "No Products found" });
  }
});

// product delete api for reactjs
app.delete("/api/product/:id", verifytoken, async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

// product get by id for updating products in reactjs
app.get("/api/product/:id", verifytoken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No Data Found" });
  }
});

// product updating (putting) in reactjs
app.put("/api/product/:id", verifytoken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

// product search api for admin ----- in reactjs
app.get(
  "/api/:id/admin/search/:key",
  verifytoken,
  ensureAdmin,
  async (req, res) => {
    let result = await Product.find({
      $or: [
        { name: { $regex: req.params.key } },
        { catogary: { $regex: req.params.key } },
        { company: { $regex: req.params.key } },
      ],
    });
    if (result) {
      res.send(result);
    }
  }
);

app.get("/api/:id/search/:key", verifytoken, async (req, res) => {
  let userId = req.params.id;
  let result = await Product.find({
    userId: userId,
    $or: [
      { name: { $regex: req.params.key } },
      { catogary: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
    // $or: [
    //         { name: { $regex: req.params.key } },
    //         { catogary: { $regex: req.params.key } },
    //         { company: { $regex: req.params.key } },
    //       ],
  });
  if (result) {
    res.send(result);
  }
});

// user get api for admin only

app.get("/api/admin/:id/user", ensureAdmin, verifytoken,  async (req, res, next) => {
  let users = await User.find({});
  if (users.length > 0) {
    let result = users;
    res.send(result);
  } else {
    res.send({ result: "No User found" });
  }
});


app.delete("/api/admin/delete/:id", verifytoken , async(req, res, next)=>{
  let result = await User.deleteOne({_id: req.params.id});
  res.send(result);
  
})




// verfication function for jwt authentication
function verifytoken(req, res, next) {
  let token = req.headers["authorization"];

  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, config.secret_jwt, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "Please provide a valid token" });
      } else {
        console.log(valid);
        next();
      }
    });
  } else {
    res.status(403).send({ result: "please add token with header" });
  }
}

// listen port here -------------------
app.listen(process.env.PORT || 5000);
