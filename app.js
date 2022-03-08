require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const { stringify } = require("nodemon/lib/utils");
const multer = require("multer");
// const upload = multer({ dest: 'uploads/' })
// const upload = multer({ dest: './public/uploads/' })

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
	name: String,
	details: String,
	price: Number
};

const User = user.model("User", userSchema);

const Hairitems = [];

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
	// Product.find(
	// 	{ tag: "Body Care Product", name: "Dolo-sss" },  // Filters
	// 	{ name: 1, img: 1, _id: 0 },                     // What To display
	// 	function (err, results) {
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
	// 			console.log("Found Results", results);
	// 			res.render("categories", {
	// 				allProducts: results
	// 			});
	// 		}
	// 	}
	// );

	Product.find({}, function (err, results) {
		if (err) {
			console.log(err);
		} else {
			console.log("Found Results: ", results);
			res.render("categories", {
				allProducts: results
			});
		}
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
	res.render("uploadData");
});

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./public/uploads");
	},
	filename: (req, file, cb) => {
		let count = req.files.length;
		let productName = req.body.productName.replace(" ", "-");
		let ext = file.originalname.substr(file.originalname.lastIndexOf("."));
		cb(null, productName + "-" + Date.now() + "-" + count + ext);
	}
});

var upload = multer({ storage: storage });

app.post("/uploadData", upload.array("productImage"), (req, res) => {
	// console.log(req.files);
	// console.log(req.files[0].path);
	var imageArray = [];
	req.files.map((data, index) => {
		imageArray.push(data.path.replace("public\\", ""));
	});
	// console.log(imageArray);

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
			path: imageArray,
			contentType: req.files[0].mimetype
		}
	});

	Product.create(product, (err, doc) => {
		if (err) {
			console.log(err);
		} else {
			console.log("Data added successfully");
			console.log(product);
			// res.redirect("/");
			res.send(product);
		}
	});
});

app.listen(PORT, (req, res) => {
	console.log("Server started on http://localhost:" + PORT);
});
