function onLoad(executionContext, eventName) {
	debugger;

	var pageContext = Xrm.Utility.getPageContext();
	var input = pageContext.input;
	var selectedViewId = input.formId;


	// Getting  formContext added by sathish 8/26/2024
	var formContext = executionContext.getFormContext();

	var formType=formContext.ui.getFormType();
	

	//Checking formType if formType is Create then performing operation

	if(formType==1){

		var articelType=formContext.getAttribute("bdf_articletype").getValue();
		var formName = Xrm.Page.ui.formSelector.getCurrentItem().getLabel();

		if(articelType==1 && articelType!=null && formName!="Article Cleansing")
			{
                formContext.getAttribute("cr60a_generalitemcategorygroup").setValue("NORM");
		    }else{
				formContext.getAttribute("cr60a_generalitemcategorygroup").setValue("LUMF");
			}
	}


	 //End 
	 
    // Adding adding addOnload event By Sathish 8/5/2024
	formContext.data.addOnLoad(volumeMandatory);

    // Adding OnChnage of Fields By Sathish 8/5/2024

     // List of fields to register the OnChange event
	 var fields = [
        "bdf_outofpackaginglength",
        "bdf_outofpackagingwidth",
        "bdf_outofpackagingheight"
    ];

    fields.forEach(function(fieldName) {
        var attribute = formContext.getAttribute(fieldName);
        if (attribute) {
            attribute.addOnChange(volumeMandatory);
        }
    });


	//if (selectedViewId == '{200CD13D-8FAC-ED11-AAD1-00224828DDAF}') return;

	// Collapse side panes
	//var pane = Xrm.App.sidePanes.getPane("ArticleCleansingPane");
	//pane.close();
	//Xrm.App.sidePanes.state = 0;



	formContext.getControl("cr60a_warrantylength").setVisible(true);
	if (formContext.getAttribute("cr60a_majorcode") != null) {
		if (formContext.getAttribute("cr60a_majorcode").getValue() == "10") {
			formContext.getControl("cr60a_warrantylength").setVisible(false);
		}
	}

	// Get Project's current milestone
	try {
		if (formContext.getAttribute("bdf_project") != null && formContext.getAttribute("bdf_project").getValue() != null && formContext.getAttribute("bdf_generic").getValue() != null) {
			projectID = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);
			genericGUID = formContext.getAttribute("bdf_generic").getValue()[0].id.slice(1, -1);

			Xrm.WebApi.retrieveRecord("bdf_project", projectID, "?$expand=bpf_bdf_project_bdf_project_milestones($select=_activestageid_value)").then(
				async function success(data) {
					console.log(data);
					let milestone = data.bpf_bdf_project_bdf_project_milestones[0]['_activestageid_value@OData.Community.Display.V1.FormattedValue'];
					let genericStage = await Xrm.WebApi.retrieveRecord("bdf_generic", `${genericGUID}`, "?$select=bdf_genericstage");

					let genericStageName = genericStage["bdf_genericstage@OData.Community.Display.V1.FormattedValue"];
					if (genericStageName) {
						// checking whether project is in sample or further state then makng the article group mandatory
						if (['Sample', 'QC & Compliance', 'Testing & Launch', 'Ready to Buy'].includes(genericStageName)) {
							// Set the "bdf_articlegroup" field as mandatory
							formContext.getAttribute("bdf_articlegroup").setRequiredLevel("required");
						} else {
							// Set the "bdf_articlegroup" field as optional
							formContext.getAttribute("bdf_articlegroup").setRequiredLevel("none");
						}
						if (['QC & Compliance', 'Testing & Launch', 'Ready to Buy'].includes(genericStageName)) //milestone != 'Ready To Buy' &&
							applyProductTypeRules(formContext, true);
						else
							applyProductTypeRules(formContext, false);
						if (['Testing & Launch', 'Ready to Buy'].includes(genericStageName)) {
							formContext.getAttribute("cr60a_salestext").setRequiredLevel("required");
						}
					}
					else {
						// checking whether project is in sample or further state then makng the article group mandatory
						if (['Sample', 'QC & Compliance', 'Testing & Launch', 'Ready To Buy'].includes(milestone)) {
							// Set the "bdf_articlegroup" field as mandatory
							formContext.getAttribute("bdf_articlegroup").setRequiredLevel("required");
						} else {
							// Set the "bdf_articlegroup" field as optional
							formContext.getAttribute("bdf_articlegroup").setRequiredLevel("none");
						}
						if (['QC & Compliance', 'Testing & Launch', 'Ready To Buy'].includes(milestone)) //milestone != 'Ready To Buy' &&
							applyProductTypeRules(formContext, true);
						else
							applyProductTypeRules(formContext, false);
						if (['Testing & Launch', 'Ready To Buy'].includes(milestone)) {
							formContext.getAttribute("cr60a_salestext").setRequiredLevel("required");
						}
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		} else if (formContext.getAttribute("bdf_project") != null && formContext.getAttribute("bdf_project").getValue() == null) {
			applyProductTypeRules(formContext, false);
		} else
			applyProductTypeRules(formContext, true);
	}
	catch (e) {
		Xrm.Utility.alertDialog(e.message);
	}


	function applyProductTypeRules(formContext, mandatoryRule) {
		// Make key fields mandatory
		//	if (selectedViewId != '{200CD13D-8FAC-ED11-AAD1-00224828DDAF}')
		if (formContext.ui.formSelector.getCurrentItem().getId() != '200cd13d-8fac-ed11-aad1-00224828ddaf') {
			formContext.getAttribute("cr60a_style").setRequiredLevel("required");
			formContext.getAttribute("cr60a_collection").setRequiredLevel("required");
			formContext.getAttribute("cr60a_materialgroup").setRequiredLevel("required");
			formContext.getAttribute("cr60a_colorgroup").setRequiredLevel("required");
			formContext.getAttribute("cr60a_upholsterymaterialgroup").setRequiredLevel("required");
			formContext.getAttribute("cr60a_finishgroup").setRequiredLevel("required");
			formContext.getAttribute("cr60a_valueclass").setRequiredLevel("required");
		}
		if (mandatoryRule)
			formContext.getAttribute("cr60a_producttype").setRequiredLevel("required");

		if (formContext.getAttribute("cr60a_producttype").getValue() != null && formContext.getAttribute("cr60a_producttype").getValue()[0].id != null) {
			var productTypeID = formContext.getAttribute("cr60a_producttype").getValue()[0].id.slice(1, -1);
			try {
				Xrm.WebApi.retrieveRecord("cr60a_producttype", productTypeID).then(
					function success(metadata) {
						//console.log(data["cr60a_ptshape"]);
						setFormFields(metadata, formContext, mandatoryRule);
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
	}

	function setFormFields(metadata, formContext, mandatoryRule) {
		try {
			//var formSaveTF = false;
			//get the values 
			for (const item in metadata) {
				if (item.startsWith("cr60a_pt")) {
					//console.log(item);
					//console.log(metadata[item]);

					fieldName = item.replace("cr60a_pt", "cr60a_");

					//formContext.getControl(fieldName).setVisible(false);
					formContext.getAttribute(fieldName).setRequiredLevel("none");
					switch (metadata[item]) {
						case "M":
							formContext.getControl(fieldName).setVisible(true);
							if (mandatoryRule) {
								formContext.getAttribute(fieldName).setRequiredLevel("required");
							}
							break;

						case "O":
							formContext.getControl(fieldName).setVisible(true);
							break;

						case null:
							if (eventName == "onChange") {
								formContext.getAttribute(fieldName).setValue(null);
								//formSaveTF = true;
							}

							formContext.getControl(fieldName).setVisible(false);
					}
				}
			};

			// if (formSaveTF) {
			// 	formContext.data.entity.save();
			// }
		}
		catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	}

	//	if (selectedViewId != '{200CD13D-8FAC-ED11-AAD1-00224828DDAF}') {
	if (/*formContext.ui.formSelector.getCurrentItem().getId() != '200cd13d-8fac-ed11-aad1-00224828ddaf'*/ true) {

		// Get article image URL
		var imageURL = formContext.getAttribute("cr60a_articleimage").getValue();

		// Set article image
		var wrCtrl = formContext.getControl("WebResource_articleimagewr");

		var wrCtrl1 = formContext.getControl("WebResource_articleimagewr1");

		if (wrCtrl != null && wrCtrl != undefined) {
			wrCtrl.getContentWindow().then(function (win) {
				win.loadArticleImage(imageURL);
			});
		}

		if (wrCtrl1 != null && wrCtrl1 != undefined) {
			wrCtrl1.getContentWindow().then(function (win) {
				win.loadArticleImage(imageURL);
			});
		}
	}
}




// code added on 31st Oct: makes article group mandatory after sample stage
function articleGroupMandatory(executionContext) {
	var formContext = executionContext.getFormContext();

	try {
		if (formContext.getAttribute("bdf_project") != null && formContext.getAttribute("bdf_project").getValue() != null) {
			var projectID = formContext.getAttribute("bdf_project").getValue()[0].id.slice(1, -1);
			Xrm.WebApi.retrieveRecord("bdf_project", projectID, "?$expand=bpf_bdf_project_bdf_project_milestones($select=_activestageid_value)").then(
				function success(data) {
					console.log(data);
					var milestone = data.bpf_bdf_project_bdf_project_milestones[0]['_activestageid_value@OData.Community.Display.V1.FormattedValue'];
					// Checking whether the project is in a sample or further state then making the article group mandatory
					if (['Sample', 'QC & Compliance', 'Testing & Launch', 'Ready To Buy'].includes(milestone)) {
						// Set the "bdf_articlegroup" field as mandatory
						formContext.getAttribute("bdf_articlegroup").setRequiredLevel("required");
					} else {
						// Set the "bdf_articlegroup" field as optional
						formContext.getAttribute("bdf_articlegroup").setRequiredLevel("none");
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


// Making Volume Filed Requrid By Sathis --- 8/2/2024

function volumeMandatory(executionContext){

    debugger;

    var formContext=executionContext.getFormContext();

    try {

		var formName = Xrm.Page.ui.formSelector.getCurrentItem().getLabel();

		if(formName!="Article Cleansing"){

			var outofPackagingLength=formContext.getAttribute("bdf_outofpackaginglength").getValue();
			var outofPackagingWidth=formContext.getAttribute("bdf_outofpackagingwidth").getValue();
			var bdf_outofPackagingHeight=formContext.getAttribute("bdf_outofpackagingheight").getValue();


        // Cheking fields contains Values are not
        if(outofPackagingLength!=null || outofPackagingWidth!=null || bdf_outofPackagingHeight!=null ){
             // Set the field "bdf_outofpackagingvolume" to be required
            formContext.getAttribute("bdf_outofpackagingvolume").setRequiredLevel("required");
        } else{
			formContext.getAttribute("bdf_outofpackagingvolume").setRequiredLevel("none");
		}
	}

        
    } catch (error) {

        Xrm.Navigation.openAlertDialog({text: error})
        
    }
}

//End