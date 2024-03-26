function callAction(){

    debugger;

    try {

        const data={
            "firstName":value1,
            "lastName":value2,
            "fullName":value3
        }

        const req=new XMLHttpRequest();

        req.open("",EndPoint,true/false);
        req.setRequestHeader("Accept","application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.onreadystatechange=function(){
            if(this.readyState===4){
                if(this.status===200 || this.status===204) {
                    let result=JSON.parse(this.response)

                result["logicalName"]
                }
            }
        }
        
    } catch (error) {
        
    }
}

fetch(Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/accounts?$select=name,accountnumber,accountratingcode", {
	method: "GET",
	headers: {
		"OData-MaxVersion": "4.0",
		"OData-Version": "4.0",
		"Content-Type": "application/json; charset=utf-8",
		"Accept": "application/json",
		"Prefer": "odata.include-annotations=*"
	}
}).then(
	function success(response) {
		return response.json().then((json) => { if (response.ok) { return [response, json]; } else { throw json.error; } });
	}
).then(function (responseObjects) {
	var response = responseObjects[0];
	var responseBody = responseObjects[1];
	var results = responseBody;
	console.log(results);
	for (var i = 0; i < results.value.length; i++) {
		var result = results.value[i];
		// Columns
		var accountid = result["accountid"]; // Guid
		var name = result["name"]; // Text
		var accountnumber = result["accountnumber"]; // Text
		var accountratingcode = result["accountratingcode"]; // Choice
		var accountratingcode_formatted = result["accountratingcode@OData.Community.Display.V1.FormattedValue"];
	}
}).catch(function (error) {
	console.log(error.message);
});