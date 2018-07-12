

function handleMain(req){
	if(req.status >= 200 && req.status <= 300) {
		const usernames = JSON.parse(req.responseText);
		const tblBody = document.getElementById("regForm");
		console.log('heeee');
		// for(const user of usernames) {
		// 	const newRow = document.createElement("tr");

		// 	const newCell = document.createElement("td");
		// 	const a = document.createElement("a");
		// 	a.appendChild(document.createTextNode("@" + user.username));
		// 	a.title = user.username;
		// 	a.href = "/user/" + user.username;
		// 	newCell.appendChild(a);
		// 	newRow.appendChild(newCell);


		// 	tblBody.appendChild(newRow);
		// }
		if (usernames.length > 0){
			//so if user/users exist with matching input from the username field, then display, cant have that username
			const warning = document.createElement("p");
			warning.appendChild(document.createTextNode("This username is already taken"));
			tblBody.appendChild(warning);
		}
	}
}

function handleMainError(){

}


function main(){
	const req = new XMLHttpRequest();
	req.open("GET", "/api/users", true);
	req.addEventListener('load', () => {handleMain(req);});
	req.addEventListener('error', handleMainError);
	req.send();
}


function validateUsername(evt){
	evt.preventDefault();
	const query = "?username=" + document.forms['regForm'].username.value ;
	const req = new XMLHttpRequest();

	req.open("GET", "/api/users/" + query, true);
	req.addEventListener('load', () => {handleUsernameResponse(req);});
	req.addEventListener('error', handleUsernameError);
	req.send();
}

function handleUsernameResponse(req){
	if(req.status >= 200 && req.status <= 300) {
		const usernames = JSON.parse(req.responseText);
		// const tblBody = document.getElementById("myTable");
		// // remove all content to replace
		// while(tblBody.firstChild){
		// 	tblBody.removeChild(tblBody.firstChild);
		// }

		// for(const user of users) {
		// 	const newRow = document.createElement("tr");

		// 	const newCell = document.createElement("td");
		// 	const a = document.createElement("a");
		// 	a.appendChild(document.createTextNode("@" + user.username));
		// 	a.title = user.username;
		// 	a.href = "/user/" + user.username;
		// 	newCell.appendChild(a);
		// 	newRow.appendChild(newCell);


		// 	tblBody.appendChild(newRow);
		// }
		const tblBody = document.getElementById("regForm");
		if (usernames.length > 0){
			//so if user/users exist with matching input from the username field, then display, cant have that username
			const warning = document.createElement("p");
			warning.appendChild(document.createTextNode("This username is already taken"));
			tblBody.appendChild(warning);
		}

	}
}


function handleUsernameError(){

}

document.addEventListener("DOMContentLoaded", main);

document.getElementById("usernameEntry").addEventListener("input", validateUsername);
