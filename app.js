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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

var fs = require("fs");
var path = require("path");

const PORT = 3000;
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


// app.use(express.static(__dirname+"./public/"))

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

var med = mongoose.createConnection(
    process.env.MONGO_CONNECTION_URL_PRODUCTSDB,
    { useNewUrlParser: true }
);

var usr = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_USERSDB, {
    useNewUrlParser: true
});

var cart = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_CART, {
    useNewUrlParser: true
});

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
]

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
                price: Number
            }
        ],
        active: {
            type: Boolean,
            default: true
        },
        modifiedOn: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

const Cart = cart.model("Cart", CartSchema);

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
        type: String,
    },
    age: {
        type: Number,
        default: null,
        min: 18,
        max: 100
    },
    profImg: {
        type: String,
        default: "",
        // contentType: String
    },
    orders: {
        type: Array,
        default: [],
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
            default: "",
        },
        street1: {
            type: String,
            default: "",
        },
        street2: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            default: "",
        },
        state: {
            type: String,
            default: "",
        },
        zip: {
            type: Number,
            default: null,
        },
    }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = usr.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
})

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/homeokart",
    // userProfileURL: "https://www.googleapis.com/oauth/v3/userinfo",
    passReqToCallback: true
},

    function (request, accessToken, refreshToken, profile, done) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id, username: profile.displayName, profImg: profile.photos[0].value }, function (err, user) {
            return done(err, user);
        });
    }
));

const Hairitems = [];

app.get("/", function (req, res) {
    res.render("homepageNEW", { category: categorie });
    // Product.find({ tag: "Haircare" }, function (err, results) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log("Found Results", results);
    //     }
    // });
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/homeokart',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.

        res.redirect('..');
    });


app.get("/categories", function (req, res) {
    // res.render("categories", {
    //     allProducts: allProducts
    // });
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
    const name = req.body.username
    const email = req.body.usermail;
    const password = req.body.password
    User.find({ usermail: email }, function (err, docs) {
        if (docs.length === 0) {
            User.register(
                {
                    username: name,
                    usermail: email,
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
            res.send("The accout already exists!");
        }
    });
});

app.get("/product", function (req, res) {
    res.render("product");
});

app.get("/cart", async function (req, res) {
    if (req.isAuthenticated()) {
        console.log("Inside cart", req);
        console.log("Inside cart", req.user.id);
        const userId = req.user.id;

        try {
            let cart = await Cart.findOne({ userId });
            console.log("Hey Cart", cart)
            if (cart) {
                //cart exists for user

                return res.render("cart", { cart: cart });
                // return res.status(201).send(cart);
            } else {
                //no cart for user, create new cart
                // const newCart = await Cart.create({
                //     userId,
                //     products: [{ productId, quantity, name, price }]
                // });

                res.render("cart", { cart: cart });
                // res.render("cart", { cart: newCart });
                // return res.status(201).send(newCart);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }

    }
    else {
        res.redirect("/login")
    }
})

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
            const { id, quantity = 1, name, price } = results;

            const productId = id;
            try {
                let cart = await Cart.findOne({ userId });

                if (cart) {
                    //cart exists for user
                    let itemIndex = cart.products.findIndex(p => p.productId == productId);

                    if (itemIndex > -1) {
                        //product exists in the cart, update the quantity
                        let productItem = cart.products[itemIndex];
                        productItem.quantity = quantity;
                        cart.products[itemIndex] = productItem;
                    } else {
                        //product does not exists in cart, add new item
                        cart.products.push({ productId, quantity, name, price });
                    }
                    cart = await cart.save();
                    return res.render("cart", { cart: cart });
                    // return res.status(201).send(cart);
                } else {
                    //no cart for user, create new cart
                    const newCart = await Cart.create({
                        userId,
                        products: [{ productId, quantity, name, price }]
                    });

                    res.render("cart", { cart: newCart });
                    // return res.status(201).send(newCart);
                }
            } catch (err) {
                console.log(err);
                res.status(500).send("Something went wrong");
            }
        });
    }

    // res.render("Cart");

    // User.findOneAndUpdate({ googleId: "112129154840141555781" }, { phone: 7048105061 })
    else {
        res.redirect("/login");
    }

});

app.post("/cart", async function (req, res) {
    if (req.isAuthenticated()) {

        const userId = req.user.id;
        // console.log(req);
        // console.log("userId", req);

        try {
            let cart = await Cart.findOne({ userId });

            if (cart) {
                //cart exists for user
                let itemIndex = cart.products.findIndex(p => p.productId == productId);

                if (itemIndex > -1) {
                    //product exists in the cart, update the quantity
                    let productItem = cart.products[itemIndex];
                    productItem.quantity = quantity;
                    cart.products[itemIndex] = productItem;
                } else {
                    //product does not exists in cart, add new item
                    cart.products.push({ productId, quantity, name, price });
                }
                cart = await cart.save();
                return res.render("cart", { cart: cart });
                // return res.status(201).send(cart);
            } else {
                //no cart for user, create new cart
                const newCart = await Cart.create({
                    userId,
                    products: [{ productId, quantity, name, price }]
                });

                res.render("cart", { cart: newCart });
                // return res.status(201).send(newCart);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    // res.render("Cart");

    // User.findOneAndUpdate({ googleId: "112129154840141555781" }, { phone: 7048105061 })
    else {
        res.redirect("/login");
    }
})

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

app.get("/products/:category", function (req, res) {
    const catTag = req.params.category;
    console.log(catTag);
    Product.find({ tag: catTag }, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log("Found Results: ", results);
            res.render("categories", {
                allProducts: results
            });
        }
    });
})

app.get("/product/:prdid", function (req, res) {
    const prdid = req.params.prdid;
    console.log("Prdid", prdid);
    Product.findById(prdid, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log("Found Results: ", results);
            res.render("product", {
                product: results
            });
        }
    });
})

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
    User.findOne({ usermail: email }, function (err, u) {
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
                                        res.redirect("/cart");
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
    });
});

app.get("/logout", function (req, res) {
    console.log("Logged out")
    // req.logout();
    req.session.destroy(function (err) {
        if (err) {
            console.log(err)
        }
        else {
            res.redirect("/");
        }
    })

})

app.listen(PORT, (req, res) => {
    console.log("Server started on http://localhost:" + PORT);
});

