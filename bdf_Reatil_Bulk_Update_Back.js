function bulkUpdateRetail(formContext) {
	debugger;
	try {
		var pageContext = Xrm.Utility.getPageContext();
		var input = pageContext.input;
		var selectedViewId = input.viewId;

		// Enable upload only from Retail View
		//if (selectedViewId != '{54A51AF8-4B22-EE11-9CBE-0022482B6EDA}') return;

		window.formContext = formContext;

		// Check if Import Diaglog is open ... if so, wait for it to close.
		waitForElementsToExist(() => checkImportDiaglogClosed(), { checkFrequency: 4000, timeout: 60000 });

		//-------------------------------------
		trackProgressInterval = setInterval(disableTrackProgressButton, 500); // Check every 500 ms


		setTimeout(stopTrackProgressInterval, 120000);
		//--------------------------------------------

	} catch (e) {
		console.log(e.message);
	}
}


//---------------------------------------------
function stopTrackProgressInterval() {
	// Clear the interval to stop calling disableTrackProgressButton
	clearInterval(trackProgressInterval);
}


function disableTrackProgressButton() {
	// Check if the "Track Progress" button is visible
	var importExcelLabel = window.top.document.querySelector("h1[aria-label='Import from Excel']");

	var trackProgressButton = window.top.document.querySelector("button[title='Track Progress'][data-id='tab4footerprevious'][id='id-dd1da831-fd13-4e45-85b3-651fd4a31273-14']");
    var trackProgressButton1 = window.top.document.querySelector("button[aria-label='Track Progress'][data-id='tab4footerprevious'][id='id-dd1da831-fd13-4e45-85b3-651fd4a31273-14']");


	if (importExcelLabel) {
		// The "Track Progress" button is visible, so let's disable it
        if (trackProgressButton)
		trackProgressButton.style.display = "none";
        
        else if(trackProgressButton1){
        trackProgressButton1.style.display = "none";

            }

		// to hide track progress button in dev environment
		var trackProgressButtonInDev = window.top.document.querySelector("button[aria-label='Track Progress']");
		var trackProgressButtonNewDev = window.top.document.querySelector("button[title='Track Progress'][data-id='tab4footerprevious'][id='id-dd1da831-fd13-4e45-85b3-651fd4a31273-35']");
		var globalContext = Xrm.Utility.getGlobalContext();
		var url = globalContext.getClientUrl();

		if (url.startsWith("https://org5aabaa88")) {
			// Do something if the URL starts with "https://org5aabaa88"
			trackProgressButtonInDev.style.display = "none";
			trackProgressButtonNewDev.style.display = "none";

		} else {
			// Do something else if the URL does not start with "https://org5aabaa88"
			trackProgressButton.style.display = "none";
		}

	}
}
//----------------------------------------------
function waitForElementsToExist(callback, options) {

	options = Object.assign({
		checkFrequency: 500, // check for elements every 500 ms
		timeout: null, // after checking for X amount of ms, stop checking
	}, options);

	// poll every X amount of ms for all DOM nodes
	var intervalHandle1 = setInterval(() => {
		let doElementsExist = true;
		var elementObj = window.top.document.querySelector("h1[aria-label='Import from Excel']") //window.top.document.querySelector("h1[aria-label='Import from Excel']"); // button[title='Finish Import']
		if (!elementObj)
			doElementsExist = false;

		// if all elements exist, stop polling and invoke the callback function 
		if (doElementsExist) {
			clearInterval(intervalHandle1);
			intervalHandle1 = null;
			if (callback) {
				callback();
			}
		}
	}, options.checkFrequency);

	if (options.timeout != null) {
		setTimeout(() => {
			if (intervalHandle1) {
				clearInterval(intervalHandle1);
				Xrm.Utility.alertDialog("Timeout occured while waiting for file import dialog to initiate.");
			}
			//displayErrorMessage();
		}, options.timeout);
	}
}

function checkImportDiaglogClosed() {
	debugger;
	var element = window.top.document.querySelector("h1[aria-label='Import from Excel']"); //"h1[aria-label='Import from Excel']");


	// Check if import diaglog is closed ... if so, wait for file to upload
	waitForElementsToDisappear([element.id], () => checkImportCompletion(), { checkFrequency: 4000, timeout: 120000 });
}

function waitForElementsToDisappear(elementIds, callback, options) {

	debugger;

	options = Object.assign({
		checkFrequency: 500, // check for elements every 500 ms
		timeout: null, // after checking for X amount of ms, stop checking
	}, options);

	// poll every X amount of ms for all DOM nodes
	var intervalHandle2 = setInterval(() => {
		let doElementsExist = false;
		for (let elementId of elementIds) {
			let element = window.top.document.getElementById(elementId);

			if (element) {
				// if element does not exist, set doElementsExist to false and stop the loop
				doElementsExist = true;
				break;
			}
		}

		// if all elements exist, stop polling and invoke the callback function 
		if (!doElementsExist) {
			clearInterval(intervalHandle2);
			intervalHandle2 = null;
			Xrm.Utility.showProgressIndicator("Checking for file upload status...");
			if (callback) {
				callback();
			}
		}
	}, options.checkFrequency);

	if (options.timeout != null) {
		setTimeout(() => {
			if (intervalHandle2) {
				clearInterval(intervalHandle2);
				Xrm.Utility.closeProgressIndicator();
				Xrm.Utility.alertDialog("Timeout occured while waiting for file import process to initiate.");
			}
			//displayErrorMessage();
		}, options.timeout);
	}
}

function checkImportCompletion() {
	debugger;

	// Check if import diaglog is closed ... if so, wait for file to upload
	waitForImportCompletion(() => retailSnapshot(formContext), { checkFrequency: 12000, timeout: 300000 });
}

function waitForImportCompletion(callback, options) {
	options = Object.assign({
		checkFrequency: 500, // check for elements every 500 ms
		timeout: null, // after checking for X amount of ms, stop checking
	}, options);

	// poll every X amount of ms for all DOM nodes
	var intervalHandle3 = setInterval(() => {

		var userId = Xrm.Utility.getGlobalContext().userSettings.userId.slice(1, -1);
		Xrm.WebApi.retrieveMultipleRecords("importfile", "?$top=1&$orderby=createdon desc&$filter=_ownerid_value eq " + userId + " and Microsoft.Dynamics.CRM.LastXHours(PropertyName='createdon',PropertyValue='1')").then(
			function success(data) {
				for (job of data.entities) {
					window.createdOnFile = job.createdon;
					var successCount = job.successcount;
					var failureCount = job.failurecount;
					var partialFailureCount = job.partialfailurecount;
					var tableName = job.targetentityname;
					var statusCode = job.statuscode; // 4 = Completed
					var statusName = job['statuscode@OData.Community.Display.V1.FormattedValue'];
					Xrm.Utility.showProgressIndicator("File upload status..." + statusName);

					if (statusCode == 4 || statusCode == 5) {
						clearInterval(intervalHandle3);
						intervalHandle3 = null;

						if (statusCode == 5 || failureCount > 0 || partialFailureCount > 0) {
							window.successCount = successCount;
							Xrm.Utility.closeProgressIndicator();
							Xrm.Utility.alertDialog("There were one or more errors encountered. Please check the log, fix the issue and re-upload data.");
							if (callback) callback();
						} else if (window.successCount = 0) {
							Xrm.Utility.closeProgressIndicator();
							Xrm.Utility.alertDialog("There was no new data to process.");
						} else {
							window.successCount = successCount;
							if (callback) callback();
						}
					}
				}
			},
			function (error) {
				Xrm.Utility.alertDialog(error.message);
			}
		);
	}, options.checkFrequency);

	if (options.timeout != null) {
		setTimeout(() => {
			if (intervalHandle3) {
				clearInterval(intervalHandle3);
				Xrm.Utility.closeProgressIndicator();
				Xrm.Utility.alertDialog("Timeout occured while waiting for file import to complete.");
			}
			//displayErrorMessage();
		}, options.timeout);
	}
}

function displayErrorMessage(message) {
	// define notification object
	var notification = {
		type: 2,
		level: 2, //error
		message: message,
		showCloseButton: true
	}
	Xrm.App.addGlobalNotification(notification).then(
		function success(GUID) {
			window.errorMessageID = GUID;
		}
	);
}

function clearErrorMessage() {
	if (errorMessageID)
		Xrm.App.clearGlobalNotification(errorMessageID);
}


function transformData(inputData) {
	const result = {};

	inputData.sort((a, b) => {
		const dateA = new Date(a['bdf_retaileffectivedate']);
		const dateB = new Date(b['bdf_retaileffectivedate']);
		return dateA - dateB; // Change to ascending order
	});


	for (let i = 0; i < inputData.length; i++) {
		const entry = inputData[i];
		const articleValue = entry['_bdf_article_value'];
		const effectiveDate = entry['bdf_retaileffectivedate@OData.Community.Display.V1.FormattedValue'];
		const retailPrice = entry['bdf_retailprice'];
		const zone = entry['bdf_zone'];
		const badgeType = entry['bdf_badgetype@OData.Community.Display.V1.FormattedValue'];

		const key = `${articleValue}_${effectiveDate}`;

		if (!result[key]) {
			result[key] = {
				'_bdf_article_value': articleValue,
				'bdf_retaileffectivedate': effectiveDate,
				'bdf_badgetypes': {}, // Initialize badge types object for each entry
				'bdf_prices': {} // Initialize prices object for each entry
			};
		}

		// Set badge type for the zone
		result[key]['bdf_badgetypes'][zone] = badgeType === 'EDLP' ? 1 : badgeType === 'Clearance' ? 2 : null;

		// Check if prior entry exists and the current entry does not have the property
		const priorDate = new Date(effectiveDate);
		priorDate.setDate(priorDate.getDate() + 1);
		const priorKey = `${articleValue}_${priorDate.toLocaleDateString()}`;

		if (result[priorKey] && !result[key]['bdf_prices'][zone]) {
			result[key]['bdf_prices'][zone] = result[priorKey]['bdf_prices'][zone];
		}

		// Set retail price for the zone
		result[key]['bdf_prices'][zone] = retailPrice;
	}

	//----------------------------------------------------------
	const finalResult = Object.values(result);
	return finalResult;
}



//-----------------------------------------------------------------------------

function checkWebAPIStatus(formContext) {
	//debugger;

	if (window.articlesCount == window.publishedArticles) {
		Xrm.Utility.closeProgressIndicator();
		formContext.refresh();
		if (!window.successCount) window.successCount = 0
		Xrm.Utility.alertDialog("Retail data was published.\n>>> Source File Records: " + window.successCount + "\n>>> Published Articles: " + window.publishedArticles);
	}
}


function retailSnapshot(formContext) {
	debugger;
	try {

		window.publishedArticles1 = 0;
		window.unPublishedArticles1 = 0;

		var userId = Xrm.Utility.getGlobalContext().userSettings.userId.slice(1, -1);
		window.publishedArticles = 0;
		window.unPublishArticles = '';
		var currentDateTime = new Date();
		var formattedCurrentDateTime = currentDateTime.toISOString();

		// Calculate the datetime 5 minutes ago
		var fifteenMinutesAgo = new Date(currentDateTime);
		fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15); // Subtract 15 minutes
		var formattedFifteenMinutesAgo = fifteenMinutesAgo.toISOString();

		//var userId = Xrm.Utility.getGlobalContext().userSettings.userId;

		var filter = "?$filter=" +
			"modifiedon ge " + createdOnFile + " and " +
			"_modifiedby_value eq " + userId;

		Xrm.WebApi.retrieveMultipleRecords("bdf_retailzonepriceupload", filter /*"?$orderby=modifiedon&$filter=_modifiedby_value eq " + userId + " and Microsoft.Dynamics.CRM.Today(PropertyName='modifiedon')"*/).then(
			async function success(data) {

				var selectedArticles = data.entities.length;
				//var publishedArticles = 0;
				window.countOfExcelRecords = 0;

				//------------------------update processing error those records whose effective date is past date
				// Get today's date in the correct format (without time component)
				var today = new Date();
				//today.setHours(0, 0, 0, 0);
				// Format date as YYYY-MM-DDTHH:MM:SSZ
				var formattedDateISO = today.toISOString();

				// Arrays to separate records based on effective date
				var validData = [];
				var invalidData = [];

				// Loop through the retrieved records
				for (var i = 0; i < data.entities.length; i++) {
					var record = data.entities[i];
					var effectiveDate = record.bdf_retaileffectivedate;

					if (effectiveDate == null) {
						invalidData.push(record);
					}

					// Check if the effective date is less than today's date
					else if (effectiveDate.slice(0, 10) < formattedDateISO.slice(0, 10)) {
						// Add the record to the invalid data list
						invalidData.push(record);
					} else {
						// Add the record to the valid data list
						validData.push(record);
					}
				}

				// Update the records with past effective dates
				for (let i = 0; i < invalidData.length; i++) {
					var record = invalidData[i];
					var updateData;
					if (record.bdf_retaileffectivedate == null) {
						updateData = {
							"bdf_processingerror": "Failed to update Article info record as effective date was missing"
						};
					}

					else {
						updateData = {
							"bdf_processingerror": "Failed to update Article info record as effective date was backdated"
						};

					}

					try {
						await Xrm.WebApi.updateRecord("bdf_retailzonepriceupload", record.bdf_retailzonepriceuploadid, updateData);
						console.log("Record updated successfully");
					} catch (error) {
						console.error("Error updating record: ", error);
					}
				}

				if (invalidData.length > 0) {
					let errorMessage = `One or more issues were found. Please Refresh the page and refer to the processing error for the latest updated records.`;

					var alertStrings = { confirmButtonLabel: "Yes", text: errorMessage, title: "Error" };
					var alertOptions = { height: 250, width: 350 };
					Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
						function (success) {
							console.log("Alert dialog closed");
							Xrm.Utility.closeProgressIndicator();
							//formContext.data.refresh();
						},
						function (error) {
							Xrm.Utility.alertDialog(error.message);
							Xrm.Utility.closeProgressIndicator();
							//formContext.data.refresh();
						});
				}

				var retails;
				// Process valid records
				if (validData.length > 0) {
					try {
						retails = await transformData(validData);
						console.log("Transformed data:", retails);
					} catch (error) {
						console.error("Error transforming data: ", error);
					}

					//------------------------
					//var retails = pivotBy(data.entities, '_bdf_article_value', 'bdf_zone', 'bdf_retailprice', 'bdf_retaileffectivedate', 'bdf_badgetype');
					//var retails = await transformData(data.entities);
					window.articlesCount = retails.length;

					// Update data into variant table
					//Xrm.Utility.showProgressIndicator("Publishing Retail Data...");


					if (articlesCount == 0) {
						Xrm.Utility.closeProgressIndicator();
						Xrm.Utility.alertDialog("Unable to fetch the records...Try Again.....");
						return;
					}

					//actioncall(retails);

					for (let retail of retails) {

						countOfExcelRecords += 1;

						actioncall(retail);

					}
				}
			},
			function (error) {
				Xrm.Utility.closeProgressIndicator();
				Xrm.Utility.alertDialog(error.message);
			}
		);

	} catch (error) {
		Xrm.Utility.closeProgressIndicator();
		Xrm.Utility.alertDialog(error.message);
	}

	finally {
		Xrm.Utility.closeProgressIndicator();
	}

}



function enableButton(formContext) {
	debugger;
	var pageContext = Xrm.Utility.getPageContext();
	var input = pageContext.input;
	var selectedViewId = input.viewId;

	// Enable upload only from Retail View
	if (selectedViewId == '{54A51AF8-4B22-EE11-9CBE-0022482B6EDA}')
		return true;
	else
		return false;
}


function actioncall(retail) {
	try {


		var retailObject = {};

		// // Convert the retail object to a stringified JSON representation
		var retailString = JSON.stringify(retail);

		// // Assign the stringified retail object to MyInputParam property
		retailObject.MyInputParam = retailString;
		retailObject.createdOnFile = createdOnFile;
		// // Use the formattedRetail object in your Fetch API request
		fetch(Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/bdf_BulkUpdateRetailAction", {
			method: "POST",
			headers: {
				"OData-MaxVersion": "4.0",
				"OData-Version": "4.0",
				"Content-Type": "application/json; charset=utf-8",
				"Accept": "application/json"
			},
			body: JSON.stringify(retailObject)
		}).then(function (response) {
			if (response.ok) {
				console.log("Success");
				return response.json(); // Parse response as JSON
			} else {
				return response.json().then((json) => { throw json.error; });
			}
		}).then(async function (result) {
			//clearInterval(progressInterval);
			// Access output parameters from the result
			publishedArticles1 += result.publishedArticles;
			unPublishedArticles1 += result.unPublishedArticles;

			// if (result.unPublishedArticleGUID != null) {
			// 	unPublishArticles += result.unPublishedArticleGUID.split(',');
			// }

			let unPublishArticleIds = []; // Initialize array to store GUIDs

			// Each time a result comes, add its unPublishedArticleGUID to the array
			if (result.unPublishedArticleGUID != null) {
				unPublishArticleIds.push(result.unPublishedArticleGUID);
			}

			// After all results are processed, format unPublishArticles according to the specifications
			let unPublishArticles = '';

			if (unPublishArticleIds.length > 0) {
				unPublishArticles = unPublishArticleIds.map(id => `'${id}'`).join(',').trim();
			}

			Xrm.Utility.showProgressIndicator(`Publishing Retail Data...${publishedArticles1 + unPublishedArticles1}/${window.articlesCount}`);

			if ((publishedArticles1 + unPublishedArticles1) == articlesCount) {
				Xrm.Utility.closeProgressIndicator();
				let unPublishedArticleResults;
				if (unPublishArticles != "") {
					// unPublishedArticleResults = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$select=cr60a_articleid&$filter=Microsoft.Dynamics.CRM.In(PropertyName='cr60a_stg_article_masterid',PropertyValues=[" + unPublishArticles + "])");
					let filterCriteria = `?$select=cr60a_articleid&$filter=Microsoft.Dynamics.CRM.In(PropertyName='cr60a_stg_article_masterid',PropertyValues=[${unPublishArticles}])`;

					// Retrieve records using Xrm.WebApi
					unPublishedArticleResults = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", filterCriteria);
				}

				// Extract cr60a_articleid values and concatenate them into a string
				//var unPublishedArticlesString = unPublishedArticleResults.entities.map(entity => entity.cr60a_articleid).join(", ");

				//Xrm.Utility.showProgressIndicator(`Publishing Retail Data...${publishedArticles1 + unPublishedArticles1}/${window.articlesCount}`);
				if (unPublishedArticles1 > 0) {
					let errorMessage = `One or more issues were found. Please Refresh the page and refer to the processing error for the latest updated records.`;

					var alertStrings = { confirmButtonLabel: "Yes", text: errorMessage, title: "Error" };
					var alertOptions = { height: 250, width: 350 };
					Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
						function (success) {
							console.log("Alert dialog closed");
							Xrm.Utility.closeProgressIndicator();
							//formContext.data.refresh();
						},
						function (error) {
							Xrm.Utility.alertDialog(error.message);
							Xrm.Utility.closeProgressIndicator();
							//formContext.data.refresh();
						});
				}

				var textMsg;
				if (publishedArticles1 > 0) {
					textMsg = `✔ Retail data was published `;
				}
				else {
					textMsg = `❌ Retail data was not published`;
				}
				//Xrm.Utility.alertDialog("Retail data was published.\n>>> Source File Records: " + window.successCount + "\n>>> Published Articles: " + publishedArticles1);
				var alertStrings = { confirmButtonLabel: "Yes", text: `>>>Total Amount of Zone Prices Changed : ${window.successCount} \n\n>>>Total Amount of Unique Articles: ${publishedArticles1}`, title: textMsg };
				var alertOptions = { height: 250, width: 350 };
				Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
					function (success) {
						console.log("Alert dialog closed");
						Xrm.Utility.closeProgressIndicator();
						//formContext.data.refresh();
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
						Xrm.Utility.closeProgressIndicator();
						//formContext.data.refresh();
					});
			}
		}).catch(function (error) {
			Xrm.Utility.alertDialog(error.message);
			setTimeout(() => {
				Xrm.Utility.closeProgressIndicator();
			}, 1000);
		});



	} catch (error) {
		Xrm.Utility.closeProgressIndicator();
		Xrm.Utility.alertDialog(error.message);
	}
	// finally {
	// 	Xrm.Utility.closeProgressIndicator();
	// }

}

window.preventLoop = 0
//inapp notification
async function appNotify() {
	debugger;
	try {

		if (preventLoop >= 1) return;
		preventLoop += 1;

		var today = new Date();
		today.setHours(0, 0, 0, 0); // Set to the start of today


		var results1 = await Xrm.WebApi.retrieveMultipleRecords("importfile", `?$select=_createdby_value,createdon,name,sourceentityname,targetentityname&$filter=(contains(targetentityname,'bdf_retailzonepriceupload') and _createdby_value eq ${Xrm.Utility.getGlobalContext().userSettings.userId.replace("{", "").replace("}", "")})&$orderby=createdon desc&$top=1`);
		var result = results1.entities[0];
		if (results1.entities.length == 0) return;
		var createdOnFile1 = result["createdon"]; // Date Time
		var createdByWhom = result["_createdby_value"];

		if (createdByWhom != Xrm.Utility.getGlobalContext().userSettings.userId.slice(1, -1).toLowerCase()) return;
		// var filter = "?$filter=" +
		// 	"modifiedon ge " + createdOnFile1 + " and " +
		// 	"bdf_processingerror ne null" + `_createdby_value eq ${createdByWhom}`;
		var filter = `?$select=createdon,modifiedon&$filter=modifiedon ge ${createdOnFile1} and bdf_processingerror ne null and _modifiedby_value eq ${createdByWhom}`;


		var retailZoneRecords = await Xrm.WebApi.retrieveMultipleRecords("bdf_retailzonepriceupload", filter);

		if (retailZoneRecords.entities.length > 0) {

			var notificationText;

			var hasOlderModifiedOnDate = retailZoneRecords.entities.some(record => new Date(record.modifiedon) < today);

			var modifiedDate = retailZoneRecords.entities[0]["modifiedon"];
			var date = new Date(modifiedDate);
			var formattedDate = date.toISOString().split('T')[0];

			if (hasOlderModifiedOnDate) {
				notificationText = `Click on Edit filters and set modified on ${formattedDate} to view the records with processing error. Then, click on the notification icon at the top right to see more details.`;
			} else {
				notificationText = "Click on the notification icon on the top right to see more details.";
			}

			var Example = window.Example || {};
			Example.SendAppNotificationRequest = function (
				title,
				recipient,
				body,
				priority,
				iconType,
				toastType,
				expiry,
				overrideContent,
				actions) {
				this.Title = title;
				this.Recipient = recipient;
				this.Body = body;
				this.Priority = priority;
				this.IconType = iconType;
				this.ToastType = toastType;
				this.Expiry = expiry;
				this.OverrideContent = overrideContent;
				this.Actions = actions;
			};

			Example.SendAppNotificationRequest.prototype.getMetadata = function () {
				return {
					boundParameter: null,
					parameterTypes: {
						"Title": {
							"typeName": "Edm.String",
							"structuralProperty": 1
						},
						"Recipient": {
							"typeName": "mscrm.systemuser",
							"structuralProperty": 5
						},
						"Body": {
							"typeName": "Edm.String",
							"structuralProperty": 1
						},
						"Priority": {
							"typeName": "Edm.Int",
							"structuralProperty": 1
						},
						"IconType": {
							"typeName": "Edm.Int",
							"structuralProperty": 1
						},
						"ToastType": {
							"typeName": "Edm.Int",
							"structuralProperty": 1
						},
						"Expiry": {
							"typeName": "Edm.Int",
							"structuralProperty": 1
						},
						"OverrideContent": {
							"typeName": "mscrm.expando",
							"structuralProperty": 5
						},
						"Actions": {
							"typeName": "mscrm.expando",
							"structuralProperty": 5
						},
					},
					operationType: 0,
					operationName: "SendAppNotification",
				};
			};
			var userName;
			var userId = Xrm.Utility.getGlobalContext().userSettings.userId.replace("{", "").replace("}", "");
			await Xrm.WebApi.retrieveRecord("systemuser", userId, "?$select=fullname").then(function success(user) {
				userName = user.fullname;
			});

			var SendAppNotificationRequest = new Example.SendAppNotificationRequest(
				"Processing Error:",
				`/systemusers(${Xrm.Utility.getGlobalContext().userSettings.userId.replace("{", "").replace("}", "")})`,
				"Processing Errors Detected in Recent Retail/Zone Record Uploads. For More Info Please Review the Processing Error Column",
				200000001, // Priority within the accepted range
				100000002, // Larger icon
				200000000, // Larger toast size
				120000, // Longer expiry time (in seconds)
				null,
				null
			);

			// Execute the notification request
			await Xrm.WebApi.online.execute(SendAppNotificationRequest).then(function (response) {
				if (response.ok) {
					Xrm.Navigation.openAlertDialog({
						text: notificationText
					});
					console.log("Status: %s %s", response.status, response.statusText);
					return response.json();
				}
			})
				.then(function (responseBody) {
					console.log("Response Body: %s", responseBody.NotificationId);
				})
				.catch(function (error) {
					Xrm.Utility.alertDialog(error.message);
				});
		}

	} catch (error) {
		Xrm.Utility.alertDialog(error.message);

	}
	finally {
		return false;
	}
}


function callCustomAction(exe) {
	debugger;
	try {
		var formContext = exe.getFormContext();
		formContext.data.entity.addOnPostSave(callOnLoadFunc);
		function callOnLoadFunc() {
			var retailObject = {};
			//var retailPrice = formContext.getAttribute("bdf_retailprice").getValue();
			retailObject.MyInputParam = formContext.data.entity.getId().slice(1, -1);
			retailObject.MyInputParam1 = formContext.data.entity.getEntityName();

			fetch(Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/bdf_BulkUpdateRetailAction", {
				method: "POST",
				headers: {
					"OData-MaxVersion": "4.0",
					"OData-Version": "4.0",
					"Content-Type": "application/json; charset=utf-8",
					"Accept": "application/json"
				},
				body: JSON.stringify(retailObject)
			}).then(function (response) {
				if (response.ok) {
					console.log("Success");
					return response.json(); // Parse response as JSON
				} else {
					return response.json().then((json) => {
						Xrm.Utility.alertDialog(json.error);
					});
				}
			});
		}
	}
	catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}

}