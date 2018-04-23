

function handleMain(req){
	if(req.status >= 200 && req.status <= 300) {
		const users = JSON.parse(req.responseText);
		console.log("users in handleMain" + users);
		const tblBody = document.getElementById("myTable");
		for(const user of users) {
			const newRow = document.createElement("tr");

			const newCell = document.createElement("td");
			const a = document.createElement("a");
			a.appendChild(document.createTextNode(user.username));
			a.title = user.username;
			a.href = "/user/" + user.username;
			newCell.appendChild(a);
			newRow.appendChild(newCell);


			tblBody.appendChild(newRow);
		}
	}
}

function handleMainError(){

}


function main(){
	console.log("in the main");
	const req = new XMLHttpRequest();
	req.open("GET", "/api/users", true);
	req.addEventListener('load', () => {handleMain(req);});
	req.addEventListener('error', handleMainError);
	req.send();
}


function search(evt){
	evt.preventDefault();
	const query = "?username=" + document.forms['myForm'].search.value ;
	const req = new XMLHttpRequest();

	req.open("GET", "/api/users/" + query, true);
	req.addEventListener('load', () => {handleSearchResponse(req);});
	req.addEventListener('error', handleSearchError);
	req.send();
}

function handleSearchResponse(req){
	if(req.status >= 200 && req.status <= 300) {
		const users = JSON.parse(req.responseText);
		const tblBody = document.getElementById("myTable");
		// remove all content to replace
		while(tblBody.firstChild){
			tblBody.removeChild(tblBody.firstChild);
		}

		for(const user of users) {
			const newRow = document.createElement("tr");

			const newCell = document.createElement("td");
			const a = document.createElement("a");
			a.appendChild(document.createTextNode(user.username));
			a.title = user.username;
			a.href = "/user/" + user.username;
			newCell.appendChild(a);
			newRow.appendChild(newCell);


			tblBody.appendChild(newRow);
		}

	}
}


function handleSearchError(){


}

document.addEventListener("DOMContentLoaded", main);

document.getElementById("searchChange").addEventListener("input", search);