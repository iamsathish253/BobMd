function saveCost(executionContext){
    debugger;
    try{
        const formContext = executionContext.getFormContext();
        
       
        console.log("buttonClicked " + formContext);
        
        var labelVisible = window.top.document.querySelector("h1[aria-label='***Note: This action will send data to SAP***']");
        
    
        formContext.ui.footerSection.setVisible(false);
        formContext.ui.headerSection.setBodyVisible(false);
        //formContext.ui.headerSection.setCommandBarVisible(false);
        formContext.ui.headerSection.setTabNavigatorVisible(false);
        
        if (labelVisible) {
            // The "Track Progress" button is visible, so let's disable it
        formContext.getAttribute("bdf_effectivedate").getValue() == null;
         Xrm.Page.getControl("bdf_effectivedate").setVisible(false);
         
         
        
        }
        
        else{
    
    //    formContext.ui.footerSection.setVisible(false);
    //    formContext.ui.headerSection.setBodyVisible(false);
    //    //formContext.ui.headerSection.setCommandBarVisible(false);
    //    formContext.ui.headerSection.setTabNavigatorVisible(false);
        
        if (formContext.getAttribute("bdf_effectivedate").getValue() == null) formContext.getAttribute("bdf_effectivedate").setValue(new Date());
    }
    }
    catch(e){
    Xrm.Utility.alertDialog(e.message);
    }
}