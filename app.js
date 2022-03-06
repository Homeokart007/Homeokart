require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ejs = require('ejs');
const { stringify } = require('nodemon/lib/utils');
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' })
// const upload = multer({ dest: './public/uploads/' })

var fs = require('fs');
var path = require('path');

const app = express();

app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// app.use(express.static(__dirname+"./public/"))


var med = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_PRODUCTSDB, {useNewUrlParser : true})

var user = mongoose.createConnection(process.env.MONGO_CONNECTION_URL_USERSDB, {useNewUrlParser : true})

// Hair Care
// Skin Care
// Covid-19 essentials 
// Trituration
// Dilutions
// Mother tincture
// Baby essentials

const productsSchema = {
    name: {
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    img:{
        data:Buffer,
        contentType:String
    },
    price:{
        type:String,
        required:true
    },
    tag:{
        type:Array,
        required:true
    },
    ratings:Number,
    origin:{
        type:String,
        required:true
    },
    man_name:{
        type:String,
        required:true
    },
    man_add:{
        type:String,
        required:true
    },
    ingred:{
        type:String,
        required:true
    }
}

// const Haircare = med.model("Haircare",productsSchema);
// const Covid = med.model("Covid",productsSchema);

const Product = med.model("Product",productsSchema)

const userSchema = {
    name: String,
    details:String,
    price:Number
}

const User = user.model("User",userSchema);

const Hairitems = []

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

app.get("/",function(req,res){
    res.render('homepage');
    Product.find({ tag: "Haircare" }, function(err,results){
        if(err){
            console.log(err)
        }
        else{
            console.log("Found Results",results)
        }
    })
})

app.get("/categories",function(req,res){
    res.render('categories');
})

app.get("/login",function(req,res){
    res.render('login')
})

app.get("/register",function(req,res){
    res.render('register')
})

app.get("/product",function(req,res){
    res.render('product');
})

app.get("/cart",function(req,res){
    res.render('Cart')
})

app.get("/uploadData",function(req,res){

    // Product.find({}, function(err,results){
    //     if(err){
    //         console.log(err)
    //     }
    //     else{
    //         console.log("Found Results",results)
    //         res.render('uploadData',{ items: results.img })
    //     } 
    // })
    res.render('uploadData')
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
  
var upload = multer({ storage: storage });

app.post('/uploadData',upload.single('avatar'),function(req,res,next){
    console.log(req.body.category)
    console.log(req.body.avatar)
    const product = new Product({
        name: req.body.name,
        description:req.body.desc,
        price:req.body.price,
        tag:req.body.category,
        ratings:req.body.rating,
        origin:req.body.origin,
        man_name:req.body.manufacturer,
        man_add:req.body.address,
        ingred:req.body.ingredients,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.avatar)),
            contentType: 'image/jpeg'
        }
    })

    Product.create(product,function(err,doc){
        if(err)
            {
                console.log(err);
            }
            else{
                console.log("data added successfully");
                res.redirect("/")
            }
    })

    console.log(product);
})

  
app.listen(3000,(req,res) => {
    console.log("Server started on port 3000..!!!")
})


// 