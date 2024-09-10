function setGenericStage(executionContext) {  //onLoad of Generic entity set Generic Stage value to Ideation if parental (Project) entity having Active stage as "Testing & Launch"
	debugger;
	try {
		var formContext = executionContext.getFormContext();
		if (formContext.getAttribute("bdf_project").getValue() && formContext.ui.getFormType() == 1) {


			var projectGuid = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);

			Xrm.WebApi.retrieveMultipleRecords("bdf_project_milestones", `?$select=_activestageid_value&$filter=_bpf_bdf_projectid_value eq '${projectGuid}'`).then(
				function success(results) {
					console.log(results);
					for (var i = 0; i < results.entities.length; i++) {
						var result = results.entities[i];
						// Columns

						var activestageid_formatted = result["_activestageid_value@OData.Community.Display.V1.FormattedValue"];

						if (activestageid_formatted == "Testing & Launch") {
							formContext.getAttribute("bdf_genericstage").setValue(1);
						}

					}
				},
				function (error) {
					console.log(error.message);
				}
			);
		}

	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}

}

function updateGlobalDropStatus(executionContext) {
	debugger;
	try {
		var formContext = executionContext.getFormContext();
		var genericId = formContext.data.entity.getId().slice(1, -1);
		var genericStage = formContext.getAttribute("bdf_genericstage").getValue();

		if (genericStage == '4' || genericStage == '5') {
			var today = new Date();
			var formattedToday = today.toISOString().split('T')[0]; // Format today's date as "YYYY-MM-DD"
			var input = { "bdf_globaldropstatus": 3, "bdf_globaldropdate": formattedToday };

			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_globaldropstatus eq null and bdf_Generic/bdf_genericid eq " + genericId).then(
				function success(data) {
					for (variant of data.entities) {
						Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
					}
				}
			);
		} else if(genericStage!=null) {
			var input = { "bdf_globaldropstatus": null, "bdf_globaldropdate": null };
			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_globaldropstatus eq 3 and bdf_Generic/bdf_genericid eq " + genericId).then(
				function success(data) {
					for (variant of data.entities) {
						Xrm.WebApi.updateRecord("cr60a_stg_article_master", variant.cr60a_stg_article_masterid, input);
					}
				}
			);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}


function setGenericBusinessProcessRules(executionContext) {
	debugger;
	var formContext = executionContext.getFormContext();
	setProjectMandatoryFields1(executionContext);
	addSoftWarning3(executionContext);
}

async function checkVANArticleGroup1(genericID) {

	var error = false;
	var data = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_Generic/bdf_genericid eq " + genericID + " and cr60a_vendorarticlenumber eq null and bdf_articletype eq 1 and bdf_globaldropstatus ne 1 ");
	if (data.entities.length > 0) {
		Xrm.Navigation.openAlertDialog({
			text: "Please fill in Vendor Article Number for all related records before proceeding."
		});
		error = true;
	}

	var data = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_Generic/bdf_genericid eq " + genericID + " and _bdf_articlegroup_value eq null and bdf_globaldropstatus ne 1");
	if (data.entities.length > 0) {
		Xrm.Navigation.openAlertDialog({
			text: "Please fill in Article Group for all related records before proceeding."
		});
		error = true;
	}
	return error;
}

async function checkVariant1(genericID, formContext) {

	var error = false;
	var data = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$orderby=bdf_outofpackagingvolume&$expand=bdf_Project($select=bdf_minorcodelookup),cr60a_ProductType&$filter=cr60a_cmstatus eq null and bdf_globaldropstatus ne 1 and bdf_Generic/bdf_genericid eq " + genericID);
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
				if((variant[fieldName] !== undefined && variant[fieldName] === null) ||
                (variant[fieldName2] !== undefined && variant[fieldName2] === null)) {
					Xrm.Navigation.openAlertDialog({
						text: "Missing Product Type related attributes. Please provide this information before proceeding."
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


//trying new code
// Global variable to store the previous value of the dropdown field
var previousDropdownValue;

// Function to capture the initial value of the dropdown field
function captureInitialDropdownValue(executionContext) {
	var formContext = executionContext.getFormContext();
	var dropdownField = formContext.getAttribute("bdf_genericstage");

	// Store the initial value
	previousDropdownValue = dropdownField.getValue();
}

// Function to handle the onchange event of the dropdown field
function handleDropdownChange(executionContext) {
	var formContext = executionContext.getFormContext();
	var genericStage = formContext.getAttribute("bdf_genericstage").getValue();
	var error = true; // Your error condition

	if (error) {
		// Revert the dropdown field value to its previous value
		formContext.getAttribute("bdf_genericstage").setValue(previousDropdownValue);
	}
}
///////

//alert user if sales text is null during stage change to Ready To Buy/Testing & Launch by vasudev on 22-03-2024
async function fieldMandatory1() {
	try {
		fieldMandatoryResult = { hasNullSalesText: false, errorMessage: '', alertHeight: 0, alertWidth: 0 };
		let articleCounts = {}; // Object to store counts for each article

		await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$select=cr60a_articleid,_bdf_generic_value,cr60a_salestext&$filter=_bdf_generic_value eq ${Xrm.Page.data.entity.getId().slice(1, -1)} and bdf_globaldropstatus ne 1`).then(
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

async function addHardStop1(executionContext) {
	debugger;
	// executionContext.getEventArgs().preventDefault();
	//addSoftWarning3(executionContext);
	let formContext = executionContext.getFormContext();
	let genericID = formContext.data.entity.getId().slice(1, -1);
	var genericStage = formContext.getAttribute("bdf_genericstage").getValue();
	let error = false;


	// When the factory is empty, it prevents the generic stage of costing and designing..... Sathish-15-04-2024

	if (genericID != null || genericID != undefined) {


		if (genericStage == '4') {

			await Xrm.WebApi.retrieveRecord("bdf_generic", "" + genericID + "", "?$expand=bdf_Project($select=_bdf_factory_value)").then(
				function success(result) {
					console.log(result);
					// Columns
					var bdf_genericid = result["bdf_genericid"]; // Guid

					// Many To One Relationships
					if (result.hasOwnProperty("bdf_Project") && result["bdf_Project"] !== null) {
						var bdf_Project_bdf_factory = result["bdf_Project"]["_bdf_factory_value"]; // Lookup
						// var bdf_Project_bdf_factory_formatted = result["bdf_Project"]["_bdf_factory_value@OData.Community.Display.V1.FormattedValue"];
						//var bdf_Project_bdf_factory_lookuplogicalname = result["bdf_Project"]["_bdf_factory_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

						if (bdf_Project_bdf_factory == undefined || bdf_Project_bdf_factory == null) {
							Xrm.Navigation.openAlertDialog({ text: "Please provide the missing factory field value in the related project before proceeding." });
							handleDropdownChange(executionContext);

						}
					}
				},
				function (error) {
					//console.log(error.message);

					Xrm.Navigation.openAlertDialog(error.message);
				}
			);

		}

	}
	//...........................................................End............................................




	if (genericStage == '6' || genericStage == '7') {

		error = await checkVariant1(genericID, formContext);

		//---------------------------------------------------
		let errorMessage = ""; // Initialize error message
		var fieldMandatoryResult = {};
		fieldMandatoryResult = await fieldMandatory1();
		error1 = fieldMandatoryResult.hasNullSalesText;

		if (error || error1) {
			handleDropdownChange(executionContext);
			//executionContext.getEventArgs().preventDefault()
		}
		// Check if any sales text is null
		if (error1) {
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
		//---------------------------------------------------
	}

	if (genericStage == '4' || genericStage == '5' || genericStage == '6' || genericStage == '7') {
		error = await checkVANArticleGroup1(genericID);
		if (error) {
			handleDropdownChange(executionContext);
			//executionContext.getEventArgs().preventDefault()
		}
	}


	if (genericStage == '6') {
		// Retrieve records from "cr60a_stg_article_master" entity
		Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", `?$select=_cr60a_productsubtype_value,_cr60a_producttype_value,bdf_setuptimeminutes,_cr60a_size_value&$filter=(_bdf_generic_value eq ${genericID} and bdf_setuptimeminutes eq null)`).then(
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

}

function addSoftWarning3(executionContext) {
	debugger;
	let formContext = executionContext.getFormContext();
	let genericStage = formContext.getAttribute("bdf_genericstage").getValue();
	if (genericStage != null) {

		if (genericStage != '1') {
			let genericID = formContext.data.entity.getId().slice(1, -1);
			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$orderby=bdf_outofpackagingvolume&$expand=bdf_Project($select=bdf_minorcodelookup),cr60a_ProductType&$filter=cr60a_cmstatus eq null and bdf_globaldropstatus ne 1 and bdf_Generic/bdf_genericid eq " + genericID).then(
				function success(data) {
					let message = '';
					let error = false;
					// Dimensions and volume checks
					if ((genericStage == '5' || genericStage == '6' || genericStage == '7')) {
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
					if (genericStage === '5' || genericStage === '6' || genericStage === '7') {
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
						if ((variant.bdf_retailprice == 0 || variant.bdf_retailprice == null) && (genericStage === '5' || genericStage === '6' || genericStage === '7')) {
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
								if ((variant[fieldName] == null)  && (genericStage == '6' || genericStage == '7')) {
									message = message + "Missing Product Type related attributes";
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
								(genericStage === '6' || genericStage === '7')) {
								message = message + "Missing Commodity / HTS Code, ";
								break;
							}
					}

					if (message.length > 0) {
						//message = message.slice(0, -2) + ".";
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

			if (genericStage != '1') {
				// Check 'bdf_draftretail' and 'bdf_draftcost' for all variants
				Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_Generic/bdf_genericid eq " + genericID).then(
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
							// setTimeout(function () {
							// 	formContext.data.refresh(true);
							// }, 1000); // 1000 milliseconds = 1 second		
						} else if (hasDraftRetailWarning) {
							formContext.ui.setFormNotification("You have pending retail to publish.", "WARNING", "SampleStageWarning");
							// setTimeout(function () {
							// 	formContext.data.refresh(true);
							// }, 1000); // 1000 milliseconds = 1 second

						} else if (hasDraftCostWarning) {
							formContext.ui.setFormNotification("You have pending cost to publish.", "WARNING", "SampleStageWarning");
							// setTimeout(function () {
							// 	formContext.data.refresh(true);
							// }, 1000);
						}
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}

		}
	}
}

// function setProjectMandatoryFields(executionContext) {
// 	debugger;

// 	var formContext = executionContext.getFormContext();
//     var genericStage = formContext.getAttribute("bdf_genericstage").getValue();
//     var projectGuid = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);

// 	if (genericStage != null && genericStage != null && genericStage != '1') {

// 		// formContext.getAttribute("bdf_vendor").setRequiredLevel("required");
// 		// formContext.getAttribute("bdf_factory").setRequiredLevel("required");
// 	}
// }

function setProjectMandatoryFields1(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();
	var genericStage = formContext.getAttribute("bdf_genericstage").getValue();
	var projectGuid = formContext.getAttribute("bdf_project").getValue();

	if (genericStage && genericStage !== '1' && projectGuid && projectGuid.length > 0) {
		var projectId = projectGuid[0].id.slice(1, -1);

		Xrm.WebApi.retrieveMultipleRecords("bdf_project", "?$filter=bdf_projectid eq " +
			projectId).then(
				function success(data) {
					console.log(data);
					if (data.entities.length > 0) {
						// Iterate through the retrieved records
						data.entities.forEach(function (record) {
							// Access fields of the retrieved record
							var vendorId = record._bdf_vendor_value;
							var factoryId = record._bdf_factory_value;

							// Check if bdf_vendor or bdf_factory is null at the project level
							if (!vendorId) {
								// Make bdf_vendor mandatory at the generic level
								formContext.getAttribute("bdf_vendor").setRequiredLevel("required");
							}

							if (!factoryId) {
								formContext.getAttribute("bdf_factory").setRequiredLevel("required");
							}
						});
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);

	}
}
