function formOnLoadAddEvent(executionContext) {
    debugger;

	try {
		
		var execContext = executionContext;
		var tab = Xrm.Page.ui.tabs.getByName('variant_dim_margin');
		tab.addTabStateChange(function(){
			if(tab.getDisplayState() === 'expanded') {
				retry(execContext);
			}
		});
	} catch (e) {
		Xrm.Utility.alertDialog(e.message);
	}

	function retry(execContext) {
		elem = window.top.document.getElementById("MscrmControls.Containers.ReferencePanelControl-ReferencePanelControlStaticNavigationItem_5");
		if (elem != null) {
			elem.addEventListener("click", function() {
				debugger;
				console.log("Click Event Detected");
				var formContext = execContext.getFormContext();
				var tabObj = formContext.ui.tabs.get("variant_dim_margin");
				var sectionObj = tabObj.sections.get("truck_type");
				sectionObj.setVisible(true);
				var sectionObj = tabObj.sections.get("dc_trucks");
				sectionObj.setVisible(true);
			});
			return;
		} else {
			setTimeout(retry, 2000, execContext)
		}
	}
}


//------------------------------------------- to make mandatory fields on onload event of project by vasudev 10-20-23
function formOnLoadMakeReqFields(executionContext) {
    debugger;

	try {
		var formContext = executionContext.getFormContext();

		if(formContext.ui.getFormType() == 1){
			//set required level
			formContext.getAttribute("bdf_collection").setRequiredLevel("none");

		}
	}
	catch (e) {
		Xrm.Utility.alertDialog(e.message);
	}

}
//-------------------------------------------