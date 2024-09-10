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
