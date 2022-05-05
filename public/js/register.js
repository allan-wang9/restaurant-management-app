//REGISTERS A NEW CLIENT USER

//GLOBAL VARIABLES -------------------------------------------------------------------
let newUser = {};

//FUNCTIONS + HELPERS ----------------------------------------------------------------

//Sends a POST request to make the new user, then redirects to user's page
function register(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    //create the newUser JSON
    newUser["username"] = username;
    newUser["password"] = password;
    newUser["privacy"] = false;

    //check if any fields are empty 
    if (isEmpty(username, password)){
        alert("Please enter valid username or password.");
    } else {
        let request = new XMLHttpRequest();
        
        //listen for state change
	    request.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200){
                let ID = JSON.parse(this.responseText)["ID"];
                window.location.href = `http://localhost:3000/private-users/${ID}`
		    }
	    }
        request.open("POST", "/users");
	    request.setRequestHeader("Content-Type", "application/json");
	    request.send(JSON.stringify(newUser));
    }
}

//Checks if any of the text box are empty (helper)
function isEmpty(username, password){
    if (username.length == 0 || password.length == 0){
        return true;
    }
    return false;
}