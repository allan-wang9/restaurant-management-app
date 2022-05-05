//EXPRESS/PUG/MONGO/PORT REQUIREMENTS ------------------------------------------------
const express = require('express');
const session = require('express-session');
const app = express();
const MongoDBStore = require('connect-mongodb-session')(session);
const ObjectID = require('mongodb').ObjectID;
const mc = require("mongodb").MongoClient;
const pug = require('pug');
const path = require('path');
const PORT = process.env.PORT || 3000;

//SESSION STORE SETTINGS -------------------------------------------------------------
let store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/a4',
    collection: 'sessions'
});
store.on('error', (error) => {console.log(error)});

//MIDDLEWARE -------------------------------------------------------------------------
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set(path.join(__dirname, 'views'));

app.use(session({
    secret: 'a4-secret-code',
    cookie:{maxAge: 1000*60*60*24*7},
    resave: true,
    saveUninitialized: false,
    store: store,
    username: null
}));

//GLOBAL VARIABLES -------------------------------------------------------------------
let db;

//SERVER ROUTES (GET/POST/PUT/DELETE) ------------------------------------------------

//GET -> home page  
app.get(['/', '/home'], getHome);

//GET -> registration page 
app.get('/register', getRegistration);

//GET -> users page 
app.get('/users', getUsers);

//GET -> user page using user's _ID 
app.get('/users/:userID', getUserByID);

//GET -> login page 
app.get('/login', getLogin);

//GET -> private home page after user has logged in
app.get('/private-home', getPrivateHome);

//GET -> private users page after user has logged in
app.get('/private-users', getPrivateUsers);

//GET -> private user page when user initially logs in 
app.get('/private-users/:userID', getLoggedInUser);

//GET -> profile of user after user has logged in 
app.get('/profile', getProfile);

//GET -> order form page after user has logged in 
app.get('/orderform', getOrderForm);

//GET -> logout 
app.get('/logout', logout);

//GET -> order page for individual order 
app.get('/orders/:orderID', getOrder);

//POST -> insert a new user in the database
app.post('/users', addUser);

//POST -> logs in the new user with its session 
app.post('/login', login);

//POST -> adds user's order in the database
app.post('/orders', addOrder);

//PUT -> updates the user's private mode setting, if toggled and saved 
app.put('/users/:userID', updateUserPrivacy);

//FUNCTIONS + HELPERS ----------------------------------------------------------------

//Get the home page (GET for /, /home)
function getHome(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);
            response.set("Content-Type", "text/html");
            response.send(pug.renderFile("./views/home.pug"));
        },
        "default" : () => {response.status(404).send("Cannot get home page.");}
    });
}

//Get the registration page (GET for /register)
function getRegistration(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);
            response.set("Content-Type", "text/html");
            response.send(pug.renderFile("./views/register.pug"));
        },
        "default" : () => {response.status(404).send("Cannot get registration page.");}
    });
}

//Get the users page (GET for /users)
function getUsers(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            //let name = request.query.name;
            //console.log(name);

            //find all public users from "users" collection
            db.collection("users").find({privacy : false}).toArray(function(error,result){
                if(error){throw err;}
                response.set("Content-Type", "text/html");
                response.send(pug.renderFile("./views/users.pug", {usersList: result}));
            }); 
        },
        "default" : () => {response.status(404).send("Cannot get users page.");}
    });
}

//Get the user page via userID (GET for /users/:userID)
function getUserByID(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            let userInfo = {};
            let orderInfo = {};
            let username;

            //parse the request
            const ID = request.params.userID;
            console.log(ID);
            db.collection("users").findOne({_id : ObjectID(ID) }, function(error, result){
                if(error) {throw error;}
                console.log(result);
                userInfo = result;
                username = result["username"];

                db.collection(`${username}Orders`).find().toArray(function(error, result){
                    if(error) {throw error;}
                    console.log(result);
                    orderInfo = result;
    
                    response.set("Content-Type", "text/html");
                    response.send(pug.renderFile("./views/user.pug", {user: userInfo, orders: orderInfo}));
                });
            });
        },
        "default" : () => {response.status(404).send("Cannot get user page by ID.");}
    });
}

//Get the log in page (GET for /login)
function getLogin(request, response){
    logRequest(request);

    response.format({
        "text/html": () => {
            logRequest(request);
            response.set("Content-Type", "text/html");
            response.send(pug.renderFile("./views/login.pug"));
        },
        "default" : () => {response.status(404).send("Cannot get login page.");}
    });
}

//Get the private home page after user has logged in (GET for /private-home)
function getPrivateHome(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            //console.log(request.session.loggedin);
            if (request.session.loggedin === false || request.session.loggedin === undefined){
                response.status(403).send("You have not logged in. Cannot display your profile page. Please go back.")
            } else {
                response.set("Content-Type", "text/html");
                response.send(pug.renderFile("./views/private/home.pug"));
            }
        },
        "default" : () => {response.status(404).send("Cannot get private home page.");}
    });
}

//Get the private users page after user has logged in (GET for /private-users) 
function getPrivateUsers(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            if (request.session.loggedin === false || request.session.loggedin === undefined){
                response.status(403).send("You have not logged in. Cannot display users page. Please go back.")
            } else {
                //find all public users from "users" collection
                db.collection("users").find({privacy : false}).toArray(function(error,result){
                    if(error){throw error;}
                    response.set("Content-Type", "text/html");
                    response.send(pug.renderFile("./views/private/users.pug", {usersList: result}));
                }); 
            }
        },
        "default" : () => {response.status(404).send("Cannot get users page.");}
    });
}

//Get the private user page for logged in account (GET for /private/users/:userID)
function getLoggedInUser(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            let userInfo = {};
            let orderInfo = {};
            let username;

            //parse the request
            const ID = request.params.userID;
            console.log(ID);
            db.collection("users").findOne({_id : ObjectID(ID) }, function(error, result){
                if(error) {throw error;}
                console.log(result);
                userInfo = result;
                username = result["username"];

                db.collection(`${username}Orders`).find().toArray(function(error, result){
                    if(error) {throw error;}
                    console.log(result);
                    orderInfo = result;
    
                    response.set("Content-Type", "text/html");
                    response.send(pug.renderFile("./views/private/user.pug", {user: userInfo, orders: orderInfo}));
                });
            });
        },
        "default" : () => {response.status(404).send("Cannot get user page by ID.");}
    });
}

//Get the profile page for logged in account (GET for /profile)
function getProfile(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            let userInfo = {};
            let orderInfo = {};

            if (request.session.loggedin === false || request.session.loggedin === undefined){
                response.status(403).send("You have not logged in. Cannot display users page. Please go back.");
            } else {
                //parse the request
                const sessionUsername = request.session.username;
                console.log(sessionUsername);

                db.collection("users").findOne({username : sessionUsername}, function(error, result){
                    if(error) {throw error;}
                    console.log(result);
                    userInfo = result;

                    db.collection(`${sessionUsername}Orders`).find().toArray(function(error, result){
                        if(error) {throw error;}
                        console.log(result);
                        orderInfo = result;
    
                        response.set("Content-Type", "text/html");
                        response.send(pug.renderFile("./views/private/user.pug", {user: userInfo, orders: orderInfo}));
                    });
                });
            }
        },
        "default" : () => {response.status(404).send("Cannot get private user page after log.");}
    });
}

//Get the order form page after user has logged in (GET for /orderform)
function getOrderForm(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            if (request.session.loggedin === false || request.session.loggedin === undefined){
                response.status(403).send("You have not logged in. Cannot display order form. Please go back.")
            } else {
                response.set("Content-Type", "text/html");
                response.send(pug.renderFile("./views/private/orderform.pug"));
            }
        },
        "default" : () => {response.status(404).send("Cannot get users page.");}
    });
}

//Get logout process (GET for /logout)
function logout(request, response){
    if (request.session.loggedin){
        request.session.loggedin = false;
        request.session.username = undefined;
        response.status(200);
        response.redirect("http://localhost:3000/home");
    } else {
        response.status(400).send("Cannot log out. No user is logged in.");
    }
}

//Get the individual order by ID (GET for /orders/:orderID)
function getOrder(request, response){
    response.format({
        "text/html": () => {
            logRequest(request);

            let order = {};
            let username;

            //parse the request
            const ID = request.params.orderID;
            console.log(ID);

            if (request.session.loggedin === false || request.session.loggedin === undefined){
                response.status(403).send("You have not logged in. Cannot display individual orders. Please go back.");
            } else {
                username = request.session.username;

                db.collection(`${username}Orders`).findOne({_id : ObjectID(ID)}, function(error, result){
                    if(error) {throw error;}
                    console.log(result);

                    if (result === null){
                        response.status(403).send("You must be logged as this profile to view individual orders.");
                    } else {
                        order = result;
                        response.set("Content-Type", "text/html");
                        response.send(pug.renderFile("./views/private/order.pug", {orderObj: order, usernameObj: username}));
                    } 
                });
            }
        },
        "default" : () => {response.status(404).send("Cannot get user page by ID.");}
    });
}

//Add a new user to the database (POST for /users)
function addUser(request, response){
    logRequest(request);
    console.log("Server accepting JSON request/body:");
    const body = request.body;
    console.log(body);

    //check for duplicates usernames
    db.collection("users").find({username : body["username"]}).toArray(function(error,result){
        if(error){throw err;}
        
        //if the result array === 0, no usernames can be found in the collection and we can make new user
        if (result.length === 0){
            //insert new user into users collection
            db.collection("users").insertOne(
            {username: body["username"], password: body["password"], privacy: body["privacy"]}, function(error, result){
		    if(error){throw error;} 
		    console.log(result);
            });

            //find user's ID using their username, and send response to allow redirect
            db.collection("users").findOne({username : body["username"]}, function(error, result){
                if(error){throw error;}    
                let IDObj = {};
                let ID = result["_id"];
                IDObj["ID"] = ID;

                //add session document + extract userID
                request.session.loggedin = true;
                request.session.username = body["username"];

                response.status(200).send(IDObj);
            });
        } else {
            response.statusMessage = "Username already exists. Please use another username";
            response.sendStatus(400);
        }
    });   
}

//Log in the user and create its session data (POST for /login)
function login(request, response){
    logRequest(request);

    console.log("Server accepting JSON request/body:");
    const body = request.body;
    console.log(body);

    //check if the username exists -> if it does, check if password is correct -> create session data
    db.collection("users").findOne({username : body["username"]}, function(error, result){
        if(error){throw error;}    
        console.log(result);

        //no username is found
        if (result === null){
            response.statusMessage = "Username cannot be found.";
            response.sendStatus(400);

        //username is found, check if password is correct    
        } else {
            if (body["password"] === result["password"]){

                //check if already logged in 
                if(request.session.loggedin){
                    response.status(200).send("Already logged in.");
                    return;
                }

                //add session document + extract userID
                request.session.loggedin = true;
                request.session.username = body["username"];
                let IDObj = {};
                let ID = result["_id"];
                IDObj["ID"] = ID;
                response.status(200).send(IDObj);

            } else {
                response.statusMessage = "Password is incorrect.";
                response.sendStatus(400);
            }
        }
    });
}

//Add user's order in the database (POST for /orders)
function addOrder(request, response){
    logRequest(request);
    console.log("Server accepting JSON request/body:");
    const body = request.body;
    const username = request.session.username;
    console.log(body);
    console.log(username);

    db.collection(`${username}Orders`).insertOne({order: body}, function(error, result){
        if (error){throw error;}
        console.log(result);
        response.sendStatus(200);
    });
}

//Update a user privacy mode (PUT for /users/:userID)
function updateUserPrivacy(request, response){
    logRequest(request);
    console.log("Server accepting JSON request/body:");
    const body = request.body;
    const updatedPrivacy = body["privacy"];
    const ID = request.params.userID;

    if (request.session.loggedin === false || request.session.loggedin === undefined){
        response.status(403).send("You have not logged in. Cannot display update the privacy setting. Please go back.");
    } else {
        //update the user's privacy value using their OID
	db.collection("users").updateOne({_id: ObjectID(ID)}, {$set: {privacy: updatedPrivacy}}, function(error, result){
		if(error) {throw error;}
		console.log(result);
	});
    response.sendStatus(200);
    }
}

//Console log the received request (helper)
function logRequest(request){
    console.log(`${request.method} -> ${request.url}`);
}

//CONNECT TO DATABASE ----------------------------------------------------------------
mc.connect("mongodb://localhost:27017", function(err, client) {
	if (err) {
		console.log("ERROR: Cannot connect to database.");
		console.log(err);
		return;
	}
	
    //Connect to "a4" and listen on port 3000
	db = client.db("a4");
	app.listen(PORT);
	console.log(`Server listening at http://localhost:${PORT}`);
});