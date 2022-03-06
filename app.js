const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.use(
	bodyParser.urlencoded({
		extended: true
	})
);

app.set("view engine", "ejs");
app.use(express.static("public"));

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
		ingred: "Manchurian, Hajmola, Kachori"
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
		ingred: "Hakka Noodles, Dal Bati"
	}
];

app.get("/", function (req, res) {
	res.render("homepage");
});

app.get("/uploadData", function (req, res) {
	res.render("uploadData");
});

app.post("/uploadData", (req, res) => {
	console.log(req.body);

	allProducts.push({
		name: req.body.productName,
		description: req.body.productDescription,
		price: req.body.productPrice,
		tag: req.body.productCategory,
		ratings: req.body.productRating,
		origin: req.body.productOriginCountry,
		man_name: req.body.manufacturerName,
		man_add: req.body.manufacturerAddress,
		ingred: req.body.productIngredients
	});

	res.send("<center><h1>Added Successfully</h1></center>");
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

app.listen(3000, (req, res) => {
	console.log("Server started on http://localhost:3000");
});
