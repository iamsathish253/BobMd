function assignTeam(executionContext) {
	debugger;

	var formContext = executionContext.getFormContext();

	var subgridName = "Subgrid_new_4"; // replace with your subgrid name

	// Call function to attach onLoad event to the subgrid
	attachOnLoadEventToSubgrid(formContext, subgridName);

	if (formContext.data.entity.getId() == '') {

		// Get user id
		var userSettings = Xrm.Utility.getGlobalContext().userSettings;
		var userGUID = userSettings.userId.slice(1, -1);

		if (formContext.data.entity.getEntityName() == 'bdf_project') {

			if (formContext.getAttribute("bdf_minorcode").getValue() != null) {

				var minorCodeID = formContext.getAttribute("bdf_minorcode").getValue()[0].id.slice(1, -1);
				var minorCode;
				Xrm.WebApi.retrieveRecord("bdf_minorcode", minorCodeID).then(
					function success(results) {
						if (formContext.getAttribute("bdf_sourcetype").getValue() == '3')
							minorCode = "DTC";
						else
							minorCode = results.bdf_minorcode;

						var matched = false;
						//Xrm.WebApi.retrieveMultipleRecords("team", "?$filter=contains(description,'" + majorCode + "')").then(
						Xrm.WebApi.retrieveMultipleRecords("team", "?$filter=contains(description,'Major')").then(
							function success(results) {
								for (team of results.entities) {
									if (team.teamid != "d60f72e0-24d1-ec11-a7b5-0022482074d0" &&
										team.teamid != "7e6a9d47-d63e-ec11-8c60-0022482494b2") {

										if (team.description.includes(minorCode)) {
											// Get Team Name
											var teamName = team.name;
											var lookup = new Array();
											lookup[0] = new Object;
											lookup[0].id = team["teamid"];
											lookup[0].name = teamName;
											lookup[0].entityType = "team";
											formContext.getAttribute("ownerid").setValue(lookup);
											matched = true;
											break;
										}
									}
								}

								if (!matched) {
									// Match team based on major code
									majorCode = " " + minorCode.substring(0, 2);
									for (team of results.entities) {
										if (team.teamid != "d60f72e0-24d1-ec11-a7b5-0022482074d0" &&
											team.teamid != "7e6a9d47-d63e-ec11-8c60-0022482494b2") {

											if (team.description.includes(majorCode)) {
												// Get Team Name
												var teamName = team.name;
												var lookup = new Array();
												lookup[0] = new Object;
												lookup[0].id = team["teamid"];
												lookup[0].name = teamName;
												lookup[0].entityType = "team";
												formContext.getAttribute("ownerid").setValue(lookup);
												break;
											}
										}
									}
								}
							},
							function (error) {
								console.log(error.message);
							}
						);
					}
				);
			}
		}
		//-------------------------------------------------- updating owner id value to New Aricle Info Record when Aricle Info Record created from variant entity by vasudev 02-11-23
		else if (formContext.data.entity.getEntityName() == 'bdf_articleinforecord' && formContext.getAttribute("bdf_articleid").getValue() != null) {
			var variantID = formContext.getAttribute("bdf_articleid").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", variantID).then(
				function success(data) {
					var lookup = new Array();
					lookup[0] = new Object;
					lookup[0].id = data["_ownerid_value"];
					lookup[0].name = data["_ownerid_value@OData.Community.Display.V1.FormattedValue"];
					lookup[0].entityType = "team";
					formContext.getAttribute("ownerid").setValue(lookup);
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}
		//--------------------------------------------------
		//-------------------------------------------------- updating owner id value to New Aricle DC when Aricle DC created from variant entity by vasudev 02-11-23
		else if (formContext.data.entity.getEntityName() == 'bdf_articledc' && formContext.getAttribute("bdf_article").getValue() != null) {
			var variantID = formContext.getAttribute("bdf_article").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", variantID).then(
				function success(data) {
					var lookup = new Array();
					lookup[0] = new Object;
					lookup[0].id = data["_ownerid_value"];
					lookup[0].name = data["_ownerid_value@OData.Community.Display.V1.FormattedValue"];
					lookup[0].entityType = "team";
					formContext.getAttribute("ownerid").setValue(lookup);
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}
		//--------------------------------------------------
		//-------------------------------------------------- updating owner id value to New Package BOM when package BOM created from variant entity by vasudev 02-11-23
		else if (formContext.data.entity.getEntityName() == 'bdf_articlebillofmaterial' && formContext.getAttribute("bdf_packagearticle").getValue() != null) {
			var variantID = formContext.getAttribute("bdf_packagearticle").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", variantID).then(
				function success(data) {
					var lookup = new Array();
					lookup[0] = new Object;
					lookup[0].id = data["_ownerid_value"];
					lookup[0].name = data["_ownerid_value@OData.Community.Display.V1.FormattedValue"];
					lookup[0].entityType = "team";
					formContext.getAttribute("ownerid").setValue(lookup);
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}
		//--------------------------------------------------
		else if (formContext.data.entity.getEntityName() == 'bdf_generic' && formContext.getAttribute("bdf_project").getValue() != null) {
			var projectID = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("bdf_project", projectID).then(
				function success(data) {
					var lookup = new Array();
					lookup[0] = new Object;
					lookup[0].id = data["_ownerid_value"];
					lookup[0].name = data["_ownerid_value@OData.Community.Display.V1.FormattedValue"];
					lookup[0].entityType = "team";
					formContext.getAttribute("ownerid").setValue(lookup);
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		} else if (formContext.data.entity.getEntityName() == 'cr60a_stg_article_master' && formContext.getAttribute("bdf_generic").getValue() != null) {
			var genericID = formContext.getAttribute("bdf_generic").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("bdf_generic", genericID).then(
				function success(data) {
					// Assign team
					var lookup = new Array();
					lookup[0] = new Object;
					lookup[0].id = data["_ownerid_value"];
					lookup[0].name = data["_ownerid_value@OData.Community.Display.V1.FormattedValue"];
					lookup[0].entityType = "team";
					formContext.getAttribute("ownerid").setValue(lookup);

					// Assign project
					var lookup = new Array();
					lookup[0] = new Object;
					lookup[0].id = data["_bdf_project_value"];
					lookup[0].name = data["_bdf_project_value@OData.Community.Display.V1.FormattedValue"];
					lookup[0].entityType = "bdf_project";
					formContext.getAttribute("bdf_project").setValue(lookup);
					formContext.getAttribute("bdf_minorcodenameproject").setValue(data['bdf_minorcode']);

				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}


	}
}

//---------------------------- on change of component qty field present in package tab in variant (package) entity and adding new package BOM by vasudev
function onChangeComponentQty(executionContext) {
	debugger;
	Xrm.Utility.showProgressIndicator("Updating Merch/Retail Cost....");
	var clearsetTime = setTimeout(async function () {
		try {
			var formContext = executionContext.getFormContext();
			var pkgArticle = formContext.getAttribute("bdf_packagearticle").getValue();
			var compArticle = formContext.getAttribute("bdf_componentarticle").getValue();
			var compQty = formContext.getAttribute("bdf_componentqty").getValue();
			//var articleType = Xrm.Page.getAttribute("bdf_articletype").getValue();
			var parentRecordId = pkgArticle[0].id.slice(1, -1);
			var parentRecord = await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", parentRecordId, "?$select=bdf_articletype");
			var articleType = parentRecord.bdf_articletype;

			if (pkgArticle && compArticle && compQty) {
				var packagearticle = pkgArticle[0].id.slice(1, -1);

				const results = await Xrm.WebApi.retrieveMultipleRecords("bdf_articlebillofmaterial", `?$filter=_bdf_packagearticle_value eq '${packagearticle}'`);

				var newMerchCost = 0;
				var newdc1merchcost = 0;
				var newdc2merchcost = 0;
				var newdc3merchcost = 0;
				var newdc4merchcost = 0;
				var newdc5merchcost = 0;
				var newretailPrice = 0;
				var newZone2retailprice = 0;
				var newZone3retailprice = 0;
				var newZone4retailprice = 0;
				var newZone5retailprice = 0;
				var newZone6retailprice = 0;
				var newZone7retailprice = 0;
				var newZone8retailprice = 0;
				var newZone9retailprice = 0;
				var newZone10retailprice = 0;

				for (var i = 0; i < results.entities.length; i++) {
					var entity = results.entities[i];
					var currentQty = entity["bdf_componentqty"];
					var componentarticleid = entity["_bdf_componentarticle_value"];

					if (componentarticleid != null) {
						const result = await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", componentarticleid, "?$select=bdf_cost,bdf_retailprice,bdf_zone10retailprice,bdf_zone2retailprice,bdf_zone3retailprice,bdf_zone4retailprice,bdf_zone5retailprice,bdf_zone6retailprice,bdf_zone7retailprice,bdf_zone8retailprice,bdf_zone9retailprice,bdf_dc1merchcost,bdf_dc2merchcost,bdf_dc3merchcost,bdf_dc4merchcost,bdf_dc5merchcost");
						newMerchCost += result["bdf_cost"] * currentQty;
						newdc1merchcost += result["bdf_dc1merchcost"] * currentQty;
						newdc2merchcost += result["bdf_dc2merchcost"] * currentQty;
						newdc3merchcost += result["bdf_dc3merchcost"] * currentQty;
						newdc4merchcost += result["bdf_dc4merchcost"] * currentQty;
						newdc5merchcost += result["bdf_dc5merchcost"] * currentQty;
						newretailPrice += result["bdf_retailprice"] * currentQty;
						newZone2retailprice += result["bdf_zone2retailprice"] * currentQty;
						newZone3retailprice += result["bdf_zone3retailprice"] * currentQty;
						newZone4retailprice += result["bdf_zone4retailprice"] * currentQty;
						newZone5retailprice += result["bdf_zone5retailprice"] * currentQty;
						newZone6retailprice += result["bdf_zone6retailprice"] * currentQty;
						newZone7retailprice += result["bdf_zone7retailprice"] * currentQty;
						newZone8retailprice += result["bdf_zone8retailprice"] * currentQty;
						newZone9retailprice += result["bdf_zone9retailprice"] * currentQty;
						newZone10retailprice += result["bdf_zone10retailprice"] * currentQty;
					}
				}

				if (articleType == '2') {
					var obj = {
						...(newMerchCost !== 0 && { "bdf_cost": newMerchCost }),
						...(newdc1merchcost !== 0 && { "bdf_dc1merchcost": newdc1merchcost }),
						...(newdc2merchcost !== 0 && { "bdf_dc2merchcost": newdc2merchcost }),
						...(newdc3merchcost !== 0 && { "bdf_dc3merchcost": newdc3merchcost }),
						...(newdc4merchcost !== 0 && { "bdf_dc4merchcost": newdc4merchcost }),
						...(newdc5merchcost !== 0 && { "bdf_dc5merchcost": newdc5merchcost })
					};
				} else {
					var obj = {
						...(newMerchCost !== 0 && { "bdf_cost": newMerchCost }),
						...(newdc1merchcost !== 0 && { "bdf_dc1merchcost": newdc1merchcost }),
						...(newdc2merchcost !== 0 && { "bdf_dc2merchcost": newdc2merchcost }),
						...(newdc3merchcost !== 0 && { "bdf_dc3merchcost": newdc3merchcost }),
						...(newdc4merchcost !== 0 && { "bdf_dc4merchcost": newdc4merchcost }),
						...(newdc5merchcost !== 0 && { "bdf_dc5merchcost": newdc5merchcost }),
						...(newretailPrice !== 0 && { "bdf_retailprice": newretailPrice }),
						...(newZone2retailprice !== 0 && { "bdf_zone2retailprice": newZone2retailprice }),
						...(newZone3retailprice !== 0 && { "bdf_zone3retailprice": newZone3retailprice }),
						...(newZone4retailprice !== 0 && { "bdf_zone4retailprice": newZone4retailprice }),
						...(newZone5retailprice !== 0 && { "bdf_zone5retailprice": newZone5retailprice }),
						...(newZone6retailprice !== 0 && { "bdf_zone6retailprice": newZone6retailprice }),
						...(newZone7retailprice !== 0 && { "bdf_zone7retailprice": newZone7retailprice }),
						...(newZone8retailprice !== 0 && { "bdf_zone8retailprice": newZone8retailprice }),
						...(newZone9retailprice !== 0 && { "bdf_zone9retailprice": newZone9retailprice }),
						...(newZone10retailprice !== 0 && { "bdf_zone10retailprice": newZone10retailprice })
					};
				}


				const updateResult = await Xrm.WebApi.updateRecord("cr60a_stg_article_master", packagearticle, obj);
				Xrm.Utility.closeProgressIndicator();
				clearTimeout(clearsetTime);
				formContext.data.refresh();
				var updatedId = updateResult.id;
				console.log(updatedId);
			}

			else {
				Xrm.Utility.closeProgressIndicator();
			}
		} catch (error) {
			Xrm.Utility.closeProgressIndicator();
			clearTimeout(clearsetTime);
			Xrm.Utility.alertDialog(error.message);
		}
	}, 1000)

}


//----------------------------------------------------- Recalculate Merch/Retail cost on record deletion in package subgrid by vasudev

function recalMerchRetailAfterDeletion(formContext) { //implemented onLoad of variant entity
	debugger;
	try {

		if (formContext) {
			// Attach an event handler to the OnSave event of the subgrid
			setTimeout(async function () {  // function will trigger onLoad of subgrid
				// Get the current record count
				debugger;
				Xrm.Utility.showProgressIndicator("Updating Merch/Retail Cost....");
				//subgrid.removeOnLoad(arguments.callee);
				var variantId = formContext.data.entity.getId().slice(1, -1);
				//Xrm.Page.data.entity.getId().slice(1, -1);
				// Xrm.Utility.showProgressIndicator("Updating Merch Cost/ Retail....");
				var articleType = Xrm.Page.getAttribute("bdf_articletype").getValue();
				const results = await Xrm.WebApi.retrieveMultipleRecords("bdf_articlebillofmaterial", `?$filter=_bdf_packagearticle_value eq '${variantId}'`);

				if (results.entities.length > 0) {


					var newMerchCost = 0;
					var newdc1merchcost = 0;
					var newdc2merchcost = 0;
					var newdc3merchcost = 0;
					var newdc4merchcost = 0;
					var newdc5merchcost = 0;
					var newretailPrice = 0;
					var newZone2retailprice = 0;
					var newZone3retailprice = 0;
					var newZone4retailprice = 0;
					var newZone5retailprice = 0;
					var newZone6retailprice = 0;
					var newZone7retailprice = 0;
					var newZone8retailprice = 0;
					var newZone9retailprice = 0;
					var newZone10retailprice = 0;

					for (var i = 0; i < results.entities.length; i++) {
						var entity = results.entities[i];
						var currentQty = entity["bdf_componentqty"];
						var componentarticleid = entity["_bdf_componentarticle_value"];

						if (componentarticleid != null) {
							const result = await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", componentarticleid, "?$select=bdf_cost,bdf_retailprice,bdf_zone10retailprice,bdf_zone2retailprice,bdf_zone3retailprice,bdf_zone4retailprice,bdf_zone5retailprice,bdf_zone6retailprice,bdf_zone7retailprice,bdf_zone8retailprice,bdf_zone9retailprice,bdf_dc1merchcost,bdf_dc2merchcost,bdf_dc3merchcost,bdf_dc4merchcost,bdf_dc5merchcost");
							newMerchCost += result["bdf_cost"] * currentQty;
							newdc1merchcost += result["bdf_dc1merchcost"] * currentQty;
							newdc2merchcost += result["bdf_dc2merchcost"] * currentQty;
							newdc3merchcost += result["bdf_dc3merchcost"] * currentQty;
							newdc4merchcost += result["bdf_dc4merchcost"] * currentQty;
							newdc5merchcost += result["bdf_dc5merchcost"] * currentQty;
							newretailPrice += result["bdf_retailprice"] * currentQty;
							newZone2retailprice += result["bdf_zone2retailprice"] * currentQty;
							newZone3retailprice += result["bdf_zone3retailprice"] * currentQty;
							newZone4retailprice += result["bdf_zone4retailprice"] * currentQty;
							newZone5retailprice += result["bdf_zone5retailprice"] * currentQty;
							newZone6retailprice += result["bdf_zone6retailprice"] * currentQty;
							newZone7retailprice += result["bdf_zone7retailprice"] * currentQty;
							newZone8retailprice += result["bdf_zone8retailprice"] * currentQty;
							newZone9retailprice += result["bdf_zone9retailprice"] * currentQty;
							newZone10retailprice += result["bdf_zone10retailprice"] * currentQty;
						}
					}

					if (articleType == '2') {
						var obj = {
							...(newMerchCost !== 0 && { "bdf_cost": newMerchCost }),
							...(newdc1merchcost !== 0 && { "bdf_dc1merchcost": newdc1merchcost }),
							...(newdc2merchcost !== 0 && { "bdf_dc2merchcost": newdc2merchcost }),
							...(newdc3merchcost !== 0 && { "bdf_dc3merchcost": newdc3merchcost }),
							...(newdc4merchcost !== 0 && { "bdf_dc4merchcost": newdc4merchcost }),
							...(newdc5merchcost !== 0 && { "bdf_dc5merchcost": newdc5merchcost })
						};
					} else {
						var obj = {
							...(newMerchCost !== 0 && { "bdf_cost": newMerchCost }),
							...(newdc1merchcost !== 0 && { "bdf_dc1merchcost": newdc1merchcost }),
							...(newdc2merchcost !== 0 && { "bdf_dc2merchcost": newdc2merchcost }),
							...(newdc3merchcost !== 0 && { "bdf_dc3merchcost": newdc3merchcost }),
							...(newdc4merchcost !== 0 && { "bdf_dc4merchcost": newdc4merchcost }),
							...(newdc5merchcost !== 0 && { "bdf_dc5merchcost": newdc5merchcost }),
							...(newretailPrice !== 0 && { "bdf_retailprice": newretailPrice }),
							...(newZone2retailprice !== 0 && { "bdf_zone2retailprice": newZone2retailprice }),
							...(newZone3retailprice !== 0 && { "bdf_zone3retailprice": newZone3retailprice }),
							...(newZone4retailprice !== 0 && { "bdf_zone4retailprice": newZone4retailprice }),
							...(newZone5retailprice !== 0 && { "bdf_zone5retailprice": newZone5retailprice }),
							...(newZone6retailprice !== 0 && { "bdf_zone6retailprice": newZone6retailprice }),
							...(newZone7retailprice !== 0 && { "bdf_zone7retailprice": newZone7retailprice }),
							...(newZone8retailprice !== 0 && { "bdf_zone8retailprice": newZone8retailprice }),
							...(newZone9retailprice !== 0 && { "bdf_zone9retailprice": newZone9retailprice }),
							...(newZone10retailprice !== 0 && { "bdf_zone10retailprice": newZone10retailprice })
						};
					}

					const updateResult = await Xrm.WebApi.updateRecord("cr60a_stg_article_master", variantId, obj);
					Xrm.Utility.closeProgressIndicator();
					clearTimeout(clearsetTime);
					var updatedId = updateResult.id;
					console.log(updatedId);

					//-------------------------------------------------
					//var formContext = executionContext.getFormContext();
					// var userId = Xrm.Utility.getGlobalContext().userSettings.userId;
					// var ownerLookup = Xrm.Page.getAttribute("ownerid").getValue();

					// if (ownerLookup && ownerLookup[0].entityType === "team") {
					// 	var requiredTeamName = ownerLookup[0].name;
					// 	var teamId = null;

					// 	try {
					// 		var teamQuery = "?$filter=name eq '" + requiredTeamName + "'&$select=teamid";
					// 		Xrm.WebApi.retrieveMultipleRecords("team", teamQuery).then(
					// 			async function (teamResults) {
					// 				if (teamResults.entities.length > 0) {
					// 					teamId = teamResults.entities[0].teamid;

					// 					try {
					// 						var userTeamQuery = "?$filter=systemuserid eq " + userId + " and teamid eq " + teamId;
					// 						var teamMembershipResults = await Xrm.WebApi.retrieveMultipleRecords("teammembership", userTeamQuery);

					// 						if (teamMembershipResults.entities.length === 0) {
					// 							console.log(`your'e not a part of the ${requiredTeamName} Team so that you're unable to perform update operation.`)
					// 							return;

					// 						}

					// 						else{
					// 							const updateResult = await Xrm.WebApi.updateRecord("cr60a_stg_article_master", variantId, obj);
					// 							// Xrm.Utility.closeProgressIndicator();
					// 							 var updatedId = updateResult.id;
					// 							 console.log(updatedId);
					// 						}
					// 					} catch (error) {
					// 						console.log(error.message);
					// 					}
					// 				}
					// 			},
					// 			function (error) {
					// 				console.log(error.message);
					// 			}
					// 		);
					// 	} catch (error) {
					// 		console.log(error.message);
					// 	}
					// }
					//-------------------------------------------------
				}
				else {
					Xrm.Utility.closeProgressIndicator();
				}
			}, 4000);
		}

	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

// form and subgrid refresh on tab change

async function formSubgridRefresh(executionContext) { // some times on delete of a record in subgrid won't refresh inorder to make it refresh we should implement this function on tab change to refresh the subgrid
	debugger;
	try {
		var formContext = executionContext.getFormContext();

		await formContext.getControl("Subgrid_new_4").refresh();
		//Xrm.Page.ui.refresh()
		formContext.data.refresh();
	}

	catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}

//----------------------------------------------
function ValidateSubgridRecord() {
	debugger;
	try {
		//Replace the subgrid name in below
		if (Xrm.Page.getAttribute("bdf_articletype").getValue() == 1) {
			return false;
		}
		else {
			//Xrm.Page.ui.clearFormNotification("2001"); // Clear notification
			return true;
		}
	}
	catch (error) {
		//Xrm.Utility.alertDialog(error.message);
		console.log(error.message);
	}
}

//attach onchange event to all the fields when Package BOM Subgrid  loaded

function attachOnLoadEventToSubgrid(formContext, subgridName) {
	var subgrid = formContext.getControl(subgridName);
	if (subgrid) {
		// Add an event handler to the OnLoad event of the subgrid
		subgrid.addOnLoad(function () {
			attachOnChangeEventsToSubgridFields(subgrid);
		});
	}
}

function attachOnChangeEventsToSubgridFields(subgrid) {
	var gridContext = subgrid.getGrid();
	if (gridContext) {
		var rows = gridContext.getRows();
		rows.forEach(function (row) {
			var rowData = row.getData();
			var attributes = rowData.entity.attributes.getAll();

			attributes.forEach(function (attribute) {
				attribute.addOnChange(myOnChangeHandler);
			});
		});
	}
}

function myOnChangeHandler(executionContext) {
    debugger;
	var column = executionContext.getEventSource();
	// Perform your custom logic here
	var formContext = executionContext.getFormContext();
	formContext.data.entity.save();
	//alert("Field changed: " + column.getName());

}