const express = require('express');
const bodyParser = require('body-parser')
const ejs = require('ejs');

const app = express();

app.set('view engine','ejs')
app.use(express.static("public"));

app.get("/",function(req,res){
    res.render('homepage');
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
  
app.listen(3000,(req,res) => {
    console.log("Server started on port 3000..!!!")
})
