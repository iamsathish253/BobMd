function onSelect (executionContext){
    debugger;
        //calculateTruck (executionContext);
        try {
            var formContext = executionContext.getFormContext();
            var articleID = formContext.data.entity.getId();
    
            var pageContext = Xrm.Utility.getPageContext();
            var input = pageContext.input;
            var selectedViewId = input.viewId;
    
            if (selectedViewId == '{A3F8AD9F-04AE-ED11-AAD1-00224828DD9C}') {
            } else {
                var pane = Xrm.App.sidePanes.getPane("ArticleCleansingPane");
                if(typeof(pane) == "undefined" || pane == null){
                    Xrm.App.sidePanes.createPane({
                        title: "Article Details",
                        imageSrc: "WebResources/msdyn_/Icons/AnalysisResult.svg",
                        paneId: "ArticleCleansingPane",
                        canClose: true,
                        width: 150
                    }).then((pane) => {
                        pane.navigate({
                            pageType: "entityrecord",
                            entityName: "cr60a_stg_article_master",
                            formId: '{6FFD6DAE-D6C9-4C2C-8430-D5E8C686DB4B}', 
                            entityId: articleID
                        })
                    });
                }    
                else{
                    pane.navigate({
                        pageType: "entityrecord",
                        entityName: "cr60a_stg_article_master",
                        formId: '{6FFD6DAE-D6C9-4C2C-8430-D5E8C686DB4B}', 
                        entityId: articleID
                    })
                };
            }
        } catch (e) {
                    console.log(e.message);
           }
    
        function calculateTruck (executionContext) {
            const formContext = executionContext.getFormContext();
    
            let subgrid = formContext.getControl('truck_calculator');
            
            if (subgrid != null) {
                let rows = getGrid().getRows();
    
            }
            //thisRow.data.entity.attributes.get('ATTRIBUTE_NAME').getValue(); // Or other attribute methods
            //thisRow.data.entity.attributes.get('description').controls.get(0).setDisabled(false); // Or other control methods
        }   
    }
    
    function genericOnSelect (executionContext){
    debugger;
        try {
            var formContext = executionContext.getFormContext();
            var genericID = formContext.data.entity.getId();
    
            var entityFormOptions = {};
            entityFormOptions["entityName"] = "bdf_generic";
            entityFormOptions["entityId"] = genericID;
    
            // Open the form.
            Xrm.Navigation.openForm(entityFormOptions).then(
                function (success) {
                    console.log(success);
                },
                function (error) {
                    console.log(error);
                }
            );
        } catch (e) {
                    console.log(e.message);
           }
    }
    


