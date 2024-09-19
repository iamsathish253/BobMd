function loadFamilyCode(executionContext) {
	debugger;
	let formContext = executionContext.getFormContext();
	if (formContext.getAttribute('bdf_familygroupcode').getValue() != null &&
		formContext.getAttribute('bdf_familyname').getValue() != null) {
		let input = {
			"bdf_familycode": formContext.getAttribute('bdf_familygroupcode').getValue().toUpperCase(),
			"bdf_familyname": formContext.getAttribute('bdf_familyname').getValue().toUpperCase(),
		}
		Xrm.WebApi.createRecord("bdf_familygroup", input).then(
			function success(result) {
				var lookup = new Array();
				lookup[0] = new Object;
				lookup[0].id = result.id;
				lookup[0].name = formContext.getAttribute('bdf_familyname').getValue().toUpperCase();
				lookup[0].entityType = "bdf_familygroup";
				formContext.getAttribute("bdf_familygroup").setValue(lookup);
			},
			function (error) {
				if (error.title != 'Duplicate Record')
					Xrm.Utility.alertDialog(error.message);
			}
		);
	}
}


/*
//--------------
async function getVendorLookUp(vendorId, genericGUID) {
	debugger;
	await Xrm.WebApi.retrieveRecord("bdf_vendor", `${vendorId}`, "?$select=bdf_vendoraccountnumber").then(
		async function success(result) {
			console.log(result);
			// Columns
			var bdf_vendorid = result["bdf_vendorid"]; // Guid
			var vendorAccountNumber = result["bdf_vendoraccountnumber"]; // Text
			//---------------------------------------------------------------------------
			await Xrm.WebApi.retrieveMultipleRecords("account", `?$filter=accountnumber eq '${vendorAccountNumber}'`).then(
				function success(results) {
					console.log(results);
					for (let i = 0; i < results.entities.length; i++) {
						var result = results.entities[i];
						// Columns
						var accountid = result["accountid"]; // Guid
						var record = {};
						record["bdf_VendorID@odata.bind"] = `/accounts(${accountid})`; // Lookup
						Xrm.WebApi.updateRecord("bdf_generic", genericGUID, record).then(
							function success(result) {
								var updatedId = result.id;
								console.log(updatedId);
							},
							function (error) {
								console.log(error.message);
							}
						);
					}

					if (results.entities.length == 0) {
						var record = {};
						record["bdf_VendorID@odata.bind"] = null; // Lookup
						Xrm.WebApi.updateRecord("bdf_generic", genericGUID, record).then(
							function success(result) {
								var updatedId = result.id;
								console.log(updatedId);
							},
							function (error) {
								console.log(error.message);
							}
						);
					}

					
				},
				function (error) {
					console.log(error.message);
				}
			);
			//--------------------------------------------------------------------------
		},
		function (error) {
			console.log(error.message);
		}
	);
}

//------------------------------------------
async function getProjectVendor(vendorType, formContext){
	debugger;

	var success1 = false
	await Xrm.WebApi.retrieveRecord("bdf_project", formContext.getAttribute("bdf_project").getValue()[0].id.slice(1,-1), "?$select=_bdf_mothervendor_value,_bdf_vendor_value").then(
		function success(result) {
			console.log(result);
			// Columns
			var bdf_projectid = result["bdf_projectid"]; // Guid
			var motherVendorId = result["_bdf_mothervendor_value"]; // Lookup
			var bdf_mothervendor_formatted = result["_bdf_mothervendor_value@OData.Community.Display.V1.FormattedValue"];
			var bdf_mothervendor_lookuplogicalname = result["_bdf_mothervendor_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
			var vendorId = result["_bdf_vendor_value"]; // Lookup
			var bdf_vendor_formatted = result["_bdf_vendor_value@OData.Community.Display.V1.FormattedValue"];
			var bdf_vendor_lookuplogicalname = result["_bdf_vendor_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
			if (motherVendorId && vendorType == "projMotherVendor") {
				getVendorLookUp(motherVendorId,formContext.data.entity.getId().slice(1, -1));
				success1 = true;
			}
			else if(vendorId && vendorType == "projChildVendor"){
				getVendorLookUp(vendorId, formContext.data.entity.getId().slice(1, -1));
				success1 = true;
			}


		},
		function(error) {
			console.log(error.message);
		}
	);

	return success1;
}



//--------------Update VendorId based on Generic Mother vendor/Project Mother vendor/Generic Child vendor/Project Child vendor by vasudev on 30-01-24.
async function updateVendorId(executionContext) {
	debugger;
	try {
		var formContext = executionContext.getFormContext();

		if (formContext.data.entity.getEntityName() == "bdf_generic") {

			if (formContext.getAttribute("bdf_mothervendor").getValue()) {

				var motherVendorId = Xrm.Page.getAttribute("bdf_mothervendor").getValue()[0].id.slice(1, -1);
				//---------------------------------------------------------------------------
				getVendorLookUp(motherVendorId, formContext.data.entity.getId().slice(1,-1));

				return; // added by Sathish 8/16/2024
				//--------------------------------------------------------------------------
			}
			 if (formContext.getAttribute("bdf_mothervendor").getValue() == null || formContext.getAttribute("bdf_mothervendor").getValue() == undefined) {
				var success2 = false;
				if (formContext.getAttribute("bdf_project").getValue()) {
					 success2 = await getProjectVendor("projMotherVendor",formContext);


				}
				else{
					var alertStrings = { confirmButtonLabel: "Yes", text: `Project Value was not found!`, title: "Error" };
					var alertOptions = { height: 120, width: 260 };
					Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
						function (success) {
							console.log("Alert dialog closed");
						},
						function (error) {
							console.log(error.message);
						}
					);
				}

				if (success2 == true) {
					return;
				}
			}
			 if (formContext.getAttribute("bdf_vendor").getValue()) {

				var childVendorId = Xrm.Page.getAttribute("bdf_vendor").getValue()[0].id.slice(1, -1);
				//---------------------------------------------------------------------------
				getVendorLookUp(childVendorId, formContext.data.entity.getId().slice(1,-1));
				//--------------------------------------------------------------------------
			}
			else if(formContext.getAttribute("bdf_vendor").getValue() == null || formContext.getAttribute("bdf_vendor").getValue() == undefined){
				var success2 = false;
				if (formContext.getAttribute("bdf_project").getValue()) {
					success2 = getProjectVendor("projChildVendor", formContext);

				}
				else{
					var alertStrings = { confirmButtonLabel: "Yes", text: `Project Value was not found!`, title: "Error" };
					var alertOptions = { height: 120, width: 260 };
					Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
						function (success) {
							console.log("Alert dialog closed");
						},
						function (error) {
							console.log(error.message);
						}
					);
				}

				if (success2 == true) {
					return;
				}
			}
		}
		else if (formContext.data.entity.getEntityName() == "bdf_project") {

			try {
				var motherVendorVal = formContext.getAttribute("bdf_mothervendor").getValue();
				var childVendorVal = formContext.getAttribute("bdf_vendor").getValue();
				const results = await Xrm.WebApi.retrieveMultipleRecords("bdf_generic", `?$select=_bdf_mothervendor_value,_bdf_vendor_value&$filter=_bdf_project_value eq ${formContext.data.entity.getId().slice(1,-1)}`);

				console.log(results);

				for (let i = 0; i < results.entities.length; i++) {
					const result = results.entities[i];
					// Columns
					const _genericid = result["bdf_genericid"]; // Guid
					const _mothervendor = result["_bdf_mothervendor_value"]; // Lookup
					const bdf_mothervendor_formatted = result["_bdf_mothervendor_value@OData.Community.Display.V1.FormattedValue"];
					const bdf_mothervendor_lookuplogicalname = result["_bdf_mothervendor_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
					const _vendor = result["_bdf_vendor_value"]; // Lookup
					const bdf_vendor_formatted = result["_bdf_vendor_value@OData.Community.Display.V1.FormattedValue"];
					const bdf_vendor_lookuplogicalname = result["_bdf_vendor_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

					if ((_mothervendor == null || _mothervendor == undefined) && (motherVendorVal !== null && motherVendorVal !== undefined)) {

						await getVendorLookUp(motherVendorVal[0].id.slice(1,-1), _genericid)
					}
					else if((_vendor == null || _vendor == undefined ) && (childVendorVal !== null && childVendorVal !== undefined) ){

						await getVendorLookUp(childVendorVal[0].id.slice(1,-1), _genericid)
					}
				}
			} catch (error) {
				console.log(error.message);
			}

		}
	} catch (error) {
		var alertStrings = { confirmButtonLabel: "Yes", text: `${error.message}`, title: "Error" };
		var alertOptions = { height: 120, width: 260 };
		Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
			function (success) {
				console.log("Alert dialog closed");
			},
			function (error) {
				console.log(error.message);
			}
		);
	}
}
	*/