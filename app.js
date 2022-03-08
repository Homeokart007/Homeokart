require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const { stringify } = require("nodemon/lib/utils");
const multer = require("multer");
const mime = require('mime');
// const upload = multer({ dest: 'uploads/' })
// const upload = multer({ dest: './public/uploads/' })

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20')
const findOrCreate = require('mongoose-findorcreate');

var fs = require("fs");
var path = require("path");

const app = express();
const PORT = 3000;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// app.use(express.static(__dirname+"./public/"))

var med = mongoose.createConnection(
    process.env.MONGO_CONNECTION_URL_PRODUCTSDB,
    { useNewUrlParser: true }
);

var user = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_USERSDB, {
    useNewUrlParser: true
});

// Hair Care
// Skin Care
// Covid-19 essentials
// Trituration
// Dilutions
// Mother tincture
// Baby essentials

const productsSchema = {
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    img: {
        data: Buffer,
        path: Array,
        contentType: String
    },
    price: {
        type: String,
        required: true
    },
    tag: {
        type: Array,
        required: true
    },
    ratings: Number,
    origin: {
        type: String,
        required: true
    },
    man_name: {
        type: String,
        required: true
    },
    man_add: {
        type: String,
        required: true
    },
    ingred: {
        type: String,
        required: true
    }
};

// const Haircare = med.model("Haircare",productsSchema);
// const Covid = med.model("Covid",productsSchema);

const Product = med.model("Product", productsSchema);

const userSchema = {
    // userId: Number,
    userName: {
        type: String,
        required: true
    },
    userMail: {
        type: String,
        required: true
    },
    age: {
        type: Number
        , min: 18,
        max: 100
    },
    profImg: {
        data: Buffer,
        contentType: String
    },
    orders: {
        type: Array,
        required: true
    },
    address: {
        country: {
            type: String,
            require: true
        },
        street1: {
            type: String,
            require: true
        },
        street2: {
            type: String,
            require: true
        },
        city: {
            type: String,
            require: true
        },
        state: {
            type: String,
            require: true
        },
        zip: {
            type: Number,
            require: true
        },
    }
};

const User = user.model("User", userSchema);

const Hairitems = [];

let allProducts = [
    {
        name: "Dolo-650",
        description: "Use it anytime, anywhere.",
        price: "6.9",
        tag: ["Covid", "Health Care Product"],
        ratings: "4.8",
        origin: "INDIA",
        man_name: "ABCD Medicines",
        man_add: "Khatra mahal, Shaitaan Gali, Samsaan ke saamne",
        ingred: "Manchurian, Hajmola, Kachori",
        img: {
            data: "/public/images/homeopathy.jpg",
            contentType: "image/jpeg"
        }
    },
    {
        name: "Paracetamol-500",
        description: "Don't use it anytime, anywhere.",
        price: "12.99",
        tag: ["Covid", "Health Care Product"],
        ratings: "4.4",
        origin: "INDIA",
        man_name: "Toshi Medical",
        man_add: "App jaan ke kya kroge",
        ingred: "Hakka Noodles, Dal Bati",
        img: {
            data: "/public/images/homeopathy.jpg",
            contentType: "image/jpeg"
        }
    }
];

// const product = new Product({
//     name: "Minoxidil",
//     description:"Haircare",
//     price:1500,
//     tag:["Haircare","Covid 19"],
//     ratings:4.2,
//     origin:"India",
//     man_name:"Zydus",
//     man_add:"Bharuch",
//     ingred:"XYZ"
// })

// Product.create(product,function(err,doc){
//     if(err)
//         {
//             console.log(err);
//         }
//         else{
//             console.log("data added successfully");
//         }
// })

app.get("/", function (req, res) {
    res.render("homepage");
    Product.find({ tag: "Haircare" }, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log("Found Results", results);
        }
    });
});

app.get("/categories", function (req, res) {
    res.render("categories", {
        allProducts: allProducts
    });
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/product", function (req, res) {
    res.render("product");
});

app.get("/cart", function (req, res) {
    res.render("Cart");
});

app.get("/uploadData", function (req, res) {
    // Product.find({}, function(err,results){
    //     if(err){
    //         console.log(err)
    //     }
    //     else{
    //         console.log("Found Results",results)
    //         res.render('uploadData',{ items: results.img })
    //     }
    // })
    res.render("uploadData");
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });

app.post("/uploadData", upload.array("productImage", 3), (req, res) => {


    var img = fs.readFileSync(req.file.path);
    var encode_img = img.toString("base64");
    // var final_img = {
    // 	contentType: req.file.mimetype,
    // 	image: new Buffer.from(encode_img, "base64")
    // };

    // Product.create(final_img, function (err, result) {
    // 	if (err) {
    // 		console.log(err);
    // 	} else {
    // 		console.log(result.img.Buffer);
    // 		console.log("Saved To database");
    // 		res.contentType(final_img.contentType);
    // 		res.send(final_img.image);
    // 	}
    // });

    const product = new Product({
        name: req.body.productName,
        description: req.body.productDescription,
        price: req.body.productPrice,
        tag: req.body.productCategory,
        ratings: req.body.productRating,
        origin: req.body.productOriginCountry,
        man_name: req.body.manufacturerName,
        man_add: req.body.manufacturerAddress,
        ingred: req.body.productIngredients,
        img: {
            data: new Buffer.from(encode_img, "base64"),
            contentType: req.file.mimetype,
            path: req.file.path,
        }
        // img: {
        // 	data: fs.readFileSync(
        // 		path.join(
        // 			__dirname + "/public/uploads/" + req.file.productImage
        // 		)
        // 	),
        // 	contentType: "image/jpeg"
        // }
    });

    Product.create(product, (err, doc) => {
        if (err) {
            console.log(err);
        } else {
            console.log("data added successfully");
            // res.redirect("/");
            // console.log(result.img.Buffer);
            console.log("Saved To database");
            res.contentType(product.img.contentType);
            res.send(product.img.data);
        }
    });

    allProducts.push({
        name: req.body.productName,
        description: req.body.productDescription,
        price: req.body.productPrice,
        tag: req.body.productCategory,
        ratings: req.body.productRating,
        origin: req.body.productOriginCountry,
        man_name: req.body.manufacturerName,
        man_add: req.body.manufacturerAddress,
        ingred: req.body.productIngredients,
        img: {
            data: new Buffer.from(encode_img, "base64"),
            contentType: "image/jpeg"
        }
    });

    console.log(product);
});

app.listen(PORT, (req, res) => {
    console.log("Server started on http://localhost:" + PORT);
});

