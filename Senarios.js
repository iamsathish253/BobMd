    function onLoad(executionContext) {
        debugger;

        var formContext = executionContext.getFormContext();

        // Getting Contact Lookup Control and Adding addPreSearch method to trigger JS when clicked on
        formContext.getControl("crd21_contact").addPreSearch(function() {
            filterLookUp(formContext);
        });
    }

    function filterLookUp(context) {
        debugger;

        try {
            // Getting Account Column info to pass to addCustomFilter
            let account = context.getAttribute("crd21_account").getValue();

            // Checking if account Value is null or Not
            if (account != null && account != undefined) {
                let accountId = account[0].id;

                // Generated fetchXml Query to filter the Data
                let fetchFilter = "<filter type='and'>" +
                    "<condition attribute='parentcustomerid' operator='eq' value='" + accountId + "' />" +
                    "</filter>";

                // Applying Custom Filter to contact lookup
                context.getControl("crd21_contact").addCustomFilter(fetchFilter, "contact");
            }
        } catch (error) {
            Xrm.Navigation.openAlertDialog({ text: error.message });
        }
    }


//JavaScript Methods Related to Choice,Choices Columns in Dynamics Crm



// Calling Power Automate on Click of Button

function callPowerAutomate(primaryControl){
    debugger;

    try {

    var formContext=primaryControl;
    var Url="https://prod-90.westus.logic.azure.com:443/workflows/68b0e12eff7e418fb9a7f0dd406ef5e0/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wFFK1C-2dFYtahjBQneGDQ6s9sNHd5Ndso1SJ82J8zA"

   var parameters = {"currentRecordId":formContext.data.entity.getId().slice(1,-1)};
    //Creating XMLHttpRequest to call Power Automate
    var req = new XMLHttpRequest();
    req.open("POST", Url, true);
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("secretkey",formContext.data.entity.getId().slice(1,-1));
    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status === 200 || this.status === 204) {
                var result = JSON.parse(this.response);
                let serviceRecordId=result.currentRecordId;
                formContext.getAttribute("crd21_powerautomateflow").setValue(serviceRecordId);
                Xrm.Navigation.openAlertDialog({text:"Flow Excuted Sucessfully, " + "This is the Response:"+serviceRecordId})  
            } else {
                Xrm.Navigation.openAlertDialog({text:this.responseText});
            }
        }
    };
    req.send(JSON.stringify(parameters));
    } catch (error) {
        Xrm.Navigation.openAlertDialog({text:error.message});
    }
}


function onLoad(executionContext){

    debugger;
  var formContext=executionContext.getFormContext();

  var Guid=Xrm.Page.data.entity.getId().slice(1,-1)


    Xrm.WebApi.retrieveRecord("testpa_sample", Guid, "?$select=testpa_baiscsalary,_testpa_lookup_incident_value,testpa_name").then(
        function success(result) {
            console.log(result);
            // Columns
          // Guid
          
           
            var testpa_lookup_incident = result["_testpa_lookup_incident_value"]; // Lookup
            var testpa_lookup_incident_formatted = result["_testpa_lookup_incident_value@OData.Community.Display.V1.FormattedValue"];
            var testpa_lookup_incident_looktestpa_lookup_incidentuplogicalname = result["_testpa_lookup_incident_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
            var testpa_name =  result.testpa_name; // Text
           

            var alertStrings = { confirmButtonLabel: "Ok", text: "Values Retrived from WebApi"+testpa_lookup_incident_formatted +","+testpa_name };
           var alertOptions = { height: 120, width: 260 };
           Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);


            
        },
        function(error) {
            console.log(error.message);
        }
    );
}


async function autoSetValues(executionContext){
    debugger;

    var formContext=executionContext.getFormContext();

    var lookUp=formContext.getAttribute("testpa_lookup_incident").getValue();

    if(lookUp!=null && lookUp!=undefined){
    var lookUpGuid=lookUp[0].id.slice(1,-1);

    var result =  await Xrm.WebApi.retrieveRecord("crd21_incidenttable",lookUpGuid, "?$select=crd21_location,crd21_type");

     var crd21_location = result["crd21_location"]; // Text
     //var crd21_type = result["crd21_type"]; // Choice
     var crd21_type_formatted = result["crd21_type@OData.Community.Display.V1.FormattedValue"];
     
    formContext.getAttribute("testpa_city").setValue(crd21_location);
    formContext.getAttribute("testpa_email").setValue(crd21_type_formatted)

}

}