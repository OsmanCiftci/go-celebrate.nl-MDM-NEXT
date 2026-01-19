const axios = require('axios')

module.exports = {
    async afterUpdate(event) {
        const { result = {}, params } = event;
        const {
            externalReference,
            name,
            email,
            phone,
            website,
            instagram,
            facebook
        } = result
        const {
            data: updatedVendor
        } = params
        
        /* const populatedContactPersons = []
        updatedVendor.contact.map(async contact => populatedContactPersons.push(strapi.entityService.findOne(contact.__pivot.component_type, contact.id)))
        try {
            const results = await Promise.all(populatedContactPersons)
            // Update pipedrive contacts here....
        } catch (error) {
            console.error(error)
        } */

        if (externalReference) {
            // Update the fields in Pipedrive
            try {
                const { data } = await axios.put(`https://api.pipedrive.com/v1/organizations/${externalReference}`,
                {
                    name,
                    '3c9986b7f9b4313da33c764c0786259274abbf8e': email,
                    '25490fd8a8dc4cf8645f757ae7dc535ff3ad3042': 9, // Meaning field Vendor: Yes
                    'cfcd1b8c1c474878ed91895c4cebc552f52bc1f1': phone,
                    'b840aeabee1ddd7464b13f8593f95966862a86f9': website,
                    '29106c99441b4a5af3d174ba179c72c1ff82c080': instagram,
                    '72aa7b8aedfb24bf3bc5033ce8bcf46903859a6e': facebook
                    /* 
                        ea4f5a5d1eeaf944ab63313b8c47860794d627d4: Cusidine type
                        1fa4c308434befea943ee3d293fd3d01dc26be6f: Dietary options
                        f1f5bd255b13b7533619803567de127133c6918a: Drinks
                        c2a833ebe7f5d6d4bcf56862667fabac571c9506: Dish type
                        8857b0114bb390c89ff18b005bec219c3424daa4: Rented empty, 20: Yes, 21: No
                        62b42f5cf47b1b4eea9853ca218624b6bc771fc9: Foodtruck brand
                        address: Address
                        address_subpremise: Apartment/suite no
                        address_street_number: address_street_number
                        address_route: Street/road name
                        address_sublocality: District/sublocality
                        address_locality: City/town/village/locality
                        address_admin_area_level_1: State/county
                        address_admin_area_level_2: Region
                        address_country: Country
                        address_postal_code: ZIP/Postal code
                        label:
                        {
                            "color": "green",
                            "label": "Customer",
                            "id": 5
                        },
                        {
                            "color": "red",
                            "label": "Hot lead",
                            "id": 6
                        },
                        {
                            "color": "yellow",
                            "label": "Warm lead",
                            "id": 7
                        },
                        {
                            "color": "blue",
                            "label": "Cold lead",
                            "id": 8
                        }
                    */
                },
                {
                    params: {
                        api_token:'1ab79b7c7d1e647a9989a1dc575aa74a62b5c1a2'
                    }
                })
                //console.log(data)
            } catch (error) {
                // Fail silently...
                console.log('Can\'t update vendor in pipedrive', error)
            }
        }
    },
};