function missing_Hts_Code(){

    webapi.safeAjax({
        type: "GET",
        url: "/_api/bdf_variantextensions?$filter=bdf_commimpcode eq null&$count=true",
        contentType: "application/json",
        headers: {
            "Prefer": "odata.include-annotations=*"
        },
        success: function (data, textStatus, xhr) {
            var results = data;
            console.log(results);
            var odata_count = results["@odata.count"];
            for (var i = 0; i < results.value.length; i++) {
                var result = results.value[i];
                // Columns
                var bdf_variantextensionid = result["bdf_variantextensionid"]; // Guid
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log(xhr);
        }
    });
}