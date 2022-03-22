require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const { stringify } = require("nodemon/lib/utils");
const multer = require("multer");
const mime = require("mime");
const Razorpay = require("razorpay");
// const upload = multer({ dest: 'uploads/' })
// const upload = multer({ dest: './public/uploads/' })

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

var fs = require("fs");
var path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json({ extended: false }));
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);

io.on("connection", (socket) => {
	socket.on("join-room", (roomId, userId) => {
		socket.join(roomId);
		socket.to(roomId).emit("user-connected", userId);

		socket.on("disconnect", () => {
			socket.to(roomId).emit("user-disconnected", userId);
		});
	});
});

// app.use(express.static(__dirname+"./public/"))

app.use(
	session({
		secret: "secret",
		resave: false,
		saveUninitialized: false
	})
);

app.use(passport.initialize());
app.use(passport.session());

var instance = new Razorpay({
	key_id: "rzp_test_DrxDeJy6wmVzgw",
	key_secret: "nTDmXspaYr3D6zbVg8Nj2rNK"
});

var med = mongoose.createConnection(
	process.env.MONGO_CONNECTION_URL_PRODUCTSDB,
	{
		useNewUrlParser: true
	}
);

var usr = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_USERSDB, {
	useNewUrlParser: true
});

var cart = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_CART, {
	useNewUrlParser: true
});

var appointment = mongoose.createConnection(
	process.env.MONGO_CONNECTION_URL_APPOINTMENT,
	{
		useNewUrlParser: true
	}
);

var doctor = mongoose.createConnection(
	process.env.MONGO_CONNECTION_URL_DOCTOR,
	{
		useNewUrlParser: true
	}
);

const categorie = [
	{
		name: "Hair Care",
		linkName: "hair_care",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	},
	{
		name: "Skin Care",
		linkName: "skin_care",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	},
	{
		name: "Covid",
		linkName: "covid",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	},
	{
		name: "Trituration",
		linkName: "trituration",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	},
	{
		name: "Dilutions",
		linkName: "dilutions",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	},
	{
		name: "Mother tincture",
		linkName: "mother_tincture",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	},
	{
		name: "Baby essentials",
		linkName: "baby_essentials",
		img: "https://www.mynanganallur.com/wp-content/uploads/2019/07/health-care-product.jpg"
	}
];

const doctorsSchema = {
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	username: {
		type: String,
		required: true
	},
	department: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	ratings: {
		type: Number,
		default: ""
	},
	degree: {
		type: String,
		default: ""
	},
	exp: {
		type: Number,
		default: null
	},
	charge: {
		type: Number,
		default: null
	},
	img: {
		path: Array,
		contentType: String
	},
	appoin: [
		{
			patientId: String,
			paDesc: String,
			name: String,
			// price: Number,
			roomId: String,
			patientHistory: String,
			date: Date,
			time: String,
			img: {
				path: Array,
				contentType: String
			}
		}
	]
};

const Doctor = doctor.model("Doctor", doctorsSchema);

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

const Product = med.model("Product", productsSchema);

const CartSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		products: [
			{
				productId: String,
				quantity: Number,
				name: String,
				price: Number,
				img: {
					path: Array,
					contentType: String
				}
			}
		],
		totalPrice: {
			type: Number,
			default: 0
		},
		active: {
			type: Boolean,
			default: true
		},
		modifiedOn: {
			type: Date,
			default: Date.now
		}
	},
	{
		timestamps: true
	}
);

const Cart = cart.model("Cart", CartSchema);

const AppointmentSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		newApp: [
			{
				username: {
					type: String,
					default: ""
					// required: true
				},
				usermail: {
					type: String,
					default: ""
					// required: true
				},
				phone: {
					type: Number,
					default: null
					// required: true
				},
				age: {
					type: Number,
					default: null,
					min: 18,
					max: 100
				},
				gender: {
					type: String,
					default: ""
				},
				department: {
					type: String,
					default: ""
				},
				history: {
					type: String,
					default: ""
				},
				comments: {
					type: String,
					default: ""
				}
			}
		],
		appointments: [
			{
				doctorId: String,
				department: String,
				name: String,
				price: Number,
				roomId: String,
				date: Date,
				time: String,
				img: {
					path: Array,
					contentType: String
				}
			}
		],
		// totalPrice: {
		//     type: Number,
		//     default: 0
		// },
		active: {
			type: Boolean,
			default: true
		},
		modifiedOn: {
			type: Date,
			default: Date.now
		}
	},
	{
		timestamps: true
	}
);

const Appointment = appointment.model("Appointment", AppointmentSchema);

// const userSchema = new mongoose.Schema({
//     username: String,
//     usermail: String,
//     password: String,
//     googleId: String,
// });

const userSchema = new mongoose.Schema({
	// userId: Number,
	username: {
		type: String,
		default: ""
		// required: true
	},
	usermail: {
		type: String,
		default: ""
		// required: true
	},
	password: String,
	googleId: {
		type: String
	},
	age: {
		type: Number,
		default: null,
		min: 18,
		max: 100
	},
	profImg: {
		type: String,
		default: ""
		// contentType: String
	},
	orders: {
		type: Array,
		default: []
		// required: true
	},
	phone: {
		type: Number,
		default: null
		// required: true
	},
	address: {
		country: {
			type: String,
			default: ""
		},
		street1: {
			type: String,
			default: ""
		},
		street2: {
			type: String,
			default: ""
		},
		city: {
			type: String,
			default: ""
		},
		state: {
			type: String,
			default: ""
		},
		zip: {
			type: Number,
			default: null
		}
	}
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = usr.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/homeokart",
			// userProfileURL: "https://www.googleapis.com/oauth/v3/userinfo",
			passReqToCallback: true
		},

		function (request, accessToken, refreshToken, profile, done) {
			// console.log(profile);
			User.findOrCreate(
				{
					googleId: profile.id
					// username: profile.displayName,
					// profImg: profile.photos[0].value
				},
				function (err, user) {
					return done(err, user);
				}
			);
		}
	)
);

const Hairitems = [];

app.get("/", async function (req, res) {
	console.log(req.isAuthenticated());
	res.render("homepageNEW", {
		category: categorie,
		isAuthenticated: req.isAuthenticated()
	});
	// Product.find({ tag: "Haircare" }, function (err, results) {
	//     if (err) {
	//         console.log(err);
	//     } else {
	//         console.log("Found Results", results);
	//     }
	// });
});

app.get(
	"/auth/google",
	passport.authenticate("google", {
		scope: ["profile"]
	})
);

app.get(
	"/auth/google/homeokart",
	passport.authenticate("google", {
		failureRedirect: "/login"
	}),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/");
		// res.redirect('..');
	}
);

app.get("/room", (req, res) => {
	res.redirect(`/room/${uuidV4()}`);
});

app.get("/room/:room", (req, res) => {
	res.render("room", { roomId: req.params.room });
});

app.get("/categories", async function (req, res) {
	const productsInCart = [];
	if (req.isAuthenticated()) {
		const userId = req.user.id;

		try {
			let cart = await Cart.findOne({
				userId
			});
			console.log("Hey Cart", cart);
			if (cart) {
				//cart exists for user

				if (cart.products) {
					console.log("Found");
					// console.log(cart.products);
					for (let i = 0; i < cart.products.length; i++) {
						productsInCart.push(cart.products[i].productId);
						// console.log(cart.products[i].productId);
					}
					// console.log(productsInCart);

					Product.find({}, function (err, results) {
						if (err) {
							console.log(err);
						} else {
							// console.log("Found Results: ", results);
							res.render("categories", {
								productsInCart: productsInCart,
								category:categorie,
								allProducts: results,
								isAuthenticated: req.isAuthenticated()
							});
						}
					});
				}
				// return res.status(201).send(cart);
			} else {
				Product.find({}, function (err, results) {
					if (err) {
						console.log(err);
					} else {
						// console.log("Found Results: ", results);
						res.render("categories", {
							productsInCart: [],
							category: categorie,
							allProducts: results,
							isAuthenticated: req.isAuthenticated()
						});
					}
				});
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Something went wrong");
		}
	} else {
		Product.find({}, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				// console.log("Found Results: ", results);
				res.render("categories", {
					productsInCart: [],
					category: categorie,
					allProducts: results,
					isAuthenticated: req.isAuthenticated()
				});
			}
		});
	}

	// Product.find({}, function (err, results) {
	// 	if (err) {
	// 		console.log(err);
	// 	} else {
	// 		// console.log("Found Results: ", results);
	// 		res.render("categories", {
	// 			category: categorie,
	// 			allProducts: results,
	// 			isAuthenticated: req.isAuthenticated()
	// 		});
	// 	}
	// });
});

app.get("/login", function (req, res) {
	res.render("login");
});

// app.post("/login", passport.authenticate('local', { failureRedirect: '/', failureMessage: true }),
//     function (req, res) {
//         res.redirect('/~' + req.user.username);
//     });

// passport.authenticate('local')(req, res, function () {
//     // res.redirect('/cart');
//     console.log("authenticated")
//     res.redirect('/');
// })

//
app.get("/register", function (req, res) {
	res.render("register");
});

// username: req.body.username,
// app.post("/register", function (req, res) {
//     User.register({ username: req.body.username, usermail: req.body.usermail }, req.body.password, function (err, user) {
//         if (err) {
//             console.log(err);
//             res.redirect("/register");
//         } else {
//             passport.authenticate("local")(req, res, function () {
//                 // res.redirect("/cart")
//                 res.redirect("/")
//             })
//         }
//     })
// })

app.post("/register", (req, res) => {
	const name = req.body.username;
	const email = req.body.usermail;
	const password = req.body.password;
	User.find(
		{
			usermail: email
		},
		function (err, docs) {
			if (docs.length === 0) {
				User.register(
					{
						username: name,
						usermail: email
					},
					password,
					function (err, user) {
						if (err) {
							console.log(err);
						} else {
							req.login(user, (err) => {
								if (err) {
									console.log(err);
								} else {
									passport.authenticate("local");
									req.session.save((error) => {
										if (err) {
											console.log(err);
										} else {
											res.redirect("/");
										}
									});
								}
							});
						}
					}
				);
			} else {
				res.redirect("/login");
			}
		}
	);
});

// app.get("/consultation", function (req, res) {
//     res.render("consultation", {
//         isAuthenticated: req.isAuthenticated()
//     });
// });

// app.get("/product", function (req, res) {
//     res.render("product", {
//         isAuthenticated: req.isAuthenticated()
//     });
// });

app.get("/cart", async function (req, res) {
	if (req.isAuthenticated()) {
		// console.log("Inside cart", req);
		// console.log("Inside cart", req.user.id);
		const userId = req.user.id;

		try {
			let cart = await Cart.findOne({
				userId
			});
			console.log("Hey Cart", cart);
			if (cart) {
				//cart exists for user

				if (cart.products) {
					// if (ite?mIndex > -1) {
					//product exists in the cart, update the quantity
					console.log("Found");
					let price = 0;
					// let productItem = cart.products[itemIndex];
					// productItem.quantity = quantity;
					// cart.products[itemIndex] = productItem;
					for (var i = 0; i < cart.products.length; i++) {
						price +=
							cart.products[i].quantity * cart.products[i].price;
					}
					cart.totalPrice = price;

					// Cart.updateOne(userId,{$set:{"totalPrice":price},function(err,results){
					//     if(err){
					//         console.log(err)
					//     } else {
					//         console.log("Andar hi hon bhai");
					//         console.log("Updated Results",results);
					//     }
					// }})
				}
				cart = await cart.save();
				res.render("cart", {
					cart: cart,
					isAuthenticated: req.isAuthenticated()
				});
				// return res.status(201).send(cart);
			} else {
				//no cart for user, create new cart
				// const newCart = await Cart.create({
				//     userId,
				//     products: [{ productId, quantity, name, price }]
				// });

				// alert("No items in the cart please add something");
				// res.render("cart", {
				//     cart: cart,
				//     isAuthenticated: req.isAuthenticated()
				// });
				res.render("emptycart");
				// res.render("cart", { cart: newCart });
				// return res.status(201).send(newCart);
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Something went wrong");
		}
	} else {
		res.redirect("/login");
	}
});

app.get("/cart/:productid", function (req, res) {
	const producId = req.params.productid;
	if (req.isAuthenticated()) {
		const userId = req.user.id;
		// console.log(req);
		// console.log("userId", req);

		Product.findById(producId, async function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("Found Results inside cart block: ", results);
			}
			const { img, id, quantity = 1, name, price } = results;
			console.log("Image Paths", img);
			const productId = id;
			try {
				let cart = await Cart.findOne({
					userId
				});

				if (cart) {
					//cart exists for user
					let itemIndex = cart.products.findIndex(
						(p) => p.productId == productId
					);

					console.log("item Index", itemIndex);
					if (itemIndex > -1) {
						//product exists in the cart, update the quantity
						let price = 0;
						let productItem = cart.products[itemIndex];
						productItem.quantity = quantity;
						cart.products[itemIndex] = productItem;
						for (var i = 0; i < cart.products.length; i++) {
							price +=
								cart.products[i].quantity *
								cart.products[i].price;
						}
						console.log("I am price", price);
						cart.totalPrice = price;
					} else {
						//product does not exists in cart, add new item
						console.log("Aagaya");

						cart.products.push({
							productId,
							quantity,
							name,
							price,
							img
						});
					}
					cart = await cart.save();

					res.redirect("/cart");
					// res.render("cart", {
					//     cart: cart,
					//     isAuthenticated: req.isAuthenticated()
					// });
					// return res.status(201).send(cart);
				} else {
					//no cart for user, create new cart
					const newCart = await Cart.create({
						userId,
						products: [{ productId, quantity, name, price, img }]
					});

					res.redirect("/cart");
					// res.render("cart", {
					//     cart: newCart,
					//     isAuthenticated: req.isAuthenticated()
					// });
					// return res.status(201).send(newCart);
				}
			} catch (err) {
				console.log(err);
				res.status(500).send("Something went wrongeeeee");
			}
		});
	}

	// res.render("Cart");

	// User.findOneAndUpdate({ googleId: "112129154840141555781" }, { phone: 7048105061 })
	else {
		res.redirect("/login");
	}
});

app.get("/cart/:id/incrqty", async function (req, res) {
	console.log("Here I am");
	const productId = req.params.id;
	console.log(productId);

	if (req.isAuthenticated()) {
		const userId = req.user.id;
		console.log(userId);

		try {
			console.log("Enter in try");
			let cart = await Cart.findOne({ userId });
			console.log(cart);
			console.log(cart.products);
			if (cart) {
				//cart exists for user
				// let itemIndex = cart.products.findIndex(p => p.productId == productId);
				let itemIndex = cart.products.findIndex(
					(p) => p.productId == productId
				);
				console.log("This", itemIndex);
				let price = 0;
				if (itemIndex > -1) {
					//product exists in the cart, update the quantity
					let productItem = cart.products[itemIndex];
					productItem.quantity = productItem.quantity + 1;
					cart.products[itemIndex] = productItem;
					for (var i = 0; i < cart.products.length; i++) {
						price +=
							cart.products[i].quantity * cart.products[i].price;
					}
					cart.totalPrice = price;
				}
				cart = await cart.save();
				res.redirect("/cart");
				// res.render("cart", {
				//     cart: cart,
				//     isAuthenticated: req.isAuthenticated()
				// });
			} else {
				console.log("Cart doesnot exists");
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Something went wrong");
		}
	} else {
		res.redirect("/login");
	}
});

app.get("/cart/:id/decrqty", async function (req, res) {
	console.log("Here I am");
	const productId = req.params.id;
	console.log(productId);

	if (req.isAuthenticated()) {
		const userId = req.user.id;
		console.log(userId);

		try {
			console.log("Enter in try");
			let cart = await Cart.findOne({ userId });
			console.log(cart);
			console.log(cart.products);
			if (cart) {
				//cart exists for user
				// let itemIndex = cart.products.findIndex(p => p.productId == productId);
				let itemIndex = cart.products.findIndex(
					(p) => p.productId == productId
				);
				console.log("This", itemIndex);

				if (itemIndex > -1) {
					//product exists in the cart, update the quantity
					let price = 0;
					let productItem = cart.products[itemIndex];
					productItem.quantity = productItem.quantity - 1;
					cart.products[itemIndex] = productItem;
					for (var i = 0; i < cart.products.length; i++) {
						price +=
							cart.products[i].quantity * cart.products[i].price;
					}
					cart.totalPrice = price;
				}
				cart = await cart.save();
				res.redirect("/cart");
				// res.render("cart", {
				//     cart: cart,
				//     isAuthenticated: req.isAuthenticated()
				// });
			} else {
				console.log("Cart doesnot exists");
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Something went wrong");
		}
	} else {
		res.redirect("/login");
	}
});

app.get("/cart/:id/remove", async function (req, res) {
	console.log("Removed");
	const productId = req.params.id;
	if (req.isAuthenticated()) {
		const userId = req.user.id;

		try {
			let cart = await Cart.findOne({ userId });
			console.log(cart);
			// console.log(cart.products)
			if (cart) {
				//cart exists for user
				let itemIndex = cart.products.findIndex(
					(p) => p.productId == productId
				);
				console.log(itemIndex);
				if (itemIndex > -1) {
					//product exists in the cart, update the quantity
					let price = 0;
					cart.products.splice(itemIndex, 1);
					for (var i = 0; i < cart.products.length; i++) {
						price +=
							cart.products[i].quantity * cart.products[i].price;
					}
					cart.totalPrice = price;
				}
				cart = await cart.save();
				res.redirect("/cart");
				// return res.render("cart", {
				//     cart: cart,
				//     isAuthenticated: req.isAuthenticated()
				// });
				// return res.status(201).send(cart);
			} else {
				//no cart for user, create new cart
				console.log("No cart for user");
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Something went wrong");
		}
	} else {
		res.redirect("/login");
	}
});

// app.post("/cart", function (req, res) {
//     if (req.isAuthenticated()) {
//         const userId = req.user.id;

//         User.findById(userId, function (err, results) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log(results);
//             }
//         })

//         Cart.findById(userId, function(err,results){
//             if(err){
//                 console.log(err);
//             }
//             else {
//                 console.log(results);
//             }
//         })
//         res.render("checkout");
//     }
//     else {
//         res.redirect("/login");
//     }
// })

app.get("/uploadData", function (req, res) {
	res.render("uploadData", {
		isAuthenticated: req.isAuthenticated()
	});
});

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./public/uploads");
	},
	filename: (req, file, cb) => {
		let count = req.files.length;
		let productName = req.body.productName.replaceAll(" ", "-");
		let ext = file.originalname.substr(file.originalname.lastIndexOf("."));
		cb(null, productName + "-" + Date.now() + "-" + count + ext);
	}
});

var upload = multer({
	storage: storage
});

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

app.get("/products/:category", async function (req, res) {
	const catTag = req.params.category;
	console.log(catTag);
    const productsInCart = [];

	if (req.isAuthenticated()) {
		const userId = req.user.id;

		try {
			let cart = await Cart.findOne({
				userId
			});
			console.log("Hey Cart", cart);
			if (cart) {
				//cart exists for user

				if (cart.products) {
					console.log("Found");
					// console.log(cart.products);
					for (let i = 0; i < cart.products.length; i++) {
						productsInCart.push(cart.products[i].productId);
						// console.log(cart.products[i].productId);
					}
					// console.log(productsInCart);

					Product.find({tag: catTag}, function (err, results) {
						if (err) {
							console.log(err);
						} else {
							// console.log("Found Results: ", results);
							res.render("categories", {
								productsInCart: productsInCart,
								category: categorie,
								allProducts: results,
								isAuthenticated: req.isAuthenticated()
							});
						}
					});
				}
				// return res.status(201).send(cart);
			} else {
				Product.find({tag: catTag}, function (err, results) {
					if (err) {
						console.log(err);
					} else {
						// console.log("Found Results: ", results);
						res.render("categories", {
							productsInCart: [],
							category: categorie,
							allProducts: results,
							isAuthenticated: req.isAuthenticated()
						});
					}
				});
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Something went wrong");
		}
	} else {
		Product.find({tag: catTag}, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				// console.log("Found Results: ", results);
				res.render("categories", {
					productsInCart: [],
					category: categorie,
					allProducts: results,
					isAuthenticated: req.isAuthenticated()
				});
			}
		});
	}










});

app.get("/product/:prdid", function (req, res) {
	const prdid = req.params.prdid;
	console.log("Prdid", prdid);
	Product.findById(prdid, function (err, results) {
		if (err) {
			console.log(err);
		} else {
			// console.log("Found Results: ", results);
			res.render("productNew", {
				product: results,
				category:categorie,
				isAuthenticated: req.isAuthenticated()
			});
		}
	});
});

// app.post("/login", function (req, res) {

//     const user = new User({
//         usermail: req.body.usermail,
//         password: req.body.password
//     });

//     console.log(req.body.usermail);
//     console.log(req.body.password);
//     console.log("User here", user);

//     req.login(user, function (err) {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log("Entered here")
//             passport.authenticate('local')(req, res, function () {
//                 console.log("authenticated")
//                 res.redirect('/');
//             })
//         }
//     })

//     // })
// });

app.post("/login", (req, res) => {
	const email = req.body.email;

	User.findOne(
		{
			usermail: email
		},
		function (err, u) {
			if (err) {
				console.log(err);
			} else {
				if (u) {
					u.authenticate(req.body.password, (err, model, info) => {
						if (info) {
							console.log("Wrong email or password!");
						}
						if (err) {
							console.log(err);
						} else if (model) {
							req.login(u, (err) => {
								if (err) {
									console.log(err);
								} else {
									passport.authenticate("local");
									req.session.save((error) => {
										if (error) {
											console.log(error);
										} else {
											res.redirect("/");
										}
									});
								}
							});
						}
					});
				} else {
					res.send("Wrong email or password!");
				}
			}
		}
	);
});

app.get("/checkout", function (req, res) {
	console.log("Entered");
	// const userId = req.user.id;
	const arr = [];
	if (req.isAuthenticated()) {
		const userId = req.user.id;
		console.log(userId);
		User.findById(userId, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("Results", results);
				arr.push(results);

                Cart.findOne({ userId: userId }, function (err, results) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Arr1", arr);
                        console.log("Got the results");
                        console.log("Cart Results", results);
                        arr.push(results);
                        console.log("Arr2", arr);
                        res.render("checkout", { info: arr,
							prf: results,
							category:categorie,
							isAuthenticated: req.isAuthenticated()
						});
                    }
                });
			}
		});

		// console.log("Arr3", arr)
	} else {
		res.redirect("/login");
	}
});

app.get("/checkout/:productid", function (req, res) {
	const prdid = req.params.productid;
	const arr = [];
	if (req.isAuthenticated()) {
		const userId = req.user.id;
		console.log("Inside Buy Now", userId);

		User.findById(userId, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("Results of User", results);
				arr.push(results);
				Product.findById(prdid, function (err, results) {
					if (err) {
						console.log(err);
					} else {
						console.log("Results", results);
						// const totalPrice = results.price

						const products = {
							img: results.img,
							name: results.name,
							price: Number(results.price)
						};
						console.log("I am products", products);
						arr.push({
							products: [products],
							totalPrice: Number(results.price)
						});
						console.log("Arr2", arr);
						res.render("checkout", { info: arr , 
							prf: results,
							category:categorie,
							isAuthenticated: req.isAuthenticated() 
						});
					}
				});
			}
		});
		// res.render("checkout", { info: arr });
	} else {
		res.redirect("/login");
	}
});

// app.post("/checkout",function(req,res){
//     const checkoutmail= req.body.checkoutemail;
//     const checkoutPhone = req.body.checkoutphone;
//     const checkoutname = req.body.checkoutname;
//     const checkoutaddress = req.body.checkoutaddress;
//     const checkoutcity = req.body.checkoutcity;
//     const checkoutcountry = req.body.checkoutcountry;
//     const checkoutpostal = req.body.checkoutpostal;

// })

app.post("/create/orderId", function (req, res) {
	var options = {
		amount: req.body.amount, // amount in the smallest currency unit
		currency: "INR",
		receipt: "rcptid_1"
	};

	instance.orders.create(options, function (err, order) {
		console.log(order);
		res.send({ orderId: order.id });
	});
});

app.post("/api/payment/verify", (req, res) => {
	//  const razorpay_payment_id= req.body.response.razorpay_payment_id;
	//  const razorpay_order_id = req.body.response.razorpay_order_id;
	//  const razorpay_signature= req.body.response.razorpay_signature;

	let body =
		req.body.response.razorpay_order_id +
		"|" +
		req.body.response.razorpay_payment_id;

	var crypto = require("crypto");
	var expectedSignature = crypto
		.createHmac("sha256", "nTDmXspaYr3D6zbVg8Nj2rNK")
		.update(body.toString())
		.digest("hex");
	console.log("sig received ", req.body.response.razorpay_signature);
	console.log("sig generated ", expectedSignature);
	var response = { signatureIsValid: "false" };
	if (expectedSignature === req.body.response.razorpay_signature)
		response = { signatureIsValid: "true" };
	res.send(response);
});

app.get("/myProfile", function (req, res) {
	if (req.isAuthenticated()) {
		const userId = req.user.id;
		console.log("Inside my Profile", userId);
		User.findById(userId, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("Updated Results in my Profile", results);
				res.render("profileNew", {
					prf: results,
					category:categorie,
					isAuthenticated: req.isAuthenticated()
				});
			}
		});
		// res.render("profileNew");
	} else {
		res.redirect("/login");
	}
});

app.get("/editProfile", function (req, res) {
	if (req.isAuthenticated()) {
		const userId = req.user.id;

		User.findById(userId, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("Updated Results in edit Profile", results);
				res.render("edit-profileNew", { prf: results,
					category:categorie,
					isAuthenticated: req.isAuthenticated()
				 });
			}
		});
		// res.render("edit-profileNew")
	} else {
		res.redirect("/login");
	}
});

app.post("/editProfile", function (req, res) {
	const username = req.body.fullName;
	const usermail = req.body.userEmail;
	const userage = req.body.userAge;
	const userphone = req.body.userPhoneNumber;
	const usergender = req.body.userGender;
	const userstreet1 = req.body.userStreet1;
	const userstreet2 = req.body.userStreet2;
	const userpincode = req.body.userPincode;
	const usercity = req.body.userCity;
	const userstate = req.body.userState;
	const usercountry = req.body.userCountry;

	console.log("Received value", username);
	console.log("Received value", usermail);
	console.log("Received value", userage);
	console.log("Received value", userphone);
	console.log("Received value", usergender);
	console.log("Received value", userstreet1);
	console.log("Received value", userpincode);

	const addr = {
		country: usercountry,
		street1: userstreet1,
		street2: userstreet2,
		city: usercity,
		state: userstate,
		zip: userpincode
	};

	console.log("addr", addr);
	if (req.isAuthenticated()) {
		const userid = req.user.id;
		console.log("Userid inside edit profile", userid);

		User.findByIdAndUpdate(
			userid,
			{
				username: username,
				usermail: usermail,
				age: userage,
				phone: userphone,
				address: addr
			},
			function (err, results) {
				if (err) {
					console.log(err);
				} else {
					console.log("Here");
					console.log(results);
					res.redirect("/myProfile");
				}
			}
		);
	} else {
		res.redirect("/login");
	}
});

// app.post("/myProfile",function(req,res){

// })

app.get("/consultation", function (req, res) {
	console.log("Entered inside consultation");
	if (req.isAuthenticated()) {
		// console.log('Entered inside consultation')
		Doctor.find({}, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("XXXXXX");
				console.log(results);
				res.render("consultation", {
					docData: results,
					category:categorie,
					isAuthenticated: req.isAuthenticated()
				});
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.post("/consultation", function (req, res) {
	if (req.isAuthenticated()) {
		const userId = req.user.id;
		const appn = new Appointment({
			userId: userId,
			newApp: [
				{
					username: req.body.name,
					usermail: req.body.email,
					phone: req.body.phone,
					age: req.body.age,
					history: req.body.history,
					gender: req.body.gender,
					department: req.body.department,
					comments: req.body.comments
				}
			]
		});
		console.log("Entered inside consul2");
		Appointment.create(appn, function (err, result) {
			if (err) {
				console.log(err);
			} else {
				console.log("Entered Here");
				console.log(result);
				// res.render("docCategory",{docData : result, isAuthenticated: req.isAuthenticated()})
			}
		});

		Doctor.find(
			{ department: req.body.department },
			function (err, results) {
				if (err) {
					console.log(err);
				} else {
					console.log(results);
					res.render("docCategory", {
						docData: results,
						isAuthenticated: req.isAuthenticated()
					});
				}
			}
		);
	} else {
		res.redirect("/login");
	}
});

app.get("/registerDoc", function (req, res) {
	if (req.isAuthenticated()) {
		res.render("registerDoc");
	} else {
		res.redirect("/login");
	}
});

app.post("/registerDoc", upload.single("productImage"), function (req, res) {
	if (req.isAuthenticated()) {
		const userId = req.user.id;

		const doctor = new Doctor({
			userId: userId,
			username: req.body.doctorName,
			usermail: req.body.doctorEmail,
			department: req.body.expertise,
			description: req.body.doctordesc,
			charge: req.body.doctorPrice,
			ratings: req.body.doctorRating,
			degree: req.body.doctorDegree,
			exp: req.body.doctorExperience
		});

		console.log("Entered inside consul2");
		Doctor.create(doctor, function (err, result) {
			if (err) {
				console.log(err);
			} else {
				console.log("Entered Here");
				console.log(result);
				res.redirect("/consultation");
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.get("/docCategory", function (req, res) {
	if (req.isAuthenticated()) {
		// console.log('Entered inside consultation')
		Doctor.find({}, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				console.log("XXXXXX");
				console.log(results);
				res.render("consultation", {
					docData: results,
					isAuthenticated: req.isAuthenticated()
				});
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.get("/docProfile/:id", function (req, res) {
	const id = req.params.id;


	Doctor.findById(id, function (err, results) {
		if (err) {
			console.log(err);
		} else {
			res.render("docProfile", { info: results });
		}
	});
});



app.post("/docProfile/booking/:id", function (req, res) {

	if (req.isAuthenticated()) {
		const id = req.params.id;
		console.log("Dr id", id);
		const userId = req.user.id;
		const date = req.body.appointmentDateAndTime.slice(0, 10)
		const time = req.body.appointmentDateAndTime.slice(11, 16)
		console.log(date);
		console.log(time);
// 		const appoi = [];
// const docAppoi = [];
		const room = req.body.appointmentDateAndTime;
		const roomId = "/room/" + id + "-" + room;
		console.log(roomId);

		Doctor.findById(id, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				const appo = {
					doctorId: id,
					department: results.department,
					name: results.username,
					price: results.charge,
					date: date,
					time: time,
					roomId: roomId
				}
				// appoi.push(appo)
				// { $set: { appointments: appointments.push(appo) } }
				Appointment.findOneAndUpdate(userId,{ $push: { appointments: appo  } } ,
					{
					  new: true,
					  upsert: true,
					}, function (err, result) {
					if (err) {
						console.log(err);
					} else {
						console.log(result);

						const len = result.newApp.length;

						const docAppo = {
							patientId: userId,
							paDesc: result.newApp[len - 1].comments,
							name: result.newApp[len - 1].username,
							roomId: roomId,
							patientHistory: result.newApp[len - 1].history,
							date: date,
							time: time
						}

						// docAppoi.push(docAppo);
						// console.log("docAppoi1", docAppoi);
						console.log("DR id", id)
						// {$set: { appoin: appoin.push(docAppo) }}
						Doctor.findByIdAndUpdate(id,{ $push: { appoin: docAppo  } } ,
							{
							  new: true,
							  upsert: true,
							}, function(err, result) {
								if (err) {
									console.log(err);
								} else {
									// console.log("docAppoi2", docAppoi);
									console.log("Inside Doc result", result);
								}
						})

						console.log("Appointment", result)
						res.render("patient-appointment", { info: result })
					}
				})

			}
			
		})
		// });

		// console.log("Data", ap);

		// const roomId = req.body.appointmentDateAndTime;
		// console.log(roomId);

		// res.render("booking");
		// res.redirect("/room/" + id + "-" + roomId);
	} else {
		res.redirect("/login");
	}

});

app.get("/docDashboard",function(req,res){
	if(req.isAuthenticated()){
		const userId = req.user.id;
		console.log(userId)

		Doctor.find({userId:userId},function(err,result){
			if(err){
				console.log(err);
			} else {
				console.log(result);
				res.render("doctor-appointment",{info:result});
			}
		})
	} else {
		res.redirect("/login")
	}
	// res.render("doctor-appointment");
})

app.get("/booking/:id", function (req, res) {
	const id = req.params.id;
	res.render("booking");
});

app.get("/patientDashboard", function (req, res) {

	if(req.isAuthenticated()){
		const userId = req.user.id;

		Appointment.find({userId : userId},function(err,result){
			if(err){
				console.log(err)
			} else {
				console.log(result);
				res.render("patient-dashboard", {info:result});
			}
		})

	} else {
		res.redirect("/login");
	}
	
})

app.get("/patientAppointment", function (req, res) {
	res.render("patient-appointment")
})

app.get("/logout", function (req, res) {
	console.log("Logged out");
	// req.logout();
	req.session.destroy(function (err) {
		if (err) {
			console.log(err);
		} else {
			res.redirect("/");
		}
	});
});

server.listen(PORT, (req, res) => {
	console.log("Server started on http://localhost:" + PORT);
});
