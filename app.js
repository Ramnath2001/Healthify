require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const { response } = require("express");
var moment = require('moment');
var nodemailer = require('nodemailer');
var flash = require('connect-flash');

const saltRounds = 10;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(flash());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/docAppDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const patientSchema = new mongoose.Schema({
    name: String,
    age: Number,
    dob: Date,
    contact: Number,
    email: String,
    password: String,
    booking: Array,
});

const doctorSchema = new mongoose.Schema({
    name: String,
    age: Number,
    dob: Date,
    qualification: String,
    speciality: String,
    city: String,
    hospital: String,
    address: String,
    locality: String,
    experience: Number,
    wstime: String,
    wetime: String,
    bstime: String,
    betime: String,
    contact: Number,
    email: String,
    password: String,
    booking: Array
});

patientSchema.plugin(passportLocalMongoose);
doctorSchema.plugin(passportLocalMongoose);

const Patient = new mongoose.model("Patient", patientSchema);


const Doctor = new mongoose.model("Doctor", doctorSchema);


var message = "";


passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


app.get("/", function(req, res){
    res.render("home");
});


app.get("/plogin", function(req, res){
    
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.render("patientlogin", {message:req.flash("pfailure")});
            }else{
                res.redirect("/patienthome");
            }
        });
    }else{
        res.render("patientlogin", {message:[]});
    }
});


app.get("/dlogin", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.render("doctorlogin", {message:req.flash("dfailure")});
            }else{
                res.redirect("/doctorhome");
            }
        });
    }else{
        res.render("doctorlogin", {message:[]});
    }
});

app.get("/pregister", function(req, res){
    res.render("patientregister", {msg: message});
    message = "";
});

app.get("/dregister", function(req, res){
    res.render("doctorregister", {msg: message});
    message = "";
});

app.get("/doctorhome", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                founduser.booking.sort(function(a,b){
                    return -1*(new Date(b.date) - new Date(a.date));
                });
                founduser.markModified('booking')
                founduser.save();
                res.render("doctorhome", {booking: founduser.booking, user: req.user});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});

app.post("/dBookings", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                var date = "";
                date = req.body.search;
                res.render("doctorbookings", {User: req.user, bookArray: founduser.booking, date:date});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});

app.get("/patienthome", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                var doctorArray = [];
                Doctor.find({}, function(err, doctors) {
                
                    doctors.forEach(function(doctor) {
                      doctorArray.push(doctor);
                    });
                    res.render("patienthome", {doctors: doctorArray});
                });
                
            }
        });
    }else{
        res.redirect("/plogin");
    }
    
});

app.post("/patienthome", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                var doctorArray = [];
                var doctorName = req.body.name;
                var hosName = req.body.hname;
                var locality = req.body.loc;
                var speciality = req.body.spec;
                var search = {};
                if(doctorName !== ""){
                    search.name = doctorName;
                }
                if(hosName !== ""){
                    search.hospital = hosName;
                }
                if(locality !== ""){
                    search.locality = locality;
                }
                if(speciality !== ""){
                    search.speciality = speciality;
                }

                Doctor.find(search, function(err, doctors) {
                
                    doctors.forEach(function(doctor) {
                      doctorArray.push(doctor);
                    });
                    res.render("patienthome", {doctors: doctorArray});
                });
                
            }
        });
    }else{
        res.redirect("/plogin");
    }
});

app.post("/pregister", function(req, res){
    message = "";
    const patientDict = {
        name: req.body.name,
        age: req.body.age,
        dob: req.body.dob,
        contact: req.body.contact,
        username: req.body.username,
    };
    passport.use(Patient.createStrategy());
    Patient.register(patientDict, req.body.password, function(err, user){
        if(err){
            console.log(err);
            message = "A user with the given username already exits";
            res.redirect("/pregister");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/patienthome");
            });
        }
    });
    
});


app.get("/plogout", function(req, res){
    req.logOut();
    res.redirect("/");
});

app.get("/dlogout", function(req, res){
    req.logOut();
    res.redirect("/");
});

app.post("/dregister", function(req, res){
    message = "";
    const docDict = {
        name: req.body.name,
        age: req.body.age,
        dob: req.body.dob,
        qualification: req.body.qualification,
        speciality: req.body.speciality,
        city: req.body.city,
        hospital: req.body.hospital,
        address: req.body.address,
        locality: req.body.hloc,
        experience: req.body.experience,
        wstime: req.body.wstime,
        wetime: req.body.wetime,
        bstime: req.body.bstime,
        betime: req.body.betime,
        contact: req.body.contact,
        username: req.body.username
    };
    passport.use(Doctor.createStrategy());
    Doctor.register(docDict, req.body.password, function(err, user){
        if(err){
            console.log(err);
            message = "A user with the given username is already registered";
            res.redirect("/dregister");
        }else{
            passport.authenticate("local")(req, res, function(){

                res.redirect("/doctorhome");
            });
            
        }
    });
});
    
app.post("/plogin", function(req, res){
    req.flash("pfailure","Invalid username or password!");
    const user = new Patient({
        username: req.body.email,
        password: req.body.password
    });
    
    passport.use(Patient.createStrategy());
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local",{successRedirect:"/patienthome", failureRedirect:"/plogin"})(req, res);
        }
    });
});

app.post("/dlogin", function(req, res){
    req.flash("dfailure","Invalid username or password!");
    const user = new Doctor({
        username: req.body.email,
        password: req.body.password
    });
    passport.use(Doctor.createStrategy());
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local",{successRedirect:"/doctorhome", failureRedirect:"/dlogin"})(req, res);
        }
    })
});


app.get("/pprofile", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                res.render("patientprofile", {User: req.user});
            }
        });
    }else{
        res.redirect("/plogin");
    }
});

app.get("/dprofile", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                res.render("doctorprofile", {User: req.user});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});

app.get("/book/:userId", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                const reqUserId = req.params.userId;
                Doctor.findOne({_id: reqUserId}, function(err, foundDoc){
                    if(err){
                        console.log(err);
                    }else if(foundDoc == null){
                        res.redirect("/patienthome");
                    }else{
                        res.render("pickdate", {doctor: foundDoc});
                    }
                });
                
            }
        });
    }else{
        res.redirect("/plogin");
    }

});


app.post("/book/:userId", function(req, res){
    const date = req.body.date;
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                const reqUserId = req.params.userId;
                Doctor.findOne({_id: reqUserId}, function(err, foundDoc){
                    if(err){
                        console.log(err);
                    }else if(foundDoc == null){
                        res.redirect("/patienthome");
                    }else{
                        var book = {};
                        book["ignore"] = 0;
                        var flag = 1;
                        const wstime = foundDoc.wstime;
                        const wetime = foundDoc.wetime;
                        const bstime = foundDoc.bstime;
                        const betime = foundDoc.betime;
                        foundDoc.booking.forEach(function(consult){
                            if(consult.date == date){
                                book = consult;
                                flag = 0;
                            }
                        });
                        if(flag == 1){
                            book["date"] = date;
                            var start = wstime+":00";
                            var end = wetime+":00";
                            var year = parseInt(date.slice(0,4));
                            var month = parseInt(date.slice(5,7));
                            var day = parseInt(date.slice(8,10));
                            const bstart = bstime+":00";
                            const bend = betime+":00";
                            while(start < end){
                                if(start < bstart || start >= bend){
                                    book[start] = 0;
                                }
                                var hours = start.slice(0,2);
                                var minutes = start.slice(3, 5);
                                var oldDateObj = new Date(year,month,day,hours,minutes,0);
                                var newDateObj = moment(oldDateObj).add(30, 'm').toDate();
                                var h = newDateObj.getHours().toString();
                                var m = newDateObj.getMinutes().toString();

                                if(h.length == 1){
                                    h = "0"+h;
                                }
                                if(m.length == 1){
                                    m = "0"+m;
                                }
                                start = h+":"+m+":00";
                            }
                            
                            foundDoc.booking.push(book);
                            foundDoc.save();
                        }
                        res.render("doctorbook", {User: foundDoc, date: date, book:book, patient:req.user});
                    }
                });
                
            }
        });
    }else{
        res.redirect("/plogin");
    }

});

app.post("/bookconsult/:doctorID", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                doctor_id = req.params.doctorID;
                date = req.body.date;
                timeSlot = req.body.slot;

                patient_details = {
                    name: req.body.name,
                    username: req.body.username,
                    gender: req.body.gender,
                    dob: req.body.dob,
                    age: req.body.age,
                    patientstatus: req.body.patientStatus,
                    mrd: req.body.mrdnum,
                    problem: req.body.problem,
                    address: req.body.address,
                    contact: req.body.contact,
                    status: "No Change",
                    delay: 0,
                    reschedule_date:0,
                    reschedule_time:0
                }
                Doctor.findOne({_id: doctor_id}, function(err, foundDoc){
                    if(err){
                        console.log(err);
                    }else if(foundDoc == null){
                        res.redirect("/patienthome");
                    }else{
                        foundDoc.booking.forEach(function(consult){
                            for(let key in consult){
                                if(consult.hasOwnProperty(key)){
                                    if(key == "date"){
                                        if(consult[key] == date){
                                            consult[timeSlot] = patient_details; 
                                            consult["ignore"] = 1;  
                                        }
                                    }
                                }
                            }
                        });
                        var dsubject = "New Appointment Booked";
                        var dtext = "Dr "+foundDoc.name+" you have a new appointment.\nHere are the details.\n\nAPPOINTMENT DETAILS\n\nDATE: "+date+"\nTIME: "+timeSlot+"\n\nPATIENT DETAILS\n\nPATIENT NAME: "+patient_details.name+"\nEMAIL ID: "+patient_details.username+"\nCONTACT: "+patient_details.contact+"\n\nPlease check your bookings on the website for more details.";
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                              user: process.env.GUSER,
                              pass: process.env.GPASS
                            }
                        });

                        var mailOptions = {
                            from: process.env.GUSER,
                            to: foundDoc.username,
                            subject: dsubject,
                            text: dtext
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                              console.log(error);
                            } else {
                              console.log('Email sent: ' + info.response);
                            }
                        });

                        foundDoc.markModified('booking')
                        foundDoc.save();
                        
                        booking_details= {
                            name: foundDoc.name,
                            address: foundDoc.address,
                            contact: foundDoc.contact,
                            booking_date: date,
                            booking_time: timeSlot,
                            username: foundDoc.username,
                            status:"No change",
                            delay:0,
                            reschedule_date:0,
                            reschedule_time:0
                        }
                        founduser.booking.push(booking_details);
                        dsubject = "Appointment Booked";
                        dtext = "Appointment booked Successfully.\nHere are the details:\n\nAPPOINTMENT DETAILS\n\nDATE: "+date+"\nTIME: "+timeSlot+"\n\nDOCTOR DETAILS\n\nDOCTOR NAME: Dr "+booking_details.name+"\nEMAIL ID: "+booking_details.username+"\nCONTACT: "+booking_details.contact+"\nEMAIL ID: "+patient_details.username+"\nCONTACT: "+patient_details.contact+"\n\nPlease check your bookings on the website for more details.";
                        transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                              user: process.env.GUSER,
                              pass: process.env.GPASS
                            }
                        });
                        mailOptions = {
                            from: process.env.GUSER,
                            to: founduser.username,
                            subject: dsubject,
                            text: dtext
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                              console.log(error);
                            } else {
                              console.log('Email sent: ' + info.response);
                            }
                        });
                        
                    }
                    

                    
                    founduser.save();
                    
                });
                res.redirect("/pBookings");
                
            }
        });
    }else{
        res.redirect("/plogin");
    }
});

app.get("/pBookings", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                founduser.booking.sort(function(a,b){
                    return -1*(new Date(b.booking_date) - new Date(a.booking_date));
                });
                founduser.markModified('booking')
                founduser.save();
                res.render("patientbookings", {User: req.user, bookArray: founduser.booking});
            }
        });
    }else{
        res.redirect("/plogin");
    }
});

app.get("/dBookings", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                var date = "";
                res.render("doctorbookings", {User: req.user, bookArray: founduser.booking, date:date});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});

app.get("/delay/:date/:time", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                var consult = {};
                var date = req.params.date;
                var time = req.params.time;
                founduser.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "date"){
                            if(book[key] == date){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == time){
                            consult = book[key];
                        }else{
                            continue;
                        }
                    }
                });
                var max = 120 - consult.delay;
                res.render("delayconsult", {consult: consult, date:date, time:time, max:max});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});

app.post("/delay/:date/:time", function(req, res){
    if(req.isAuthenticated()){
        var delayTime = req.body.delayTime;
        var date = req.params.date;
        var time = req.params.time;
        var newTime;
        var finalDelay;
        var flag = 0;
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                var consult = {};
                var patientUsername;
                founduser.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "date"){
                            if(book[key] == date){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == time){
                            consult = book[key];
                            if(consult.status == "Delayed"){

                                finalDelay = parseInt(consult.delay)+parseInt(delayTime);

                                consult.delay = finalDelay.toString();
                                patientUsername = consult.username;
                                var year = parseInt(date.slice(0,4));
                                var month = parseInt(date.slice(5,7));
                                var day = parseInt(date.slice(8,10));
                                var hours = consult.reschedule_time.slice(0,2);
                                var minutes = consult.reschedule_time.slice(3, 5);
                                var oldDateObj = new Date(year,month,day,hours,minutes,0);
                                var newDateObj = moment(oldDateObj).add(delayTime, 'm').toDate();
                                var h = newDateObj.getHours().toString();
                                var m = newDateObj.getMinutes().toString();
                                if(h.length == 1){
                                    h = "0"+h;
                                }else if(m.length == 1){
                                    m = "0"+m;
                                }
                                newTime = h+":"+m+":00";
                                consult.reschedule_time = newTime;
                                consult.reschedule_date = date;
                                
                            }else{
                                finalDelay = delayTime;
                                consult.status = "Delayed";
                                consult.delay = finalDelay;
                                patientUsername = consult.username;
                                var year = parseInt(date.slice(0,4));
                                var month = parseInt(date.slice(5,7));
                                var day = parseInt(date.slice(8,10));
                                var hours = key.slice(0,2);
                                var minutes = key.slice(3, 5);
                                var oldDateObj = new Date(year,month,day,hours,minutes,0);
                                var newDateObj = moment(oldDateObj).add(delayTime, 'm').toDate();
                                var h = newDateObj.getHours().toString();
                                var m = newDateObj.getMinutes().toString();
                                if(h.length == 1){
                                    h = "0"+h;
                                }else if(m.length == 1){
                                    m = "0"+m;
                                }
                                newTime = h+":"+m+":00";
                                consult.reschedule_time = newTime;
                                consult.reschedule_date = date;
                            }
          
                        }else{
                            continue;
                        }
                    }
                });
                founduser.markModified('booking')
                founduser.save(); 

                Patient.findOne({username: patientUsername}, function(err, foundPatient){
                    if(err){
                        console.log(err);
                    }else{
                        foundPatient.booking.forEach(function(book){
                            for(let key in book){
                                if(key == "booking_date"){
                                    if(book[key] == date){
                                        continue;
                                    }else{
                                        break;
                                    }
                                }else if(key == "booking_time"){
                                    if(book[key] == time){
                                        book.status = "Delayed";
                                        book.reschedule_date = date;
                                        book.reschedule_time = newTime;
                                        book.delay = finalDelay;
                                    }else{
                                        break;
                                    }
                                }
                            }
                        });
                        var dsubject = "Appointment Delayed";
                        var dtext = "Your appointment with Dr "+founduser.name+" on "+date+" at "+time+" has been delayed. \n\nPlease check your bookings on the website for more information.";
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                              user: process.env.GUSER,
                              pass: process.env.GPASS
                            }
                        });

                        var mailOptions = {
                            from: process.env.GUSER,
                            to: foundPatient.username,
                            subject: dsubject,
                            text: dtext
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                              console.log(error);
                            } else {
                              console.log('Email sent: ' + info.response);
                            }
                        });
                        
                        foundPatient.markModified('booking');
                        foundPatient.save();
                    }
                });
                
                
                
                res.redirect("/doctorhome");
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});


app.get("/reschedule/:date/:time", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                var consult = {};
                var date = req.params.date;
                var time = req.params.time;
                founduser.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "date"){
                            if(book[key] == date){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == time){
                            consult = book[key];
                        }else{
                            continue;
                        }
                    }
                });
                res.render("rescheduleconsult", {consult: consult, date:date, time:time});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});


app.post("/rescheduleDate/:date/:time", function(req, res){
    const date = req.body.rescheduleDate;
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, foundDoc){
            if(err){
                console.log(err);
            }else if(foundDoc == null){
                res.redirect("/dlogin");
            }else{
                var book = {};
                book["ignore"] = 0;
                var flag = 1;
                const wstime = foundDoc.wstime;
                const wetime = foundDoc.wetime;
                const bstime = foundDoc.bstime;
                const betime = foundDoc.betime;
                foundDoc.booking.forEach(function(consult){
                    if(consult.date == date){
                        book = consult;
                        flag = 0;
                    }
                });
                if(flag == 1){
                    book["date"] = date;
                    var start = wstime+":00";
                    var end = wetime+":00";
                    var year = parseInt(date.slice(0,4));
                    var month = parseInt(date.slice(5,7));
                    var day = parseInt(date.slice(8,10));
                    const bstart = bstime+":00";
                    const bend = betime+":00";
                    while(start < end){
                        if(start < bstart || start >= bend){
                            book[start] = 0;
                        }
                        var hours = start.slice(0,2);
                        var minutes = start.slice(3, 5);
                        var oldDateObj = new Date(year,month,day,hours,minutes,0);
                        var newDateObj = moment(oldDateObj).add(30, 'm').toDate();
                        var h = newDateObj.getHours().toString();
                        var m = newDateObj.getMinutes().toString();
                        if(h.length == 1){
                            h = "0"+h;
                        }
                        if(m.length == 1){
                            m = "0"+m;
                        }
                        start = h+":"+m+":00";
                    }
                    
                    foundDoc.booking.push(book);
                    foundDoc.save();
                }
                var consult = {};
                var pdate = req.params.date;
                var ptime = req.params.time;
                foundDoc.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "date"){
                            if(book[key] == pdate){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == ptime){
                            consult = book[key];
                        }else{
                            continue;
                        }
                    }
                });
                res.render("rescheduledate", {consult: consult, date: pdate, time: ptime, book:book, newDate: date});
            }
        });
            
    }else{
        res.redirect("/dlogin");
    }

});

app.post("/reschedule/:date/:time", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                var consult = {};

                var date = req.params.date;
                var time = req.params.time;
                var rdate = req.body.rescheduleDate;
                var rtime = req.body.slot;
                founduser.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "date"){
                            if(book[key] == date || book[key] == rdate){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == time && book["date"] == date){
                            consult = book[key];
                            book[key].status = "Rescheduled";
                            book[key].delay = 0;
                            book[key].reschedule_date = rdate;
                            book[key].reschedule_time = rtime;

                        }else if(key == rtime && book["date"] == rdate){
                            let newConsult = Object.assign({}, consult);
                            newConsult.status = "Rescheduled";
                            newConsult.reschedule_date = rdate;
                            newConsult.reschedule_time = rtime;
                            book[key] = newConsult;
                            book["ignore"] = 1;
                        }
                    }
                     
                });

                
                founduser.markModified('booking');
                founduser.save();
                Patient.findOne({username: consult.username}, function(err, foundPatient){
                    if(err){
                        console.log(err);
                    }else{
                        foundPatient.booking.forEach(function(book){
                            for(let key in book){
                                if(key == "booking_date"){
                                    if(book[key] == date){
                                        continue;
                                    }else{
                                        break;
                                    }
                                }else if(key == "booking_time"){
                                    if(book[key] == time){
                                        book.status = "Rescheduled";
                                        book.reschedule_date = rdate;
                                        book.reschedule_time = rtime;
                                        book.delay = 0;
                                    }
                                }
                            }
                            
                        });
                        var dsubject = "Appointment Rescheduled";
                        var dtext = "Your appointment with Dr "+founduser.name+" on "+date+" at "+time+" has been rescheduled. \n\nPlease check your bookings on the website for more information.";
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                              user: process.env.GUSER,
                              pass: process.env.GPASS
                            }
                        });

                        var mailOptions = {
                            from: process.env.GUSER,
                            to: foundPatient.username,
                            subject: dsubject,
                            text: dtext
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                              console.log(error);
                            } else {
                              console.log('Email sent: ' + info.response);
                            }
                        });
                        foundPatient.markModified("booking");
                        foundPatient.save();
                    }
                });
                res.redirect("/doctorhome");
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});

app.post("/cancel/:date/:time/:username", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                const date = req.params.date;
                const time = req.params.time;
                const username = req.params.username;
                var index;
                founduser.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "booking_date"){
                            if(book[key] == date){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == "booking_time"){
                            if(book[key] == time){
                                index = founduser.booking.indexOf(book);
                            }
                        }
                    }
                });
                founduser.booking.splice(index, 1);
                var dsubject = "Appointment Cancelled";
                var dtext = "Your appointment on "+date+" at "+time+" has been cancelled.";
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: process.env.GUSER,
                      pass: process.env.GPASS
                    }
                })
                var mailOptions = {
                    from: process.env.GUSER,
                    to: founduser.username,
                    subject: dsubject,
                    text: dtext
                }
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                });
                founduser.markModified('booking')
                founduser.save();
                var consult;
                var rdate;
                var rtime;
                var flag = 0;
                Doctor.findOne({username: username}, function(err, foundDoc){
                    if(err){
                        console.log(err);
                    }else{
                        foundDoc.booking.forEach(function(book){
                            for(let key in book){
                                if(key == "date"){
                                    if(book[key] == date){
                                        continue;
                                    }else{
                                        break;
                                    }
                                }else if(key == time){
                                    consult = book[key];
                                    book[key] = 0;
                                    if(consult.status == "Rescheduled"){
                                        rdate = consult.reschedule_date;
                                        rtime = consult.reschedule_time;
                                        flag = 1;
                                    }
                                }
                            }
                        });

                        if(flag == 1){
                            foundDoc.booking.forEach(function(book){
                                for(let key in book){
                                    if(key == "date"){
                                        if(book[key] == rdate){
                                            continue;
                                        }else{
                                            break;
                                        }
                                    }else if(key == rtime){
                                        consult = book[key];
                                        book[key] = 0;
                                    }
                                }
                            });
                            var dtext = "Your appointment on "+rdate+" at "+rtime+" has been cancelled.";
                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                  user: process.env.GUSER,
                                  pass: process.env.GPASS
                                }
                            })
                            var mailOptions = {
                                from: process.env.GUSER,
                                to: foundDoc.username,
                                subject: dsubject,
                                text: dtext
                            }
                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                }
                            });
                            
                        }else{
                            var dtext = "Your appointment on "+date+" at "+time+" has been cancelled.";
                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                  user: process.env.GUSER,
                                  pass: process.env.GPASS
                                }
                            })
                            var mailOptions = {
                                from: process.env.GUSER,
                                to: foundDoc.username,
                                subject: dsubject,
                                text: dtext
                            }
                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                }
                            });

                        }
                        
                        foundDoc.markModified('booking')
                        foundDoc.save();
                    }
                });
                
                res.redirect("/pBookings");
            }
        });
    }else{
        res.redirect("/plogin");
    }
});


app.post("/confirmReschedule/:date/:time", function(req, res){
    if(req.isAuthenticated()){
        Patient.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/plogin");
            }else{
                const date = req.params.date;
                const time = req.params.time;
                var username;
                var index;
                var booking_details = {};
                var rdate;
                var rtime;
                founduser.booking.forEach(function(book){
                    for(let key in book){
                        if(key == "booking_date"){
                            if(book[key] == date){
                                continue;
                            }else{
                                break;
                            }
                        }else if(key == "booking_time"){
                            if(book[key] == time){
                                booking_details.name = book.name;
                                booking_details.address = book.address;
                                booking_details.contact = book.contact;
                                booking_details.booking_date = book.reschedule_date;
                                rdate = book.reschedule_date;
                                booking_details.booking_time = book.reschedule_time;
                                rtime = book.reschedule_time; 
                                username = book.username;
                                booking_details.username = book.username;
                                booking_details.status = "No change";
                                booking_details.delay = 0;
                                booking_details.reschedule_date = 0;
                                booking_details.reschedule_time = 0;
                                index = founduser.booking.indexOf(book);
                            }
                        }
                    }
                });

                founduser.booking.push(booking_details);
                founduser.booking.splice(index, 1);
                
                
                
                founduser.markModified('booking')
                founduser.save();
                Doctor.findOne({username: username}, function(err, foundDoc){
                    if(err){
                        console.log(err);
                    }else{
                        foundDoc.booking.forEach(function(book){
                            for(let key in book){
                                if(key == "date"){
                                    if(book[key] == date || book[key] == rdate){
                                        continue;
                                    }else{
                                        break;
                                    }
                                }else if(key == time && book["date"] == date){
                                    book[key] = 0;

                                }else if(key == rtime && book["date"] == rdate){
                                    var plan = book[key];
                                    plan.status = "No Change";
                                    plan.reschedule_date = 0;
                                    plan.reschedule_time = 0;
                                }
                            }
                        });
                        foundDoc.markModified('booking');
                        foundDoc.save();
                        
                    }
                    
                });
                var dsubject = "Appointment Reschedule Confirmation Successfull";
                var dtext = "Your appointment on "+date+" at "+time+" has been rescheduled and a new appointment has been made.";
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: process.env.GUSER,
                      pass: process.env.GPASS
                    }
                })
                var mailOptions = {
                    from: process.env.GUSER,
                    to: founduser.username,
                    subject: dsubject,
                    text: dtext
                }
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                });
                
                
                 
                res.redirect("/pBookings");
            }
        });
    }else{
        res.redirect("/plogin");
    }
});

app.get("/viewDetails/:date/:time", function(req, res){
    if(req.isAuthenticated()){
        Doctor.findOne({_id: req.user._id}, function(err, founduser){
            if(err){
                console.log(err);
            }else if(founduser == null){
                res.redirect("/dlogin");
            }else{
                const date = req.params.date;
                const time = req.params.time
                res.render("details", {bookArray: founduser.booking, date:date, time:time});
            }
        });
    }else{
        res.redirect("/dlogin");
    }
});



 
app.listen(3000, function(){
    console.log("Server started on port 3000");
});