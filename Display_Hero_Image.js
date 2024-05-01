function displayHeroImage(executionContext)
{
	debugger;
	let formContext = executionContext.getFormContext();
	let gridContext = formContext.getControl("sharepoint_doc"); // get the grid context
    console.log("gridContext: " +gridContext);

	gridContext.addOnLoad(heroImage);
 
	function heroImage(executionContext)
	{
		debugger;
		console.log("Subgrid OnLoad event occurred...");
		let formContext = executionContext.getFormContext();
		// Get URL to display
		let subgrid = Xrm.Page.ui.controls.get("sharepoint_doc");
		console.log("subgrid: " +subgrid);
		var row = subgrid.getGrid().getRows().getAll()[0];
		//if (row != undefined) {
		// Check if top seller article is provided.
		let imageURL;
		
		if (formContext.getAttribute("bdf_topsellerarticleid").getValue() != null){
			imageURL = formContext.getAttribute("bdf_url").getValue();
		}

		let library = formContext.data.getEntity().getEntityName();
		
		if (subgrid.getGrid().getTotalRecordCount() == 0)
		{
			if (imageURL == null || imageURL == undefined)
			{
				if (library == "bdf_project") formContext.ui.tabs.get("Project").sections.get("section_hero").setVisible(false);
				else formContext.ui.tabs.get("Generic").sections.get("section_hero").setVisible(false);
				return;
			}
		}
		else
		{
			let file = row.getAttribute("relativelocation").getValue();
			let hero = row.getAttribute("bdf_heroimage").getValue();
			if (hero == "No")
			{
				if (imageURL == null || imageURL == undefined)
				{
					if (library == "bdf_project") formContext.ui.tabs.get("Project").sections.get("section_hero").setVisible(false);
					else formContext.ui.tabs.get("Generic").sections.get("section_hero").setVisible(false);
					return;
				}
			}
			else if (hero == "Yes")
			{
				//imageURL = "https://mybobs.sharepoint.com/sites/ARTICLEMDM/" + library + "/" + file;
				let currentURL = window.location.href;
				if (currentURL.includes("org5aabaa88")) imageURL = "https://mybobs.sharepoint.com/sites/ArticleMDMDevSite/" + library + "/" + file;
				else imageURL = "https://mybobs.sharepoint.com/sites/ARTICLEMDM/" + library + "/" + file;
			}
		}
		if (library == "bdf_project") formContext.ui.tabs.get("Project").sections.get("section_hero").setVisible(true);
		else formContext.ui.tabs.get("Generic").sections.get("section_hero").setVisible(true);
		// find web resource
		let wrCtrl = formContext.getControl("WebResource_hero");
		// Set web resource image



		if (wrCtrl != null && wrCtrl != undefined)
		{
			//let src = wrCtrl.getSrc();
			//wrCtrl.setSrc(imageURL);
			wrCtrl.getContentWindow().then(function (win)
			{
				win.loadArticleImage(imageURL);

				function reloadImage() {
					win.loadArticleImage(imageURL);
				}
			// Set interval to reload the image every 2 seconds
			let intervalId = setInterval(reloadImage, 2000);

			// Stop reloading after 30 seconds
			setTimeout(function() {
				clearInterval(intervalId);
			}, 30000); // 30 seconds in milliseconds
					});

			
		}

		}
		
		//} else {
		//	setTimeout(heroImage, 3000, executionContext);
			//}
	}

	

