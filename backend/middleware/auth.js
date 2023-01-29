let jwt = require("jsonwebtoken");
const config = require("../config/config")



// verfication function for jwt authentication
function verifytoken(req, res, next) {

    const token = req.headers["authorization"];
    if (token) {
      token = token.split(" ")[1];
      Jwt.verify(token, config.secret_jwt, (err, valid) => {
        if (err) {
          res.status(401).send({ result: "Please provide a valid token" });
        } else {
          console.log(valid)
          next();
        }
      });
    } else {
      res.status(403).send({ result: "please add token with header" });
    }
  }



  module.exports = verifytoken