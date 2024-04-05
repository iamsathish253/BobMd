var createPackage = {

	enableButton: function (formContext) {
		debugger;
		if (formContext.controlDescriptor.Name.startsWith("variant_attribute")) {
			return true;
		}
		return false;
	},

	build: async function (SelectedControl) {
		debugger;
		try {
			var selectedRows = SelectedControl.getGrid().getSelectedRows();

			let selectedArticles = '';
			selectedRows.forEach(function (row) {
				selectedArticles = selectedArticles + ",'" + row.getData().getEntity().attributes.get("cr60a_articleid").getValue() + "'";
			});
			selectedArticles = selectedArticles.slice(1);

			//Xrm.Utility.showProgressIndicator("Creating Package");
			//verify whether selected variants of type individual or not to create a package by vasudev on 26-03-24
			// Flag to indicate if any record has bdf_articletype equal to 2
			let hasIndividualType = false;
			let articleResults = await Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$select=bdf_articletype&$filter=Microsoft.Dynamics.CRM.In(PropertyName='cr60a_articleid',PropertyValues=[" + selectedArticles + "])");
			articleResults.entities.forEach(function (row) {
				if (row["bdf_articletype"] == 2) {
					hasIndividualType = true;
					return; // Exit forEach loop early as soon as we find one record with bdf_articletype equal to 2
				}
			});

			if (hasIndividualType) {
				Xrm.Navigation.openErrorDialog({ message: "Please select individual type articles to create a package." });
			} else {

				Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$expand=cr60a_ProductType($select=bdf_producttypeshortname),cr60a_Size($select=bdf_sizeshortname)&$orderby=bdf_retailprice desc&$filter=Microsoft.Dynamics.CRM.In(PropertyName='cr60a_articleid',PropertyValues=[" + selectedArticles + "])").then(
					function success(data) {
						createPackage.getBaseData(data.entities, SelectedControl);
					}
				)
			}
		} catch (e) {
			Xrm.Navigation.openErrorDialog({ message: `${e.message}` });
		}
	},

	getBaseData: function (selectedRows, control) {
		try {
			//var firstRow = selectedRows.getAll()[0].getData().getEntity().attributes._collection;
			var firstRow = selectedRows[0];

			var genericName = firstRow["_bdf_generic_value@OData.Community.Display.V1.FormattedValue"];
			var firtProductType = firstRow["_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue"];
			var firstSize = firstRow["_cr60a_size_value@OData.Community.Display.V1.FormattedValue"];
			var assemblyrequired = false;
			var genericGUID = firstRow._bdf_generic_value;
			var projectGUID;
			if (Xrm.Page.data.entity.getEntityName() == 'bdf_generic') {
				projectGUID = firstRow._bdf_project_value;
			}
			else {
				projectGUID = Xrm.Utility.getPageContext().input.entityId.slice(1, -1);
			}

			var dc5Indicator = false;
			var productType = '';
			selectedRows.forEach(function (row) {

				// if (row["_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue"] == "Mattresses") {
				// 	genericGUID = row["_bdf_generic_value"];
				// 	projectGUID = row["_bdf_project_value"];
				// }

				if (row["bdf_dc5indicator"] == true) {
					dc5Indicator = true;
				}
				if (row.cr60a_assemblyrequired === true) {
					assemblyrequired = true;
				}

				if (row.cr60a_ProductType != null) {
					let shortName = row.cr60a_ProductType.bdf_producttypeshortname;
					productType = productType + ', ' + (shortName == null ? row["_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue"] : shortName);
				}
			});

			var pc = ' ' + selectedRows.length + 'PC ';


			var packageName = "**" + genericName + pc + (firstSize == null ? '' : firstSize + ' ') + productType.slice(2);

			var merchCost = 0;
			var bdf_cost = 0;
			var totalLandedCost = 0;
			var packageFreightCost = 0;
			var bdf_totalfreightcost = 0;
			var bdf_dc1merchcost = 0;
			var bdf_dc2merchcost = 0;
			var bdf_dc3merchcost = 0;
			var bdf_dc4merchcost = 0;
			var bdf_dc5merchcost = 0;
			var bdf_retailprice = 0;
			var bdf_outofpackagingheight = 0;
			var bdf_outofpackaginglength = 0;
			var bdf_outofpackagingvolume = 0;
			var bdf_outofpackagingweight = 0;
			var bdf_outofpackagingwidth = 0;
			var bdf_inpackagingheight = 0;
			var bdf_inpackaginglength = 0;
			var bdf_inpackagingvolume = 0;
			var bdf_inpackagingweight = 0;
			var bdf_inpackagingwidth = 0;
			var bdf_setuptimeminutes = 0;
			selectedRows.forEach(function (row) {
				//var attributes = row.getData().getEntity().attributes;
				//totalLandedCost = totalLandedCost + row.bdf_totallandedcost;
				// merchCost = totalLandedCost;
				bdf_cost = (row.bdf_cost == null || row.bdf_cost == 0 ? null : bdf_cost + row.bdf_cost);
				bdf_totalfreightcost = (row.bdf_totalfreightcost == null || row.bdf_totalfreightcost == 0 ? null : bdf_totalfreightcost + row.bdf_totalfreightcost);
				packageFreightCost = bdf_totalfreightcost;
				bdf_dc1merchcost = (row.bdf_dc1merchcost == null || row.bdf_dc1merchcost == 0 ? null : bdf_dc1merchcost + row.bdf_dc1merchcost);
				bdf_dc2merchcost = (row.bdf_dc2merchcost == null || row.bdf_dc2merchcost == 0 ? null : bdf_dc2merchcost + row.bdf_dc2merchcost);
				bdf_dc3merchcost = (row.bdf_dc3merchcost == null || row.bdf_dc3merchcost == 0 ? null : bdf_dc3merchcost + row.bdf_dc3merchcost);
				bdf_dc4merchcost = (row.bdf_dc4merchcost == null || row.bdf_dc4merchcost == 0 ? null : bdf_dc4merchcost + row.bdf_dc4merchcost);
				bdf_dc5merchcost = (row.bdf_dc5merchcost == null || row.bdf_dc5merchcost == 0 ? null : bdf_dc5merchcost + row.bdf_dc5merchcost);
				bdf_retailprice = bdf_retailprice + row.bdf_retailprice;


				if (['Adjustable Base Sets', 'Mattresses', 'Sectional Components'].indexOf(firtProductType) >= 0) {
					bdf_outofpackagingheight = bdf_outofpackagingheight + row.bdf_outofpackagingheight;
					bdf_outofpackaginglength = firstRow.bdf_outofpackaginglength;
					bdf_outofpackagingvolume = bdf_outofpackagingvolume + row.bdf_outofpackagingvolume;
					bdf_outofpackagingweight = bdf_outofpackagingweight + row.bdf_outofpackagingweight;
					bdf_outofpackagingwidth = firstRow.bdf_outofpackagingwidth;
					bdf_inpackagingheight = bdf_inpackagingheight + row.bdf_inpackagingheight;
					bdf_inpackaginglength = firstRow.bdf_inpackaginglength;
					bdf_inpackagingvolume = bdf_inpackagingvolume + row.bdf_inpackagingvolume;
					bdf_inpackagingweight = bdf_inpackagingweight + row.bdf_inpackagingweight;
					bdf_inpackagingwidth = firstRow.bdf_inpackagingwidth;
				}
				bdf_setuptimeminutes = bdf_setuptimeminutes + row.bdf_setuptimeminutes;
			});

			var totalMerchCost = (totalLandedCost == null || totalLandedCost == 0 ? null : totalLandedCost);
			bdf_retailprice = (bdf_retailprice == null || bdf_retailprice == 0 ? null : bdf_retailprice);




			createPackage.saveVariant(dc5Indicator, assemblyrequired, firstRow, genericGUID, packageName, totalMerchCost, bdf_cost, packageFreightCost, bdf_dc1merchcost, bdf_dc2merchcost, bdf_dc3merchcost, bdf_dc4merchcost, bdf_dc5merchcost, bdf_retailprice,
				projectGUID, selectedRows, selectedRows.length,
				bdf_outofpackagingheight, bdf_outofpackaginglength, bdf_outofpackagingvolume, bdf_outofpackagingweight, bdf_outofpackagingwidth,
				bdf_inpackagingheight, bdf_inpackaginglength, bdf_inpackagingvolume, bdf_inpackagingweight, bdf_inpackagingwidth, bdf_setuptimeminutes, control);

			//Xrm.Utility.alertDialog("Package was created.");
		} catch (e) {
			console.log(e.message);
		}
	},

	saveVariant: async function (dc5Indicator, assemblyrequired, source, genericGUID, packageName, totalMerchCost, bdf_cost, packageFreightCost, bdf_dc1merchcost, bdf_dc2merchcost, bdf_dc3merchcost, bdf_dc4merchcost, bdf_dc5merchcost, bdf_retailprice,
		projectGUID, selectedRows, componentCount,
		bdf_outofpackagingheight, bdf_outofpackaginglength, bdf_outofpackagingvolume, bdf_outofpackagingweight, bdf_outofpackagingwidth,
		bdf_inpackagingheight, bdf_inpackaginglength, bdf_inpackagingvolume, bdf_inpackagingweight, bdf_inpackagingwidth, bdf_setuptimeminutes, control) {
		debugger;
		try {
			Xrm.Utility.showProgressIndicator("Creating Package")
			// Features
			let features = [];
			var featuresId = [];
			selectedRows.forEach(function (row) {
				for (const item in row) {
					//--------------------

					if (
						item.startsWith("_cr60a_feature") && item.endsWith("value") && row[item] !== null && featuresId.indexOf(row[item]) === -1)
						featuresId.push(row[item]);
					//--------------------
					if (item.startsWith("_cr60a_feature") && item.endsWith("value@OData.Community.Display.V1.FormattedValue") && features.indexOf(row[item]) === -1)
						features.push(row[item]);
				}
			});

			let productType = null;
			switch (source['_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue']) {
				case "Mattresses":
				case "Foundations":
					productType = 'Mattress Sets';
					break;
				case "Sectional Components":
					productType = 'Sectional Sets';
					break;
				case "Dressers":
				case "Chests":
					productType = 'Bedroom Sets';
					break;
				case "Sofas":
				case "Loveseats":
					productType = 'Living Room Sets';
					break;
				case "Dining Chairs":
				case "Dining Tables":
					productType = 'Dining Sets';
					break;
				case "Mattress Protectors":
				case "Pillow Protectors":
					productType = 'Protector Bundles';
					break;
				case "Dining & Occasional Table Tops":
				case "Dining & Occasional Table Bases":
					productType = 'Dining Tables';
					break;
				case "Dining & Occasional Table Tops":
				case "Dining & Occasional Table Bases":
					productType = 'Occasional Tables';
					break;
			}

			let productSubType = null;
			//if (productType != null && source['_cr60a_productsubtype_value@OData.Community.Display.V1.FormattedValue'] != null)
			//		productSubType = source['_cr60a_productsubtype_value@OData.Community.Display.V1.FormattedValue'].replace(source['_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue'], productType);

			let size = null;
			//if (productType != null && source['_cr60a_size_value@OData.Community.Display.V1.FormattedValue'] != null)
			//		size = source['_cr60a_size_value@OData.Community.Display.V1.FormattedValue'].replace(source['_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue'], productType);

			let height = null;
			//if (productType != null && source['_cr60a_height_value@OData.Community.Display.V1.FormattedValue'] != null)
			//		height = source['_cr60a_height_value@OData.Community.Display.V1.FormattedValue'].replace(source['_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue'], productType);

			let sizeAdj = null;
			if (source["_cr60a_size_value"] != null && source["_cr60a_size_value@OData.Community.Display.V1.FormattedValue"] != null)
				sizeAdj = source["_cr60a_size_value@OData.Community.Display.V1.FormattedValue"].replace(source['_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue'] + ':', '');

			let bdf_zone2retailprice = 0;
			let bdf_zone3retailprice = 0;
			let bdf_zone4retailprice = 0;
			let bdf_zone5retailprice = 0;
			let bdf_zone6retailprice = 0;
			let bdf_zone7retailprice = 0;
			let bdf_zone8retailprice = 0;
			let bdf_zone9retailprice = 0;
			let bdf_zone10retailprice = 0;
			selectedRows.forEach(function (row) {
				bdf_zone2retailprice = (row.bdf_zone2retailprice == null || row.bdf_zone2retailprice == 0 ? null : bdf_zone2retailprice + row.bdf_zone2retailprice);
				bdf_zone3retailprice = (row.bdf_zone3retailprice == null || row.bdf_zone3retailprice == 0 ? null : bdf_zone3retailprice + row.bdf_zone3retailprice);
				bdf_zone4retailprice = (row.bdf_zone4retailprice == null || row.bdf_zone4retailprice == 0 ? null : bdf_zone4retailprice + row.bdf_zone4retailprice);
				bdf_zone5retailprice = (row.bdf_zone5retailprice == null || row.bdf_zone5retailprice == 0 ? null : bdf_zone5retailprice + row.bdf_zone5retailprice);
				bdf_zone6retailprice = (row.bdf_zone6retailprice == null || row.bdf_zone6retailprice == 0 ? null : bdf_zone6retailprice + row.bdf_zone6retailprice);
				bdf_zone7retailprice = (row.bdf_zone7retailprice == null || row.bdf_zone7retailprice == 0 ? null : bdf_zone7retailprice + row.bdf_zone7retailprice);
				bdf_zone8retailprice = (row.bdf_zone8retailprice == null || row.bdf_zone8retailprice == 0 ? null : bdf_zone8retailprice + row.bdf_zone8retailprice);
				bdf_zone9retailprice = (row.bdf_zone9retailprice == null || row.bdf_zone9retailprice == 0 ? null : bdf_zone9retailprice + row.bdf_zone9retailprice);
				bdf_zone10retailprice = (row.bdf_zone10retailprice == null || row.bdf_zone10retailprice == 0 ? null : bdf_zone10retailprice + row.bdf_zone10retailprice);
			});

			var input =
			{
				"bdf_zone2retailprice": bdf_zone2retailprice,
				"bdf_zone3retailprice": bdf_zone3retailprice,
				"bdf_zone4retailprice": bdf_zone4retailprice,
				"bdf_zone5retailprice": bdf_zone5retailprice,
				"bdf_zone6retailprice": bdf_zone6retailprice,
				"bdf_zone7retailprice": bdf_zone7retailprice,
				"bdf_zone8retailprice": bdf_zone8retailprice,
				"bdf_zone9retailprice": bdf_zone9retailprice,
				"bdf_zone10retailprice": bdf_zone10retailprice,
				"bdf_Project@odata.bind": "/bdf_projects(" + projectGUID + ")",
				"bdf_Generic@odata.bind": "/bdf_generics(" + genericGUID + ")",
				"cr60a_articlename": packageName.slice(0, 40),
				"cr60a_articledescription": packageName.slice(0, 40),
				"cr60a_articletype": "HAWA",
				"cr60a_generalitemcategorygroup": "LUMF",
				"bdf_articletype": 2,
				"bdf_cost": bdf_cost,
				"bdf_packagefreightcost": packageFreightCost,
				"bdf_dc1merchcost": bdf_dc1merchcost,
				"bdf_dc2merchcost": bdf_dc2merchcost,
				"bdf_dc3merchcost": bdf_dc3merchcost,
				"bdf_dc4merchcost": bdf_dc4merchcost,
				"bdf_dc5merchcost": bdf_dc5merchcost,
				"cr60a_basematerial": source['cr60a_basematerial'],
				"cr60a_color": source['cr60a_color'],
				"cr60a_ColorGroup@odata.bind": (source["_cr60a_colorgroup_value"] == null ? null : "/cr60a_colorgroups(" + source["_cr60a_colorgroup_value"] + ")"),
				"cr60a_familycode": source['cr60a_familycode'],
				"cr60a_familycodedescription": source['cr60a_familycodedescription'],
				"cr60a_FinishGroup@odata.bind": (source["_cr60a_finishgroup_value"] == null ? null : "/cr60a_finishgroups(" + source["_cr60a_finishgroup_value"] + ")"),
				"cr60a_majorcode": source['cr60a_majorcode'],
				"cr60a_majorcodedescription": source['cr60a_majorcodedescription'],
				"cr60a_material": source['cr60a_material'],
				"cr60a_MaterialGroup@odata.bind": (source["_cr60a_materialgroup_value"] == null ? null : "/cr60a_materialgroups(" + source["_cr60a_materialgroup_value"] + ")"),
				"cr60a_merchandisecategory": source['cr60a_merchandisecategory'],
				"cr60a_merchandisecategorydescription": source['cr60a_merchandisecategorydescription'],
				"cr60a_minorcode": source['cr60a_minorcode'],
				"cr60a_minorcodedescription": source['cr60a_minorcodedescription'],
				"cr60a_motion": source['cr60a_motion'],
				"cr60a_pcmproducttype": source['cr60a_pcmproducttype'],
				"cr60a_pcmstyle": source['cr60a_pcmstyle'],
				"cr60a_pcmvariantcolor": source['cr60a_pcmvariantcolor'],
				"cr60a_pcmvariantfinish": source['cr60a_pcmvariantfinish'],
				"cr60a_primarymaterial": source['cr60a_primarymaterial'],
				"cr60a_ProductSubType@odata.bind": (productSubType == null ? null : "/cr60a_productsubtypes(cr60a_code='" + productSubType + "')"),
				"cr60a_ProductType@odata.bind": (productType == null ? null : "/cr60a_producttypes(cr60a_code='" + productType + "')"),
				"cr60a_salestext": source['cr60a_salestext'],
				"cr60a_sapfinish": source['cr60a_sapfinish'],
				"cr60a_sapfinishgroup": source['cr60a_sapfinishgroup'],
				"cr60a_sapmaterialgroup": source['cr60a_sapmaterialgroup'],
				"cr60a_sapprimarycolor": source['cr60a_sapprimarycolor'],
				"cr60a_sapproducttype": source['cr60a_sapproducttype'],
				"cr60a_sapstyle": source['cr60a_sapstyle'],
				"cr60a_seatmaterial": source['cr60a_seatmaterial'],
				"cr60a_seatspecificcolor": source['cr60a_seatspecificcolor'],
				"cr60a_shadecolorgroup": source['cr60a_shadecolorgroup'],
				"cr60a_shadespecificmaterial": source['cr60a_shadespecificmaterial'],
				"cr60a_sourcetype": source['cr60a_sourcetype'],
				"statuscode": 1,
				"cr60a_storage": source['cr60a_storage'],
				"cr60a_Style@odata.bind": (source["_cr60a_style_value"] == null ? null : "/cr60a_ref_styles(" + source["_cr60a_style_value"] + ")"),
				"cr60a_topmaterial": source['cr60a_topmaterial'],
				"cr60a_UpholsteryMaterialGroup@odata.bind": (source["_cr60a_upholsterymaterialgroup_value"] == null ? null : "/cr60a_upholsterymaterialgroups(" + source["_cr60a_upholsterymaterialgroup_value"] + ")"),
				"cr60a_specificcolor": source['cr60a_specificcolor'],
				"cr60a_specificfinish": source['cr60a_specificfinish'],
				"cr60a_sealableindicator": source['cr60a_sealableindicator'],
				"cr60a_mattressthickness": (source['cr60a_mattressthickness']),
				"cr60a_specialorderindicator": source['cr60a_specialorderindicator'],
				"cr60a_cleansingstatus": source['cr60a_cleansingstatus'],
				"cr60a_priorityorder": (source['cr60a_priorityorder']),
				"cr60a_Pattern@odata.bind": (source["_cr60a_pattern_value"] == null ? null : "/cr60a_patterns(" + source["_cr60a_pattern_value"] + ")"),
				"cr60a_Size@odata.bind": (size == null ? null : "/cr60a_sizes(cr60a_code='" + size + "')"),
				"cr60a_SideFacing@odata.bind": (source["_cr60a_sidefacing_value"] == null ? null : "/cr60a_sidefacings(" + source["_cr60a_sidefacing_value"] + ")"),
				"cr60a_SwitchStyle@odata.bind": (source["_cr60a_switchstyle_value"] == null ? null : "/cr60a_switchstyles(" + source["_cr60a_switchstyle_value"] + ")"),
				"cr60a_NumberofSeat@odata.bind": (source["_cr60a_numberofseat_value"] == null ? null : "/cr60a_numberofseats(" + source["_cr60a_numberofseat_value"] + ")"),
				"cr60a_ArmStyle@odata.bind": (source["_cr60a_armstyle_value"] == null ? null : "/cr60a_armstyles(" + source["_cr60a_armstyle_value"] + ")"),
				"cr60a_BulbWattage@odata.bind": (source["_cr60a_bulbwattage_value"] == null ? null : "/cr60a_bulbwattages(" + source["_cr60a_bulbwattage_value"] + ")"),
				"cr60a_Height@odata.bind": (height == null ? null : "/cr60a_heights(cr60a_code='" + height + "')"),
				"cr60a_Shape@odata.bind": (source["_cr60a_shape_value"] == null ? null : "/cr60a_shapes(" + source["_cr60a_shape_value"] + ")"),
				"cr60a_NumberofDrawer@odata.bind": (source["_cr60a_numberofdrawer_value"] == null ? null : "/cr60a_numberofdrawers(" + source["_cr60a_numberofdrawer_value"] + ")"),
				"cr60a_NumberofBulb@odata.bind": (source["_cr60a_numberofbulb_value"] == null ? null : "/cr60a_numberofbulbs(" + source["_cr60a_numberofbulb_value"] + ")"),
				"cr60a_RugPileHeight@odata.bind": (source["_cr60a_rugpileheight_value"] == null ? null : "/cr60a_rugpileheights(" + source["_cr60a_rugpileheight_value"] + ")"),
				"cr60a_MattressFeel@odata.bind": (source["_cr60a_mattressfeel_value"] == null ? null : "/cr60a_mattressfeels(" + source["_cr60a_mattressfeel_value"] + ")"),
				"cr60a_MattressFirmness@odata.bind": (source["_cr60a_mattressfirmness_value"] == null ? null : "/cr60a_mattressfirmnesses(" + source["_cr60a_mattressfirmness_value"] + ")"),
				"cr60a_MattressTailoring@odata.bind": (source["_cr60a_mattresstailoring_value"] == null ? null : "/cr60a_mattresstailorings(" + source["_cr60a_mattresstailoring_value"] + ")"),
				"bdf_dataqualityissues": source['bdf_dataqualityissues'],
				"bdf_specificmaterial": source['bdf_specificmaterial'],
				"bdf_onlineindicator": source['bdf_onlineindicator'],
				"bdf_outletindicator": source['bdf_outletindicator'],
				"bdf_flooredindicator": source['bdf_flooredindicator'],
				"bdf_platformstoragecompatibleind": source['bdf_platformstoragecompatibleind'],
				"cr60a_TopMaterialGroup@odata.bind": (source["_cr60a_topmaterialgroup_value"] == null ? null : "/cr60a_topmaterialgroups(" + source["_cr60a_topmaterialgroup_value"] + ")"),
				"ownerid@odata.bind": '/teams(' + source['_ownerid_value'] + ')',
				"cr60a_ValueClass@odata.bind": (source["_cr60a_valueclass_value"] == null ? null : "/cr60a_valueclasses(" + source["_cr60a_valueclass_value"] + ")"),
				"cr60a_featuretext": source['CMFeatureText'],
				"cr60a_Collection@odata.bind": (source["_cr60a_collection_value"] == null ? null : "/cr60a_collections(" + source["_cr60a_collection_value"] + ")"),
				"cr60a_vendorname": source['cr60a_vendorname'],
				"cr60a_CupHolderType@odata.bind": (source["_cr60a_cupholdertype_value"] == null ? null : "/cr60a_cupholdertypes(" + source["_cr60a_cupholdertype_value"] + ")"),
				"cr60a_NumberofPillow@odata.bind": (source["_cr60a_numberofpillow_value"] == null ? null : "/cr60a_numberofpillows(" + source["_cr60a_numberofpillow_value"] + ")"),
				"cr60a_PowerBase@odata.bind": (source["_cr60a_powerbase_value"] == null ? null : "/cr60a_powerbases(" + source["_cr60a_powerbase_value"] + ")"),
				//                    "cr60a_Feature1@odata.bind": (features[0] == null ? null : "/cr60a_features(cr60a_code='"+ encodeURIComponent(features[0])+"')"),
				//                    "cr60a_Feature2@odata.bind": (features[1] == null ? null : "/cr60a_features(cr60a_code='"+ features[1]+"')"),
				//                    "cr60a_Feature3@odata.bind": (features[2] == null ? null : "/cr60a_features(cr60a_code='"+ features[2]+"')"),
				//                    "cr60a_Feature4@odata.bind": (features[3] == null ? null : "/cr60a_features(cr60a_code='"+ features[3]+"')"),
				//                    "cr60a_Feature5@odata.bind": (features[4] == null ? null : "/cr60a_features(cr60a_code='"+ features[4]+"')"),
				//                    "cr60a_Feature6@odata.bind": (features[5] == null ? null : "/cr60a_features(cr60a_code='"+ features[5]+"')"),
				//                    "cr60a_Feature7@odata.bind": (features[6] == null ? null : "/cr60a_features(cr60a_code='"+ features[6]+"')"),
				//                    "cr60a_Feature8@odata.bind": (features[7] == null ? null : "/cr60a_features(cr60a_code='"+ features[7]+"')"),
				//                    "cr60a_Feature9@odata.bind": (features[8] == null ? null : "/cr60a_features(cr60a_code='"+ features[8]+"')"),
				//                    "cr60a_Feature10@odata.bind": (features[9] == null ? null : "/cr60a_features(cr60a_code='"+ features[9]+"')"), // update all feature lookup values using GUID's instead cr60a_code by vasudev 22-11-23 
				"cr60a_Feature1@odata.bind": (featuresId[0] == null ? null : "/cr60a_features(" + featuresId[0] + ")"),
				"cr60a_Feature2@odata.bind": (featuresId[1] == null ? null : "/cr60a_features(" + featuresId[1] + ")"),
				"cr60a_Feature3@odata.bind": (featuresId[2] == null ? null : "/cr60a_features(" + featuresId[2] + ")"),
				"cr60a_Feature4@odata.bind": (featuresId[3] == null ? null : "/cr60a_features(" + featuresId[3] + ")"),
				"cr60a_Feature5@odata.bind": (featuresId[4] == null ? null : "/cr60a_features(" + featuresId[4] + ")"),
				"cr60a_Feature6@odata.bind": (featuresId[5] == null ? null : "/cr60a_features(" + featuresId[5] + ")"),
				"cr60a_Feature7@odata.bind": (featuresId[6] == null ? null : "/cr60a_features(" + featuresId[6] + ")"),
				"cr60a_Feature8@odata.bind": (featuresId[7] == null ? null : "/cr60a_features(" + featuresId[7] + ")"),
				"cr60a_Feature9@odata.bind": (featuresId[8] == null ? null : "/cr60a_features(" + featuresId[8] + ")"),
				"cr60a_Feature10@odata.bind": (featuresId[9] == null ? null : "/cr60a_features(" + featuresId[9] + ")"),
				"cr60a_FillMaterial@odata.bind": (source["_cr60a_fillmaterial_value"] == null ? null : "/cr60a_fillmaterials(" + source["_cr60a_fillmaterial_value"] + ")"),
				"cr60a_WindowTreatmentHeader@odata.bind": (source["_cr60a_windowtreatmentheader_value"] == null ? null : "/cr60a_windowtreatmentheaders(" + source["_cr60a_windowtreatmentheader_value"] + ")"),
				"cr60a_ProductCare@odata.bind": (source["_cr60a_productcare_value"] == null ? null : "/cr60a_productcares(" + source["_cr60a_productcare_value"] + ")"),
				"cr60a_ArtworkTypeSubject@odata.bind": (source["_cr60a_artworktypesubject_value"] == null ? null : "/cr60a_artworktypesubjects(" + source["_cr60a_artworktypesubject_value"] + ")"),
				"cr60a_Design@odata.bind": (source["_cr60a_design_value"] == null ? null : "/cr60a_designs(" + source["_cr60a_design_value"] + ")"),
				"cr60a_Construction@odata.bind": (source["_cr60a_construction_value"] == null ? null : "/cr60a_constructions(" + source["_cr60a_construction_value"] + ")"),
				"cr60a_seatheight": source['cr60a_seatheight'],
				"cr60a_seatwidth": source['cr60a_seatwidth'],
				"cr60a_seatdepth": source['cr60a_seatdepth'],
				"cr60a_seatbackheight": source['cr60a_seatbackheight'],
				"cr60a_wallclearance": source['cr60a_wallclearance'],
				"cr60a_fullreclinedepth": source['cr60a_fullreclinedepth'],
				"cr60a_merchandisingfeaturedescription": source['cr60a_merchandisingfeaturedescription'],
				"cr60a_mattresshighlight": source['cr60a_mattresshighlight'],
				"cr60a_mattresslayer": source['cr60a_mattresslayer'],
				"cr60a_armheight": source['cr60a_armheight'],
				"cr60a_armthickness": source['cr60a_armthickness'],
				"cr60a_assemblyrequired": assemblyrequired,
				"cr60a_additionaldimension": source['cr60a_additionaldimension'],
				"cr60a_additionalmaterialinformation": source['cr60a_additionalmaterialinformation'],
				"cr60a_seatcushionthickness": source['cr60a_seatcushionthickness'],
				"cr60a_specialcareinstructions": source['cr60a_specialcareinstructions'],
				"cr60a_weightlimit": source['cr60a_weightlimit'],
				"cr60a_recommendedmattressheight": source['cr60a_recommendedmattressheight'],
				"cr60a_numberofslat": (source['cr60a_numberofslat']),
				"cr60a_totalrevenueamount": (source['cr60a_totalrevenueamount']),
				"cr60a_ecpriorityindicator": source['cr60a_ecpriorityindicator'],
				"cr60a_ecprioritydate": source['cr60a_ecprioritydate'],
				"cr60a_eccomment": source['cr60a_eccomment'],
				"cr60a_genericarticleid": source['cr60a_genericarticleid'],
				"cr60a_genericarticledescription": source['cr60a_genericarticledescription'],
				"bdf_storelineupssalestext": source['bdf_storelineupssalestext'],
				"bdf_additionalinformation": source['bdf_additionalinformation'],
				"cr60a_warrantylength": source['cr60a_warrantylength'],
				"cr60a_pressurerelief": source['cr60a_pressurerelief'],
				"cr60a_motionisolation": source['cr60a_motionisolation'],
				"cr60a_temperatureregulation": source['cr60a_temperatureregulation'],

				"bdf_outofpackagingheight": bdf_outofpackagingheight,
				"bdf_outofpackaginglength": bdf_outofpackaginglength,
				"bdf_outofpackagingvolume":	/*bdf_outofpackagingvolume*/ null,
				"bdf_outofpackagingweight": bdf_outofpackagingweight,
				"bdf_outofpackagingwidth": bdf_outofpackagingwidth,
				"bdf_inpackagingheight": bdf_inpackagingheight,
				"bdf_inpackaginglength": bdf_inpackaginglength,
				"bdf_inpackagingvolume": /*bdf_inpackagingvolume*/ null,
				"bdf_inpackagingweight": bdf_inpackagingweight,
				"bdf_inpackagingwidth": bdf_inpackagingwidth,
				"bdf_mainarticlepackageindicator": source['bdf_mainarticlepackageindicator'],
				"bdf_planneddeliverytimeindays": source['bdf_planneddeliverytimeindays'],
				"bdf_casepackretailprice": source['bdf_casepackretailprice'],
				"bdf_casepackunits": source['bdf_casepackunits'],
				"bdf_deliverydependentcomponent": source['bdf_deliverydependentcomponent'],
				"bdf_flooredindicator": source['bdf_flooredindicator'],
				"bdf_goofproofindicator": source['bdf_goofproofindicator'],
				"bdf_onlineindicator": source['bdf_onlineindicator'],
				"bdf_retailprice": bdf_retailprice,
				"bdf_rptype": 1,
				//"bdf_setuptimeminutes": bdf_setuptimeminutes,	// not requied for packages
				"bdf_tariffindicator": source['bdf_tariffindicator'],
				"bdf_tariff": source['bdf_tariff'],
				"bdf_sizename": sizeAdj
			}


			//--------------------------------------------------------------- set Global Drop Status and Global Drop Date when project is in sample stage by vasudev 11-12-23.
			var milestonesResults = await Xrm.WebApi.retrieveMultipleRecords("bdf_project_milestones", `?$select=_activestageid_value&$filter=_bpf_bdf_projectid_value eq ${projectGUID}`);


			if (milestonesResults.entities.length > 0) {
				var result = milestonesResults.entities[0];
				var activestageName = result["_activestageid_value@OData.Community.Display.V1.FormattedValue"];

				if (activestageName && activestageName === 'Sample') {
					input["bdf_globaldropstatus"] = 3
					input["bdf_globaldropdate"] = new Date().toISOString(); // Date Time
				}
			}

			//---------------------------------------------------------------

			if (dc5Indicator == true) {
				input["bdf_dc5indicator"] = true;
			}
			await Xrm.WebApi.createRecord("cr60a_stg_article_master", input).then(
				async function success(result) {
					variantGUID = result.id;
					Xrm.Utility.closeProgressIndicator();

					//----------------------------------------------
					await Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${variantGUID}'`).then(
						function success(results) {
							console.log(results);
							if (results.entities.length == 0) {
								// Xrm.Utility.showProgressIndicator("Creating Article DC....");
								var dcValues = ["3000", "3010", "3200", "3210", "3220"];

								for (var i = 0; i < dcValues.length; i++) {
									var record = {};
									record["bdf_Article@odata.bind"] = "/cr60a_stg_article_masters(" + variantGUID + ")"; // Lookup
									record.bdf_dc = dcValues[i]; // Text
									record.bdf_grprocessingtime = (i < 5) ? 6 : null/* Set your default value for other records */;
									record["ownerid@odata.bind"] = "/teams(" + source["_ownerid_value"] + ")"; // update ownerId same as variant record by vasudev 28-11-23
									Xrm.WebApi.createRecord("bdf_articledc", record).then(
										function success(result) {
											var newId = result.id;
											//clearTimeout(clearsetTime);
											//Xrm.Utility.closeProgressIndicator();
											Xrm.Page.getControl("Subgrid_new_3").refresh();
											console.log("Created child record with ID: " + newId);
										},
										function (error) {
											console.log("Error creating child record: " + error.message);
											Xrm.Utility.closeProgressIndicator();

										}
									);
								}


								//Xrm.Page.getAttribute("bdf_dc5indicator").setValue(true);
								Xrm.Page.data.refresh(true).then(function () {
									if (dc5Indicator == true) {
										onChangeDC5(variantGUID, dc5Indicator);
									}
								})



							}

						},
						function (error) {
							console.log(error.message);
							Xrm.Utility.closeProgressIndicator();
						}
					);
					//----------------------------------------------


					createPackage.saveArticlePackageMM(projectGUID, variantGUID);
					createPackage.saveBOM(variantGUID, selectedRows, componentCount).then(
						function (value) {
							createPackage.updateArticleID(variantGUID, control);
						});
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}
		catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	}, // createVariant

	saveBOM: async function (variantGUID, selectedRows, componentCount) {
		selectedRows.forEach(function (row) {
			var componentGUID = row.cr60a_stg_article_masterid;
			try {
				var input =
				{
					"bdf_PackageArticle@odata.bind": "/cr60a_stg_article_masters(" + variantGUID + ")",
					"bdf_ComponentArticle@odata.bind": "/cr60a_stg_article_masters(" + componentGUID + ")",
					//"bdf_articlebillofmaterialid": packageName,
					"bdf_componentqty": 1,
					"bdf_totalcomponentcount": componentCount,
					"ownerid@odata.bind": "/teams(" + row["_ownerid_value"] + ")" //update ownerId same as variant record by vasudev 28-11-23
				}
				Xrm.WebApi.createRecord("bdf_articlebillofmaterial", input).then(
					function success(result) {
						genericGUID = result.id;
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}
			catch (e) {
				Xrm.Utility.alertDialog(e.message);
			}
		});
	}, // saveBOM

	saveArticlePackageMM: async function (projectID, articleID) {

		Xrm.WebApi.online.execute(createPackage.buildRelateData(projectID, articleID, "Associate"))
			.then(function (response) {
				if (response.ok) {
					//console.log("Status: %s %s", response.status, response.statusText);
				}
			})
			.catch(function (error) {
				Xrm.Utility.alertDialog(error.message);
			});

	}, // saveArticlePackageMM

	buildRelateData: function (projectID, articleID, operationName) {

		var Sdk = window.Sdk || {};
		Sdk.AssociateRequest = function (target, relatedEntities, relationship) {
			this.target = target;
			this.relatedEntities = relatedEntities;
			this.relatedEntityId = articleID;
			this.relationship = relationship;
		};
		Sdk.AssociateRequest.prototype.getMetadata = function () {
			return {
				boundParameter: null,
				parameterTypes: {},
				operationType: 2, // Associate and Disassociate fall under the CRUD umbrella
				operationName: operationName
			}
		};

		var target = {
			entityType: "bdf_project",
			id: projectID
		};
		var relatedEntities = [
			{
				entityType: "cr60a_stg_article_master",
				id: articleID
			}
		];

		var relationship = "bdf_variant_project_mm";
		return new Sdk.AssociateRequest(target, relatedEntities, relationship);
	}, // Build MM Relate Data

	updateArticleID: async function (articleID, control) {

		try {
			Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", articleID).then(
				function success(data) {
					var input =
					{
						"cr60a_articleid": data.bdf_variantnumber
					}
					Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleID, input).then(
						function success(result) {
							//productGUID = result.id;
							Xrm.Utility.closeProgressIndicator();
							Xrm.Utility.confirmDialog("Package was created successfully."); //Xrm.Utility.alertDialog("Package was created successfully.");
							control.refresh();
						},
						function (error) {
							Xrm.Utility.alertDialog(error.message);
							Xrm.Utility.closeProgressIndicator();
						}
					);
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
					Xrm.Utility.closeProgressIndicator();
				}
			);
		} catch (e) {
			Xrm.Utility.alertDialog(e.message);
			Xrm.Utility.closeProgressIndicator();
		}
	} // Update Article ID from Variant Number

},
	marginComp = {

		enableButton: function (formContext) {
			debugger;
			if (formContext.controlDescriptor.Name.startsWith("project_variant_margin") ||
				formContext.controlDescriptor.Name.startsWith("project_variant_comp_margin")) {
				return true;
			}
			return false;
		},

		takeSnapshot: function (SelectedControl, formContext) {
			debugger;

			// Save recreen data first
			formContext.data.save();

			var parentID = Xrm.Utility.getPageContext().input.entityId.slice(1, -1);
			var freight = formContext.getAttribute('bdf_freightcostpercube').getValue();

			// Save in project table
			try {
				var input =
				{
					"bdf_priorfreightcostpercube": freight,
					"bdf_priorcostsnapshotdate": new Date(),
					"bdf_priorcostsnapshotuser": Xrm.Utility.getGlobalContext().userSettings.userName
				}
				Xrm.WebApi.updateRecord("bdf_project", parentID, input).then(
					function success(result) {
						projectGUID = result.id;
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}
			catch (e) {
				Xrm.Utility.alertDialog(e.message);
			}

			// Save in variant table
			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=_bdf_project_value eq " + parentID).then(
				function success(data) {
					for (let variant of data.entities) {
						var articleID = variant.cr60a_stg_article_masterid;
						var input =
						{
							"bdf_priormerchcost": variant.bdf_cost,
							"bdf_priorretailprice": variant.bdf_retailprice,
							"bdf_priordc1merchcost": variant.bdf_dc1merchcost,
							"bdf_priordc2merchcost": variant.bdf_dc2merchcost,
							"bdf_priordc3merchcost": variant.bdf_dc3merchcost,
							"bdf_priordc4merchcost": variant.bdf_dc4merchcost,
							"bdf_priordc5merchcost": variant.bdf_dc5merchcost,
							"bdf_priortotalfreightcost": variant.bdf_totalfreightcost,
							"bdf_priortotallandedcost": variant.bdf_totallandedcost,
							"bdf_priorgm": variant.bdf_gm,
							"bdf_priordc1gm": variant.bdf_dc1gm,
							"bdf_priordc2gm": variant.bdf_dc2gm,
							"bdf_priordc3gm": variant.bdf_dc3gm,
							"bdf_priordc4gm": variant.bdf_dc4gm,
							"bdf_priordc5gm": variant.bdf_dc5gm
						}
						Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleID, input).then(
							function success(result) {
								let articleGUID = result.id;
							},
							function (error) {
								Xrm.Utility.alertDialog(error.message);
							}
						);
					}
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
			Xrm.Utility.alertDialog("Cost Snapshot process was completed.");
		} // Take Snapshot
	},
	publishCost2 = {

		enableButton: function (formContext) {
			debugger;
			if (formContext.controlDescriptor.Name.startsWith("project_variant_margin") ||
				formContext.controlDescriptor.Name.startsWith("project_variant_comp_margin")) {
				return true;
			}
			return false;
		},

		takeSnapshot: function (SelectedControl, formContext) {
			debugger;

			// Save recreen data first
			formContext.data.save();

			var parentID = Xrm.Utility.getPageContext().input.entityId.slice(1, -1);
			var freight = formContext.getAttribute('bdf_freightcostpercube').getValue();

			// Save in project table
			try {
				var input =
				{
					"bdf_priorfreightcostpercube": freight,
					"bdf_priorcostsnapshotdate": new Date(),
					"bdf_priorcostsnapshotuser": Xrm.Utility.getGlobalContext().userSettings.userName
				}
				Xrm.WebApi.updateRecord("bdf_project", parentID, input).then(
					function success(result) {
						projectGUID = result.id;
					},
					function (error) {
						Xrm.Utility.alertDialog(error.message);
					}
				);
			}
			catch (e) {
				Xrm.Utility.alertDialog(e.message);
			}

			// Open a new form to get the effective date
			var pageInput = {
				pageType: "entityrecord",
				entityName: "bdf_projectcostretailsnapshot",
				//formType: 2,
				formId: "{E4FC5BD4-EE1A-4BA0-9343-85AED9F5FFA4}",
				createFromEntity: { entityType: "bdf_project", id: Xrm.Page.data.entity.getId(), name: "Project" }
				//entityId: "265c5fac-6fc7-ed11-b597-00224828ddaf"
			};
			var navigationOptions = {
				target: 2,
				height: { value: 40, unit: "%" },
				width: { value: 40, unit: "%" },
				position: 1
			};
			Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
				function success(result) {
					console.log("Record created with ID: " + result.savedEntityReference[0].id +
						" Name: " + result.savedEntityReference[0].name)

					// Handle dialog closed
					var nowDate = new Date();
					var currentDate = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + nowDate.getDate() // + 'T00:00:00Z'; T00:00:00Z

					Xrm.WebApi.retrieveRecord("bdf_projectcostretailsnapshot", result.savedEntityReference[0].id).then(
						function success(data) {
							var effectiveDate = data.bdf_effectivedate;
							// Save in variant table
							Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=_bdf_project_value eq " + parentID).then(
								function success(data) {
									for (let variant of data.entities) {
										//var projectGUID = variant.bdf_Generic._bdf_project_value;
										var articleID = variant.cr60a_stg_article_masterid;
										//var input = {"bdf_Project@odata.bind": "/bdf_projects("+projectGUID+")"};

										var input =
										{
											"bdf_priormerchcost": variant.bdf_cost,
											"bdf_priorretailprice": variant.bdf_retailprice,
											"bdf_priordc1merchcost": variant.bdf_dc1merchcost,
											"bdf_priordc2merchcost": variant.bdf_dc2merchcost,
											"bdf_priordc3merchcost": variant.bdf_dc3merchcost,
											"bdf_priordc4merchcost": variant.bdf_dc4merchcost,
											"bdf_priordc5merchcost": variant.bdf_dc5merchcost,
											"bdf_priortotalfreightcost": variant.bdf_totalfreightcost,
											"bdf_priortotallandedcost": variant.bdf_totallandedcost,
											"bdf_priorgm": variant.bdf_gm,
											"bdf_priordc1gm": variant.bdf_dc1gm,
											"bdf_priordc2gm": variant.bdf_dc2gm,
											"bdf_priordc3gm": variant.bdf_dc3gm,
											"bdf_priordc4gm": variant.bdf_dc4gm,
											"bdf_priordc5gm": variant.bdf_dc5gm
										}
										Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleID, input).then(
											function success(result) {
												let articleGUID = result.id;

												// Delete existing records if available
												Xrm.WebApi.retrieveMultipleRecords("bdf_articleinforecord", "?$select=bdf_articleinforecordid&$filter=_bdf_articleid_value eq " + articleGUID + " and bdf_effectivedate eq " + currentDate).then(
													function success(data) {
														if (data.entities.length > 0) {
															for (let info of data.entities) {
																var articleInfoGUID = info.bdf_articleinforecordid;
																Xrm.WebApi.deleteRecord("bdf_articleinforecord", articleInfoGUID).then(
																	function success(result) {
																		var articleInfoGUID = result.id;

																		// Save in info record
																		var input =
																		{
																			"bdf_ArticleID@odata.bind": "/cr60a_stg_article_masters(" + articleGUID + ")",
																			"bdf_effectivedate": effectiveDate,
																			"bdf_freightcostpercube": freight,
																			"bdf_cost": variant.bdf_cost,
																			"bdf_retailprice": variant.bdf_retailprice,
																			"bdf_dc1merchcost": variant.bdf_dc1merchcost,
																			"bdf_dc2merchcost": variant.bdf_dc2merchcost,
																			"bdf_dc3merchcost": variant.bdf_dc3merchcost,
																			"bdf_dc4merchcost": variant.bdf_dc4merchcost,
																			"bdf_dc5merchcost": variant.bdf_dc5merchcost,
																			"bdf_totalfreightcost": variant.bdf_totalfreightcost,
																			"bdf_totallandedcost": variant.bdf_totallandedcost
																		}
																		Xrm.WebApi.createRecord("bdf_articleinforecord", input).then(
																			function success(result) {
																				articleGUID = result.id;
																			},
																			function (error) {
																				Xrm.Utility.alertDialog(error.message);
																			}
																		);
																	},
																	function (error) {
																		Xrm.Utility.alertDialog(error.message);
																	});
															}
														} else {
															// Save in info record
															var input =
															{
																"bdf_ArticleID@odata.bind": "/cr60a_stg_article_masters(" + articleGUID + ")",
																"bdf_effectivedate": effectiveDate,
																"bdf_freightcostpercube": freight,
																"bdf_cost": variant.bdf_cost,
																"bdf_retailprice": variant.bdf_retailprice,
																"bdf_dc1merchcost": variant.bdf_dc1merchcost,
																"bdf_dc2merchcost": variant.bdf_dc2merchcost,
																"bdf_dc3merchcost": variant.bdf_dc3merchcost,
																"bdf_dc4merchcost": variant.bdf_dc4merchcost,
																"bdf_dc5merchcost": variant.bdf_dc5merchcost,
																"bdf_totalfreightcost": variant.bdf_totalfreightcost,
																"bdf_totallandedcost": variant.bdf_totallandedcost
															}
															Xrm.WebApi.createRecord("bdf_articleinforecord", input).then(
																function success(result) {
																	let articleInfoGUID = result.id;
																},
																function (error) {
																	Xrm.Utility.alertDialog(error.message);
																}
															);
														}
													});
											},
											function (error) {
												Xrm.Utility.alertDialog(error.message);
											}
										);
									}
								},
								function (error) {
									Xrm.Utility.alertDialog(error.message);
								}
							);

						},
						function (error) {
							Xrm.Utility.alertDialog(error.message);
						}
					);

					Xrm.Utility.alertDialog("Cost Snapshot process was completed.");
				},
				function error() {
					// Handle errors
				}
			);
		}
	},

	publishRetail = {

		enableButton: function (formContext) {
			debugger;
			if (formContext.controlDescriptor.Name.startsWith("project_variant_margin") ||
				formContext.controlDescriptor.Name.startsWith("project_variant_comp_margin")) {
				return true;
			}
			return false;
		},

		createRecords: function (effectiveDate, variant, freight, last, formContext) {
			// Create new snapshot entries
			var articleGUID = variant.cr60a_stg_article_masterid;

			// Save in info record
			var input =
			{
				"bdf_ArticleID@odata.bind": "/cr60a_stg_article_masters(" + articleGUID + ")",
				"bdf_effectivedate": effectiveDate,
				"bdf_freightcostpercube": freight,
				"bdf_cost": variant.bdf_cost,
				"bdf_retailprice": variant.bdf_retailprice,
				"bdf_dc1merchcost": variant.bdf_dc1merchcost,
				"bdf_dc2merchcost": variant.bdf_dc2merchcost,
				"bdf_dc3merchcost": variant.bdf_dc3merchcost,
				"bdf_dc4merchcost": variant.bdf_dc4merchcost,
				"bdf_dc5merchcost": variant.bdf_dc5merchcost,
				"bdf_totalfreightcost": variant.bdf_totalfreightcost,
				"bdf_totallandedcost": variant.bdf_totallandedcost,
				"bdf_infotype": 2,
				"bdf_zone2retailprice": variant.bdf_zone2retailprice,
				"bdf_zone3retailprice": variant.bdf_zone3retailprice,
				"bdf_zone4retailprice": variant.bdf_zone4retailprice,
				"bdf_zone5retailprice": variant.bdf_zone5retailprice,
				"bdf_zone6retailprice": variant.bdf_zone6retailprice,
				"bdf_zone7retailprice": variant.bdf_zone7retailprice,
				"bdf_zone8retailprice": variant.bdf_zone8retailprice,
				"bdf_zone9retailprice": variant.bdf_zone9retailprice,
				"bdf_zone10retailprice": variant.bdf_zone10retailprice,
				"ownerid@odata.bind": '/teams(' + variant['_ownerid_value'] + ')'
			}
			Xrm.WebApi.createRecord("bdf_articleinforecord", input).then(
				function success(result) {
					// Reset draft retail
					var input = { "bdf_draftretail": false };
					Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleGUID, input);

					if (last) {
						Xrm.Utility.closeProgressIndicator();
						var parameters = {};
						parameters["param_focustab"] = "variant_dim_margin";
						Xrm.Utility.openEntityForm(Xrm.Page.data.entity.getEntityName(), Xrm.Page.data.entity.getId(), parameters);
						formContext.getControl("project_variant_margin").refresh();
						formContext.data.refresh(true);
					}
				}
			);
		},

		deleteRecords: function (effectiveDate, variant, freight, last, formContext) {

			var articleGUID = variant.cr60a_stg_article_masterid;
			// Delete existing records if available
			Xrm.WebApi.retrieveMultipleRecords("bdf_articleinforecord", "?$select=bdf_articleinforecordid&$filter=bdf_infotype eq 2 and _bdf_articleid_value eq " + articleGUID + " and bdf_effectivedate eq " + effectiveDate).then(
				function success(data) {
					if (data.entities.length > 0) {
						for (let info of data.entities) {
							var articleInfoGUID = info.bdf_articleinforecordid;
							Xrm.WebApi.deleteRecord("bdf_articleinforecord", articleInfoGUID).then(
								function success(result) {
									// Create new snapshot entries
									publishRetail.createRecords(effectiveDate, variant, freight, last, formContext);
								}
							);
						}
					} else {
						// Create new snapshot entries
						publishRetail.createRecords(effectiveDate, variant, freight, last, formContext);
					}
				}
			);
		},

		takeSnapshot: function (SelectedControl, formContext) {
			debugger;
			// Save screen data first
			formContext.data.save();

			var parentID = Xrm.Utility.getPageContext().input.entityId.slice(1, -1);
			var freight = formContext.getAttribute('bdf_freightcostpercube').getValue();

			// Check if there is any pending work to do
			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_draftretail eq true and _bdf_project_value eq " + parentID).then(
				function success(data) {
					if (data.entities.length == 0)
						Xrm.Utility.alertDialog("There is no pending retail to publish.");
					else {

						// Open a new form to get the effective date
						var pageInput = {
							pageType: "entityrecord",
							entityName: "bdf_projectcostretailsnapshot",
							//formType: 2,
							formId: "{E4FC5BD4-EE1A-4BA0-9343-85AED9F5FFA4}",
							createFromEntity: { entityType: "bdf_project", id: Xrm.Page.data.entity.getId(), name: "Project" }
							//entityId: "265c5fac-6fc7-ed11-b597-00224828ddaf"
						};

						var navigationOptions = {
							target: 2,
							height: { value: 50, unit: "%" },
							width: { value: 50, unit: "%" },
							position: 1,
							title: "***Note: This action will send data to SAP***"
						};
						Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
							function success(result) {
								if (result.savedEntityReference == null) return;

								Xrm.Utility.showProgressIndicator("Taking retail snapshot");

								var nowDate = new Date();
								var effectiveDate = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + nowDate.getDate(); // + 'T00:00:00Z'; T00:00:00Z

								// Update the newly created record
								var data = { "bdf_infotype": 2, "bdf_effectivedate": effectiveDate }
								Xrm.WebApi.updateRecord("bdf_projectcostretailsnapshot", result.savedEntityReference[0].id, data);

								Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_draftretail eq true and _bdf_project_value eq " + parentID).then(
									function success(data) {

										// Delete existing snapshot if available 
										for (let variant of data.entities) {
											var last = variant === data.entities.at(-1) ? true : false
											publishRetail.deleteRecords(effectiveDate, variant, freight, last, formContext);
										}
									}
								);
							},
							function error() {
								Xrm.Utility.closeProgressIndicator();
								Xrm.Utility.alertDialog(error.message);
							}
						);
					}
				}
			);
		}
	},

	publishCost = {

		enableButton: function (formContext) {
			debugger;
			//var result = publishCost.calculateTruck(formContext);
			var tc = formContext.formContext.getControl('truck_calculator');
			if (tc != null && tc.getVisible())
				tc.getVisible();
			if (formContext.controlDescriptor.Name.startsWith("project_variant_margin") ||
				formContext.controlDescriptor.Name.startsWith("project_variant_comp_margin")) {
				return true;
			}
			return false;
		},

		calculateTruck: function (formContext) {
			let subgrid = formContext.formContext.getControl('truck_calculator');

			if (subgrid != null) {
				let rows = subgrid.getGrid().getRows();
			}
			return true;
			//thisRow.data.entity.attributes.get('ATTRIBUTE_NAME').getValue(); // Or other attribute methods
			//thisRow.data.entity.attributes.get('description').controls.get(0).setDisabled(false); // Or other control methods
		},

		createRecords: function (effectiveDate, variant, freight, last, formContext) {
			// Create new snapshot entries
			var articleGUID = variant.cr60a_stg_article_masterid;

			// Save in info record
			var input =
			{
				"bdf_ArticleID@odata.bind": "/cr60a_stg_article_masters(" + articleGUID + ")",
				"bdf_effectivedate": effectiveDate,
				"bdf_freightcostpercube": freight,
				"bdf_cost": variant.bdf_cost,
				"bdf_retailprice": variant.bdf_retailprice,
				"bdf_dc1merchcost": variant.bdf_dc1merchcost,
				"bdf_dc2merchcost": variant.bdf_dc2merchcost,
				"bdf_dc3merchcost": variant.bdf_dc3merchcost,
				"bdf_dc4merchcost": variant.bdf_dc4merchcost,
				"bdf_dc5merchcost": variant.bdf_dc5merchcost,
				"bdf_totalfreightcost": variant.bdf_totalfreightcost,
				"bdf_totallandedcost": variant.bdf_totallandedcost,
				"bdf_infotype": 1,
				"bdf_zone2retailprice": variant.bdf_zone2retailprice,
				"bdf_zone3retailprice": variant.bdf_zone3retailprice,
				"bdf_zone4retailprice": variant.bdf_zone4retailprice,
				"bdf_zone5retailprice": variant.bdf_zone5retailprice,
				"bdf_zone6retailprice": variant.bdf_zone6retailprice,
				"bdf_zone7retailprice": variant.bdf_zone7retailprice,
				"bdf_zone8retailprice": variant.bdf_zone8retailprice,
				"bdf_zone9retailprice": variant.bdf_zone9retailprice,
				"bdf_zone10retailprice": variant.bdf_zone10retailprice,
				"ownerid@odata.bind": '/teams(' + variant['_ownerid_value'] + ')'
			}
			Xrm.WebApi.createRecord("bdf_articleinforecord", input).then(
				function success(result) {
					// Reset draft cost
					var input = { "bdf_draftcost": false };
					Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleGUID, input);

					if (last) {
						Xrm.Utility.closeProgressIndicator();
						var parameters = {};
						parameters["param_focustab"] = "variant_dim_margin";
						Xrm.Utility.openEntityForm(Xrm.Page.data.entity.getEntityName(), Xrm.Page.data.entity.getId(), parameters);
						formContext.getControl("project_variant_margin").refresh();
						formContext.data.refresh(true);
					}
				}
			);
		},

		deleteRecords: function (effectiveDate, variant, freight, last, formContext) {

			var articleGUID = variant.cr60a_stg_article_masterid;
			// Delete existing records if available
			Xrm.WebApi.retrieveMultipleRecords("bdf_articleinforecord", "?$select=bdf_articleinforecordid&$filter=bdf_infotype eq 1 and _bdf_articleid_value eq " + articleGUID + " and bdf_effectivedate eq " + effectiveDate).then(
				function success(data) {
					if (data.entities.length > 0) {
						for (let info of data.entities) {
							var articleInfoGUID = info.bdf_articleinforecordid;
							Xrm.WebApi.deleteRecord("bdf_articleinforecord", articleInfoGUID).then(
								function success(result) {
									// Create new snapshot entries
									publishCost.createRecords(effectiveDate, variant, freight, last, formContext);
								}
							);
						}
					} else {
						// Create new snapshot entries
						publishCost.createRecords(effectiveDate, variant, freight, last, formContext);
					}
				}
			);
		},

		takeSnapshot: function (SelectedControl, formContext) {
			debugger;

			// Save screen data first
			formContext.data.save();

			var parentID = Xrm.Utility.getPageContext().input.entityId.slice(1, -1);
			var freight = formContext.getAttribute('bdf_freightcostpercube').getValue();

			// Check if there is any pending work to do
			Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_draftcost eq true and _bdf_project_value eq " + parentID).then(
				function success(data) {
					if (data.entities.length == 0)
						Xrm.Utility.alertDialog("There is no pending cost to publish.");
					else {
						// Open a new form to get the effective date
						var pageInput = {
							pageType: "entityrecord",
							entityName: "bdf_projectcostretailsnapshot",
							//formType: 2,
							formId: "{E4FC5BD4-EE1A-4BA0-9343-85AED9F5FFA4}",
							createFromEntity: { entityType: "bdf_project", id: Xrm.Page.data.entity.getId(), name: "Project" }
							//entityId: "265c5fac-6fc7-ed11-b597-00224828ddaf"
						};
						var navigationOptions = {
							target: 2,
							height: { value: 50, unit: "%" },
							width: { value: 50, unit: "%" },
							position: 1,
							title: "***Note:This action will send data to SAP***"
						};
						Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
							function success(result) {
								if (result.savedEntityReference == null) return;

								Xrm.Utility.showProgressIndicator("Taking cost snapshot");
								// Update the newly created record
								var data = { "bdf_infotype": 1 }
								Xrm.WebApi.updateRecord("bdf_projectcostretailsnapshot", result.savedEntityReference[0].id, data)

								// Specify the entity logical name
								var entityLogicalName = "bdf_aricleinforecord";

								Xrm.WebApi.retrieveRecord("bdf_projectcostretailsnapshot", result.savedEntityReference[0].id).then(
									function success(data) {
										var effectiveDate = data.bdf_effectivedate;

										// Save in variant table
										Xrm.WebApi.retrieveMultipleRecords("cr60a_stg_article_master", "?$filter=bdf_draftcost eq true and _bdf_project_value eq " + parentID).then(
											function success(data) {

												// Delete existing snapshot if available 
												for (let variant of data.entities) {
													//var articleGUID = variant.cr60a_stg_article_masterid;
													var last = variant === data.entities.at(-1) ? true : false
													publishCost.deleteRecords(effectiveDate, variant, freight, last, formContext);
												}
											}
										);
									}
								);
							},
							function error() {
								Xrm.Utility.closeProgressIndicator();
								Xrm.Utility.alertDialog(error.message);
							}
						);
					}
				}
			);
		}
	}

//---------------------------------------------- onChange of dc5 indicator
function onChangeDC5(articleId, dc5Indicator) {
	debugger;
	try {
		//        var formContext = executionContext.getFormContext();
		//        var dc5Indicator = formContext.getAttribute("bdf_dc5indicator").getValue();
		//        var articleId = formContext.data.entity.getId().slice(1, -1);

		if (dc5Indicator == true) {
			Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleId}'`).then(
				function success(results) {
					if (results.entities.length > 0) {
						// Iterate through the retrieved records and update each one
						// Xrm.Utility.showProgressIndicator("");
						for (var i = 0; i < results.entities.length; i++) {
							var recordId = results.entities[i].bdf_articledcid; // Assuming the ID field is named "bdf_articledcid"
							var dccodeValue = results.entities[i].bdf_dc; // Assuming "bdf_dccode" is the field you want to check

							// Check if dccode is not equal to 3220 before updating
							if (dccodeValue !== "3220") {
								var entity = {};
								entity.bdf_dropcode = 1; // Assuming "bdf_dropcode" is the field you want to update
								entity.bdf_dropdate = new Date();
								entity.bdf_grprocessingtime = (i < 5) ? 999 : null/* Set your default value for other records */;
								// Use Xrm.WebApi to update the record
								Xrm.WebApi.updateRecord("bdf_articledc", recordId, entity).then(
									function success(result) {
										// Record updated successfully
										formContext.getControl("Subgrid_new_3").refresh();
									},
									function (error) {
										console.log(error.message);
										//Xrm.Utility.closeProgressIndicator();
									}
								);
							}
						}
					}
				},
				function (error) {
					console.log(error.message);
					Xrm.Utility.closeProgressIndicator();
				}
			);
		} else {
			// If dc5Indicator is false, retrieve related records
			Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleId}'`).then(
				function success(results) {
					if (results.entities.length > 0) {
						// Iterate through the retrieved records and update dropcode to null
						for (var i = 0; i < results.entities.length; i++) {
							var recordId = results.entities[i].bdf_articledcid; // Assuming the ID field is named "bdf_articledcid"
							var dccodeValue = results.entities[i].bdf_dc; // Assuming "bdf_dccode" is the field you want to check

							// Check if dccode is not equal to 3220 before updating to null
							if (dccodeValue !== "3220") {
								var entity = {};
								entity.bdf_dropcode = null; // Set "bdf_dropcode" to null
								entity.bdf_dropdate = null;
								entity.bdf_grprocessingtime = (i < 5) ? 6 : null/* Set your default value for other records */;
								// Use Xrm.WebApi to update the record
								Xrm.WebApi.updateRecord("bdf_articledc", recordId, entity).then(
									function success(result) {
										// Record updated successfully
										formContext.getControl("Subgrid_new_3").refresh();
									},
									function (error) {
										console.log(error.message);
										//Xrm.Utility.closeProgressIndicator();
									}
								);
							}
						}
					}
				},
				function (error) {
					console.log(error.message);
					// Xrm.Utility.closeProgressIndicator();
				}
			);
		}
	} catch (error) {
		Xrm.Utility.alertDialog(error.message);
	}
}