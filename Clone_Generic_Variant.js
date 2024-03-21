async function cloneGenericVariant(GUIDS, control) {
	debugger;

	Xrm.Utility.showProgressIndicator("Cloning Generic and Variants...");

	var idMap = {};

	for (GUID of GUIDS) {
		await Xrm.WebApi.retrieveRecord("bdf_generic", GUID, "?$expand=bdf_variant_generic").then(
			async function success(data) {
				//------------------------------------
				let inconsistencyFound = false; // Flag to track if inconsistency was found

				for (const iterator of data.bdf_variant_generic) {
					if (iterator._cr60a_size_value) {

						await Xrm.WebApi.retrieveRecord("cr60a_size", `${iterator._cr60a_size_value}`, "?$select=_cr60a_producttype_value,cr60a_code,cr60a_sizename").then(
							function success(result) {
								console.log(result);
								// Columns
								var cr60a_sizeid = result["cr60a_sizeid"]; // Guid
								var cr60a_producttype = result["_cr60a_producttype_value"]; // Lookup
								var cr60a_producttype_formatted = result["_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue"];
								var cr60a_producttype_lookuplogicalname = result["_cr60a_producttype_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
								var cr60a_code = result["cr60a_code"]; // Text
								var cr60a_sizename = result["cr60a_sizename"]; // Text

								if (cr60a_producttype != iterator._cr60a_producttype_value) {
									inconsistencyFound = true; // Set the flag to true if inconsistency is found
									var alertStrings = { confirmButtonLabel: "Yes", text: `Article Id ${iterator.cr60a_articleid} has inconsistency between Product Type : ${iterator["_cr60a_producttype_value@OData.Community.Display.V1.FormattedValue"]} and Related Field : ${iterator["_cr60a_size_value@OData.Community.Display.V1.FormattedValue"]} `, title: "Error" };
									var alertOptions = { height: 120, width: 260 };
									Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then(
										function (success) {
											console.log("Alert dialog closed");
											Xrm.Utility.closeProgressIndicator();
											return; // Exit the loop after showing the alert dialog
										},
										function (error) {
											console.log(error.message);
										}
									);
								}
							},
							function (error) {
								console.log(error.message);
							}
						);
					}

					if (inconsistencyFound) {
						break; // Break out of the loop if an inconsistency is found
					}
				}

				// Execute saveGeneric(data) only if inconsistency was not found
				if (!inconsistencyFound) {
					saveGeneric(data);
				}

				//------------------------------------

			},
			function (error) {
				Xrm.Utility.alertDialog(error.message);
			}
		);
	}

	function saveGeneric(source) {
		try {
			var input =
			{
				"bdf_expecteddropdate": source["bdf_expecteddropdate"],
				"bdf_expectedlaunchdate": source["bdf_expectedlaunchdate"],
				"bdf_genericdescription": (source["bdf_genericdescription"] == null ? null : "**" + source["bdf_genericdescription"].substring(0, 98)),
				"bdf_genericname": (source["bdf_genericname"] == null ? null : "**" + source["bdf_genericname"].substring(0, 48)),
				"bdf_goofproofindicator": source["bdf_goofproofindicator"],
				"bdf_notes": source["bdf_notes"],
				//"bdf_specificcolor": source["bdf_specificcolor"],
				//"bdf_specificfinish": source["bdf_specificfinish"],
				"bdf_specificmaterial": source["bdf_specificmaterial"],
				//"bdf_ColorGroup@odata.bind": (source["_bdf_colorgroup_value"] == null ? null : "/cr60a_colorgroups("+source["_bdf_colorgroup_value"]+")"),
				"bdf_Factory@odata.bind": (source["_bdf_factory_value"] == null ? null : "/bdf_factories(" + source["_bdf_factory_value"] + ")"),
				//"bdf_FamilyGroup@odata.bind": (source["_bdf_familygroup_value"] == null ? null : "/bdf_familygroups("+source["_bdf_familygroup_value"]+")"),

				"bdf_Feature1@odata.bind": (source["_bdf_feature1_value"] == null ? null : "/cr60a_features(" + source["_bdf_feature1_value"] + ")"),
				"bdf_Feature2@odata.bind": (source["_bdf_feature2_value"] == null ? null : "/cr60a_features(" + source["_bdf_feature2_value"] + ")"),
				"bdf_Feature3@odata.bind": (source["_bdf_feature3_value"] == null ? null : "/cr60a_features(" + source["_bdf_feature3_value"] + ")"),
				"bdf_Feature4@odata.bind": (source["_bdf_feature4_value"] == null ? null : "/cr60a_features(" + source["_bdf_feature4_value"] + ")"),
				"bdf_Feature5@odata.bind": (source["_bdf_feature5_value"] == null ? null : "/cr60a_features(" + source["_bdf_feature5_value"] + ")"),

				//"bdf_FinishGroup@odata.bind": (source["_bdf_finishgroup_value"] == null ? null : "/cr60a_finishgroups("+source["_bdf_finishgroup_value"]+")"),
				"bdf_FrameMaterialGroup@odata.bind": (source["_bdf_framematerialgroup_value"] == null ? null : "/cr60a_materialgroups(" + source["_bdf_framematerialgroup_value"] + ")"),
				"bdf_Project@odata.bind": "/bdf_projects(" + source["_bdf_project_value"] + ")",
				"bdf_UpholsteryMaterialGroup@odata.bind": (source["_bdf_upholsterymaterialgroup_value"] == null ? null : "/cr60a_upholsterymaterialgroups(" + source["_bdf_upholsterymaterialgroup_value"] + ")"),
				"bdf_Vendor@odata.bind": (source["_bdf_vendor_value"] == null ? null : "/bdf_vendors(" + source["_bdf_vendor_value"] + ")"),
				"bdf_VendorContact@odata.bind": (source["_bdf_vendorcontact_value"] == null ? null : "/bdf_vendorcontacts(" + source["_bdf_vendorcontact_value"] + ")"),
				"ownerid@odata.bind": '/teams(' + source['_ownerid_value'] + ')',
			}




			//----------------------------------------------- When cloning a generic record, verify whether the project is in the "Testing & Launch" stage. If it is, update the Generic Stage value to "Ideation Dt: 10-10-2023" by Vasudev.
			var projectGuid = Xrm.Page.data.entity.getId().slice(1, -1);

			Xrm.WebApi.retrieveMultipleRecords("bdf_project_milestones", `?$select=_activestageid_value&$filter=_bpf_bdf_projectid_value eq '${projectGuid}'`).then(
				function success(results) {
					console.log(results);
					for (let i = 0; i < results.entities.length; i++) {
						var result = results.entities[i];
						// Columns

						var activestageid_formatted = result["_activestageid_value@OData.Community.Display.V1.FormattedValue"];

						if (activestageid_formatted == "Testing & Launch") {
							input["bdf_genericstage"] = 1

							Xrm.WebApi.createRecord("bdf_generic", input).then(
								function success(result) {
									var genericGUID = result.id;
									idMap[source["_bdf_generic_value"]] = genericGUID;
									for (variant of source["bdf_variant_generic"]) {
										saveVariant(variant, genericGUID, source["_bdf_project_value"])
									}
									for (variant of source["bdf_variant_generic"]) {
										if (variant['bdf_articletype'] != '1')
											saveBOM(variant['cr60a_stg_article_masterid']);
									}
									control.refresh();
									Xrm.Utility.closeProgressIndicator();
								},
								function (error) {
									Xrm.Utility.alertDialog(error.message);
								}
							);
						}

						else {

							Xrm.WebApi.createRecord("bdf_generic", input).then(
								function success(result) {
									var genericGUID = result.id;
									idMap[source["_bdf_generic_value"]] = genericGUID;
									for (variant of source["bdf_variant_generic"]) {
										saveVariant(variant, genericGUID, source["_bdf_project_value"])
									}
									for (variant of source["bdf_variant_generic"]) {
										if (variant['bdf_articletype'] != '1')
											saveBOM(variant['cr60a_stg_article_masterid']);
									}
									control.refresh();
									Xrm.Utility.closeProgressIndicator();
								},
								function (error) {
									Xrm.Utility.alertDialog(error.message);
								}
							);
						}

					}
				},
				function (error) {
					console.log(error.message);
				}
			);
			//------------------------------------------
			//Xrm.Utility.alertDialog("Clone process completed.");
		}
		catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	} // saveGeneric

	async function saveVariant(source, genericGUID, projectGUID) {
		try {
			var input =
			{
				"bdf_grprocessingtime": source["bdf_grprocessingtime"],
				"bdf_globaldropstatus": source["bdf_globaldropstatus"],
				"bdf_globaldropdate": ((source["bdf_globaldropstatus"] == 1 || source["bdf_globaldropstatus"] == 3) ? new Date().toISOString() : null),
				"bdf_Project@odata.bind": "/bdf_projects(" + projectGUID + ")",
				"bdf_Generic@odata.bind": "/bdf_generics(" + genericGUID + ")",
				"cr60a_articlename": "**" + source['cr60a_articlename'].substring(0, 38),
				//"cr60a_articledescription": "**" + source['cr60a_articledescription'].substring(0, 38),
				"cr60a_articletype": source['cr60a_articletype'],
				"cr60a_basematerial": source['cr60a_basematerial'],
				"cr60a_cmstatus": source['cr60a_cmstatus'],
				"cr60a_color": source['cr60a_color'],
				//"cr60a_ColorGroup@odata.bind": (source["_cr60a_colorgroup_value"] == null ? null : "/cr60a_colorgroups("+source["_cr60a_colorgroup_value"]+")"),
				"cr60a_familycode": source['cr60a_familycode'],
				"cr60a_familycodedescription": source['cr60a_familycodedescription'],
				//"cr60a_FinishGroup@odata.bind": (source["_cr60a_finishgroup_value"] == null ? null : "/cr60a_finishgroups("+source["_cr60a_finishgroup_value"]+")"),
				"cr60a_majorcode": source['cr60a_majorcode'],
				"cr60a_majorcodedescription": source['cr60a_majorcodedescription'],
				"cr60a_material": source['cr60a_material'],
				"cr60a_MaterialGroup@odata.bind": (source["_cr60a_materialgroup_value"] == null ? null : "/cr60a_materialgroups(" + source["_cr60a_materialgroup_value"] + ")"),
				"cr60a_merchandisecategory": source['cr60a_merchandisecategory'],
				"cr60a_merchandisecategorydescription": source['cr60a_merchandisecategorydescription'],
				"cr60a_minorcode": source['cr60a_minorcode'],
				"cr60a_minorcodedescription": source['cr60a_minorcodedescription'],
				"cr60a_motion": source['cr60a_motion'],
				//"cr60a_pcmproducttype": source['cr60a_pcmproducttype'],
				//"cr60a_pcmstyle": source['cr60a_pcmstyle'],
				//"cr60a_pcmvariantcolor": source['cr60a_pcmvariantcolor'],
				//"cr60a_pcmvariantfinish": source['cr60a_pcmvariantfinish'],
				//"cr60a_primarymaterial": source['cr60a_primarymaterial'],
				"cr60a_ProductSubType@odata.bind": (source["_cr60a_productsubtype_value"] == null ? null : "/cr60a_productsubtypes(" + source["_cr60a_productsubtype_value"] + ")"),
				"cr60a_ProductType@odata.bind": (source["_cr60a_producttype_value"] == null ? null : "/cr60a_producttypes(" + source["_cr60a_producttype_value"] + ")"),
				"cr60a_salestext": source['cr60a_salestext'],
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
				"cr60a_Size@odata.bind": (source["_cr60a_size_value"] == null ? null : "/cr60a_sizes(" + source["_cr60a_size_value"] + ")"),
				"cr60a_SideFacing@odata.bind": (source["_cr60a_sidefacing_value"] == null ? null : "/cr60a_sidefacings(" + source["_cr60a_sidefacing_value"] + ")"),
				"cr60a_SwitchStyle@odata.bind": (source["_cr60a_switchstyle_value"] == null ? null : "/cr60a_switchstyles(" + source["_cr60a_switchstyle_value"] + ")"),
				"cr60a_NumberofSeat@odata.bind": (source["_cr60a_numberofseat_value"] == null ? null : "/cr60a_numberofseats(" + source["_cr60a_numberofseat_value"] + ")"),
				"cr60a_ArmStyle@odata.bind": (source["_cr60a_armstyle_value"] == null ? null : "/cr60a_armstyles(" + source["_cr60a_armstyle_value"] + ")"),
				"cr60a_BulbWattage@odata.bind": (source["_cr60a_bulbwattage_value"] == null ? null : "/cr60a_bulbwattages(" + source["_cr60a_bulbwattage_value"] + ")"),
				"cr60a_Height@odata.bind": (source["_cr60a_height_value"] == null ? null : "/cr60a_heights(" + source["_cr60a_height_value"] + ")"),
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
				"cr60a_vendorarticlenumber": (source['cr60a_vendorarticlenumber'] == null ? null : '**' + source['cr60a_vendorarticlenumber'].substring(0, 33)),
				"cr60a_CupHolderType@odata.bind": (source["_cr60a_cupholdertype_value"] == null ? null : "/cr60a_cupholdertypes(" + source["_cr60a_cupholdertype_value"] + ")"),
				"cr60a_NumberofPillow@odata.bind": (source["_cr60a_numberofpillow_value"] == null ? null : "/cr60a_numberofpillows(" + source["_cr60a_numberofpillow_value"] + ")"),
				"cr60a_PowerBase@odata.bind": (source["_cr60a_powerbase_value"] == null ? null : "/cr60a_powerbases(" + source["_cr60a_powerbase_value"] + ")"),
				"cr60a_Feature1@odata.bind": (source["_cr60a_feature1_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature1_value"] + ")"),
				"cr60a_Feature2@odata.bind": (source["_cr60a_feature2_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature2_value"] + ")"),
				"cr60a_Feature3@odata.bind": (source["_cr60a_feature3_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature3_value"] + ")"),
				"cr60a_Feature4@odata.bind": (source["_cr60a_feature4_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature4_value"] + ")"),
				"cr60a_Feature5@odata.bind": (source["_cr60a_feature5_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature5_value"] + ")"),
				"cr60a_Feature6@odata.bind": (source["_cr60a_feature6_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature6_value"] + ")"),
				"cr60a_Feature7@odata.bind": (source["_cr60a_feature7_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature7_value"] + ")"),
				"cr60a_Feature8@odata.bind": (source["_cr60a_feature8_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature8_value"] + ")"),
				"cr60a_Feature9@odata.bind": (source["_cr60a_feature9_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature9_value"] + ")"),
				"cr60a_Feature10@odata.bind": (source["_cr60a_feature10_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature10_value"] + ")"),
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
				"cr60a_assemblyrequired": source['cr60a_assemblyrequired'],
				"cr60a_additionaldimension": source['cr60a_additionaldimension'],
				"cr60a_additionalmaterialinformation": source['cr60a_additionalmaterialinformation'],
				"cr60a_seatcushionthickness": source['cr60a_seatcushionthickness'],
				"cr60a_specialcareinstructions": source['cr60a_specialcareinstructions'],
				"cr60a_weightlimit": source['cr60a_weightlimit'],
				"cr60a_recommendedmattressheight": source['cr60a_recommendedmattressheight'],
				"cr60a_numberofslat": (source['cr60a_numberofslat']),
				"cr60a_totalrevenueamount": (source['cr60a_totalrevenueamount']),
				"cr60a_generalitemcategorygroup": source['cr60a_generalitemcategorygroup'],
				"bdf_articletype": source['bdf_articletype'],
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
				"bdf_outofpackagingheight": source['bdf_outofpackagingheight'],
				"bdf_outofpackaginglength": source['bdf_outofpackaginglength'],
				"bdf_outofpackagingvolume": source['bdf_outofpackagingvolume'],
				"bdf_outofpackagingweight": source['bdf_outofpackagingweight'],
				"bdf_outofpackagingwidth": source['bdf_outofpackagingwidth'],
				"bdf_inpackagingheight": source['bdf_inpackagingheight'],
				"bdf_inpackaginglength": source['bdf_inpackaginglength'],
				"bdf_inpackagingvolume": source['bdf_inpackagingvolume'],
				"bdf_inpackagingweight": source['bdf_inpackagingweight'],
				"bdf_inpackagingwidth": source['bdf_inpackagingwidth'],
				"bdf_mainarticlepackageindicator": source['bdf_mainarticlepackageindicator'],
				"bdf_planneddeliverytimeindays": source['bdf_planneddeliverytimeindays'],
				"bdf_ArticleGroup@odata.bind": (source["_bdf_articlegroup_value"] == null ? null : "/bdf_articlegroups(" + source["_bdf_articlegroup_value"] + ")"),
				"bdf_casepackretailprice": source['bdf_casepackretailprice'],
				"bdf_casepackunits": source['bdf_casepackunits'],
				"bdf_cost": source['bdf_cost'],
				"bdf_dc1merchcost": source['bdf_dc1merchcost'],
				"bdf_dc2merchcost": source['bdf_dc2merchcost'],
				"bdf_dc3merchcost": source['bdf_dc3merchcost'],
				"bdf_dc4merchcost": source['bdf_dc4merchcost'],
				"bdf_dc5merchcost": source['bdf_dc5merchcost'],
				"bdf_deliverydependentcomponent": source['bdf_deliverydependentcomponent'],
				"bdf_flooredindicator": source['bdf_flooredindicator'],
				"bdf_goofproofindicator": source['bdf_goofproofindicator'],
				"bdf_onlineindicator": source['bdf_onlineindicator'],
				"bdf_retailprice": source['bdf_retailprice'],
				"bdf_rptype": source['bdf_rptype'],
				//"bdf_setuptimeminutes": source['bdf_setuptimeminutes'],	
				"bdf_tariffindicator": source['bdf_tariffindicator'],
				"bdf_tariff": source['bdf_tariff']
			}
			await Xrm.WebApi.createRecord("cr60a_stg_article_master", input).then(
				function success(result) {
					articleGUID = result.id;
					idMap[source["cr60a_stg_article_masterid"]] = articleGUID;
					saveArticlePackageMM(projectGUID, articleGUID);
					updateArticleID(articleGUID);
					articleDCCreation(source, articleGUID);
				},
				function (error) {
					console.log(input);
					Xrm.Utility.alertDialog(error.message);
				}
			);
		}
		catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	} // saveVariant

	async function saveArticlePackageMM(projectID, articleID) {

		Xrm.WebApi.online.execute(buildRelateData(projectID, articleID, "Associate"))
			.then(function (response) {
				if (response.ok) {
					//console.log("Status: %s %s", response.status, response.statusText);
				}
			})
			.catch(function (error) {
				Xrm.Utility.alertDialog(error.message);
			});

	} // saveArticlePackageMM

	function buildRelateData(projectID, articleID, operationName) {

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
	} // Build MM Relate Data

	async function updateArticleID(articleID) {

		try {
			Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", articleID).then(
				function success(data) {
					var input =
					{
						"cr60a_articleid": data.bdf_variantnumber
					}
					Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleID, input).then(
						function success(result) {
							productGUID = result.id;
							//Xrm.Utility.closeProgressIndicator();
							control.refresh();
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
		} catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	} // Update Article ID from Variant Number	

	async function saveBOM(packageGUID) {

		Xrm.WebApi.retrieveMultipleRecords("bdf_articlebillofmaterial", "?$filter=_bdf_packagearticle_value eq " + packageGUID).then(
			function success(data) {
				let skip = false;
				data.entities.forEach(async function (row) {
					idMap[row._bdf_componentarticle_value];
					var componentGUID = row._bdf_componentarticle_value;
					if (componentGUID == null && !skip) {
						Xrm.Utility.alertDialog('Skipping Package #' + row['_bdf_packagearticle_value@OData.Community.Display.V1.FormattedValue'] + ' as component was not found');
						skip = true;
						return;
					}
					try {
						if (idMap[packageGUID] != null && !skip) {
							var input =
							{
								"bdf_PackageArticle@odata.bind": "/cr60a_stg_article_masters(" + idMap[packageGUID] + ")",
								"bdf_ComponentArticle@odata.bind": "/cr60a_stg_article_masters(" + componentGUID + ")",
								"bdf_componentqty": row.bdf_componentqty,
								"bdf_totalcomponentcount": row.bdf_totalcomponentcount
							}
							await Xrm.WebApi.createRecord("bdf_articlebillofmaterial", input).then(
								function success(result) {
									genericGUID = result.id;
								},
								function (error) {
									Xrm.Utility.alertDialog(error.message);
								}
							);
						}
					}
					catch (e) {
						Xrm.Utility.alertDialog(e.message);
					}
				});
			}
		)
	} // saveBOM
}




async function cloneVariant(GUIDS, control) {
	debugger;


	var idMap = {};

	if (GUIDS.length > 1) {

		Xrm.Utility.alertDialog("Please select just one record to clone");
		return;

	}
	else {
		const firstGUID = GUIDS[0];
		Xrm.Utility.showProgressIndicator("Cloning Variants");
		try {
			const data = await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", firstGUID);
			var genericGUID = data["_bdf_generic_value"];
			var projectGUID = data["_bdf_project_value"];
			var dc5Indicator = data["bdf_dc5indicator"];
			idMap["PackageId"] = data['cr60a_stg_article_masterid'];

			await saveVariant(data, genericGUID, projectGUID, idMap.PackageId);

			setTimeout(function () {
				control.refresh();
				Xrm.Utility.closeProgressIndicator();
			}, 2000);
		} catch (error) {
			Xrm.Utility.alertDialog(error.message);
			control.refresh();
			Xrm.Utility.closeProgressIndicator();
		}
	}

	async function saveVariant(source, genericGUID, projectGUID, PackageId) {
		try {
			var input = {
				"bdf_grprocessingtime": source["bdf_grprocessingtime"],
				"bdf_globaldropstatus": source["bdf_globaldropstatus"],
				"bdf_globaldropdate": ((source["bdf_globaldropstatus"] == 1 || source["bdf_globaldropstatus"] == 3) ? new Date().toISOString() : null),
				"bdf_Project@odata.bind": "/bdf_projects(" + projectGUID + ")",
				"bdf_Generic@odata.bind": "/bdf_generics(" + genericGUID + ")",
				"cr60a_articlename": (source["cr60a_articlename"] == null ? null : "**" + source['cr60a_articlename'].substring(0, 38)),
				//"cr60a_articledescription": "**" + source['cr60a_articledescription'].substring(0, 38),
				"cr60a_articletype": source['cr60a_articletype'],
				"cr60a_basematerial": source['cr60a_basematerial'],
				"cr60a_cmstatus": source['cr60a_cmstatus'],
				"cr60a_color": source['cr60a_color'],
				//"cr60a_ColorGroup@odata.bind": (source["_cr60a_colorgroup_value"] == null ? null : "/cr60a_colorgroups("+source["_cr60a_colorgroup_value"]+")"),
				"cr60a_familycode": source['cr60a_familycode'],
				"cr60a_familycodedescription": source['cr60a_familycodedescription'],
				//"cr60a_FinishGroup@odata.bind": (source["_cr60a_finishgroup_value"] == null ? null : "/cr60a_finishgroups("+source["_cr60a_finishgroup_value"]+")"),
				"cr60a_majorcode": source['cr60a_majorcode'],
				"cr60a_majorcodedescription": source['cr60a_majorcodedescription'],
				"cr60a_material": source['cr60a_material'],
				"cr60a_MaterialGroup@odata.bind": (source["_cr60a_materialgroup_value"] == null ? null : "/cr60a_materialgroups(" + source["_cr60a_materialgroup_value"] + ")"),
				"cr60a_merchandisecategory": source['cr60a_merchandisecategory'],
				"cr60a_merchandisecategorydescription": source['cr60a_merchandisecategorydescription'],
				"cr60a_minorcode": source['cr60a_minorcode'],
				"cr60a_minorcodedescription": source['cr60a_minorcodedescription'],
				"cr60a_motion": source['cr60a_motion'],
				//"cr60a_pcmproducttype": source['cr60a_pcmproducttype'],
				//"cr60a_pcmstyle": source['cr60a_pcmstyle'],
				//"cr60a_pcmvariantcolor": source['cr60a_pcmvariantcolor'],
				//"cr60a_pcmvariantfinish": source['cr60a_pcmvariantfinish'],
				//"cr60a_primarymaterial": source['cr60a_primarymaterial'],
				"cr60a_ProductSubType@odata.bind": (source["_cr60a_productsubtype_value"] == null ? null : "/cr60a_productsubtypes(" + source["_cr60a_productsubtype_value"] + ")"),
				"cr60a_ProductType@odata.bind": (source["_cr60a_producttype_value"] == null ? null : "/cr60a_producttypes(" + source["_cr60a_producttype_value"] + ")"),
				"cr60a_salestext": source['cr60a_salestext'],
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
				"cr60a_Size@odata.bind": (source["_cr60a_size_value"] == null ? null : "/cr60a_sizes(" + source["_cr60a_size_value"] + ")"),
				"cr60a_SideFacing@odata.bind": (source["_cr60a_sidefacing_value"] == null ? null : "/cr60a_sidefacings(" + source["_cr60a_sidefacing_value"] + ")"),
				"cr60a_SwitchStyle@odata.bind": (source["_cr60a_switchstyle_value"] == null ? null : "/cr60a_switchstyles(" + source["_cr60a_switchstyle_value"] + ")"),
				"cr60a_NumberofSeat@odata.bind": (source["_cr60a_numberofseat_value"] == null ? null : "/cr60a_numberofseats(" + source["_cr60a_numberofseat_value"] + ")"),
				"cr60a_ArmStyle@odata.bind": (source["_cr60a_armstyle_value"] == null ? null : "/cr60a_armstyles(" + source["_cr60a_armstyle_value"] + ")"),
				"cr60a_BulbWattage@odata.bind": (source["_cr60a_bulbwattage_value"] == null ? null : "/cr60a_bulbwattages(" + source["_cr60a_bulbwattage_value"] + ")"),
				"cr60a_Height@odata.bind": (source["_cr60a_height_value"] == null ? null : "/cr60a_heights(" + source["_cr60a_height_value"] + ")"),
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
				"cr60a_vendorarticlenumber": (source['cr60a_vendorarticlenumber'] === null ? null : '**' + source['cr60a_vendorarticlenumber'].substring(0, 33)),
				"cr60a_CupHolderType@odata.bind": (source["_cr60a_cupholdertype_value"] == null ? null : "/cr60a_cupholdertypes(" + source["_cr60a_cupholdertype_value"] + ")"),
				"cr60a_NumberofPillow@odata.bind": (source["_cr60a_numberofpillow_value"] == null ? null : "/cr60a_numberofpillows(" + source["_cr60a_numberofpillow_value"] + ")"),
				"cr60a_PowerBase@odata.bind": (source["_cr60a_powerbase_value"] == null ? null : "/cr60a_powerbases(" + source["_cr60a_powerbase_value"] + ")"),
				"cr60a_Feature1@odata.bind": (source["_cr60a_feature1_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature1_value"] + ")"),
				"cr60a_Feature2@odata.bind": (source["_cr60a_feature2_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature2_value"] + ")"),
				"cr60a_Feature3@odata.bind": (source["_cr60a_feature3_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature3_value"] + ")"),
				"cr60a_Feature4@odata.bind": (source["_cr60a_feature4_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature4_value"] + ")"),
				"cr60a_Feature5@odata.bind": (source["_cr60a_feature5_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature5_value"] + ")"),
				"cr60a_Feature6@odata.bind": (source["_cr60a_feature6_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature6_value"] + ")"),
				"cr60a_Feature7@odata.bind": (source["_cr60a_feature7_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature7_value"] + ")"),
				"cr60a_Feature8@odata.bind": (source["_cr60a_feature8_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature8_value"] + ")"),
				"cr60a_Feature9@odata.bind": (source["_cr60a_feature9_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature9_value"] + ")"),
				"cr60a_Feature10@odata.bind": (source["_cr60a_feature10_value"] == null ? null : "/cr60a_features(" + source["_cr60a_feature10_value"] + ")"),
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
				"cr60a_assemblyrequired": source['cr60a_assemblyrequired'],
				"cr60a_additionaldimension": source['cr60a_additionaldimension'],
				"cr60a_additionalmaterialinformation": source['cr60a_additionalmaterialinformation'],
				"cr60a_seatcushionthickness": source['cr60a_seatcushionthickness'],
				"cr60a_specialcareinstructions": source['cr60a_specialcareinstructions'],
				"cr60a_weightlimit": source['cr60a_weightlimit'],
				"cr60a_recommendedmattressheight": source['cr60a_recommendedmattressheight'],
				"cr60a_numberofslat": (source['cr60a_numberofslat']),
				"cr60a_totalrevenueamount": (source['cr60a_totalrevenueamount']),
				"cr60a_generalitemcategorygroup": source['cr60a_generalitemcategorygroup'],
				"bdf_articletype": source['bdf_articletype'],
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
				"bdf_outofpackagingheight": source['bdf_outofpackagingheight'],
				"bdf_outofpackaginglength": source['bdf_outofpackaginglength'],
				"bdf_outofpackagingvolume": source['bdf_outofpackagingvolume'],
				"bdf_outofpackagingweight": source['bdf_outofpackagingweight'],
				"bdf_outofpackagingwidth": source['bdf_outofpackagingwidth'],
				"bdf_inpackagingheight": source['bdf_inpackagingheight'],
				"bdf_inpackaginglength": source['bdf_inpackaginglength'],
				"bdf_inpackagingvolume": source['bdf_inpackagingvolume'],
				"bdf_inpackagingweight": source['bdf_inpackagingweight'],
				"bdf_inpackagingwidth": source['bdf_inpackagingwidth'],
				"bdf_mainarticlepackageindicator": source['bdf_mainarticlepackageindicator'],
				"bdf_planneddeliverytimeindays": source['bdf_planneddeliverytimeindays'],
				"bdf_ArticleGroup@odata.bind": (source["_bdf_articlegroup_value"] == null ? null : "/bdf_articlegroups(" + source["_bdf_articlegroup_value"] + ")"),
				"bdf_casepackretailprice": source['bdf_casepackretailprice'],
				"bdf_casepackunits": source['bdf_casepackunits'],
				"bdf_cost": (source['bdf_cost'] == null || source['bdf_cost'] == 0 ? null : source['bdf_cost']),
				"bdf_dc1merchcost": (source['bdf_dc1merchcost'] == null || source['bdf_dc1merchcost'] == 0 ? null : source['bdf_dc1merchcost']),
				"bdf_dc2merchcost": (source['bdf_dc2merchcost'] == null || source['bdf_dc2merchcost'] == 0 ? null : source['bdf_dc2merchcost']),
				"bdf_dc3merchcost": (source['bdf_dc3merchcost'] == null || source['bdf_dc3merchcost'] == 0 ? null : source['bdf_dc3merchcost']),
				"bdf_dc4merchcost": (source['bdf_dc4merchcost'] == null || source['bdf_dc4merchcost'] == 0 ? null : source['bdf_dc4merchcost']),
				"bdf_dc5merchcost": (source['bdf_dc5merchcost'] == null || source['bdf_dc5merchcost'] == 0 ? null : source['bdf_dc5merchcost']),
				"bdf_deliverydependentcomponent": source['bdf_deliverydependentcomponent'],
				"bdf_flooredindicator": source['bdf_flooredindicator'],
				"bdf_goofproofindicator": source['bdf_goofproofindicator'],
				"bdf_onlineindicator": source['bdf_onlineindicator'],
				"bdf_retailprice": source['bdf_retailprice'],
				"bdf_rptype": (source['bdf_rptype'] == null || source['bdf_rptype'] == 0 ? null : source['bdf_rptype']),
				//"bdf_setuptimeminutes": source['bdf_setuptimeminutes'],	
				"bdf_tariffindicator": source['bdf_tariffindicator'],
				"bdf_tariff": source['bdf_tariff']
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
			if (source["bdf_dc5indicator"] == true) {
				input["bdf_dc5indicator"] = true;
			}

			await Xrm.WebApi.createRecord("cr60a_stg_article_master", input).then(
				async function success(result) {
					articleGUID = result.id;
					//----------------------------------------------
					await Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleGUID}'`).then(
						async function success(results) {
							console.log(results);
							if (results.entities.length == 0) {
								//Xrm.Utility.showProgressIndicator("Creating Article DC....");
								var dcValues = ["3000", "3010", "3200", "3210", "3220"];

								for (let i = 0; i < dcValues.length; i++) {
									var record = {};
									record["bdf_Article@odata.bind"] = "/cr60a_stg_article_masters(" + articleGUID + ")"; // Lookup
									record.bdf_dc = dcValues[i]; // Text
									record["ownerid@odata.bind"] = '/teams(' + source['_ownerid_value'] + ')';
									record["bdf_grprocessingtime"] = (i < 5) ? 6 : null/* Set your default value for other records */;

									await Xrm.WebApi.createRecord("bdf_articledc", record).then(
										function success(result) {
											var newId = result.id;
											//clearTimeout(clearsetTime);

											if (i == 4) {
												//Xrm.Utility.closeProgressIndicator();
												Xrm.Page.getControl("Subgrid_new_3").refresh();
											}
											console.log("Created child record with ID: " + newId);
										},
										function (error) {
											console.log("Error creating child record: " + error.message);
											Xrm.Utility.closeProgressIndicator();

										}
									);
								}

								if (source["bdf_dc5indicator"] == true) {
									//Xrm.Page.getAttribute("bdf_dc5indicator").setValue(true);
									Xrm.Page.data.refresh(true).then(function () {
										onChangeDC5(articleGUID, source["bdf_dc5indicator"]);
									})
								}


							}

						},
						function (error) {
							console.log(error.message);
							Xrm.Utility.closeProgressIndicator();
						}
					);
					//----------------------------------------------

					await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", articleGUID).then(
						function success(data) {
							if (data['bdf_articletype'] != '1') {
								saveBOM(data['cr60a_stg_article_masterid'], PackageId, source);
							}
						}
					);

					idMap[source["cr60a_stg_article_masterid"]] = articleGUID;
					saveArticlePackageMM(projectGUID, articleGUID);
					updateArticleID(articleGUID);
				},
				function (error) {
					Xrm.Utility.alertDialog(error.message);
				}
			);
		} catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	}



	async function saveArticlePackageMM(projectID, articleID) {

		await Xrm.WebApi.online.execute(buildRelateData(projectID, articleID, "Associate"))
			.then(function (response) {
				if (response.ok) {
					//console.log("Status: %s %s", response.status, response.statusText);
				}
			})
			.catch(function (error) {
				Xrm.Utility.alertDialog(error.message);
			});

	} // saveArticlePackageMM

	function buildRelateData(projectID, articleID, operationName) {

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
		var relatedEntities = [{
			entityType: "cr60a_stg_article_master",
			id: articleID
		}];

		var relationship = "bdf_variant_project_mm";
		return new Sdk.AssociateRequest(target, relatedEntities, relationship);
	} // Build MM Relate Data

	async function updateArticleID(articleID) {

		try {
			await Xrm.WebApi.retrieveRecord("cr60a_stg_article_master", articleID).then(
				function success(data) {
					var input = {
						"cr60a_articleid": data.bdf_variantnumber
					}
					Xrm.WebApi.updateRecord("cr60a_stg_article_master", articleID, input).then(
						function success(result) {
							productGUID = result.id;
							//Xrm.Utility.closeProgressIndicator();
							control.refresh();
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
		} catch (e) {
			Xrm.Utility.alertDialog(e.message);
		}
	} // Update Article ID from Variant Number	

	async function saveBOM(packageGUID, PackageId, source) {
		await Xrm.WebApi.retrieveMultipleRecords("bdf_articlebillofmaterial", "?$filter=_bdf_packagearticle_value eq " + PackageId).then(
			function success(data) {
				let skip = false;
				data.entities.forEach(async function (row) {
					idMap[row._bdf_componentarticle_value];
					var componentGUID = row._bdf_componentarticle_value;
					if (componentGUID == null && !skip) {
						Xrm.Utility.alertDialog('Skipping Package #' + row['_bdf_packagearticle_value@OData.Community.Display.V1.FormattedValue'] + ' as component was not found');
						skip = true;
						return;
					}
					try {
						if (idMap.PackageId != null && !skip) {
							var input = {
								"bdf_PackageArticle@odata.bind": "/cr60a_stg_article_masters(" + packageGUID + ")",
								"bdf_ComponentArticle@odata.bind": "/cr60a_stg_article_masters(" + componentGUID + ")",
								"bdf_componentqty": row.bdf_componentqty,
								"bdf_totalcomponentcount": row.bdf_totalcomponentcount,
								"ownerid@odata.bind": '/teams(' + source['_ownerid_value'] + ')'
							}
							await Xrm.WebApi.createRecord("bdf_articlebillofmaterial", input).then(
								function success(result) {
									genericGUID = result.id;
								},
								function (error) {
									Xrm.Utility.alertDialog(error.message);
								}
							);
						}
					} catch (e) {
						Xrm.Utility.alertDialog(e.message);
					}
				});
			}
		)
	} // saveBOM

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
						for (let i = 0; i < results.entities.length; i++) {
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
				async function success(results) {
					if (results.entities.length > 0) {
						// Iterate through the retrieved records and update dropcode to null
						for (let i = 0; i < results.entities.length; i++) {
							var recordId = results.entities[i].bdf_articledcid; // Assuming the ID field is named "bdf_articledcid"
							var dccodeValue = results.entities[i].bdf_dc; // Assuming "bdf_dccode" is the field you want to check

							// Check if dccode is not equal to 3220 before updating to null
							if (dccodeValue !== "3220") {
								var entity = {};
								entity.bdf_dropcode = null; // Set "bdf_dropcode" to null
								entity.bdf_dropdate = null;
								entity.bdf_grprocessingtime = (i < 5) ? 6 : null/* Set your default value for other records */;
								// Use Xrm.WebApi to update the record
								await Xrm.WebApi.updateRecord("bdf_articledc", recordId, entity).then(
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


//---------------------------------------------- creation of article dc when clone generic and variant
async function articleDCCreation(source, articleGUID) {

	await Xrm.WebApi.retrieveMultipleRecords("bdf_articledc", `?$filter=_bdf_article_value eq '${articleGUID}'`).then(
		async function success(results) {
			console.log(results);
			if (results.entities.length == 0) {
				//Xrm.Utility.showProgressIndicator("Creating Article DC....");
				var dcValues = ["3000", "3010", "3200", "3210", "3220"];

				for (let i = 0; i < dcValues.length; i++) {
					var record = {};
					record["bdf_Article@odata.bind"] = "/cr60a_stg_article_masters(" + articleGUID + ")"; // Lookup
					record.bdf_dc = dcValues[i]; // Text
					record["ownerid@odata.bind"] = '/teams(' + source['_ownerid_value'] + ')';
					record["bdf_grprocessingtime"] = (i < 5) ? 6 : null/* Set your default value for other records */;

					await Xrm.WebApi.createRecord("bdf_articledc", record).then(
						function success(result) {
							var newId = result.id;
							//clearTimeout(clearsetTime);

							// if (i == 4) {
							// 	//Xrm.Utility.closeProgressIndicator();
							// 	Xrm.Page.getControl("Subgrid_new_3").refresh();
							// }
							console.log("Created child record with ID: " + newId);
						},
						function (error) {
							console.log("Error creating child record: " + error.message);
							Xrm.Utility.closeProgressIndicator();

						}
					);
				}

				if (source["bdf_dc5indicator"] == true) {
					//Xrm.Page.getAttribute("bdf_dc5indicator").setValue(true);
					Xrm.Page.data.refresh(true).then(function () {
						onChangeDC5(articleGUID, source["bdf_dc5indicator"]);
					})
				}


			}

		},
		function (error) {
			console.log(error.message);
			Xrm.Utility.closeProgressIndicator();
		}
	);
}
//----------------------------------------------