//UPDATES AN EXISTING CLIENT USER (allows user to toggle private mode)

//GLOBAL VARIABLES -------------------------------------------------------------------
let privacyToggle = {};

//FUNCTIONS + HELPERS ----------------------------------------------------------------

//Sends a PUT request to update the user's privacy field
function savePrivacy(){
    let enabled = document.getElementById("enabled");
    let disabled = document.getElementById("disabled");
    
    //get the user _ID from URL
    const ID = document.URL.split("/")[4];
    privacyToggle["OID"] = ID;
    
    //set the privacyToggle to true or false 
    if (enabled.checked){
        privacyToggle["privacy"] = true;
    } else if (disabled.checked) {
        privacyToggle["privacy"] = false;
    } else {
        alert("Please select a private mode setting.");
    }

    console.log(privacyToggle);

    let request = new XMLHttpRequest();
    
    //listen for state change
	request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200){
            alert("Private Mode updated.");
		}
    }
	    
    request.open("PUT", `/users/${ID}`);
	request.setRequestHeader("Content-Type", "application/json");
	request.send(JSON.stringify(privacyToggle));
}