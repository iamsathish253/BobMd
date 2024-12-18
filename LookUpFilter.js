function onLoadLookUpFilter(executionContext){

    debugger;

    var formContext=executionContext.getFormContext();

    // Adding addPreSearch for Specific Color Group by Sathish 09/10/2024 bdf_specificfinish

	var entityName=formContext.data.entity.getEntityName();

	if(entityName=="cr60a_stg_article_master"){

		formContext.getControl("bdf_specificcolor").addPreSearch(filterSpecificColorGroup);
		formContext.getControl("bdf_specificfinish").addPreSearch(filterSpecificFinishGroup);

	}

	//addOnPreSearch of Specific Color and Specific Finish By Sathish 9/18/2020
	var entityName=formContext.data.entity.getEntityName();

	if(entityName=="bdf_generic"){

		formContext.getControl("bdf_specificcolorlkp").addPreSearch(filiterSpecificColorgeneric);
		formContext.getControl("bdf_specificfinishlkp").addPreSearch(filiterSpecificFinishgeneric);

	}

}


//filtering Specific Color Group based on Variant Color Group and Generic Color Group by sathish 9/10/2024

function filterSpecificColorGroup(executionContext) {

    debugger;

    var formContext = executionContext.getFormContext();

    try {
        // Getting Color Group from Variant
        var colorGroup = formContext.getAttribute("cr60a_colorgroup").getValue();
        var genericValue = formContext.getAttribute("bdf_generic").getValue();
       // var bdf_colorgroup, bdf_colorgroup_formatted;

		// If color group from variant is not null, filter lookup based on that
		if (colorGroup != null && colorGroup != undefined) {
		var colorGroupGuid = colorGroup[0].id.slice(1, -1).toLowerCase();
		var colorName = colorGroup[0].name;

		filterLookUpColor(colorName, colorGroupGuid, formContext);
		return;
	    }
        
		//Getting QuickVieControl to get Values

		var quickViewControl=formContext.ui.quickForms.get("QuickviewControl1680446661136");

		if(quickViewControl!=undefined){
			var genericValue=quickViewControl.getAttribute("bdf_colorgroup").getValue();

			if(genericValue!=null && genericValue!=undefined){
				var genericId=genericValue[0].id.slice(1,-1);
				var genericName=genericValue[0].name;
				filterLookUpColor(genericName, genericId, formContext);
				return;
				
			}else{

				var customFilter = "<filter type='and'>" +
							"<condition attribute='statecode' operator='eq' value='0' />" +
							"<condition attribute='bdf_colorgroup' operator='null' />" +
							"</filter>";

		        formContext.getControl("bdf_specificcolor").addCustomFilter(customFilter);

			}
	
		}
    
    } catch (error) {
        Xrm.Navigation.openErrorDialog({ message: error.message });
    }
}


//filtering Specific Finish Group based on Variant Finish Group and Generic Color Group by sathish 9/10/2024

function filterLookUpColor(name, Guid, formContext) {
    debugger;

    var customFilter = "<filter type='and'>" +
                        "<condition attribute='statecode' operator='eq' value='0' />" +
                        "<condition attribute='bdf_colorgroup' operator='eq' uiname='" + name + "' uitype='cr60a_colorgroup' value='" + Guid + "' />" +
                        "</filter>";

    // Adding custom filter to specific Color Group bdf_specificcolor
    formContext.getControl("bdf_specificcolor").addCustomFilter(customFilter);
}



function filterSpecificFinishGroup(executionContext) {

    debugger;

    var formContext = executionContext.getFormContext();

    try {
        // Getting Color Group from Variant
        var finishGroup = formContext.getAttribute("cr60a_finishgroup").getValue();
        var genericValue = formContext.getAttribute("bdf_generic").getValue();
       // var bdf_colorgroup, bdf_colorgroup_formatted;

		// If color group from variant is not null, filter lookup based on that
		if (finishGroup != null && finishGroup != undefined) {
		var finishGroupGuid = finishGroup[0].id.slice(1, -1).toLowerCase();
		var finishName = finishGroup[0].name;

		filterLookUpFinish(finishName, finishGroupGuid, formContext);
		return;
	    }

     //Getting QuickVieControl to get Values

		var quickViewControl=formContext.ui.quickForms.get("QuickviewControl1680446661136");

		if(quickViewControl!=undefined){
			var genericValue=quickViewControl.getAttribute("bdf_finishgroup").getValue();

			if(genericValue!=null && genericValue!=undefined){
				var genericId=genericValue[0].id.slice(1,-1);
				var genericName=genericValue[0].name;
				filterLookUpFinish(genericName, genericId, formContext);
				return;
				
			}else{

				var customFilter = "<filter type='and'>"+
									"<condition attribute='statecode' operator='eq' value='0' />"+
									"<condition attribute='bdf_finishgroup' operator='null' />"+
									"</filter>"

		        formContext.getControl("bdf_specificfinish").addCustomFilter(customFilter);

			}
	
		}
    
    } catch (error) {
        Xrm.Navigation.openErrorDialog({ message: error.message });
    }
}



//filtering Specific Finish Group based on Variant Finish Group and Generic Color Group by sathish 9/10/2024

function filterLookUpFinish(name, Guid, formContext) {
    debugger;

    var customFilter = "<filter type='and'>"+
"<condition attribute='statecode' operator='eq' value='0' />"+
"<condition attribute='bdf_finishgroup' operator='eq' uiname='"+name+"' uitype='cr60a_finishgroup' value='"+Guid+"' />"+
"</filter>"

    // Adding custom filter to specific Color Group bdf_specificcolor
    formContext.getControl("bdf_specificfinish").addCustomFilter(customFilter);
}

 
// Filtering Specific Color and Finish in Generic Table based on Color Group and Finish Group by Sathish 9/18/2024


function filiterSpecificColorgeneric(executionContext){

	debugger

	try {

		var formContext=executionContext.getFormContext();
		var colorGroup=formContext.getAttribute("bdf_colorgroup").getValue();


		if(colorGroup!=null && colorGroup!=undefined){
			var colorGroupGuid=colorGroup[0].id.slice(1,-1);

			var fetchXmlQurey="<filter type='and'>"+
								" <condition attribute='statecode' operator='eq' value='0' />"+
								" <condition attribute='bdf_colorgroup' operator='eq' uiname='Black' uitype='cr60a_colorgroup' value='"+colorGroupGuid+"' />"+
								"</filter>"
			//adding Custom Filter to Specific Color Group
			formContext.getControl("bdf_specificcolorlkp").addCustomFilter(fetchXmlQurey);


		}else{

            var fetchXmlQurey="<filter type='and'>"+
                                "<condition attribute='statecode' operator='eq' value='0' />"+
                                "<condition attribute='bdf_colorgroup' operator='null' />"+
                                "</filter>"

            //adding Custom Filter to Specific Color Group
			formContext.getControl("bdf_specificcolorlkp").addCustomFilter(fetchXmlQurey);
        
        }
		
	} catch (error) {

		Xrm.Navigation.openAlertDialog({message: error.message });
		
	}
}


function filiterSpecificFinishgeneric(executionContext){

	debugger

	try {

		var formContext=executionContext.getFormContext();
		var finishGroup=formContext.getAttribute("bdf_finishgroup").getValue();
		

		if(finishGroup!=null && finishGroup!=undefined){
			var finishGroupGuid=finishGroup[0].id.slice(1,-1);

			var fetchXmlQurey="<filter type='and'>"+
								" <condition attribute='statecode' operator='eq' value='0' />"+
								"<condition attribute='bdf_finishgroup' operator='eq' uiname='Blue' uitype='cr60a_finishgroup' value='"+finishGroupGuid+"' />"+
								"</filter>"
			//adding Custom Filter to Specific Color Group
			formContext.getControl("bdf_specificfinishlkp").addCustomFilter(fetchXmlQurey);


		}else
        {
            var fetchXmlQurey="<filter type='and'>"+
                            "<condition attribute='statecode' operator='eq' value='0' />"+
                            "<condition attribute='bdf_finishgroup' operator='null' />"+
                            "</filter>"

            //adding Custom Filter to Specific Color Group
			formContext.getControl("bdf_specificfinishlkp").addCustomFilter(fetchXmlQurey);
        }
		
	} catch (error) {

		Xrm.Navigation.openAlertDialog({message: error.message });
		
	}
}
