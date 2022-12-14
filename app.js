const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs')
const mongoose = require('mongoose');
const app = express();
const session = require('express-session')
const flash = require('connect-flash')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret:"yash is a super star",
      cookie: { secure: false, maxAge: 14400000 },
    })
);
app.use(flash());

const url = "mongodb+srv://aman:aman2002@cluster0.zdgwity.mongodb.net/customersDB"; 
mongoose.connect(url, {useNewUrlParser : true});

const customerSchema = new mongoose.Schema({
    name : String,
    email : String,
    phone : String,
    amount : Number,
    accountNumber : Number
});

const transactionSchema = new mongoose.Schema({
    sno : Number,
    sender : String,
    reciever : String,
    amount : Number
});

const Transaction = mongoose.model('transaction', transactionSchema);
const Customer = mongoose.model('customer',customerSchema);


app.get("/", function (req, res) {
    res.render("index");
})

app.get("/customers",function(req,res){
    Customer.find({}, function(err, customerlist){
        res.render('customers',{
            customerList : customerlist
        })
    })
})

app.get('/about',function(req,res){
    res.render("about");
})
app.get("/transaction",function(req,res){
    res.render("transaction", {message : req.flash('message')});
})

app.get("/history",function(req,res){
    Transaction.find({},function(err,transactionlist){
        res.render("history", {transactionList : transactionlist});
    })
})


app.post("/transaction",function(req,res){
    // console.log(req.body);
    let reqObj = req.body;
    let amt = req.body.senderAmount;
    let bal;
    Customer.find({name : reqObj.senderUserName,accountNumber : reqObj.senderAccountNumber})
    .then(sender => {
        if(typeof sender[0] === "undefined"){
            req.flash('message', 'Sender Not Found')
            res.redirect('/transaction')
        }
        else
        {
            Customer.find({name : reqObj.recieverUserName,accountNumber : reqObj.recieverAccountNumber})
            .then(reciever => {
                if(typeof reciever[0] === "undefined"){
                    req.flash('message', 'Reciever Not Found')
                    res.redirect('/transaction')
                }
                        
                else{                                
                    let newAmt = Number(reciever[0].amount) + Number(amt);
                    Transaction.find({})
                    .then(transactions => {
                        let t1 = new Transaction({
                            sno : transactions.length + 1,
                            sender : reqObj.senderUserName,
                            reciever : reqObj.recieverUserName,
                            amount : amt
                        });
                        
                        t1.save(function(err){
                            console.log(err);
                        })
                    })
                    .catch(err => console.log(err))
                    
                    Customer.findOneAndUpdate({accountNumber: reqObj.recieverAccountNumber},{amount : newAmt},function(err, doc) {
                        if (err) 
                            console.log(err);
                       
                    });

                    bal = sender[0].amount - amt;
                    
                    if(bal < 0){
                        req.flash('message', 'User entered amount which is more than their balance. Please try again.')
                        res.redirect('/transaction')
                    }
                    Customer.findOneAndUpdate({accountNumber: reqObj.senderAccountNumber},{amount : bal},function(err, doc) {
                        if (err) 
                            console.log(err);
                       
                    });
                    req.flash('message', 'successful transaction !')
                    res.redirect('/transaction')
            
                }
            })
            .catch(err => console.log(err))
                    
        }
    })
    .catch(err => console.log(err))
})

app.get("/addCustomer", (req,res)=>{
    Customer.find({}, function(err, customerlist){
        res.render('addCustomer',{
            customerList : customerlist
        })
    })
})

app.post("/addCustomer", (req, response)=> {
    
    Customer.find({})
    .then(res => {
        let accountNumber = 1001;
        accountNumber += res.length;

        let newUser = {
            name : req.body.userName,
            email : req.body.userEmail,
            phone : req.body.phoneNumber,
            amount : req.body.accountBalance,
            accountNumber : accountNumber
        }
        Customer.insertMany(newUser);
        response.redirect('/customers');
    })
    .catch(err =>console.log("err", err))
    
})
app.listen(process.env.PORT || 3000, function () { 
    console.log("Server started.");
});



