function setBusinessProcessRules(executionContext) {
	debugger;

	// Set project mandatory fields
	setProjectMandatoryFields(executionContext);
	addSoftWarning2(executionContext);

	var formContext = executionContext.getFormContext();
	formContext.data.process.addOnPreStageChange(addHardStop);
}

async function checkVANArticleGroup(projectID) {

	var error = false;
	var data = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_Project/bdf_projectid eq " + projectID + " and cr60a_vendorarticlenumber eq null and bdf_articletype eq 1");
	if (data.entities.length > 0) {
		Xrm.Navigation.openAlertDialog({
			text: "Please fill in Vendor Article Number for all related records before proceeding."
		});
		error = true;
	}

	var data = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_Project/bdf_projectid eq " + projectID + " and _bdf_articlegroup_value eq null");
	if (data.entities.length > 0) {
		Xrm.Navigation.openAlertDialog({
			text: "Please fill in Article Group for all related records before proceeding."
		});
		error = true;
	}
	return error;
}

async function checkVariant(projectID, formContext) {

	var error = false;
	var data = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$orderby=bdf_outofpackagingvolume&$expand=bdf_Project($select=bdf_minorcodelookup),cr60a_ProductType&$filter=cr60a_cmstatus eq null and bdf_Project/bdf_projectid eq " + projectID);
	for (variant of data.entities) {
		if ((variant.cr60a_generalitemcategorygroup == 'NORM') && // variant.bdf_Project.bdf_minorcodelookup == '2010' || 
			(variant.bdf_outofpackagingvolume == 0 || variant.bdf_outofpackagingvolume == null ||
				variant.bdf_outofpackagingheight == 0 || variant.bdf_outofpackagingheight == null ||
				variant.bdf_outofpackaginglength == 0 || variant.bdf_outofpackaginglength == null ||
				variant.bdf_outofpackagingweight == 0 || variant.bdf_outofpackagingweight == null ||
				variant.bdf_outofpackagingwidth == 0 || variant.bdf_outofpackagingwidth == null ||
				variant.bdf_inpackagingvolume == 0 || variant.bdf_inpackagingvolume == null ||
				variant.bdf_inpackagingheight == 0 || variant.bdf_inpackagingheight == null ||
				variant.bdf_inpackaginglength == 0 || variant.bdf_inpackaginglength == null ||
				variant.bdf_inpackagingweight == 0 || variant.bdf_inpackagingweight == null ||
				variant.bdf_inpackagingwidth == 0 || variant.bdf_inpackagingwidth == null)) {
			Xrm.Navigation.openAlertDialog({
				text: "Missing or zero Volume / Dimensions. Please provide this information before proceeding."
			});

			error = true;
			formContext.ui.setFormNotification("There are the following issues discovered: Missing or zero Volume / Dimensions. Please provide this information before proceeding", "ERROR", "ProjectWarning");
			break;
		}
	}

	// Retail Check	
	for (variant of data.entities) {
		if (variant.bdf_retailprice == 0 || variant.bdf_retailprice == null) {

			Xrm.Navigation.openAlertDialog({
				text: "Missing or zero Retail. Please provide this information before proceeding."
			});

			error = true;
			break;
		}
	}

	// Product Type related attributes check
	let missingData = false;
	for (variant of data.entities) {
		// Loop through each columns
		for (const item in variant.cr60a_ProductType) {
			if (item.startsWith("cr60a_pt") && variant.cr60a_ProductType[item] == "M") {

				fieldName = item.replace("cr60a_pt", "_cr60a_") + "_value";
				fieldName2 = item.replace("cr60a_pt", "cr60a_");
				if ((variant[fieldName] != undefined && variant[fieldName] == null) ||
					(variant[fieldName2] != undefined && variant[fieldName2] == null)) {
					Xrm.Navigation.openAlertDialog({
						text: "Missing Product Type related attributes (" + fieldName + "). Please provide this information before proceeding."
					});
					missingData = true;
					error = true;
					break;
				}
			}
		};
		if (missingData) break;
	}
	return error;
}


//Generic Stage update
async function updateGenericStage(executionContext) {
	debugger;
	var success = false;
	var formContext = executionContext.getFormContext();
	let direction = executionContext.getEventArgs().getDirection();
	var stagesData = [
		{ "stagename": "Ideation" },
		{ "stagename": "Design & Costing" },
		{ "stagename": "Sample" },
		{ "stagename": "QC & Compliance" },
		{ "stagename": "Ready To Buy" },
		{ "stagename": "Testing & Launch" }
	];

	try {
		var results = await Xrm.WebApi.retrieveMultipleRecords("bdf_generic", `?$select=bdf_genericstage&$filter=_bdf_project_value eq ${Xrm.Page.data.entity.getId().slice(1, -1)}`);
		console.log(results);

		for (var i = 0; i < results.entities.length; i++) {
			var result = results.entities[i];
			var bdf_genericid = result["bdf_genericid"];
			var bdf_genericstage = result["bdf_genericstage"];
			var bdf_genericstage_formatted = result["bdf_genericstage@OData.Community.Display.V1.FormattedValue"];
			var currentActiveStage = formContext.data.process.getActiveStage().getName();

			if (currentActiveStage.toUpperCase() == bdf_genericstage_formatted.toUpperCase()) {
				var currentIndex = stagesData.findIndex(stage => stage.stagename.toUpperCase() == currentActiveStage.toUpperCase());

				if (currentIndex !== -1 && currentIndex < stagesData.length) {
					if (direction == "Next") {
						var nextOrPrevStageName = stagesData[currentIndex + 1].stagename;
					}
					else {
						var nextOrPrevStageName = stagesData[currentIndex - 1].stagename;
					}

					var choiceValue;

					switch (nextOrPrevStageName) {
						case 'Ideation':
							choiceValue = 1;
							break;
						case 'Design & Costing':
							choiceValue = 2;
							break;
						case 'Sample':
							choiceValue = 4;
							break;
						case 'QC & Compliance':
							choiceValue = 5;
							break;
						case 'Ready To Buy':
							choiceValue = 6;
							break;
						case 'Testing & Launch':
							choiceValue = 7;
							break;
						default:
							// Handle unexpected stage name
							break;
					}

					var record = {};
					record.bdf_genericstage = choiceValue;

					var updateResult = await Xrm.WebApi.updateRecord("bdf_generic", bdf_genericid, record);
					console.log(updateResult.id);
					if (updateResult.id) {
						success = true;

					}
				}
			}
		}

		return success;

	} catch (error) {
		console.log(error.message);
	}
}

//alert user if sales text is null during stage change to Ready To Buy/Testing & Launch by vasudev on 22-03-2024
async function fieldMandatory() {
	try {
		 fieldMandatoryResult = { hasNullSalesText: false, errorMessage: '', alertHeight: 0, alertWidth: 0 };
		let articleCounts = {}; // Object to store counts for each article

		await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$select=cr60a_articleid,_bdf_generic_value,cr60a_salestext&$filter=_bdf_project_value eq ${Xrm.Page.data.entity.getId().slice(1, -1)}`).then(
			function success(results) {
				console.log(results);
				for (let i = 0; i < results.entities.length; i++) {
					var result = results.entities[i];
					// Columns
					var cr60a_stg_article_masterid = result["cr60a_stg_article_masterid"]; // Guid
					var cr60a_articleid = result["cr60a_articleid"]; // Text
					var bdf_generic = result["_bdf_generic_value"]; // Lookup
					var bdf_generic_formatted = result["_bdf_generic_value@OData.Community.Display.V1.FormattedValue"];
					var bdf_generic_lookuplogicalname = result["_bdf_generic_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
					var salestext = result["cr60a_salestext"]; // Text

					if (salestext == null) {
						fieldMandatoryResult.hasNullSalesText = true; // Set flag to true if any sales text is null
						if (!articleCounts[cr60a_articleid]) {
							articleCounts[cr60a_articleid] = 1; // Initialize count for the article
						} else {
							articleCounts[cr60a_articleid]++; // Increment count for the article
						}
					}
				}


				// If at least one sales text is null, display the alert dialog
				if (fieldMandatoryResult.hasNullSalesText) {
					// Update result object
					fieldMandatoryResult.alertHeight = 120 + (Object.keys(articleCounts).length * 20);
					fieldMandatoryResult.alertWidth = 360;

					// After looping through all records
					// errorMessage = "The following articles have missing sales text value:\n";
					errorMessage = "Articles have missing sales text value. Please fill them before proceeding...\n";
					// for (let articleId in articleCounts) {
					// 	errorMessage += `${articleId}\n`;
					// }
					fieldMandatoryResult.errorMessage = errorMessage;

				}


			},
			function (error) {
				console.log(error.message);
				
			}
		);

	} catch (error) {
		var alertStrings = { confirmButtonLabel: "Ok", text: `${error.message}`, title: "Error" };
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

	finally {
        return fieldMandatoryResult; // Return the object regardless of whether an error occurred or not
    }
}



async function addHardStop(executionContext) {
	debugger;
	executionContext.getEventArgs().preventDefault();
	addSoftWarning2(executionContext);
	let formContext = executionContext.getFormContext();
	let projectID = formContext.data.entity.getId().slice(1, -1);
	let error = false;
	let direction = executionContext.getEventArgs().getDirection();
    let factory=formContext.getAttribute("bdf_factory").getValue();
   

    // Making Factory Field Requried When stage is moving to Sample ..................................... Sathish - 12-04-2024
    
    if(formContext.data.process.getActiveStage().getName() =='Design & Costing' && direction=="Next" && factory==null){

     formContext.getAttribute("bdf_factory").setRequiredLevel("required");

	 //Xrm.Navigation.openAlertDialog({text:"Missing Factory Field Value. Please provide this information before proceeding."});

	 Xrm.Navigation.openAlertDialog({text:"Missing Factory Field Value. Please provide this information before proceeding."});
	
	}

	//....................................................End.....................................................


	if (formContext.data.process.getActiveStage().getName() == 'QC & Compliance' ||
		formContext.data.process.getActiveStage().getName() == 'Ready To Buy' ||
		formContext.data.process.getActiveStage().getName() == 'Testing & Launch') {
		error = await checkVariant(projectID, formContext);
	}


	if (formContext.data.process.getActiveStage().getName() == 'Design & Costing') {
		error = await checkVANArticleGroup(projectID);
	}

	if ((direction == 'Next' && formContext.data.process.getActiveStage().getName() == 'QC & Compliance') || formContext.data.process.getActiveStage().getName() == 'Ready To Buy' ||
		formContext.data.process.getActiveStage().getName() == 'Testing & Launch') {

		let errorMessage = ""; // Initialize error message
		var fieldMandatoryResult = {};
		fieldMandatoryResult = await fieldMandatory();
		error = fieldMandatoryResult.hasNullSalesText;
		// Check if any sales text is null
		if (error) {
			errorMessage = fieldMandatoryResult.errorMessage; // Get error message
		}

		// Show alert dialog if errorMessage is not empty
		if (errorMessage !== "") {
			// Display error message
			var alertStrings = { confirmButtonLabel: "Ok", text: errorMessage, title: "Articles with missing Sales Text" };
			var alertOptions = { height: fieldMandatoryResult.alertHeight, width: fieldMandatoryResult.alertWidth };
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

	if (direction == "Previous" && !error) {

		formContext.data.process.removeOnPreStageChange(addHardStop);
		// Call the function
		const resutedValue = await updateGenericStage(executionContext);


		formContext.data.process.movePrevious(function () {
			formContext.data.process.addOnPreStageChange(addHardStop);
		});


	}

	if (!error) {
		// Add Sample drop code


		// code added to update global drop status and date if generic is in sample or qc & compliance
		// if (
		// 	formContext.data.process.getActiveStage().getName() == 'Ideation' ||
		// 	formContext.data.process.getActiveStage().getName() == 'Design & Costing' ||
		// 	formContext.data.process.getActiveStage().getName() == 'Sample' ||
		// 	formContext.data.process.getActiveStage().getName() == 'QC & Compliance'
		// ) {
		// Retrieve related Generics records and their attributes
		Xrm.WebApi.retrieveMultipleRecords("bdf_generic", `?$select=bdf_genericid,bdf_genericstage&$filter=_bdf_project_value eq ${projectID}`).then(
			function success(results) {
				// Iterate through the retrieved records
				for (var i = 0; i < results.entities.length; i++) {
					var result = results.entities[i];

					// Retrieve attributes from the record
					var bdf_genericid = result["bdf_genericid"];
					var bdf_genericstage = result["bdf_genericstage"];
					var bdf_genericstage_formatted = result["bdf_genericstage@OData.Community.Display.V1.FormattedValue"];
					var currentActiveStage = formContext.data.process.getActiveStage().getName();

					if (bdf_genericstage != null && bdf_genericstage_formatted != currentActiveStage) {
						// Check if bdf_genericstage_formatted is "Sample" or "QC & Compliance"
						if (bdf_genericstage_formatted == "Sample" || bdf_genericstage_formatted == "QC & Compliance") {
							// Perform the specified logic
							var today = new Date();
							var formattedToday = today.toISOString().split('T')[0]; // Format today's date as "YYYY-MM-DD"
							var input = { "bdf_globaldropstatus": 3, "bdf_globaldropdate": formattedToday };

							// Update records in "cr60a_stg_article_master" entity
							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$filter=bdf_globaldropstatus eq null and bdf_Generic/bdf_genericid eq ${bdf_genericid}`).then(
								function success(data) {
									for (variant of data.entities) {
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
									}
								}
							);
						} else {
							var input = { "bdf_globaldropstatus": null, "bdf_globaldropdate": null };
							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$filter=bdf_globaldropstatus eq 3 and bdf_Generic/bdf_genericid eq ${bdf_genericid}`).then(
								function success(data) {
									for (variant of data.entities) {
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
									}
								}
							);
						}
					} else {

						// Remove Sample drop code
						if (direction == 'Next' && formContext.data.process.getActiveStage().getName() == 'QC & Compliance') {
							var input = { "bdf_globaldropstatus": null, "bdf_globaldropdate": null };
							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$filter=bdf_globaldropstatus eq 3 and bdf_Generic/bdf_genericid eq ${bdf_genericid}`).then(
								function success(data) {
									for (variant of data.entities) {
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
									}
								}
							);
						}

						//code added on 23rd jan to make drop code sample on moving back
						if (direction == 'Previous' && formContext.data.process.getActiveStage().getName() == 'Ready To Buy') {
							var today = new Date();
							var formattedToday = today.toISOString().split('T')[0]; // Format today's date as "YYYY-MM-DD"
							var input = { "bdf_globaldropstatus": 3, "bdf_globaldropdate": formattedToday };

							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$filter=bdf_globaldropstatus eq null and bdf_Generic/bdf_genericid eq ${bdf_genericid}`).then(
								function success(data) {
									for (variant of data.entities) {
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
									}
								}
							);
						}

						if (formContext.data.process.getActiveStage().getName() == 'Design & Costing') {
							var today = new Date();
							var formattedToday = today.toISOString().split('T')[0]; // Format today's date as "YYYY-MM-DD"
							var input = { "bdf_globaldropstatus": 3, "bdf_globaldropdate": formattedToday };

							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$filter=bdf_globaldropstatus eq null and bdf_Generic/bdf_genericid eq ${bdf_genericid}`).then(
								function success(data) {
									for (variant of data.entities) {
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
									}
								}
							);
						}

						//remove sample drop code
						if (direction == 'Previous' && formContext.data.process.getActiveStage().getName() == 'Sample') {
							var input = { "bdf_globaldropstatus": null, "bdf_globaldropdate": null };
							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$filter=bdf_globaldropstatus eq 3 and bdf_Generic/bdf_genericid eq ${bdf_genericid}`).then(
								function success(data) {
									for (variant of data.entities) {
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
									}
								}
							);
						}
					}


				}
			}
		);
		// }
	}


	if (formContext.data.process.getActiveStage().getName() == 'QC & Compliance') {
		// Retrieve records from "cr60a_stg_article_master" entity
		Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$select=_cr60a_productsubtype_value,_cr60a_producttype_value,bdf_setuptimeminutes,_cr60a_size_value&$filter=(_bdf_project_value eq ${projectID} and bdf_setuptimeminutes eq null)`).then(
			function success(articleMasterResults) {
				// Retrieve records from "bdf_sapsetuptime" entity
				Xrm.WebApi.retrieveMultipleRecords("bdf_sapsetuptime", "?$select=_bdf_productsubtype_value,_bdf_producttype_value,bdf_setuptimeminutes,_bdf_size_value").then(
					function success(sapSetupTimeResults) {
						// Iterate through "cr60a_stg_article_master" records
						for (var i = 0; i < articleMasterResults.entities.length; i++) {
							var articleMasterResult = articleMasterResults.entities[i];

							// Initialize highest setup time
							var highestSetupTime = -1;

							// Iterate through "bdf_sapsetuptime" records
							for (var j = 0; j < sapSetupTimeResults.entities.length; j++) {
								var sapSetupTimeResult = sapSetupTimeResults.entities[j];

								// Identify non-null fields among the specified fields
								var nonNullFields = ["producttype_value", "productsubtype_value", "size_value"].filter(
									field => articleMasterResult[`_cr60a_${field}`] !== null
								);

								// Check if there are non-null fields in articleMasterResult
								if (nonNullFields.length > 0) {
									// Check if the non-null fields in articleMasterResult match sapSetupTimeResult
									var fieldsMatch = nonNullFields.every(
										field => articleMasterResult[`_cr60a_${field}`] === sapSetupTimeResult[`_bdf_${field}`]
									);

									if (fieldsMatch) {
										// Check if the current sapSetupTimeResult has a higher setuptime
										if (sapSetupTimeResult.bdf_setuptimeminutes > highestSetupTime) {
											highestSetupTime = sapSetupTimeResult.bdf_setuptimeminutes;
										}
									}
								}
							}

							// After the inner loop, update the "cr60a_stg_article_master" record with the highest setuptime
							if (highestSetupTime !== -1) {
								// Update Variant Entity function
								updateVariantEntity(articleMasterResult, highestSetupTime);
							}
						}
					}
				);
			}
		);

		// Update Variant Entity function
		function updateVariantEntity(articleMasterResult, highestSetupTime) {
			// Assuming you have the variant entity ID, replace 'variantEntityId' with the actual ID
			var variantEntityId = articleMasterResult["cr60a_stg_article_masterid"]; // Guid

			var data = {
				"bdf_setuptimeminutes": highestSetupTime
			};

			Xrm.WebApi.updateRecord("cr60a_stg_article_master", variantEntityId, data)
		}
	}

	if (direction == "Next" && !error) {
		// executionContext.getEventArgs().preventDefault();
		formContext.data.process.removeOnPreStageChange(addHardStop);

		// Call the function
		const resutedValue = await updateGenericStage(executionContext);



		formContext.data.process.moveNext(function () {
			formContext.data.process.addOnPreStageChange(addHardStop);
		});

	}
}

//var formContext = Xrm.Page;
//formContext.data.process.addOnPreStageChange(addHardStop);

function onSave() {
	debugger;
	try {
		// Call the function after 3 seconds
		setTimeout(function () {
			formContext.data.refresh(false).then(
				function successRefreshCallback() {
					// Get the form context
					var formContext = Xrm.Page;

					// Attach the function to the addOnStageChange event
					//formContext.data.process.addOnPreStageChange(addHardStop);
				}
			);
		}, 3000);
	} catch (e) {
		alert(e.message)
	}
}

function addSoftWarning2(executionContext) {
	debugger;
	let formContext = executionContext.getFormContext();
	if (formContext.data.process.getActiveStage() != null) {

		if (formContext.data.process.getActiveStage().getName() != 'Ideation') {
			let projectID = formContext.data.entity.getId().slice(1, -1);
			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$orderby=bdf_outofpackagingvolume&$expand=bdf_Project($select=bdf_minorcodelookup),cr60a_ProductType&$filter=cr60a_cmstatus eq null and bdf_Project/bdf_projectid eq " + projectID).then(
				function success(data) {
					let message = '';
					let error = false;
					// Dimensions and volume checks
					if ((formContext.data.process.getActiveStage().getName() === 'QC & Compliance' || formContext.data.process.getActiveStage().getName() == 'Ready To Buy' || formContext.data.process.getActiveStage().getName() == 'Testing & Launch')) {
						for (variant of data.entities) {
							if ((variant.cr60a_generalitemcategorygroup == 'NORM') && // variant.bdf_Project.bdf_minorcodelookup == '2010' || 
								(variant.bdf_outofpackagingvolume == 0 || variant.bdf_outofpackagingvolume == null ||
									variant.bdf_outofpackagingheight == 0 || variant.bdf_outofpackagingheight == null ||
									variant.bdf_outofpackaginglength == 0 || variant.bdf_outofpackaginglength == null ||
									variant.bdf_outofpackagingweight == 0 || variant.bdf_outofpackagingweight == null ||  //previously this was commented out
									variant.bdf_outofpackagingwidth == 0 || variant.bdf_outofpackagingwidth == null ||
									variant.bdf_inpackagingvolume == 0 || variant.bdf_inpackagingvolume == null ||
									variant.bdf_inpackagingheight == 0 || variant.bdf_inpackagingheight == null ||
									variant.bdf_inpackaginglength == 0 || variant.bdf_inpackaginglength == null ||
									variant.bdf_inpackagingweight == 0 || variant.bdf_inpackagingweight == null ||  //previously this was commented out
									variant.bdf_inpackagingwidth == 0 || variant.bdf_inpackagingwidth == null)) {
								message = message + "Missing or zero Volume / Dimensions, ";
								error = true;
								//formContext.data.process.addOnPreStageChange(addHardStop);
								break;
							}
						}
					}

					//------------------------------------------ set notification on load of the form from QC & Complliance and later stages if any missing in/out Packaging weights by vasudev 07-12-23
					if (formContext.data.process.getActiveStage().getName() === 'QC & Compliance' || formContext.data.process.getActiveStage().getName() === 'Ready To Buy' || formContext.data.process.getActiveStage().getName() === 'Testing & Launch') {
						// Dimensions and volume checks
						for (variant of data.entities) {
							if ((variant.cr60a_generalitemcategorygroup == 'NORM') && // variant.bdf_Project.bdf_minorcodelookup == '2010' || 
								(
									variant.bdf_outofpackagingweight == 0 || variant.bdf_outofpackagingweight == null ||

									variant.bdf_inpackagingweight == 0 || variant.bdf_inpackagingweight == null)) {
								formContext.ui.setFormNotification("There are the following issues discovered: Missing or zero In/Out Packaging Weights", "ERROR", "ProjectWarning");
								//formContext.data.process.addOnPreStageChange(addHardStop);
								break;
							}
						}
					}
					//------------------------------------------

					// Retail Check	
					for (variant of data.entities) {
						if ((variant.bdf_retailprice == 0 || variant.bdf_retailprice == null) && (formContext.data.process.getActiveStage().getName() === 'QC & Compliance' || formContext.data.process.getActiveStage().getName() == 'Ready To Buy' || formContext.data.process.getActiveStage().getName() == 'Testing & Launch')) {
							message = message + "Missing or zero Retail, ";
							error = true;
							break;
						}
					}

					// Cost Check	
					for (variant of data.entities) {
						if (variant.cr60a_generalitemcategorygroup == 'NORM' && (variant.bdf_cost == 0 || variant.bdf_cost == null)) {
							message = message + "Missing or zero Cost, ";
							break;
						}
					}

					// Product Type related attributes check

					let missingData = false;
					for (variant of data.entities) {
						//if (variant && variant.cr60a_generalitemcategorygroup == 'NORM') {
						// Loop through each columns
						for (const item in variant.cr60a_ProductType) {
							if (item.startsWith("cr60a_pt") && variant.cr60a_ProductType[item] == "M") {

								fieldName = item.replace("cr60a_pt", "_cr60a_") + "_value";
								fieldName2 = item.replace("cr60a_pt", "cr60a_");
								if ((variant[fieldName] != undefined && variant[fieldName] == null) ||
									(variant[fieldName2] != undefined && variant[fieldName2] == null)) {
									message = message + "Missing Product Type related attributes (" + fieldName + "), ";
									missingData = true;
									break;
								}
							}
						};
						//}	
						if (missingData) break;

						// Commodity code check
						if (variant.cr60a_generalitemcategorygroup == 'NORM' && typeof (incoterm) != 'undefined' && incoterm && (incoterm == 'ZDP' || incoterm == 'ZFB'))
							if (variant._bdf_commoditycode_value == null &&
								(formContext.data.process.getActiveStage().getName() == 'Testing & Launch' ||
									formContext.data.process.getActiveStage().getName() == 'Ready To Buy')) {
								message = message + "Missing Commodity / HTS Code, ";
								break;
							}
					}

					if (message.length > 0) {
						message = message.slice(0, -2) + ".";
						Xrm.Navigation.openAlertDialog("There are the following issues discovered: " + message);
						if (!error) {
							//formContext.data.process.removeOnPreStageChange(addHardStop);
						}
						formContext.ui.setFormNotification("There are the following issues discovered: " + message, "ERROR", "ProjectWarning");
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);

			if (formContext.data.process.getActiveStage().getName() === 'Design & Costing' || formContext.data.process.getActiveStage().getName() === 'Sample' || formContext.data.process.getActiveStage().getName() === 'QC & Compliance' || formContext.data.process.getActiveStage().getName() === 'Ready To Buy' || formContext.data.process.getActiveStage().getName() === 'Testing & Launch') {
				// Check 'bdf_draftretail' and 'bdf_draftcost' for all variants
				Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_Project/bdf_projectid eq " + projectID).then(
					function success(data) {
						let hasDraftRetailWarning = false;
						let hasDraftCostWarning = false;

						for (variant of data.entities) {
							if (variant.bdf_draftretail === true) {
								hasDraftRetailWarning = true;
							}

							if (variant.bdf_draftcost === true) {
								hasDraftCostWarning = true;
							}

							// Exit the loop if both conditions are met
							if (hasDraftRetailWarning && hasDraftCostWarning) {
								break;
							}
						}

						// Display a form notification if needed
						if (hasDraftRetailWarning && hasDraftCostWarning) {
							formContext.ui.setFormNotification("You have pending cost and retail to publish.", "WARNING", "SampleStageWarning");
							setTimeout(function () {
								formContext.data.refresh(true);
							}, 1000); // 1000 milliseconds = 1 second		
						} else if (hasDraftRetailWarning) {
							formContext.ui.setFormNotification("You have pending retail to publish.", "WARNING", "SampleStageWarning");
							setTimeout(function () {
								formContext.data.refresh(true);
							}, 1000); // 1000 milliseconds = 1 second

						} else if (hasDraftCostWarning) {
							formContext.ui.setFormNotification("You have pending cost to publish.", "WARNING", "SampleStageWarning");
							setTimeout(function () {
								formContext.data.refresh(true);
							}, 1000);
						}
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}

			// set notification when generic is in prior stage to project
			var projectGuid = formContext.data.entity.getId().slice(1, -1);

			var stage = formContext.data.process.getActiveStage();
			var projectStageName = stage.getName();

			// Mapping of Project stages to their corresponding numbers
			var projectStageMapping = {
				"Ideation": 1,
				"Design & Costing": 2,
				"Sample": 4,
				"QC & Compliance": 5,
				"Ready To Buy": 6,
				"Testing & Launch": 7
			};

			// Check if the project is in one of the specified stages
			if (["Design & Costing", "Sample", "QC & Compliance", "Ready To Buy", "Testing & Launch"].includes(projectStageName)) {
				// Retrieve related Generics records and their Generic Stage
				Xrm.WebApi.retrieveMultipleRecords("bdf_generic", `?$select=bdf_genericstage&$filter=_bdf_project_value eq '${projectGuid}'`).then(
					function success(results) {
						// Iterate through the retrieved records
						for (var i = 0; i < results.entities.length; i++) {
							var result = results.entities[i];

							// Retrieve the Generic Stage from the record
							var genericStageNumber = result["bdf_genericstage"]; // Number

							// Check if the Generic Stage number is less than the Project Stage number
							if (genericStageNumber != null && projectStageMapping[projectStageName] != null && genericStageNumber < projectStageMapping[projectStageName]) {
								// Notify the user about Generics in a prior state to the Project
								formContext.ui.setFormNotification("You have Generics that are in a prior state to the Project", "WARNING", "GenericsNotification");
								Xrm.Navigation.openAlertDialog({
									text: "You have Generics that are in a prior state to the Project",
								});
								//message = message + "You have Generics that are in a prior state to the Project, ";
								break; // Exit the loop after notifying about the first record
							}
						}
					}
				);
			}

		}
	}
}

function setProjectMandatoryFields(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();

	if (formContext.data.process != null && formContext.data.process.getActiveStage() != null && formContext.data.process.getActiveStage().getName() != 'Ideation') {
		formContext.getAttribute("bdf_vendor").setRequiredLevel("required");
		formContext.getAttribute("bdf_factory").setRequiredLevel("required");
       
	}



    
}

//code for setting setup time on creation of new article
function setupTime(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();
	try {
		if (formContext.getAttribute("bdf_project") != null && formContext.getAttribute("bdf_project").getValue() != null) {
			projectID = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("bdf_project", projectID, "?$expand=bpf_bdf_project_bdf_project_milestones($select=_activestageid_value)").then(
				function success(data) {
					//console.log(data);
					let milestone = data.bpf_bdf_project_bdf_project_milestones[0]['_activestageid_value@OData.Community.Display.V1.FormattedValue'];

					if (['Ready To Buy', 'Testing & Launch'].includes(milestone)) {
						//code to be included
						if (formContext.getAttribute("bdf_setuptimeminutes").getValue() === null) {
							var productTypeGuid = formContext.getAttribute("cr60a_producttype").getValue() ? formContext.getAttribute("cr60a_producttype").getValue()[0].id.slice(1, -1) : null;
							var productSubTypeGuid = formContext.getAttribute("cr60a_productsubtype").getValue() ? formContext.getAttribute("cr60a_productsubtype").getValue()[0].id.slice(1, -1) : null;
							var sizeGuid = formContext.getAttribute("cr60a_size").getValue() ? formContext.getAttribute("cr60a_size").getValue()[0].id.slice(1, -1) : null;

							try {
								Xrm.WebApi.retrieveMultipleRecords("bdf_sapsetuptime", `?$filter=_bdf_producttype_value eq ${productTypeGuid} and _bdf_productsubtype_value eq ${productSubTypeGuid} and _bdf_size_value eq ${sizeGuid}&$select=bdf_setuptimeminutes`).then(
									function success(data) {
										// Initialize highest setup time
										var highestSetupTime = -1;

										for (var i = 0; i < data.entities.length; i++) {
											var sapSetupTimeResult = data.entities[i];

											// Check if the current sapSetupTimeResult has a higher setuptime
											if (sapSetupTimeResult.bdf_setuptimeminutes > highestSetupTime) {
												highestSetupTime = sapSetupTimeResult.bdf_setuptimeminutes;
											}
										}
										if (highestSetupTime !== -1) {
											// Assuming you have the article entity ID, replace 'articleEntityId' with the actual ID
											//var articleEntityId = formContext.data.entity.getId().slice(1, -1); // Guid

											// Set the attribute value using setAttribute
											formContext.getAttribute("bdf_setuptimeminutes").setValue(highestSetupTime);

										}
									},
									function (error) {
										Xrm.Utility.alertDialog(error.message);
									}
								);
							} catch (e) {
								Xrm.Utility.alertDialog(e.message);
							}
						}
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}
	} catch (e) {
		Xrm.Utility.alertDialog(e.message);
	}
}

//------------------------------------------------
function disableSampleOption1(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();

	try {
		// Get references to the fields
		var articleTypeField = formContext.getAttribute("bdf_articletype").getValue();
		var globalDropStatusField = formContext.getAttribute("bdf_globaldropstatus");
		var selectedValue = globalDropStatusField.getValue();

		if (articleTypeField == 2 || articleTypeField == 1 || articleTypeField == 3) {
			var sampleValue = 3; // The actual value of "sample"

			var initialSelectedValue = globalDropStatusField.getInitialValue();

			if (selectedValue === sampleValue && articleTypeField == 2 /*package*/) {

				globalDropStatusField.setValue(initialSelectedValue);

				// Use Xrm.Utility.confirmDialog to show a message
				var confirmStrings = {
					title: "Sample Option Selected",
					text: "Package Cannot be 'Sample'.",
					confirmButtonLabel: "OK"
				};

				var confirmOptions = {
					height: 200,
					width: 450
				};

				Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(function (success) {
					//            if (success.confirmed)  // Set the value to null
					//                globalDropStatusField.setValue(null);
					//            else  // Set the value to null
					//                globalDropStatusField.setValue(null);
				});
			}

			else if (selectedValue === 1) { //Dropped

				// Condition when "bdf_globaldropstatus" is equal to 1
				var entityId = formContext.data.entity.getId(); // Get the entity record's ID
				var entityLogicalName = formContext.data.entity.getEntityName(); // Get the entity logical name

				// Define the values to update
				var data = {
					"bdf_onlineindicator": false,
					"bdf_globaldropdate": new Date().toISOString(),
					"bdf_rptype": 1,
					"bdf_planneddeliverytimeindays": 999,
					"bdf_grprocessingtime": 999 // onChange of global drop status, default Gr Processing Time to 999 
				};

				// Make the Dataverse Web API update request
				Xrm.WebApi.updateRecord(entityLogicalName, entityId, data).then(
					function success(result) {
						//-------------------------------- update Article Dc GR Processing Time to 999 when Article Globally Dropped by vasudev on 08-01-23
						Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$select=bdf_grprocessingtime,bdf_dc&$filter=_bdf_article_value eq ${entityId}`).then(
							async function success(results) {
								console.log(results);
								for (var i = 0; i < results.entities.length; i++) {
									var result = results.entities[i];
									// Columns
									var bdf_articledcid = result["bdf_articledcid"]; // Guid
									var dccodeValue = results.entities[i].bdf_dc;
									var record = {};
									record.bdf_grprocessingtime = 999; // Whole Number
									// Check if dccode is not equal to 3220 before updating
									//if (dccodeValue !== "3220") {
									await Xrm.WebApi.updateRecord("bdf_articledc", bdf_articledcid, record).then(
										function success(result) {
											var updatedId = result.id;
											console.log(updatedId);
											formContext.data.refresh();
										},
										function (error) {
											console.log(error.message);
										}
									);
									//}
								}
							},
							function (error) {
								console.log(error.message);
							}
						);
						//--------------------------------
						formContext.data.refresh(true);
					}
				);
			}
			else if (selectedValue === 3 || selectedValue == null || selectedValue == undefined) {
				// Condition when "bdf_globaldropstatus" is equal to 3
				var entityId = formContext.data.entity.getId(); // Get the entity record's ID
				var entityLogicalName = formContext.data.entity.getEntityName(); // Get the entity logical name

				// Define the value to update bdf_globaldropdate
				var dataObj = {
					//"bdf_globaldropdate": new Date().toISOString(),
					"bdf_grprocessingtime": 6 // onChange of global drop status(globally undropped), default Gr Processing Time to 6
				};

				if (selectedValue === 3) {
					dataObj["bdf_globaldropdate"] = new Date().toISOString();
				}
				else if (selectedValue == null || selectedValue == undefined) {
					dataObj["bdf_globaldropdate"] = null;
					var specialOrderInd = formContext.getAttribute("cr60a_specialorderindicator"); // Replace with the actual field name
					if (specialOrderInd != null && specialOrderInd.getValue() == true) {
						// Set the value of rptype to 1
						dataObj["bdf_rptype"] = 2;
					}
				}

				//-------------------------------------------------------------- when article is globally undropped default Planned Del Time to 90 or 180 based on incoterm by vasudev 22-11-23
				var projectID;
				Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", entityId, "?$select=_bdf_project_value").then(
					function success(result) {
						//console.log(result);
						// Columns
						var cr60a_stg_article_masterid = result["cr60a_stg_article_masterid"]; // Guid
						projectID = result["_bdf_project_value"]; // Lookup
						var bdf_project_formatted = result["_bdf_project_value@OData.Community.Display.V1.FormattedValue"];
						var bdf_project_lookuplogicalname = result["_bdf_project_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

						// Inco term from project
						Xrm.WebApi.retrieveRecord("bdf_project", projectID, "?$expand=bdf_Vendor").then(
							function success(data) {
								if (data.bdf_Vendor != null) {
									incoterm = data.bdf_Vendor['bdf_incoterm@OData.Community.Display.V1.FormattedValue'];
									if (incoterm == 'ZFB' || incoterm == 'ZDP' || incoterm == 'ZLD')
										//formContext.getAttribute("bdf_planneddeliverytimeindays").setValue(180);
										dataObj["bdf_planneddeliverytimeindays"] = 180;
									else
										//formContext.getAttribute("bdf_planneddeliverytimeindays").setValue(90);
										dataObj["bdf_planneddeliverytimeindays"] = 90;

									// Make the Dataverse Web API update request
									Xrm.WebApi.updateRecord(entityLogicalName, entityId, dataObj).then(
										function success(result) {
											//-------------------------------- update Article Dc GR Processing Time to 6 when Article Globally Un Dropped and DC Drop code should not be Dropped by vasudev on 08-01-23
											Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$select=bdf_dropcode,bdf_dc&$filter=_bdf_article_value eq ${entityId}`).then(
												async function success(results) {
													console.log(results);
													for (var i = 0; i < results.entities.length; i++) {
														var result = results.entities[i];
														// Columns
														var bdf_articledcid = result["bdf_articledcid"]; // Guid
														var bdf_dropcodeVal = result["bdf_dropcode"]; // Choice
														var dccodeValue = results.entities[i].bdf_dc;
														var record = {};
														record.bdf_grprocessingtime = 6; // Whole Number


														// Check if dccode is not equal to 3220 before updating
														if (bdf_dropcodeVal != 1) {
															await Xrm.WebApi.updateRecord("bdf_articledc", bdf_articledcid, record).then(
																function success(result) {
																	var updatedId = result.id;
																	console.log(updatedId);
																	formContext.data.refresh();
																},
																function (error) {
																	console.log(error.message);
																}
															);
														}
													}
												},
												function (error) {
													console.log(error.message);
												}
											);
											//--------------------------------
											// Optionally, refresh the form to see the updated data
											//formContext.data.entity.save();
											formContext.data.refresh(true);
										}
									);

								}
							},
							function (error) {
								Xrm.Utility.alertDialog(error.message);
							}
						);
					}
				);




				//--------------------------------------------------------------


			}

			//			else if( selectedValue == null || selectedValue == undefined) {
			//				formContext.getAttribute("bdf_globaldropdate").setValue(null);
			//				formContext.data.refresh(true);
			//			}
		}
	} catch (error) {
		alert(error.message);
	}
}

//-----------------------------------------------------------------------------------
function nestedSubgridDCDropCode(executionContext) {
	debugger;
	try {
		var formContext = executionContext.getFormContext();
		var dropCodeValue = formContext.getAttribute("bdf_dropcode").getValue();

		if (dropCodeValue === 1 || dropCodeValue === 3) {
			formContext.getAttribute("bdf_dropdate").setValue(new Date());
			if (dropCodeValue === 1) {
				formContext.getAttribute("bdf_grprocessingtime").setValue(999);
			}
			else if (dropCodeValue === 3) {
				formContext.getAttribute("bdf_grprocessingtime").setValue(6);
			}

		} else if (dropCodeValue === null) {
			formContext.getAttribute("bdf_dropdate").setValue(null);
			formContext.getAttribute("bdf_grprocessingtime").setValue(6);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}


//-------------------------------------------------------------------------------------


function checkCharacterLimit() {
	debugger;
	var maxCharacters = 40;
	var field = Xrm.Page.getAttribute("cr60a_salestext");

	if (field.getValue() && field.getValue().length > maxCharacters) {
		// Display a field-level notification as an error message
		field.controls.forEach(function (control) {
			control.setNotification("The maximum character limit for Sales Text is " + maxCharacters + " characters.");
		});

		// Prevent saving the record
		Xrm.Page.data.entity.addOnSave(preventSave);
	} else {
		// Clear any existing field-level notifications
		field.controls.forEach(function (control) {
			control.clearNotification();
		});

		// Allow saving the record
		Xrm.Page.data.entity.removeOnSave(preventSave);
	}
}

function preventSave(executionContext) {
	// Prevent saving the record
	executionContext.getEventArgs().preventDefault();
}


//------------------------------------------------------
//onSave of Form in Family (Group) Entity
function onChangeFamilycode(executionContext) {
	debugger;

	try {
		var count = 0;

		var formContext = executionContext.getFormContext();
		// Replace "field_name" with the actual name of the field you want to monitor
		var familycode = formContext.getAttribute("bdf_familycode");
		var familyname = formContext.getAttribute("bdf_familyname");
		var enityType = formContext.data.entity.getEntityName() + "s";
		var guidValue = formContext.data.entity.getId().slice(1, -1);



		if (familycode && guidValue) {
			// Attach a change event handler to the field

			// Get the current field value
			var familygroupcode = familycode.getValue();
			var familyname1 = familyname.getValue();

			//check wheather the provide family code and family name are unique or not before proceeding to update all child records.
			Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familycode,bdf_familyname&$filter=bdf_familycode eq '${familygroupcode}'`).then(
				function success(results) {
					//console.log(results);
					if (results.entities.length === 0) {
						updateRelatedRecords();
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);

			Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familycode,bdf_familyname&$filter=bdf_familyname eq '${familyname1}'`).then(
				function success(results) {
					if (results.entities.length === 0) {
						console.log("family code is unique");
						updateRelatedRecords();
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				});

			function updateRelatedRecords() {
				// Define your FetchXML query with the GUID value
				var fetchXml = `<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
                <entity name="bdf_generic">
                    <attribute name="bdf_genericid" />
                    <attribute name='bdf_familygroup' />
                    <attribute name="bdf_genericname" />
                    <attribute name="createdon" />
                    <order attribute="bdf_genericname" descending="false" />
                    <filter type="and">
                        <condition attribute="bdf_familygroup" operator="eq" value="${guidValue}" />
                    </filter>
                </entity>
            </fetch>`;

				Xrm.WebApi.retrieveMultipleRecords("bdf_generic", "?fetchXml=" + encodeURIComponent(fetchXml))
					.then(function (results) {
						if (results.entities.length > 0) {
							// Loop through the related records and update the desired field
							for (var i = 0; i < results.entities.length; i++) {
								var relatedRecord = results.entities[i];

								var inputData = {}
								// Update the related record with the new field value from the parent entity
								inputData["bdf_familygroupcode"] = familygroupcode; // Replace "new_field_name" with the name of the field you want to update
								inputData["bdf_familyname"] = familyname1;

								inputData["bdf_FamilyGroup@odata.bind"] = "/" + enityType + "(" + guidValue + ")";
								Xrm.WebApi.updateRecord("bdf_generic", relatedRecord.bdf_genericid, inputData)
									.then(function () {

										count += 1

										if (count == results.entities.length) {

											//Xrm.Utility.alertDialog("Related Generic Records updated successfully");



										}
										// Update successful
									}, function (error) {
										// Handle update error
										Xrm.Utility.alertDialog(error.message);

									});
							}


						}
					}, function (error) {
						// Handle fetch error
						Xrm.Utility.alertDialog(error.message);
					});
			}
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

//----------------------------------------------------------

function onLoadAttachEvent(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();
	formContext.data.entity.addOnSave(toCheckUniqueFamilyName);

}
//-------------------------------------------------
//on save of generic form to check weather user provided both code and name are unique or not if code is unique and not name then providing user an error popup and also if both are unique used to create a new family group
//on save of generic form to check weather user provided both code and name are unique or not if code is unique and not name then providing user an error popup and also if both are unique used to create a new family group
function toCheckUniqueFamilyName(executionContext) {
	debugger;
	try {


		var formContext = executionContext.getFormContext();

		if (formContext.ui.getFormType() == 1) {
			return;
		}

		executionContext.getEventArgs().preventDefault(); // Remove the save handler


		//Xrm.Page.data.entity.addOnSave(preventSave); //prevent form from saving


		formContext.data.entity.removeOnSave(toCheckUniqueFamilyName);

		var familygroupcode = formContext.getAttribute("bdf_familygroupcode");

		var familyname = formContext.getAttribute("bdf_familyname");

		if (familygroupcode && familyname) {

			familygroupcode1 = familygroupcode.getValue();
			familyname1 = familyname.getValue();

			// Function to properly escape single quotes in the variable value
			function escapeSingleQuotes(value) {
				if (value !== null) {
					return value.replace(/'/g, "''");
				}

			}

			// Escape single quotes in familyname1
			var escapedFamilyName = escapeSingleQuotes(familyname1);
			var escapedfamilygroupcode = escapeSingleQuotes(familygroupcode1);

			// var fetchXml = `<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
			// 				<entity name='bdf_familygroup'>
			// 					<attribute name='bdf_familygroupid' />
			// 					<attribute name='bdf_familyname' />
			// 					<attribute name='bdf_familycode' />
			// 					<attribute name='bdf_projectcollection' />
			// 					<order attribute='bdf_familyname' descending='false' />
			// 					<filter type='and'>
			// 					<condition attribute='bdf_familycode' operator='eq' value='${escapedfamilygroupcode}' />
			// 					</filter>
			// 				</entity>
			// 				</fetch>`;

			Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familygroupid,_bdf_projectcollection_value,bdf_familycode,bdf_familyname&$filter=bdf_familycode eq '${escapedfamilygroupcode}'`)
				.then(function (result) {
					if (result.entities.length == 0) {  //if user entered unique family code

						//-------------------------------------------------

						// Now use encodedFamilyName in your fetch query
						// var fetchXml2 = `<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
						// 		<entity name='bdf_familygroup'>
						// 			<attribute name='bdf_familygroupid' />
						// 			<attribute name='bdf_familyname' />
						// 			<attribute name='bdf_familycode' />
						// 			<attribute name='bdf_projectcollection' />
						// 			<filter type='and'>
						// 				<condition attribute='bdf_familyname' operator='eq' value='${escapedFamilyName}' />
						// 			</filter>
						// 		</entity>
						// 	</fetch>`;

						// Use fetchQuery as needed in your code


						Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familygroupid,_bdf_projectcollection_value,bdf_familycode,bdf_familyname&$filter=bdf_familyname eq '${escapedFamilyName}'`).then(function (result2) {
							if (result2.entities.length > 0) {
								// Records found with familyname1, show alert message and prevent save
								var familyCode = result2.entities[0]["bdf_familycode"];
								//formContext.getAttribute('bdf_familygroupcode').setValue(familyCode);

								//--------------------------------------------------- whenever user enters unique family code but not unique family name show popup and reset family code to its previous value by vasudev 21-11-23
								var record = {};
								record.bdf_familygroupcode = familyCode; // Text

								if (formContext.data.entity.getId().slice(1, -1) != '' && formContext.data.entity.getId().slice(1, -1) != null && formContext.data.entity.getId().slice(1, -1) !== undefined) {
									Xrm.WebApi.updateRecord("bdf_generic", formContext.data.entity.getId().slice(1, -1), record).then(
										function success(result) {
											var updatedId = result.id;
											Xrm.Utility.alertDialog("Provide a unique family name.", function () {
												// This function will be called when the user closes the alert dialog
												// You can perform additional actions here if needed

												// Refresh the entire form
												Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));

												// If using Unified Interface and the form is opened from a grid, you can also refresh the parent grid
												//Xrm.Utility.refreshParentGrid();
											});
											//console.log(updatedId);
										}
									).catch(function (error) {
										//Xrm.Utility.alertDialog(error.message);
										//formContext.data.refresh();

										var alertStrings = { confirmButtonLabel: "Yes", text: `${error.message}`, title: "Error" };
										var alertOptions = { height: 120, width: 260 };
										Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
											function (success) {
												Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
												console.log("Alert dialog closed");
											},
											function (error) {
												Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
											}
										);
									}
									);
								}
								else {
									// Xrm.Utility.alertDialog("Provide a unique family name.");
									// formContext.data.refresh();

									var alertStrings = { confirmButtonLabel: "Yes", text: "Provide a unique family name.", title: "Error" };
									var alertOptions = { height: 120, width: 260 };
									Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
										function (success) {
											Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
											console.log("Alert dialog closed");
										},
										function (error) {
											Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
										}
									);
								}

								//---------------------------------------------------
								// Xrm.Page.data.entity.addOnSave(preventSave);

							}

							else {

								//console.log("data saved");
								//------------------------------------  code available on bdf_load_family_code on save event

								// let formContext = executionContext.getFormContext();

								if (formContext.getAttribute('bdf_familygroupcode').getValue() != null &&
									formContext.getAttribute('bdf_familyname').getValue() != null) {
									let input = {
										"bdf_familycode": formContext.getAttribute('bdf_familygroupcode').getValue().toUpperCase(),
										"bdf_familyname": formContext.getAttribute('bdf_familyname').getValue().toUpperCase(),
									}

									var projectId = formContext.getAttribute('bdf_project').getValue()[0].id.slice(1, -1);

									Xrm.WebApi.retrieveRecord("bdf_project", projectId, "?$select=_bdf_collection_value").then(
										function success(result) {
											//console.log(result);
											// Columns
											var familyGroupGuidValue = result["_bdf_collection_value"];
											input["bdf_ProjectCollection@odata.bind"] = "/" + "bdf_familygroups" + "(" + familyGroupGuidValue + ")";
											var bdf_collection = result["_bdf_collection_value"]; // Lookup

											Xrm.WebApi.createRecord("bdf_familygroup", input).then(
												async function success(result) {
													familyId = result.id;
													await Xrm.Page.data.entity.save();
													//----------------------------------------------------- After creating a new record in the "familygroup" entity, set the family group lookup on the generic entity record to establish and maintain the relationship by vasudev 21-11-23.
													var record = {};
													record["bdf_FamilyGroup@odata.bind"] = `/bdf_familygroups(${familyId})`; // Lookup

													Xrm.WebApi.updateRecord("bdf_generic", formContext.data.entity.getId().slice(1, -1), record).then(
														function success(result) {
															var updatedId = result.id; // The reason to choose an API method for updating instead of using formContext.getAttribute().setValue() is that it provides flexibility in saving the record without triggering the onSave event again.
															//console.log(updatedId);
															// Refresh the entire form
															Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
														}
													);

													// var lookup = new Array();
													// lookup[0] = new Object;
													//	lookup[0].id = result.id;
													//	lookup[0].name = formContext.getAttribute('bdf_familyname').getValue().toUpperCase();
													//	lookup[0].entityType = "bdf_familygroup";
													//	formContext.getAttribute("bdf_familygroup").setValue(lookup);

													//-----------------------------------------------------
													//Xrm.Page.data.entity.removeOnSave(preventSave);
													//formContext.data.refresh(true);
												},
												function (error) {
													if (error.title != 'Duplicate Record')
														Xrm.Utility.alertDialog(error.message);
												}
											);

										}
									);

								}


							}

						}).catch(function (error) {
							//Xrm.Utility.alertDialog(error.message);

							var alertStrings = { confirmButtonLabel: "Yes", text: `${error.message}`, title: "Error" };
							var alertOptions = { height: 120, width: 260 };
							Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
								function (success) {
									Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
									console.log("Alert dialog closed");
								},
								function (error) {
									Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
								}
							);
						}
						)
						//----------------------------------------------

					}

					else if (result.entities.length > 0 && formContext.getAttribute("bdf_familygroup").getValue()) {

						// var fetchXml2 = `<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
						// 	<entity name='bdf_familygroup'>
						// 		<attribute name='bdf_familygroupid' />
						// 		<attribute name='bdf_familyname' />
						// 		<attribute name='bdf_familycode' />
						// 		<attribute name='bdf_projectcollection' />
						// 		<order attribute='bdf_familyname' descending='false' />
						// 		<filter type='and'>
						// 		<condition attribute='bdf_familyname' operator='eq' value='${escapedFamilyName}' />
						// 		</filter>
						// 	</entity>
						// 	</fetch>`;

						Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familygroupid,_bdf_projectcollection_value,bdf_familycode,bdf_familyname&$filter=bdf_familyname eq '${escapedFamilyName}'`).
							then(function (result2) {
								if (result2) {
									if (familyname1 != formContext.getAttribute("bdf_familygroup").getValue()[0].name && result2.entities.length > 0) {
										var updatedfamilyname = result.entities[0]["bdf_familyname"];
										formContext.getAttribute("bdf_familyname").setValue(updatedfamilyname);
										//Xrm.Page.data.entity.addOnSave(preventSave);

										var alertStrings = { confirmButtonLabel: "Yes", text: "Provided family name already exists please provide an unique one..", title: "Error" };
										var alertOptions = { height: 120, width: 260 };
										Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
											function (success) {
												Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
												console.log("Alert dialog closed");
											},
											function (error) {
												Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
											}
										);

									}

									else if (familyname1 != formContext.getAttribute("bdf_familygroup").getValue()[0].name && result2.entities.length == 0) {


										var data =
										{
											"bdf_familyname": familyname1
										}
										//updating family name to family Group entity
										Xrm.WebApi.updateRecord("bdf_familygroup", result.entities[0]["bdf_familygroupid"], data).then(
											function success(result) {


												Xrm.WebApi.retrieveRecord("bdf_familygroup", result.id, "?$select=bdf_familyname").then(
													function success(result1) {

														// Columns

														var updatedfamilyname = result1["bdf_familyname"]; // Text

														//may be need to update lookup value
														var lookupValue = new Array();
														lookupValue[0] = new Object();
														lookupValue[0].id = result1.bdf_familygroupid;
														lookupValue[0].name = updatedfamilyname;
														lookupValue[0].entityType = "bdf_familygroup";
														formContext.getAttribute("bdf_familygroup").setValue(lookupValue);
														formContext.getAttribute("bdf_familyname").setValue(updatedfamilyname);
														//formContext.data.entity.save();
														formContext.data.refresh(true);
														formContext.data.entity.addOnPostSave(function () {
															Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
														});

														//Xrm.Page.data.entity.removeOnSave(preventSave); // allow saving
													}
												);
												//console.log("updated successfully");
											},
											function (error) {
												Xrm.Utility.alertDialog("Provide unique family name");
											}
										);
									}

									else if (result2.entities.length > 0 && familyname1 == formContext.getAttribute("bdf_familygroup").getValue()[0].name) {

										var fetchedFamilyName = result.entities[0]["bdf_familyname"]
										formContext.getAttribute("bdf_familyname").setValue(fetchedFamilyName);
										var lookupValue = new Array();
										lookupValue[0] = new Object();
										lookupValue[0].id = result.entities[0]["bdf_familygroupid"];
										lookupValue[0].name = fetchedFamilyName;
										lookupValue[0].entityType = "bdf_familygroup";
										formContext.getAttribute("bdf_familygroup").setValue(lookupValue);
										//formContext.data.entity.save();
										formContext.data.refresh(true).then(
											function success() {
												Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), Xrm.Page.data.entity.getId().slice(1, -1));
											},
											function (error) {
												formContext.data.refresh();
											}
										);

										//Xrm.Page.data.entity.removeOnSave(preventSave);

									}

								}
							}).catch(function (error) {
								Xrm.Utility.alertDialog(error.message);


							})


					}


				}).catch(function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
				)


		}


	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}


//------------------------------------------------ onChange of family group code in generic entity

function updateGenericCreateFamilyGroup(executionContext) {
	debugger;
	try {

		var formContext = executionContext.getFormContext();
		if (formContext.ui.getFormType() == 1) {
			var familygroupcode = formContext.getAttribute("bdf_familygroupcode");
			if (familygroupcode) {
				familygroupcode1 = familygroupcode.getValue();

				Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familycode,bdf_familyname&$filter=bdf_familycode eq '${familygroupcode1}'`).then(
					function success(results) {
						//console.log(results);
						if (results.entities.length > 0) {
							//----------------------------- check whether Provided code already exits or not in Generic entity

							Xrm.WebApi.retrieveMultipleRecords("bdf_generic", `?$select=bdf_familygroupcode,bdf_familyname&$filter=bdf_familygroupcode eq '${familygroupcode1}'`).then(
								function success(result) {
									//console.log(result);
									if (result.entities.length > 0) {
										// for (var i = 0; i < results.entities.length; i++) {
										// 	var result = results.entities[i];
										// 	// Columns
										// 	var bdf_genericid = result["bdf_genericid"]; // Guid
										// 	var bdf_familygroupcode = result["bdf_familygroupcode"]; // Text
										// 	var bdf_familyname = result["bdf_familyname"]; // Text
										// }
										formContext.getAttribute("bdf_familyname").setValue(null);
										Xrm.Utility.alertDialog(`Provided Family code ${familygroupcode1} already exists in Generic Entity.`)
									}

									else {
										var result = results.entities[0];
										// Columns

										var familyname = result["bdf_familyname"]; // Text
										formContext.getAttribute("bdf_familyname").setValue(familyname);

										var lookupValue = new Array();
										lookupValue[0] = new Object();
										lookupValue[0].id = result["bdf_familygroupid"];
										lookupValue[0].name = familyname;
										lookupValue[0].entityType = "bdf_familygroup";
										formContext.getAttribute("bdf_familygroup").setValue(lookupValue);
									}
								}
							);
							//-----------------------------
						}

						else {
							formContext.getAttribute("bdf_familyname").setRequiredLevel("required");
							formContext.getAttribute("bdf_familyname").setValue(null);

							//formContext.getAttribute("bdf_familyname").addOnChange(checkUniqueFamilyName);
						}
					}
				);
			}
		}
	}
	catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}
//------------------------------------------------ onChange of family group name in generic entity

function checkUniqueFamilyName(executionContext) {
	debugger;
	try {

		var formContext = executionContext.getFormContext();
		if (formContext.ui.getFormType() == 1) {
			var famName = formContext.getAttribute("bdf_familyname").getValue();
			// Function to properly escape single quotes in the variable value
			function escapeSingleQuotes(value) {
				if (value !== null) {
					return value.replace(/'/g, "''");
				}
			}

			// Escape single quotes in familyname1
			var escapedFamilyName = escapeSingleQuotes(famName);
			Xrm.WebApi.retrieveMultipleRecords("bdf_familygroup", `?$select=bdf_familycode,bdf_familyname&$filter=bdf_familyname eq '${escapedFamilyName}'`).then(
				function success(results) {

					if (results.entities.length > 0) {

						formContext.getAttribute("bdf_familyname").setValue(null); //it will prevent form from saving if not then the form getting saved.
						Xrm.Utility.alertDialog(`Provide an unique family name.`);

					}

					else {
						Xrm.WebApi.retrieveMultipleRecords("bdf_generic", `?$select=bdf_familygroupcode,bdf_familyname&$filter=bdf_familyname eq '${escapedFamilyName}'`).then(
							function success(results) {
								if (results.entities.length > 0) {


									Xrm.Utility.alertDialog(`Provided Family code ${famName} already exists in Generic Entity.`);
								}

								else {
									let input = {
										"bdf_familycode": formContext.getAttribute('bdf_familygroupcode').getValue().toUpperCase(),
										"bdf_familyname": formContext.getAttribute('bdf_familyname').getValue().toUpperCase(),
									}

									var projectId = formContext.getAttribute('bdf_project').getValue()[0].id.slice(1, -1);

									Xrm.WebApi.retrieveRecord("bdf_project", projectId, "?$select=_bdf_collection_value").then(
										function success(result) {
											//console.log(result);
											// Columns
											var familyGroupGuidValue = result["_bdf_collection_value"];
											if (familyGroupGuidValue) {
												input["bdf_ProjectCollection@odata.bind"] = "/" + "bdf_familygroups" + "(" + familyGroupGuidValue + ")";
											}
											var bdf_collection = result["_bdf_collection_value"]; // Lookup

											Xrm.WebApi.createRecord("bdf_familygroup", input).then(
												function success(result) {
													var lookup = new Array();
													lookup[0] = new Object;
													lookup[0].id = result.id;
													lookup[0].name = formContext.getAttribute('bdf_familyname').getValue().toUpperCase();
													lookup[0].entityType = "bdf_familygroup";
													formContext.getAttribute("bdf_familygroup").setValue(lookup);

													//Xrm.Page.data.entity.removeOnSave(preventSave);
													//formContext.data.refresh(true);
												},
												function (error) {
													if (error.title != 'Duplicate Record')
														Xrm.Utility.alertDialog(error.message);
												}
											);
										}
									);
								}
							}
						);
					}
				}
			);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}