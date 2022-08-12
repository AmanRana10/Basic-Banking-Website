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
    Customer.find({name : reqObj.senderUserName,accountNumber : reqObj.senderAccountNumber},function(err,sender){
        if(err)
            console.log(err);
        else {
            if(typeof sender[0] === "undefined"){
                req.flash('message', 'Sender Not Found')
                res.redirect('/transaction')
                // console.log("alert")
            }
            
            else{
                bal = sender[0].amount - amt;
                // console.log(sender[0]);
                if(bal < 0){
                    req.flash('message', 'User entered amount which is more than their balance. Please try again.')
                    res.redirect('/transaction')
                    // console.log("alert")
                }
                else
                {
                    Customer.find({name : reqObj.recieverUserName,accountNumber : reqObj.recieverAccountNumber},function(err,reciever){
                        if(err)
                            console.log(err);
                        else {
                            if(typeof reciever[0] === "undefined"){
                                req.flash('message', 'Reciever Not Found')
                                res.redirect('/transaction')
                            }
                            
                            else{                                
                                let newAmt = Number(reciever[0].amount) + Number(amt);
                                // console.log(bal)
                                Transaction.find({},function(err,transactionos){
                                    if(err)
                                        console.log(err);
                                    else{
                                        let t1 = new Transaction({
                                            sno : transactionos.length + 1,
                                            sender : reqObj.senderUserName,
                                            reciever : reqObj.recieverUserName,
                                            amount : amt
                                        });
                                        
                                        t1.save(function(err){
                                            console.log(err);
                                        })
                                    }
                                })
                                
                                Customer.findOneAndUpdate({accountNumber: reqObj.recieverAccountNumber},{amount : newAmt},function(err, doc) {
                                    if (err) 
                                        console.log(err);
                                   
                                });
                                
                                Customer.findOneAndUpdate({accountNumber: reqObj.senderAccountNumber},{amount : bal},function(err, doc) {
                                    if (err) 
                                        console.log(err);
                                   
                                });
                                req.flash('message', 'successful transaction !')
                                res.redirect('/transaction')
                
                            }
                        }     
                    })
                    
                }
                
            }
        }     
    })
})


let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }
 
app.listen(port, function() {
  console.log("Server started succesfully");
});



