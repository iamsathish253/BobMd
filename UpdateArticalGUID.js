var formAfterSaveCustomizations = {  
	runAftersave: function (executionContext) {  
		//debugger;
		var formContext = executionContext.getFormContext();  
		formContext.data.entity.addOnPostSave(formAfterSaveCustomizations.updateProjectGUID);  
	},  

	updateProjectGUID: function (executionContext) {  
		debugger;
		try {
			var formContext = executionContext.getFormContext();
			if (typeof(formContext) == "undefined") formContext = executionContext; // call from Ribbon workbench which is passing formContext directly
			
			//var articleID = formContext.data.entity.getId();
			//var genericID = formContext.getAttribute('bdf_generic').getValue().slice(1,-1);

			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$expand=bdf_Generic($select=_bdf_project_value)&$filter=_bdf_project_value eq null and _bdf_generic_value ne null").then(
						function success(data) {
							for (variant of data.entities) {
								var projectGUID = ntvaria.bdf_Generic._bdf_project_value;
								var articleGUID = variant.cr60a_stg_article_masterid;
								var input = {"bdf_Project@odata.bind": "/bdf_projects("+projectGUID+")"};
								Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleGUID, input).then(
									function success(result) {
										articleGUID = result.id;
									},
									function (error) {
										Xrm.Utility.alertDialog(error.message);
									}
								);
							}	
						},
						function (error) {
							Xrm.Utility.alertDialog(error.message);
						}
					);			
		} catch (e) {
					console.log(e.message);
		}   
	}
}