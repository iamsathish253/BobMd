async function updateVariantData(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();
	updateSizeName(formContext);
	updateArticleID(formContext);


	let formType = formContext.ui.getFormType();
	let bdf_globaldropstatus1; // Declare the variable bdf_globaldropstatus1

	if (formType !== 1) {

		let variantGuid = formContext.data.entity.getId().slice(1, -1);
		// Retrieving global drop status from parent  .............. Added by Sathish .. Date:18-04-2024
		await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", "" + variantGuid + "", "?$select=bdf_globaldropstatus").then(
			function success(result) {
				console.log(result);
				var bdf_globaldropstatus = result["bdf_globaldropstatus"];
				bdf_globaldropstatus1 = bdf_globaldropstatus;
			},
			function (error) {
				Xrm.Navigation.openAlertDialog(error.message)
			}
		);

	} else if (formType === 1) {
		bdf_globaldropstatus1 = formContext.getAttribute("bdf_globaldropstatus").getValue();
	}

	//formContext.getAttribute("bdf_globaldropstatus").getValue()

	//--------------------------------------------------------------------------------- Set the Global Drop Status and Global Drop Date during the creation of a new variant when the project is in the Sample Stage, by Vasudev, 08-12-23
	if (formContext.getAttribute("bdf_project") && formContext.getAttribute("bdf_project").getValue() != null && bdf_globaldropstatus1 != 1) {

		var projectID = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);

		Xrm.WebApi.retrieveMultipleRecords("bdf_project_milestones", `?$select=_activestageid_value&$filter=_bpf_bdf_projectid_value eq ${projectID}`).then(
			function success(results) {
				console.log(results);
				for (var i = 0; i < results.entities.length; i++) {
					var result = results.entities[i];
					// Columns
					var businessprocessflowinstanceid = result["businessprocessflowinstanceid"]; // Guid
					var activestageid = result["_activestageid_value"]; // Lookup
					var activestageid_formatted = result["_activestageid_value@OData.Community.Display.V1.FormattedValue"]; //Active Stage name
					var activestageid_lookuplogicalname = result["_activestageid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

					if (activestageid_formatted !== null && activestageid_formatted !== undefined && activestageid_formatted == "Sample" && bdf_globaldropstatus1 == null) {
						formContext.data.entity.addOnPostSave(function () {
							debugger;
							if (formContext.getAttribute("bdf_globaldropstatus").getValue() != 1) {

								console.log(formContext.data.entity.getId().slice(1, -1));
								var varId = formContext.data.entity.getId().slice(1, -1);
								var record = {};
								record.bdf_globaldropstatus = 3; // Choice
								record.bdf_globaldropdate = new Date().toISOString(); // Date Time

								Xrm.WebApi.updateRecord("cr60a_stg_article_master", varId, record).then(
									function success(result) {
										var updatedId = result.id;
										console.log(updatedId);
									},
									function (error) {
										Xrm.Navigation.openAlertDialog(error.message)
									}
								);

							}
						});
					}
				}
			},
			function (error) {
				Xrm.Navigation.openAlertDialog(error.message);
			}
		);
	}
	//---------------------------------------------------------------------------------

	// Cleansing Status
	if (formContext.getAttribute("cr60a_producttype") && formContext.getAttribute("cr60a_producttype").getValue() != null && formContext.getAttribute("cr60a_producttype").getValue()[0].id != null) {
		var productTypeID = formContext.getAttribute("cr60a_producttype").getValue()[0].id.slice(1, -1);
		try {
			Xrm.WebApi.retrieveRecord("cr60a_producttype", productTypeID).then(
				function success(metadata) {
					let missingValue = false;
					for (const item in metadata) {
						if (item.startsWith("cr60a_pt") && typeof (variant) != 'undefined') {
							fieldName = item.replace("cr60a_pt", "_cr60a_") + "_value";
							fieldName2 = item.replace("cr60a_pt", "cr60a_");
							if ((variant[fieldName] != undefined && variant[fieldName] == null) ||
								(variant[fieldName2] != undefined && variant[fieldName2] == null)) {
								missingValue = true;
								break;
							}
						}
					};
					if (!missingValue && typeof (variant) != 'undefined')
						formContext.getAttribute("cr60a_cleansingstatus").setValue(true);
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

	// Uppercase names	
	let articleNameObj = formContext.getAttribute("cr60a_articlename");
	if (articleNameObj != null && articleNameObj.getValue() != null)
		articleNameObj.setValue(articleNameObj.getValue().toUpperCase());

	let salesSetObj = formContext.getAttribute("cr60a_salestext");
	if (salesSetObj != null && salesSetObj.getValue() != null)
		salesSetObj.setValue(salesSetObj.getValue().toUpperCase());

	// ZSH Volume Calculation
	if (formContext.getAttribute("bdf_inpackaginglength") &&
		formContext.getAttribute("bdf_inpackagingwidth") &&
		formContext.getAttribute("bdf_inpackagingheight")) {
		//formContext.getAttribute("bdf_inpackagingvolume").setValue(volume);
		formContext.data.entity.addOnPostSave(async function () {
			let volume = formContext.getAttribute("bdf_inpackaginglength").getValue() * formContext.getAttribute("bdf_inpackagingwidth").getValue() * formContext.getAttribute("bdf_inpackagingheight").getValue() / 1728;
			var record = {};
			record.bdf_inpackagingvolume = volume; // Decimal

			await Xrm.WebApi.updateRecord("cr60a_stg_article_master", Xrm.Page.data.entity.getId().slice(1, -1), record).then(
				function success(result) {
					//formContext.data.refresh();
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);

		});

	}

	// Set GeneralItemCategory Group modified by sathish 8/23/2024

	/*var articleType;

	if (formContext.getAttribute("bdf_articletype"))
		articleType = formContext.getAttribute("bdf_articletype").getValue();
	if (articleType && formContext.getAttribute("cr60a_generalitemcategorygroup") != null) {
		if (articleType == 1)
			formContext.getAttribute("cr60a_generalitemcategorygroup").setValue("NORM");
		else
			formContext.getAttribute("cr60a_generalitemcategorygroup").setValue("LUMF");
	}
			
	*/




	// Set Goof Proof
	if (formContext.getAttribute("bdf_goofproofindicator") != null) {
		var goofProof = formContext.getAttribute("bdf_goofproofindicator").getValue();
		if (formContext.ui.getFormType() == 1 || goofProof == null) {
			var minorCode = formContext.getAttribute("bdf_minorcodenameproject").getValue();
			if (minorCode == 'MATTRESSES & FOUNDATIONS' || minorCode == 'MATTRESS PADS' || minorCode == 'TABLETOP ACCESSORIES' || minorCode == 'PET FURNITURE' || minorCode == 'TREES' || minorCode == 'FLORAL' || minorCode == 'OUTDOOR OTHER' || minorCode == 'MATTRESSES AND FOUNDATIONS OUTLET')
				formContext.getAttribute("bdf_goofproofindicator").setValue(false);
			else
				formContext.getAttribute("bdf_goofproofindicator").setValue(true);
		}
	}

	// Set Delivery Dependent Component
	if (formContext.getAttribute("bdf_deliverydependentcomponent") != null) {
		var deliveryDependentComponent = formContext.getAttribute("bdf_deliverydependentcomponent").getValue();
		if (formContext.ui.getFormType() == 1 || deliveryDependentComponent == null) {
			var productType = formContext.getAttribute("cr60a_producttype");
			productType = (productType != null && productType.getValue() != null ? productType.getValue()[0].name : null);
			var list = ['Bed Components', 'Bedroom Set Components', 'Dining & Occasional Table Bases (Components)', 'Dining & Occasional Table Tops (Components)', 'Dining Set Components',
				'Entertainment Center Components', 'Sectional Component(s)', 'Sleeper Components']
			if (list.indexOf(productType) >= 0)
				formContext.getAttribute("bdf_deliverydependentcomponent").setValue(true);
		}
	}

	// Set default for Planned Delivery Time
	if (formContext.getAttribute("bdf_planneddeliverytimeindays") != null) {
		var plannedDeliveryTime = formContext.getAttribute("bdf_planneddeliverytimeindays");
		var globalDropStatus = formContext.getAttribute("bdf_globaldropstatus").getValue();
		if (plannedDeliveryTime.getValue() == null || (globalDropStatus == '1' && plannedDeliveryTime.getValue() <= 180)) {
			if (globalDropStatus == '1')
				formContext.getAttribute("bdf_planneddeliverytimeindays").setValue(999);
			else {
				var projectID = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);
				// Inco term from project
				Xrm.WebApi.retrieveRecord("bdf_project", projectID, "?$expand=bdf_Vendor").then(
					function success(data) {
						if (data.bdf_Vendor != null) {
							incoterm = data.bdf_Vendor['bdf_incoterm@OData.Community.Display.V1.FormattedValue'];
							if (incoterm == 'ZFB' || incoterm == 'ZDP' || incoterm == 'ZLD')
								formContext.getAttribute("bdf_planneddeliverytimeindays").setValue(180);
							else
								formContext.getAttribute("bdf_planneddeliverytimeindays").setValue(90);
						} else {
							formContext.getAttribute("bdf_planneddeliverytimeindays").setValue(180);
						}
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}
		}
	}

	// Set default for GR Processing Time
	if (formContext.getAttribute("bdf_grprocessingtime") && formContext.getAttribute("bdf_grprocessingtime").getValue() == null) {
		formContext.getAttribute("bdf_grprocessingtime").setValue(6); //On creation of article, set default Gr Processing Time to 6 
	}

	// Set default for special order item
	var specialOrderInd = formContext.getAttribute("cr60a_specialorderindicator");
	if (specialOrderInd != null && specialOrderInd.getValue() == true) {
		formContext.getAttribute("bdf_onlineindicator").setValue(false);
		formContext.getAttribute("bdf_rptype").setValue(1);
	}

	// Set customer facing indicator
	var customerFacingInd = formContext.getAttribute("bdf_customerfacingindicator");
	if (customerFacingInd && formContext.ui.getFormType() == 1) {
		onlineInd = formContext.getAttribute("bdf_onlineindicator");
		if (onlineInd && onlineInd.getValue() == true)
			formContext.getAttribute("bdf_customerfacingindicator").setValue(true);

		productType = formContext.getAttribute("cr60a_producttype");
		productTypeName = productType.getValue()[0].name;
		if (productType && (productTypeName == 'Sectional Sets' || productTypeName == 'Sectional Component(s)'))
			formContext.getAttribute("bdf_customerfacingindicator").setValue(true);
	}

	function updateSizeName(formContext) {
		var size = formContext.getAttribute("cr60a_size");
		var sizeObj = formContext.getAttribute("bdf_sizename");
		if (sizeObj != null) {
			if (size != null && size.getValue() != null) {

				var sizeName = size.getValue()[0].name.split(":")[1];
				if (sizeName != null) {
					sizeObj.setValue(sizeName);
				}
			} else sizeObj.setValue(null);
		}
	} // SizeName

	function updateArticleID(formContext) {
		var productID = formContext.getAttribute("cr60a_articleid");
		if (productID != null && productID.getValue() == null) {

			var variantNumber = formContext.getAttribute("bdf_variantnumber");
			if (variantNumber != null) {
				productID.setValue(variantNumber.getValue());
			}
		}
	} // ArticleID

} // Main function

//--------------------------------------------- Pre-Populate article DC list for every new variant
function createArticleDC(executionContext) {
	try {
		var formContext = executionContext.getFormContext();

		// Check if the form is in create mode
		if (formContext.ui.getFormType() !== 1) {
			// Form is not in create mode, do nothing
			return;
		}

		// Register the function to execute on post-save
		formContext.data.entity.addOnPostSave(createDcRecords);

		async function createDcRecords(executionContext) {
			debugger;
			var formContext = executionContext.getFormContext();
			// Remove the function from the onSave event to avoid recursive calls
			formContext.data.entity.removeOnPostSave(createDcRecords);

			// Your original logic to create Article DC records
			// var clearsetTime = setInterval(async function () {
			var articleId = formContext.data.entity.getId().slice(1, -1);
			var dc5IndicatorStatus = formContext.getAttribute("bdf_dc5indicator").getValue();

			if (articleId !== null && articleId !== "" && articleId !== undefined) {
				await Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleId}'`)
					.then(async function success(results) {
						// clearInterval(clearsetTime);
						console.log(results);

						if (results.entities.length === 0) {
							var articleDCCount = 0;
							var dcValues = ["3000", "3010", "3200", "3210", "3220"];

							// Use Promise.all to wait for all createRecord promises to resolve
							await Promise.all(dcValues.map(async (dcValue) => {
								var record = {};
								record["bdf_Article@odata.bind"] = "/cr60a_stg_article_masters(" + articleId + ")"; // Lookup
								record.bdf_dc = dcValue; // Text
								record.bdf_grprocessingtime = (dcValues.indexOf(dcValue) < 5) ? 6 : null;

								try {
									var result = await Xrm.WebApi.createRecord("bdf_articledc", record);
									var newId = result.id;

									//-------------------------------------------------check if DC5 Indicator Turned ON/OFF
									articleDCCount += 1;

									if (articleDCCount === dcValues.length && dc5IndicatorStatus === true) {
										await onChangeDC5(executionContext);
									}
									//--------------------------------------------------

									Xrm.Page.getControl("Subgrid_new_3").refresh();
									console.log("Created child record with ID: " + newId);
								} catch (error) {
									console.log("Error creating child record: " + error.message);
								}
							}));
						}
					},
						function (error) {
							console.log(error.message);
						});
			}
			// }, 1000);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

//--------------------------------------------- onChange of dc5 indicator
function onChangeDC5(executionContext) {
	debugger;
	try {
		var formContext = executionContext.getFormContext();
		var dc5Indicator = formContext.getAttribute("bdf_dc5indicator").getValue();
		var articleId = formContext.data.entity.getId().slice(1, -1);
		var globalDropStatus = formContext.getAttribute("bdf_globaldropstatus").getValue();

		if (dc5Indicator == true) {

			//------------------------------------------------------ Whenever DC5 Turned ON and SOI Turned Off  then update rp_type as ZD by vasudev on 26-12-23
			var specialOrderIndicator = formContext.getAttribute("cr60a_specialorderindicator").getValue();
			if (specialOrderIndicator == false) {
				formContext.getAttribute("bdf_rptype").setValue(2);
			}
			//------------------------------------------------------
			Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleId}'`).then(
				function success(results) {
					if (results.entities.length > 0) {
						// Iterate through the retrieved records and update each one
						// Xrm.Utility.showProgressIndicator("");
						for (var i = 0; i < results.entities.length; i++) {
							var recordId = results.entities[i].bdf_articledcid; // Assuming the ID field is named "bdf_articledcid"
							var dccodeValue = results.entities[i].bdf_dc; // Assuming "bdf_dccode" is the field you want to check

							// Check if dccode is not equal to 3220 before updating
							if (dccodeValue !== "3220") {
								var entity = {};
								entity.bdf_dropcode = 1; // Assuming "bdf_dropcode" is the field you want to update
								entity.bdf_dropdate = new Date();
								entity.bdf_grprocessingtime = (i < 5) ? 999 : null/* Set your default value for other records */;
								// Use Xrm.WebApi to update the record
								Xrm.WebApi.updateRecord("bdf_articledc", recordId, entity).then(
									function success(result) {
										// Record updated successfully
										formContext.getControl("Subgrid_new_3").refresh();
										formContext.data.refresh(true)
									},
									function (error) {
										console.log(error.message);
										//Xrm.Utility.closeProgressIndicator();
									}
								);
							}
						}
					}
				},
				function (error) {
					console.log(error.message);
					Xrm.Utility.closeProgressIndicator();
				}
			);
		} else {
			// If dc5Indicator is false, retrieve related records
			Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleId}'`).then(
				function success(results) {
					if (results.entities.length > 0) {
						// Iterate through the retrieved records and update dropcode to null
						for (var i = 0; i < results.entities.length; i++) {
							var recordId = results.entities[i].bdf_articledcid; // Assuming the ID field is named "bdf_articledcid"
							var dccodeValue = results.entities[i].bdf_dc; // Assuming "bdf_dccode" is the field you want to check

							// Check if dccode is not equal to 3220 before updating to null
							if (dccodeValue !== "3220") {
								var entity = {};
								entity.bdf_dropcode = null; // Set "bdf_dropcode" to null
								entity.bdf_dropdate = null;
								if (globalDropStatus != 1) {
									entity.bdf_grprocessingtime = (i < 5) ? 6 : null/* Set your default value for other records */;
								}
								// Use Xrm.WebApi to update the record
								Xrm.WebApi.updateRecord("bdf_articledc", recordId, entity).then(
									function success(result) {
										// Record updated successfully
										formContext.getControl("Subgrid_new_3").refresh();
									},
									function (error) {
										console.log(error.message);
										//Xrm.Utility.closeProgressIndicator();
									}
								);
							}
						}
					}
				},
				function (error) {
					console.log(error.message);
					// Xrm.Utility.closeProgressIndicator();
				}
			);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

//------------------------------------------------- Whenever user Turned SOI Off then update rp_type as ZD by vasudev on 26-12-23
function onchangeSOI(executionContext) {
	debugger;
	try {

		var formContext = executionContext.getFormContext();
		var specialOrderIndicator = formContext.getAttribute("cr60a_specialorderindicator").getValue();
		if (specialOrderIndicator == false) {
			formContext.getAttribute("bdf_rptype").setValue(2);
		}

	}
	catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

//------------------------------------------------- update below two fields whenever user updates notes from Generic Form level by vasudev on 26-12-23
//----------------------------------------------------------- Notes Tracking
async function updateNotes(executionContext) {
	debugger;
	try {

		var formContext = executionContext.getFormContext();
		// Store the current and previous values in a neat string format
		var currentNotes = formContext.getAttribute("bdf_notes").getValue();
		formContext.getAttribute("bdf_notes").setValue(null);
		if (formContext.ui.getFormType() == 1) {
			// Add a function to be executed after the record is saved
			formContext.data.entity.addOnPostSave(updateNotes);
		} else if (formContext.ui.getFormType() == 2) {

			formContext.data.entity.removeOnPostSave(updateNotes);
			var entityId = formContext.data.entity.getId();
			var entityName = formContext.data.entity.getEntityName();

			// Fetch the existing record to get the previous values
			await Xrm.WebApi.retrieveRecord(entityName, entityId, "?$select=bdf_previousnotescomments").then(
				async function success(existingRecord) {

					// Parse previousNotes to extract content without additional information
					var previousNotesWithMetadata = existingRecord.bdf_previousnotescomments;

					// Get information about the current user (Placeholder, actual implementation may vary)
					var currentUserInfo = Xrm.Utility.getGlobalContext().userSettings.userName; // Placeholder for current user information

					// Check if current and previous notes are different

					// Concatenate the current and previous values into a neat string
					var notesHistory = `${currentNotes} \nComment added by: ${currentUserInfo} on: ${new Date().toLocaleString()}\n\n ${previousNotesWithMetadata ? previousNotesWithMetadata + '\n' : ''}`;


					await formContext.data.refresh(true);

					// Update the record with the new value and the notes history
					var record = {};
					record.bdf_bobscommentedon = new Date().toISOString(); // Date Time
					record.bdf_commentprovidergroup = "Bobs"; // Text
					record.bdf_previousnotescomments = notesHistory;
					//record.bdf_notes = '';

					var res = await Xrm.WebApi.updateRecord(entityName, entityId, record);
					if (res) {
						await Xrm.Utility.openEntityForm(entityName, entityId);
						// Set focus on the "bdf_previousnotescomments" field
						formContext.getControl("bdf_previousnotescomments").setFocus();
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
//-----------------------------------------------------------
//--------------------------------------------- when user enters drop date then they should enter drop code too in Article DC Entity form level by vasudev 26-10-23
function onChangeDropDate(executionContext) {
	debugger;
	try {
		var formContext = executionContext.getFormContext();
		var dropdate = formContext.getAttribute("bdf_dropdate").getValue();
		if (dropdate != null) {
			formContext.getAttribute("bdf_dropcode").setRequiredLevel("required");
		}

		else {
			formContext.getAttribute("bdf_dropcode").setRequiredLevel("none");
		}
	}
	catch (error) {
		xrm.Utility.alertDialog(error.message);
	}
}

//----------------------------------------- will trigger on onSave of subgrid present in Drop status Tab in variant entity. 
function onDropcodeChange(executionContext) {
	debugger;
	// Get the form context from the execution context
	var formContext = executionContext.getFormContext();


	// Get the value of the "bdf_dropcode" field in the subgrid
	var dropDate = formContext.getAttribute("bdf_dropdate").getValue();
	var dropCode = formContext.getAttribute("bdf_dropcode").getValue();

	// Check if "bdf_dropcode" has a value
	if (dropDate != null && dropCode == null) {
		// Make the "bdf_dropcode" field mandatory in the subgrid
		formContext.getAttribute("bdf_dropcode").setRequiredLevel("required");
		executionContext.getEventArgs().preventDefault();

	} else {
		// Make the "bdf_dropcode" field optional in the subgrid
		formContext.getAttribute("bdf_dropcode").setRequiredLevel("none");
	}
}



function changeGeneralItemCategory(executionContext) {
	debugger;
	var formContext = executionContext.getFormContext();
	try {
		var articleType = formContext.getAttribute("bdf_articletype").getValue();
		var entityId = formContext.data.entity.getId(); // Get the entity record's ID
		var entityLogicalName = formContext.data.entity.getEntityName(); // Get the entity logical name

		if (articleType) {
			if (articleType == 1) {
				var data = {
					"cr60a_generalitemcategorygroup": "NORM"
				};
			} else {
				var data = {
					"cr60a_generalitemcategorygroup": "LUMF"
				};
			}

			Xrm.WebApi.updateRecord(entityLogicalName, entityId, data).then(
				function success(result) {

				},
				function error(error) {
					console.log("Error updating record: " + error.message);
				}
			);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

async function stopSaveCleasingForm(executionContext) {
	try {
		let formContext = executionContext.getFormContext();
		if (formContext.ui.getFormType() == 1) {
			executionContext.getEventArgs().preventDefault();
			var alertStrings = { confirmButtonLabel: "Ok", text: `Cannot create a new variant from here...`, title: "Error!" };
			var alertOptions = { height: 120, width: 360 };
			Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
				function (success) {
					console.log("Alert dialog closed");
				},
				function (error) {
					console.log(error.message);
				}
			);

		}

	} catch (error) {

		// Display error message
		var alertStrings = { confirmButtonLabel: "Ok", text: `${error.message}`, title: "Error!" };
		var alertOptions = { height: 120, width: 360 };
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

function preventNewCreation(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();
	if (formContext.ui.getFormType() == 1) {
		//executionContext.getEventArgs().preventDefault();
		Xrm.Navigation.openErrorDialog({ message: "Please do not create a new variant on this page. Please switch to Variant Create/Update form to create a new variant. Your data will not be saved here." });
		// Xrm.Utility.alertDialog('Please switch to Variant Create/Update form to create new variants.');
	}
}

function preventNewCreationOnSave(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();
	if (formContext.ui.getFormType() == 1) {
		executionContext.getEventArgs().preventDefault();
		Xrm.Navigation.openErrorDialog({ message: "Please do not create a new variant on this page. Please switch to Variant Create/Update form to create a new variant. Your data will not be saved here." });
		// Xrm.Utility.alertDialog('Please switch to Variant Create/Update form to create new variants.');
	}
}

function preventOnlineExclusiveIndicator(executionContext) {
	debugger;

	try {
		//executionContext.getEventArgs().preventDefault();
		var formContext = executionContext.getFormContext();
		var exclusiveIndicatorOnOff = formContext.getAttribute("bdf_onlineexclusiveindicator").getValue();
		var onlineIndicatorOnOff = formContext.getAttribute("bdf_onlineindicator").getValue();
		if (exclusiveIndicatorOnOff && onlineIndicatorOnOff) {
			formContext.getAttribute("bdf_onlineexclusiveindicator").setValue(false);
			formContext.data.refresh(true);
			Xrm.Navigation.openErrorDialog({ message: "Article cannot be an online exclusive item and have online indicator on" });
		}
	} catch (error) {
		Xrm.Navigation.openErrorDialog({ message: error.message });
	}
}

// function preventSplDelFeeIndicator(executionContext) {
// 	debugger;

// 	try {
// 		//executionContext.getEventArgs().preventDefault();
// 		var formContext = executionContext.getFormContext();
// 		var specialDeliveryFeeIndicator = formContext.getAttribute("bdf_specialdeliveryfeeindicator").getValue();
// 		var articleType = formContext.getAttribute("bdf_articletype").getValue();
// 		if (specialDeliveryFeeIndicator && (articleType == 2 || articleType == 3)) {
// 			formContext.getAttribute("bdf_specialdeliveryfeeindicator").setValue(false);
// 			formContext.data.refresh(true);
// 			Xrm.Navigation.openErrorDialog({ message: "Article of General Item Category Group equal to LUMF cannot turn Special Delivery Fee indicator to Yes" });
// 		}
// 	} catch (error) {
// 		Xrm.Navigation.openErrorDialog({ message: error.message });
// 	}
// }

async function preventSplDelFeeIndicator(executionContext) {
    debugger;

    try {
        var formContext = executionContext.getFormContext();
        var specialDeliveryFeeIndicator = formContext.getAttribute("bdf_specialdeliveryfeeindicator").getValue();
        var articleType = formContext.getAttribute("bdf_articletype").getValue();

        let packageId = formContext.data.entity.getId().slice(1, -1);
        if (specialDeliveryFeeIndicator && (articleType == 2 || articleType == 3)) {
            try {
                const results = await Xrm.WebApi.retrieveMultipleRecords("bdf_articlebillofmaterial", "?$filter=_bdf_packagearticle_value eq " + packageId);
                console.log(results);

                let found = false;               
                for (const entity of results.entities) {
                    var componentArticleId = entity._bdf_componentarticle_value;
                    const componentResult = await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", componentArticleId, "?$select=bdf_specialdeliveryfeeindicator");
                    var componentSpecialDeliveryFeeIndicator = componentResult.bdf_specialdeliveryfeeindicator;
                    console.log("Component Special Delivery Fee Indicator: " + componentSpecialDeliveryFeeIndicator);

                    if (componentSpecialDeliveryFeeIndicator === true) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    formContext.getAttribute("bdf_specialdeliveryfeeindicator").setValue(false);
                    formContext.data.refresh(true);
                    await Xrm.Navigation.openErrorDialog({ message: "None of the Components have Special Delivery Fee Indicator turned to Yes" });
                }

            } catch (error) {
                await Xrm.Navigation.openErrorDialog({ message: error.message });
            }
        }

    } catch (error) {
        await Xrm.Navigation.openErrorDialog({ message: error.message });
    }
}

//End

	// Set GeneralItemCategory Group modified by sathish 8/23/2024

	
	function onChangeGeneralItemCategory(executionContext){

		debugger;
		var formContext=executionContext.getFormContext();

		if (formContext.getAttribute("bdf_articletype"))
			var articleType = formContext.getAttribute("bdf_articletype").getValue();
		if (articleType && formContext.getAttribute("cr60a_generalitemcategorygroup") != null) {
			if (articleType == 1)
				formContext.getAttribute("cr60a_generalitemcategorygroup").setValue("NORM");
			else
				formContext.getAttribute("cr60a_generalitemcategorygroup").setValue("LUMF");
		}
	}


	