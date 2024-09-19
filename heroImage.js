function displayHeroImage(executionContext)
{
	debugger;
	let formContext = executionContext.getFormContext();
	let gridContext = formContext.getControl("sharepoint_doc"); // get the grid context
    
    console.log("gridContext: " +gridContext);

	function heroImage(executionContext)
	{
		console.log("Subgrid OnLoad event occurred...");
		let formContext = executionContext.getFormContext();
		// Get URL to display
		let subgrid = Xrm.Page.ui.controls.get("sharepoint_doc");
        //console.log("subgrid: " +subgrid);
		var row = subgrid.getGrid().getRows().getAll()[0];
		//if (row != undefined) {
		// Check if top seller article is provided.
		let imageURL
		if (formContext.getAttribute("bdf_topsellerarticleid").getValue() != null) imageURL = formContext.getAttribute("bdf_url").getValue();
		let library = formContext.data.getEntity().getEntityName();
		if (subgrid.getGrid().getTotalRecordCount() == 0)
		{
			if (imageURL == null)
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
				if (imageURL == null)
				{
					if (library == "bdf_project") formContext.ui.tabs.get("Project").sections.get("section_hero").setVisible(false);
					else formContext.ui.tabs.get("Generic").sections.get("section_hero").setVisible(false);
					return;
				}
			}
			else if (hero == "Yes" && formContext.getAttribute("bdf_topsellerarticleid").getValue() == null)
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
			});
		}
		//} else {
		//	setTimeout(heroImage, 3000, executionContext);
		//}
	}
	gridContext.addOnLoad(heroImage);
}