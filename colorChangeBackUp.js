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
}


function ColorChange(executionContext) {
    // Get the correct form context
    const formContext = executionContext.getFormContext ? executionContext.getFormContext() : executionContext;

    // Helper function to safely set element style with retry mechanism
    function setElementStyle(selector, property, value, maxRetries = 10) {
        let retryCount = 0;
        
        function attemptStyleSet() {
            try {
                // Try both querySelector and querySelectorAll to handle dynamic IDs
                let elements = window.top.document.querySelectorAll(selector);
                if (elements.length === 0) {
                    // If no elements found with querySelectorAll, try exact querySelector
                    const singleElement = window.top.document.querySelector(selector);
                    if (singleElement) {
                        elements = [singleElement];
                    }
                }

                if (elements.length > 0) {
                    elements.forEach(element => {
                        if (element) {
                            element.style[property] = value;
                        }
                    });
                    return true;
                }

                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retry ${retryCount} of ${maxRetries} for selector: ${selector}`);
                    setTimeout(attemptStyleSet, 500 * retryCount);
                    return false;
                } else {
                    console.warn(`Failed to find element after ${maxRetries} retries: ${selector}`);
                    return false;
                }
            } catch (error) {
                console.error(`Error setting style for ${selector}:`, error);
                return false;
            }
        }

        return attemptStyleSet();
    }

    try {
        // Get form values with proper Dynamics 365 attribute handling
        const getAttributeValue = (attributeName) => {
            try {
                const attribute = formContext.data.entity.attributes.get(attributeName);
                return attribute ? attribute.getValue() : null;
            } catch (error) {
                console.warn(`Could not get value for attribute ${attributeName}:`, error);
                return null;
            }
        };

        const formValues = {
            fraudReview: getAttributeValue("bdf_proposedforfraudreview"),
            returningFraudster: getAttributeValue("bdf_returningfraudsterind"),
            addressChanged: getAttributeValue("bdf_deliveryaddresschangedrecentlyind"),
            addressMatch: getAttributeValue("bdf_soldtoshiptoaddressmatchind"),
            docuSignHold: getAttributeValue("bdf_docusignholdind"),
            mlPrediction: getAttributeValue("bdf_mlpredictionscore"),
            distanceSoldToShip: getAttributeValue("bdf_distancebetweensoldtoandshipto"),
            distanceSoldToStore: getAttributeValue("bdf_distancebetweensoldtoandstore"),
            distanceShipToStore: getAttributeValue("bdf_distancebetweenshiptoandstore"),
            docuSignVerification: getAttributeValue("bdf_docusignverification")
        };

        // Using original selectors for toggles
        if (formValues.fraudReview === 1) 
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-1-bdf_proposedforfraudreviewf9a8a302-114e-466a-b582-6771b2ae0d92-bdf_proposedforfraudreview\\.fieldControl-toggle-container .r13wlxb8", "backgroundColor", "red");
        
        if (formValues.returningFraudster === 1) 
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-2-bdf_returningfraudsterind\\.fieldControl-toggle-container .r13wlxb8", "backgroundColor", "red");
        
        if (formValues.addressChanged === 1) 
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-1-bdf_returningfraudsterind\\.fieldControl-toggle-container .r13wlxb8", "backgroundColor", "red");
        
        if (formValues.addressMatch === 1) 
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-46-bdf_soldtoshiptoaddressmatchind\\.fieldControl-toggle-container .r13wlxb8", "backgroundColor", "red");
        
        if (formValues.docuSignHold === 1) 
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-87-bdf_docusignholdind\\.fieldControl-toggle-container .r13wlxb8", "backgroundColor", "red");

        // Handle ML prediction scores with original selectors
        if (formValues.mlPrediction >= 80) {
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-15-bdf_mlpositivetriggers-field-label", "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-16-bdf_mlnegativetriggers-field-label", "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-15-bdf_mlpositivetriggers4273edbd-ac1d-40d3-9fb2-095c621b552d .f1pivz5x", "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-16-bdf_mlnegativetriggers4273edbd-ac1d-40d3-9fb2-095c621b552d .f1pivz5x", "color", "red");
        }

        // Handle distances
        if (formValues.distanceSoldToShip > 100) {
            setElementStyle('input[data-id="bdf_distancebetweensoldtoandshipto.fieldControl-whole-number-text-input"]', "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-43-bdf_distancebetweensoldtoandshipto-field-label", "color", "red");
        }
        if (formValues.distanceSoldToStore > 100) {
            setElementStyle('input[data-id="bdf_distancebetweensoldtoandstore.fieldControl-whole-number-text-input"]', "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-44-bdf_distancebetweensoldtoandstore-field-label", "color", "red");
        }
        if (formValues.distanceShipToStore > 100) {
            setElementStyle('input[data-id="bdf_distancebetweenshiptoandstore.fieldControl-whole-number-text-input"]', "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-45-bdf_distancebetweenshiptoandstore-field-label", "color", "red");
        }

        // Handle DocuSign verification
        if (formValues.docuSignVerification !== 3) {
            setElementStyle('input[aria-label="Docusign Verification"]', "color", "red");
            setElementStyle("#id-2ed5d890-5725-4f83-97d1-65fd0831aea1-82-bdf_docusignverification-field-label", "color", "red");
        }

    } catch (error) {
        console.error("Error in ColorChange function:", error);
    }
}

function onFormLoad(executionContext) {
    // Initial delay to let the form load
    setTimeout(() => {
        ColorChange(executionContext);
    }, 1000);

    // Add a mutation observer to handle dynamic updates
    const observer = new MutationObserver(() => {
        ColorChange(executionContext);
    });

    // Start observing the form container for changes
    const formContainer = window.top.document.querySelector('[data-id="mainform"]');
    if (formContainer) {
        observer.observe(formContainer, {
            childList: true,
            subtree: true
        });
    }
}