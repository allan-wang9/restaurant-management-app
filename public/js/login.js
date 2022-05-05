//LOGS IN NEW USER AND CREATES SESSION

//GLOBAL VARIABLES -------------------------------------------------------------------
let userLogin = {};

//FUNCTIONS + HELPERS ----------------------------------------------------------------

//Sends a POST request to log in the user for session
function login(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    //create the userLogin JSON
    userLogin["username"] = username;
    userLogin["password"] = password;

    //check if any fields are empty 
    if (isEmpty(username, password)){
        alert("Please enter valid username or password.");
    } else {
        let request = new XMLHttpRequest();
        
        //listen for state change
	    request.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200){
                console.log("Logging in and redirecting to private home...");

                //WE NOW MAKE A GET FOR private-users/userID in server 
                let ID = JSON.parse(this.responseText)["ID"];
                console.log(ID);
                window.location.href = `http://localhost:3000/private-users/${ID}`
		    }
	    }
        request.open("POST", "/login");
	    request.setRequestHeader("Content-Type", "application/json");
	    request.send(JSON.stringify (userLogin));
    }
}

//Checks if any of the textboxes are empty (helper)
function isEmpty(username, password){
    if (username.length == 0 || password.length == 0){
        return true;
    }
    return false;
}