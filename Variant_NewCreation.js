function enableButton (selectedControl) {
	debugger;
	//var formItem = formContext.ui.formSelector.getCurrentItem();
	//var pageContext = Xrm.Utility.getPageContext();
	//var input = pageContext.input;
	//var selectedViewId = input.viewId;
	//if (formItem.getId() === '1cf5089c-6d9b-ed11-aad1-00224828ddaf'){
	//if (selectedViewId == '{60D0E501-7329-484F-9FFE-54C4F3338D60}'){
	//	return false;
	//}}
	//return false;
	var controlName = selectedControl._controlName;
	//var entityName = selectedControl._formContext._entityName;
	var controlList = ['project_variant_dim', 'project_variant_margin', 'case_pack_margin', 'project_variant_comp_margin', 'cost_snapshot', 'truck_calculator', 
				       'primary_generics', 'primary_generic_home']
	if (controlList.includes(controlName)) return false;
}