function openUploadFileDialog(pageContext, operationType){
	debugger;
 if (Xrm.Page.data.entity.getId() != '') {
	projectID =Xrm.Page.data.entity.getId().slice(1,-1);

 }
	var entityName;
	var payload;
    var projectNumber = 0;
	if (operationType == "New") {
		entityName = pageContext.data.entity.getEntityName()
		let recordId = pageContext.data.entity.getId().slice(1,-1).replaceAll('-','');
		let recordName = pageContext.data.entity.getPrimaryAttributeValue();
		if (entityName == "bdf_project") {
			try {
				Xrm.WebApi.retrieveRecord("bdf_project", projectID, "?$select=bdf_projectnumber").then(
					function success(data) {
						console.log(data);
						projectNumber = data.bdf_projectnumber;
						console.log(projectNumber);
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}
			catch (e) {
				Xrm.Utility.alertDialog(e.message);
			}

		}
		payload = JSON.stringify({recordId: recordId, recordName: recordName, operationType: operationType, projectNumber: projectNumber});
	} else {
		
		let form = pageContext.getParentForm();
		entityName = form.entityReference.entityType;
		let recordId = form.entityReference.id.slice(1,-1).replaceAll('-','');
		let recordName;
		if (entityName == "bdf_project") recordName = form.getAttribute("bdf_projectname").getValue();
		else if (entityName == "bdf_generic") recordName = form.getAttribute("bdf_genericname").getValue();
		else recordName = form.getAttribute("bdf_articleid").getValue();

		let grid = pageContext.getGrid()
		//grid.getSelectedRows().getAll()[0]._entityId
		let row = grid.getSelectedRows().getAll()[0]
		let title = row.getAttribute("title").getValue()
		let fileName = row.getAttribute("fullname").getValue()
		let heroImage = row.getAttribute("bdf_heroimage").getValue()
		
			payload = JSON.stringify({recordId: recordId, recordName: recordName, operationType: operationType,
				title: title, fileName: fileName, heroImage: heroImage});
			}
	
	Xrm.Navigation.navigateTo({ 
		pageType: "custom",
		name: "bdf_fileupload_cbc2e",
		entityName: entityName,
		recordId: payload
	}, {
		target:2, 
		width: 700, 
		height:400
	})
	.then(
		function success(result) {
			console.log("File Uploaded / Updated Successfully.")
			//pageContext.data.refresh();
			let subgrid = Xrm.Page.ui.controls.get("sharepoint_doc");
			setTimeout(function() {subgrid.refresh()}, 2000);
			//subgrid.refresh();

			// Refresh the "Subgrid_new_5" subgrid
            let subgridNew5 = Xrm.Page.ui.controls.get("Subgrid_new_5");
            setTimeout(function() {
                subgridNew5.refresh();
            }, 2000);
		},
		function error(err) {
			alert(err);
		}
	);
}