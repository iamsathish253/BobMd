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
