function showHideDeliveryAddressSec(executionContext){
  debugger;
  var formContext = executionContext.getFormContext();
  var addressChangeInd = formContext.getAttribute("bdf_deliveryaddresschangeind").getValue();

  // Check if the field value is true or false
  if (addressChangeInd) {
      // If true, show the delivery_address_change section
      formContext.ui.tabs.get("OrderDetails").sections.get("delivery_address_change").setVisible(true);
  } else {
      // If false, hide the delivery_address_change section
      formContext.ui.tabs.get("OrderDetails").sections.get("delivery_address_change").setVisible(false);
  }
  //show hide Docusign Section based on Order Type
  if( formContext.getAttribute("bdf_ordertype").getValue() == 'Web'){
  
  formContext.ui.tabs.get("OrderDetails").sections.get("null_section_8").setVisible(false);
   
  }
  else{
  formContext.getControl("bdf_guestcheckoutind").setVisible(false);
  }
}


// Changeing bgColor of Choice Column by sathish 10/23/2924

function ColorChange(formContext){
  debugger;

  try {


      //Making bdf_proposedforfraudreview Value Red if it is Yes
      var bdf_proposedforfraudreview=formContext.getAttribute("bdf_proposedforfraudreview").getValue();
      
      if(bdf_proposedforfraudreview==1){
          window.top.document.querySelector('[data-id="bdf_proposedforfraudreview.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";

          window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-1-bdf_proposedforfraudreview-field-label").style.color="red";
      }

       //Making bdf_proposedforfraudreview Value Red if it is Yes
      var bdf_returningfraudsterind=formContext.getAttribute("bdf_returningfraudsterind").getValue();
  
      if(bdf_returningfraudsterind==1){
      window.top.document.querySelector('[data-id="bdf_returningfraudsterind.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";

      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-2-bdf_returningfraudsterind-field-label").style.color="red";
         
         
      window.top.document.querySelector('[data-id="bdf_returningfraudstertrigger.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-13-bdf_returningfraudstertrigger-field-label").style.color="red";
  
      }

      //Making bdf_deliveryaddresschangedrecentlyind Value Red if it is Yes

      var bdf_deliveryaddresschangedrecentlyind=formContext.getAttribute("bdf_deliveryaddresschangedrecentlyind").getValue();

      if(bdf_deliveryaddresschangedrecentlyind==1){

          window.top.document.querySelector('[data-id="bdf_deliveryaddresschangedrecentlyind.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";

          window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-5-bdf_deliveryaddresschangedrecentlyind-field-label").style.color="red";           
      }


       //Making bdf_sameaccountdifferentcustomerind Value Red if it is Yes

      var bdf_sameaccountdifferentcustomerind=formContext.getAttribute("bdf_sameaccountdifferentcustomerind").getValue();

      if(bdf_sameaccountdifferentcustomerind==1){

          window.top.document.querySelector('[data-id="bdf_sameaccountdifferentcustomerind.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";

          window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-3-bdf_sameaccountdifferentcustomerind-field-label").style.color="red";           
      }

       //Making bdf_deliveryaddresschangedrecentlyind Value Red if it is Yes
  
      var bdf_financingaccounttheftindicator=formContext.getAttribute("bdf_financingaccounttheftindicator").getValue();

      if(bdf_financingaccounttheftindicator==1){
      //window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-4-bdf_bdf_financingaccounttheftindicatorf9a8a302-114e-466a-b582-6771b2ae0d92-bdf_financingaccounttheftindicator\\.fieldControl-toggle-container .r13wlxb8").style.backgroundColor = "red";
      window.top.document.querySelector('[data-id="bdf_financingaccounttheftindicator.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";

      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-6-bdf_financingaccounttheftindicator-field-label").style.color="red";     
      
      window.top.document.querySelector('[data-id="bdf_financingapplicationtrigger.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-14-bdf_financingapplicationtrigger-field-label").style.color="red";
    }

    //Checking ML Prediction Score if it is more than 80 or Equle making ML Positive Triggers & ML Negative Triggers Red

    var MlPredection=formContext.getAttribute("bdf_mlpredictionscore").getValue();

    if(MlPredection>=80){

      window.top.document.querySelector('[data-id="bdf_mlpositivetriggers.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-19-bdf_mlpositivetriggers-field-label").style.color="red";
      window.top.document.querySelector('[data-id="bdf_mlnegativetriggers.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-20-bdf_mlnegativetriggers-field-label").style.color="red";

    }


    //Sold To Ship To Address Match Ind

    
    var bdf_soldtoshiptoaddressmatchind=formContext.getAttribute("bdf_soldtoshiptoaddressmatchind").getValue();

    if(bdf_soldtoshiptoaddressmatchind==1){

      window.top.document.querySelector('[data-id="bdf_soldtoshiptoaddressmatchind.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-46-bdf_soldtoshiptoaddressmatchind-field-label").style.color="red";
    }


    var bdf_docusignholdind=formContext.getAttribute("bdf_docusignholdind").getValue();

    if(bdf_docusignholdind==1){

      window.top.document.querySelector('[data-id="bdf_docusignholdind.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-83-bdf_docusignholdind-field-label").style.color="red";
    }

    //bdf_docusignverification

    var bdf_docusignverification=formContext.getAttribute("bdf_docusignverification").getValue();

    if(bdf_docusignverification!=3){

      window.top.document.querySelector('[data-id="bdf_docusignverification.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-78-bdf_docusignverification-field-label").style.color="red";
    }
   

    // Stop the interval after 10 seconds
    setTimeout(function () {
      //bdf_distancebetweensoldtoandshipto

    var bdf_distancebetweensoldtoandshipto=formContext.getAttribute("bdf_distancebetweensoldtoandshipto").getValue();

    if(bdf_distancebetweensoldtoandshipto>100){

      window.top.document.querySelector('[data-id="bdf_distancebetweensoldtoandshipto.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-43-bdf_distancebetweensoldtoandshipto-field-label").style.color="red";
    }

    //bdf_distancebetweensoldtoandstore

    var bdf_distancebetweensoldtoandstore=formContext.getAttribute("bdf_distancebetweensoldtoandstore").getValue();

    if(bdf_distancebetweensoldtoandstore>100){

      window.top.document.querySelector('[data-id="bdf_distancebetweensoldtoandstore.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-44-bdf_distancebetweensoldtoandstore-field-label").style.color="red";
    }

    //bdf_distancebetweenshiptoandstore


    var bdf_distancebetweenshiptoandstore=formContext.getAttribute("bdf_distancebetweenshiptoandstore").getValue();

    if(bdf_distancebetweenshiptoandstore>100){

      window.top.document.querySelector('[data-id="bdf_distancebetweenshiptoandstore.fieldControl-pcf-container-id"] .f1pivz5x').style.color="red";
      window.top.document.querySelector("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-45-bdf_distancebetweenshiptoandstore-field-label").style.color="red";
    }
          
    }, 1000); // 10 seconds

    
  
  } catch (error) {
      //Xrm.Utility.alertDialog(error.message);
      console.log(error.message);

      
  }
}


// //var stopInterval; // Declare stopInterval globally

function onFormLoad1(executionContext) {

var formContext = executionContext.getFormContext(); // Get the form context 

//var formContext=executionContext


// Start the color change every 500 milliseconds
var intervalId = setInterval(function () {
  ColorChange(formContext);
}, 500); // Run every 500 ms

// Stop the interval after 10 seconds
setTimeout(function () {
  clearInterval(intervalId);
}, 60000); // 10 seconds
      
  

}








