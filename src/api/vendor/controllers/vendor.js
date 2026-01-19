'use strict';
const axios = require('axios')

/**
 *  vendor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vendor.vendor', ({ strapi }) => ({
    async migrateContacts(ctx) {
        return { error: 'Not allowed' }
        try {
            // Filter ID for persons who have organisation.VENDOR=true is 113186
            const filter_id = 113186
            let more_items_in_collection = true
            let next_start = 0
            const limit = 100
            let users = []
            while (more_items_in_collection) {
                const { data } = await axios.get('https://api.pipedrive.com/v1/persons', {
                    params: {
                        filter_id,
                        limit,
                        start: next_start,
                        api_token: process.env.PIPEDRIVE_API_TOKEN
                    }
                })
                users = [
                    ...users,
                    ...data.data
                ]
                next_start = data.additional_data.pagination.next_start
                more_items_in_collection = data.additional_data.pagination.more_items_in_collection
            }

            for (const index in users) {
                const {
                    id,
                    first_name,
                    last_name,
                    primary_email,
                    phone = [],
                    org_id
                } = users[index] || {}
                const primaryPhone = phone.find(p => p.primary)

                if (!org_id || !org_id.value) continue;

                const foundVedor = await strapi.entityService.findMany('api::vendor.vendor', {
                    filters: {
                        externalReference: org_id.value,
                    },
                    publicationState: 'preview',
                    locale: 'all',
                    populate: { contact: true }
                })
    
                if (foundVedor && foundVedor[0]) {
                    const vendor = foundVedor[0]
                    const result = await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                        data: {
                            contact: [
                                ...vendor.contact,
                                {
                                    pipedriveId: `${id}`,
                                    firstName: first_name,
                                    lastName: last_name,
                                    email: primary_email,
                                    phone: primaryPhone ? primaryPhone.value : null
                                }
                            ]
                        }
                    })
                }
            }
            return { ok: true }
        } catch (error) {
            console.log(error)
        }
    },
    async migrate(ctx) {
        return { error: 'Not allowed' }
        const urls = [
            'https://go-celebrate.nl/vendor/barefoot-coffee/',
            'https://go-celebrate.nl/vendor/acai/',
            'https://go-celebrate.nl/vendor/la-cookaracha/',
            'https://go-celebrate.nl/vendor/casa-lisetta/',
            'https://go-celebrate.nl/vendor/stokesbbq/',
            'https://go-celebrate.nl/vendor/mister-tosti/',
            'https://go-celebrate.nl/vendor/fries-cycle/',
            'https://go-celebrate.nl/vendor/mexicaanse-foodtruck-ay-caray/',
            'https://go-celebrate.nl/vendor/the-bbq-trailer/',
            'https://go-celebrate.nl/vendor/holy-pasta/',
            'https://go-celebrate.nl/vendor/de-melkbus/',
            'https://go-celebrate.nl/vendor/wafeltjes-van-ons-bomma/',
            'https://go-celebrate.nl/vendor/warung-kripik/',
            'https://go-celebrate.nl/vendor/de-ijscoman/',
            'https://go-celebrate.nl/vendor/blitz-catering-amsterdam/',
            'https://go-celebrate.nl/vendor/zeeuws-ijsmeisje/',
            'https://go-celebrate.nl/vendor/mini-coffee-bar/',
            'https://go-celebrate.nl/vendor/buibui/',
            'https://go-celebrate.nl/vendor/cocktailbar-bar-estafette/',
            'https://go-celebrate.nl/vendor/baron-wiels/',
            'https://go-celebrate.nl/vendor/cocktailz-on-the-road/',
            'https://go-celebrate.nl/vendor/lulus-tribal-kitchen/',
            'https://go-celebrate.nl/vendor/cafe-vw-retrocafe/',
            'https://go-celebrate.nl/vendor/battle-butchers/',
            'https://go-celebrate.nl/vendor/kat-patat/',
            'https://go-celebrate.nl/vendor/wilde-koffie/',
            'https://go-celebrate.nl/vendor/bbq-food-express/',
            'https://go-celebrate.nl/vendor/bar-soif/',
            'https://go-celebrate.nl/vendor/friet-bakfiets-frietvelo/',
            'https://go-celebrate.nl/vendor/ambachtelijk-gerookte-paling/',
            'https://go-celebrate.nl/vendor/goud-panini/',
            'https://go-celebrate.nl/vendor/louis-pizza/',
            'https://go-celebrate.nl/vendor/koffie-foodtruck-baristabar/',
            'https://go-celebrate.nl/vendor/olivr-foodtruck-en-catering/',
            'https://go-celebrate.nl/vendor/pasta-vespa-foodtruck/',
            'https://go-celebrate.nl/vendor/de-cocktail-caravan/',
            'https://go-celebrate.nl/vendor/gezonde-foodtruck-tarwegrasboer/',
            'https://go-celebrate.nl/vendor/pizzabus-sylvano/',
            'https://go-celebrate.nl/vendor/bfrozen-icecream/',
            'https://go-celebrate.nl/vendor/gerse-bbq/',
            'https://go-celebrate.nl/vendor/keep-on-toasting/',
            'https://go-celebrate.nl/vendor/koffie-foodtruck-baroma/',
            'https://go-celebrate.nl/vendor/gebakken-brood/',
            'https://go-celebrate.nl/vendor/indiase-foodtruck-madame-curry/',
            'https://go-celebrate.nl/vendor/empanada-royal-foodtruck/',
            'https://go-celebrate.nl/vendor/friet-foodtruck-goldenfries/',
            'https://go-celebrate.nl/vendor/papa-pannenkoek/',
            'https://go-celebrate.nl/vendor/hot-dog-foodtruck-copperdog/',
            'https://go-celebrate.nl/vendor/biertruck/',
            'https://go-celebrate.nl/vendor/rolios/',
            'https://go-celebrate.nl/vendor/stacks/',
            'https://go-celebrate.nl/vendor/festifizz/',
            'https://go-celebrate.nl/vendor/de-blitz/',
            'https://go-celebrate.nl/vendor/swirling-spoons/',
            'https://go-celebrate.nl/vendor/smaakmakers/',
            'https://go-celebrate.nl/vendor/bar-jules/',
            'https://go-celebrate.nl/vendor/carlito-burrito/',
            'https://go-celebrate.nl/vendor/in-vuur-en-vlam-chef-claudia/',
            'https://go-celebrate.nl/vendor/stoer-slow-food-chefs-baaf-roel/',
            'https://go-celebrate.nl/vendor/cocktailbar/',
            'https://go-celebrate.nl/vendor/koffiebar-bar-company/',
            'https://go-celebrate.nl/vendor/smoothiebar-bar-company/',
            'https://go-celebrate.nl/vendor/dafeine-koffie-foodtruck/',
            'https://go-celebrate.nl/vendor/willem-koffie-lekkers/',
            'https://go-celebrate.nl/vendor/pasta-la-vista/',
            'https://go-celebrate.nl/vendor/espresso-kitchen/',
            'https://go-celebrate.nl/vendor/pizza-della-casa/',
            'https://go-celebrate.nl/vendor/koffiefiets/',
            'https://go-celebrate.nl/vendor/yoghurt-barn/',
            'https://go-celebrate.nl/vendor/tati-coffee-roasters/',
            'https://go-celebrate.nl/vendor/ice-cream-roll-paradise/',
            'https://go-celebrate.nl/vendor/el-chef/',
            'https://go-celebrate.nl/vendor/bloesembar/',
            'https://go-celebrate.nl/vendor/unicorn-photobooth/',
            'https://go-celebrate.nl/vendor/cro-magnon/',
            'https://go-celebrate.nl/vendor/sobremesa/',
            'https://go-celebrate.nl/vendor/quintse-stroopwafels/',
            'https://go-celebrate.nl/vendor/most-wanted-food-truck/',
            'https://go-celebrate.nl/vendor/smaakvol/',
            'https://go-celebrate.nl/vendor/culinaireloods/',
            'https://go-celebrate.nl/vendor/de-banaanhangwagen/',
            'https://go-celebrate.nl/vendor/creperie-ouioui/',
            'https://go-celebrate.nl/vendor/meals-on-wheels/',
            'https://go-celebrate.nl/vendor/food-kartel/',
            'https://go-celebrate.nl/vendor/de-gelegenheid/',
            'https://go-celebrate.nl/vendor/lumineux-bbq-catering/',
            'https://go-celebrate.nl/vendor/case-of-coffee/',
            'https://go-celebrate.nl/vendor/funkkaravaan/',
            'https://go-celebrate.nl/vendor/soep-met-een-vork/',
            'https://go-celebrate.nl/vendor/snooze-like-the-button/',
            'https://go-celebrate.nl/vendor/otruck/',
            'https://go-celebrate.nl/vendor/stewart-sally/',
            'https://go-celebrate.nl/vendor/shakes-on-wheels/',
            'https://go-celebrate.nl/vendor/salland-smokers/',
            'https://go-celebrate.nl/vendor/the-oysterman/',
            'https://go-celebrate.nl/vendor/bakken-op-hakken/',
            'https://go-celebrate.nl/vendor/de-pelikaan-foodtruck/',
            'https://go-celebrate.nl/vendor/sapori-di-casa/',
            'https://go-celebrate.nl/vendor/el-churrito/',
            'https://go-celebrate.nl/vendor/beptilly/',
            'https://go-celebrate.nl/vendor/de-oesterkoning/',
            'https://go-celebrate.nl/vendor/cups-n-crepes/',
            'https://go-celebrate.nl/vendor/bunny-chow/',
            'https://go-celebrate.nl/vendor/mobile-street-food/',
            'https://go-celebrate.nl/vendor/daily-lunch-bus/',
            'https://go-celebrate.nl/vendor/daily-dog-foodtruck/',
            'https://go-celebrate.nl/vendor/lekkere-trek-foodtruck/',
            'https://go-celebrate.nl/vendor/kok-au-van/',
            'https://go-celebrate.nl/vendor/de-poffertjesman/',
            'https://go-celebrate.nl/vendor/bbq-babes/',
            'https://go-celebrate.nl/vendor/pizza-met-pazzi/',
            'https://go-celebrate.nl/vendor/stroopwafelkraam-foodtruck/',
            'https://go-celebrate.nl/vendor/mister-tis-foodtruck/',
            'https://go-celebrate.nl/vendor/frefrayo/',
            'https://go-celebrate.nl/vendor/de-lekkerste-paling/',
            'https://go-celebrate.nl/vendor/stoempkot/',
            'https://go-celebrate.nl/vendor/multi-tosti-foodtruck/',
            'https://go-celebrate.nl/vendor/dj-caravan/',
            'https://go-celebrate.nl/vendor/koning-pannenkoek/',
            'https://go-celebrate.nl/vendor/roxy-photo-booth-foodtruck/',
            'https://go-celebrate.nl/vendor/muziek-caravan/',
            'https://go-celebrate.nl/vendor/t-kombuis/',
            'https://go-celebrate.nl/vendor/crepouz-foodtruck/',
            'https://go-celebrate.nl/vendor/funk-food/',
            'https://go-celebrate.nl/vendor/churros4all/',
            'https://go-celebrate.nl/vendor/exotiqo-foodtruck/',
            'https://go-celebrate.nl/vendor/just-gin/',
            'https://go-celebrate.nl/vendor/zoet-zopie/',
            'https://go-celebrate.nl/vendor/de-smaak-van-italia/',
            'https://go-celebrate.nl/vendor/pasta-republic-pasta-foodtruck/',
            'https://go-celebrate.nl/vendor/bitter-real/',
            'https://go-celebrate.nl/vendor/brazilian-cocktail-bar/',
            'https://go-celebrate.nl/vendor/food-on-wheels/',
            'https://go-celebrate.nl/vendor/peter-switser/',
            'https://go-celebrate.nl/vendor/pickelsmayo-foodtruck/',
            'https://go-celebrate.nl/vendor/rene-visser/',
            'https://go-celebrate.nl/vendor/marleys-cocktails-foodtruck/',
            'https://go-celebrate.nl/vendor/holy-basil-foodtruck/',
            'https://go-celebrate.nl/vendor/sophie-van-oyen/',
            'https://go-celebrate.nl/vendor/stephan-van-den-berg/',
            'https://go-celebrate.nl/vendor/thomas-karsten/',
            'https://go-celebrate.nl/vendor/toni-van-der-kooij/',
            'https://go-celebrate.nl/vendor/willem-ten-teije/',
            'https://go-celebrate.nl/vendor/doree-den-hollander/',
            'https://go-celebrate.nl/vendor/elmar-gerekink/',
            'https://go-celebrate.nl/vendor/jean-en-marie/',
            'https://go-celebrate.nl/vendor/barbara-van-oosterwijk/',
            'https://go-celebrate.nl/vendor/michel-willems/',
            'https://go-celebrate.nl/vendor/gerrit-jan-en-marco/',
            'https://go-celebrate.nl/vendor/emma-brands/',
            'https://go-celebrate.nl/vendor/sander-oudshoorn/',
            'https://go-celebrate.nl/vendor/waffletruck-foodtruck/',
            'https://go-celebrate.nl/vendor/foodtruck-pardoel/',
            'https://go-celebrate.nl/vendor/potato-delicious-foodtruck/',
            'https://go-celebrate.nl/vendor/oesterbar-verhuur-foodtruck/',
            'https://go-celebrate.nl/vendor/green-cafe/',
            'https://go-celebrate.nl/vendor/churro-kitchen/',
            'https://go-celebrate.nl/vendor/mister-coffee-foodtruck/',
            'https://go-celebrate.nl/vendor/rollend-genieten/',
            'https://go-celebrate.nl/vendor/ratjetoe-foodtruck-veganistisch/',
            'https://go-celebrate.nl/vendor/omelet-loket/',
            'https://go-celebrate.nl/vendor/polser-by-jord/',
            'https://go-celebrate.nl/vendor/time-to-taste/',
            'https://go-celebrate.nl/vendor/trattoria-azzurra/',
            'https://go-celebrate.nl/vendor/portugese-tafel-foodtruck/',
            'https://go-celebrate.nl/vendor/de-wentelteefjes-dessert/',
            'https://go-celebrate.nl/vendor/de-wafelwagen/',
            'https://go-celebrate.nl/vendor/the-real-gentlemen/',
            'https://go-celebrate.nl/vendor/tiroler-grillwagen/',
            'https://go-celebrate.nl/vendor/berlins-tasty/',
            'https://go-celebrate.nl/vendor/koko-loco/',
            'https://go-celebrate.nl/vendor/brughmans-espressobar/',
            'https://go-celebrate.nl/vendor/frietendorf/',
            'https://go-celebrate.nl/vendor/de-pieper-mobiel/',
            'https://go-celebrate.nl/vendor/pofferdory/',
            'https://go-celebrate.nl/vendor/de-picknick-kar/',
            'https://go-celebrate.nl/vendor/happy-cupcake-dessert-foodtruck/',
            'https://go-celebrate.nl/vendor/joes-kitchen-wereldse-wagens/',
            'https://go-celebrate.nl/vendor/bruin-cafe-op-wielen/',
            'https://go-celebrate.nl/vendor/cosy-world/',
            'https://go-celebrate.nl/vendor/doppio/',
            'https://go-celebrate.nl/vendor/allround-foodtruck-farmers-finest-co/',
            'https://go-celebrate.nl/vendor/bbq-army/',
            'https://go-celebrate.nl/vendor/what-the-eggz/',
            'https://go-celebrate.nl/vendor/begemans/',
            'https://go-celebrate.nl/vendor/vegetarische-foodtruck-zoeperbus/',
            'https://go-celebrate.nl/vendor/rijdende-barista/',
            'https://go-celebrate.nl/vendor/de-mojito-bar/',
            'https://go-celebrate.nl/vendor/pizza-foodtruck-pizzakeet/',
            'https://go-celebrate.nl/vendor/dylange/',
            'https://go-celebrate.nl/vendor/de-wafelbakkerij/',
            'https://go-celebrate.nl/vendor/kilimanjaro/',
            'https://go-celebrate.nl/vendor/gezonde-foodtruck-the-bootlegger-bar/',
            'https://go-celebrate.nl/vendor/foodtruck-watt/',
            'https://go-celebrate.nl/vendor/between-the-burrs/',
            'https://go-celebrate.nl/vendor/soundtrek/',
            'https://go-celebrate.nl/vendor/droomevenementen/',
            'https://go-celebrate.nl/vendor/de-discobus/',
            'https://go-celebrate.nl/vendor/the-mocktailclub/',
            'https://go-celebrate.nl/vendor/de-sheriff/',
            'https://go-celebrate.nl/vendor/los-pistoleros/',
            'https://go-celebrate.nl/vendor/retro-koffiebar-michinos-coffee-bar/',
            'https://go-celebrate.nl/vendor/lonnys-foodkraam/',
            'https://go-celebrate.nl/vendor/koffie-foodtruck-kaldi-mobiel-hilversum/',
            'https://go-celebrate.nl/vendor/dollys-foodtruck/',
            'https://go-celebrate.nl/vendor/theetantes/',
            'https://go-celebrate.nl/vendor/tourart/',
            'https://go-celebrate.nl/vendor/bici-barista/',
            'https://go-celebrate.nl/vendor/luenas-foodcorner/',
            'https://go-celebrate.nl/vendor/femkes-diner/',
            'https://go-celebrate.nl/vendor/tadamun-hummus-bar/',
            'https://go-celebrate.nl/vendor/rudys-roadkill/',
            'https://go-celebrate.nl/vendor/paddys-shebeen/',
            'https://go-celebrate.nl/vendor/friet-ballen/',
            'https://go-celebrate.nl/vendor/oyo-burgers/',
            'https://go-celebrate.nl/vendor/photobooth-truck-say-cheese-wheels/',
            'https://go-celebrate.nl/vendor/johnny-doodle/',
            'https://go-celebrate.nl/vendor/de-empanada-fabriek/',
            'https://go-celebrate.nl/vendor/streetfood-foodtruck-magneet/',
            'https://go-celebrate.nl/vendor/frietkar-bakfrietfiets/',
            'https://go-celebrate.nl/vendor/theateretappe/',
            'https://go-celebrate.nl/vendor/streetfood-foodtruck-williewurst/',
            'https://go-celebrate.nl/vendor/fusion-streetfood-foodtruck-zanzibar/',
            'https://go-celebrate.nl/vendor/koffie-thee-foodtruck-koffiat/',
            'https://go-celebrate.nl/vendor/indy-truck/',
            'https://go-celebrate.nl/vendor/de-buikjes-foodtruck/',
            'https://go-celebrate.nl/vendor/broodjestruck-hys-de-lekkerste/',
            'https://go-celebrate.nl/vendor/borreltruck-deust/',
            'https://go-celebrate.nl/vendor/wijn-foodtruck-wijnbar-salute/',
            'https://go-celebrate.nl/vendor/unieke-foodtruck-hop-ola/',
            'https://go-celebrate.nl/vendor/hawaiiaanse-foodtruck-dios/',
            'https://go-celebrate.nl/vendor/photobooth-foodtruck-fotocaravan/',
            'https://go-celebrate.nl/vendor/gourmet-foodtruck-kokeneteke/',
            'https://go-celebrate.nl/vendor/caffe-delizia/',
            'https://go-celebrate.nl/vendor/the-blue-truck/',
            'https://go-celebrate.nl/vendor/soep-foodtruck-soepreme-classic/',
            'https://go-celebrate.nl/vendor/viva-la-mexico/',
            'https://go-celebrate.nl/vendor/koffie-gebak-foodtruck-de-sjampetter/',
            'https://go-celebrate.nl/vendor/portugese-streetfoodtruck-amora/',
            'https://go-celebrate.nl/vendor/the-american-foodtruck/',
            'https://go-celebrate.nl/vendor/lunas-caravan/',
            'https://go-celebrate.nl/vendor/ijs-foodtruck-hemels-ijs-la-catrina/',
            'https://go-celebrate.nl/vendor/healthy-foodtruck-vitamien-elien/',
            'https://go-celebrate.nl/vendor/moor-bites/',
            'https://go-celebrate.nl/vendor/dine-a-bite/',
            'https://go-celebrate.nl/vendor/gezonde-foodtruck-the-healthy-foodtruck/',
            'https://go-celebrate.nl/vendor/braaimobiel/',
            'https://go-celebrate.nl/vendor/mr-smooth/',
            'https://go-celebrate.nl/vendor/noodle-burger/',
            'https://go-celebrate.nl/vendor/wereldse-wagen-pasado/',
            'https://go-celebrate.nl/vendor/the-vexican/',
            'https://go-celebrate.nl/vendor/indiase-foodtruck-sergeant-pepper/',
            'https://go-celebrate.nl/vendor/natuurlijk-sinderens-weide-kalf/',
            'https://go-celebrate.nl/vendor/wereldse-wagen-ofjespaanseworstlust/',
            'https://go-celebrate.nl/vendor/koffiefoodtruck-de-buurvrouw/',
            'https://go-celebrate.nl/vendor/streetfoodtruck-remork/',
            'https://go-celebrate.nl/vendor/walter-whites-espresso/',
            'https://go-celebrate.nl/vendor/biertruck-de-speciaalbiertruck/',
            'https://go-celebrate.nl/vendor/pittige-dames/',
            'https://go-celebrate.nl/vendor/streetfood-foodtruck-ten-dauwe/',
            'https://go-celebrate.nl/vendor/vietnamese-streetfoodtruck-banh-mi/',
            'https://go-celebrate.nl/vendor/laurences-focacceria/',
            'https://go-celebrate.nl/vendor/alma-libre/',
            'https://go-celebrate.nl/vendor/koek-zopie/',
            'https://go-celebrate.nl/vendor/gezonde-foodtruck-ine-quizine/',
            'https://go-celebrate.nl/vendor/bries-saucies/',
            'https://go-celebrate.nl/vendor/wereldse-wagen-madame-fourchette/',
            'https://go-celebrate.nl/vendor/stroot-foodtruck/',
            'https://go-celebrate.nl/vendor/streetfood-foodtruck-monba/',
            'https://go-celebrate.nl/vendor/table-dho/',
            'https://go-celebrate.nl/vendor/gezonde-foodtruck-zettu/',
            'https://go-celebrate.nl/vendor/pasta-en-aperio-foodtruck-buon-appetito/',
            'https://go-celebrate.nl/vendor/crepes-nomades/',
            'https://go-celebrate.nl/vendor/vietnamama/',
            'https://go-celebrate.nl/vendor/napolitanizza/',
            'https://go-celebrate.nl/vendor/gourmet-foodtruck-duck-en-more/',
            'https://go-celebrate.nl/vendor/pannenkoeken-foodtruck-pancake-crumble/',
            'https://go-celebrate.nl/vendor/mobiele-wijnbar-de-vrolijke-druif/',
            'https://go-celebrate.nl/vendor/goulashkanon/',
            'https://go-celebrate.nl/vendor/rich-pork/',
            'https://go-celebrate.nl/vendor/barabus/',
            'https://go-celebrate.nl/vendor/caravan-bertha/',
            'https://go-celebrate.nl/vendor/frietosoof/',
            'https://go-celebrate.nl/vendor/wereldse-foodbike-dios/',
            'https://go-celebrate.nl/vendor/jukebus/',
            'https://go-celebrate.nl/vendor/rollende-pizzas/',
            'https://go-celebrate.nl/vendor/blend-bus/',
            'https://go-celebrate.nl/vendor/brandt-levie/',
            'https://go-celebrate.nl/vendor/gezonde-foodtruck-friska/',
            'https://go-celebrate.nl/vendor/waldo/',
            'https://go-celebrate.nl/vendor/de-bieterbal/',
            'https://go-celebrate.nl/vendor/cats-food/',
            'https://go-celebrate.nl/vendor/koffie-foodtruck-el-cappuccino/',
            'https://go-celebrate.nl/vendor/streetfood-biologische-foodtruck-punt-lekker/',
            'https://go-celebrate.nl/vendor/piepers-rund/',
            'https://go-celebrate.nl/vendor/de-gare-kip/',
            'https://go-celebrate.nl/vendor/indian-roast/',
            'https://go-celebrate.nl/vendor/koffie-en-koek-foodtruck-le-triporteur/',
            'https://go-celebrate.nl/vendor/lick-foodvan/',
            'https://go-celebrate.nl/vendor/eisko-ijs-foodtruck/',
            'https://go-celebrate.nl/vendor/leut-koffie/',
            'https://go-celebrate.nl/vendor/houben-worstenbrood/',
            'https://go-celebrate.nl/vendor/casabarista/',
            'https://go-celebrate.nl/vendor/b2bkoffie-koffie-foodtruck/',
            'https://go-celebrate.nl/vendor/slagerij-op-wielen-schell-on-tour/',
            'https://go-celebrate.nl/vendor/lekkernijs/',
            'https://go-celebrate.nl/vendor/forq-food/',
            'https://go-celebrate.nl/vendor/fantastic-wheels/',
            'https://go-celebrate.nl/vendor/bar-american/',
            'https://go-celebrate.nl/vendor/streats/',
            'https://go-celebrate.nl/vendor/smultantes/',
            'https://go-celebrate.nl/vendor/freezy-flavours/',
            'https://go-celebrate.nl/vendor/gehaktballen-foodtruck-gehaktballenexpress/',
            'https://go-celebrate.nl/vendor/friethoes/',
            'https://go-celebrate.nl/vendor/horecavan/',
            'https://go-celebrate.nl/vendor/speciaalbier-foodtruck-de-speciaalbierbus/',
            'https://go-celebrate.nl/vendor/bar-mobil/',
            'https://go-celebrate.nl/vendor/campos-foodtruck/',
            'https://go-celebrate.nl/vendor/pepes-ijs/',
            'https://go-celebrate.nl/vendor/frozen-yoghurt-foodtruck-fruges/',
            'https://go-celebrate.nl/vendor/oto-burger/',
            'https://go-celebrate.nl/vendor/carpaccio-foodtruck-car-paccio-2/',
            'https://go-celebrate.nl/vendor/grill-n-smoke/',
            'https://go-celebrate.nl/vendor/mister-wrap/',
            'https://go-celebrate.nl/vendor/get-hy-on-our-supply/',
            'https://go-celebrate.nl/vendor/kaas-en-worst-op-wielen/',
            'https://go-celebrate.nl/vendor/la-dolce-barista/',
            'https://go-celebrate.nl/vendor/meat-en-veggie-foodtruck-grizzl/',
            'https://go-celebrate.nl/vendor/de-bakbrommer/',
            'https://go-celebrate.nl/vendor/renzos-on-wheels/',
            'https://go-celebrate.nl/vendor/formidable/',
            'https://go-celebrate.nl/vendor/sublime-food-co/',
            'https://go-celebrate.nl/vendor/de-pizzabus/',
            'https://go-celebrate.nl/vendor/biologische-tosti-foodtruck-de-tosti-kip/',
            'https://go-celebrate.nl/vendor/roll-or-bowl/',
            'https://go-celebrate.nl/vendor/vespressi/',
            'https://go-celebrate.nl/vendor/streetfood-foodtruck-food-to-walk/',
            'https://go-celebrate.nl/vendor/miss-little-pancake/',
            'https://go-celebrate.nl/vendor/espressionisme/',
            'https://go-celebrate.nl/vendor/de-tapruijters/',
            'https://go-celebrate.nl/vendor/tacos-los-amigos/',
            'https://go-celebrate.nl/vendor/be-cosy-kitchen/',
            'https://go-celebrate.nl/vendor/bollyfoods/',
            'https://go-celebrate.nl/vendor/hieper-de-pieper/',
            'https://go-celebrate.nl/vendor/de-sapkar/',
            'https://go-celebrate.nl/vendor/uit-de-pan/',
            'https://go-celebrate.nl/vendor/the-dutch-weed-burger/',
            'https://go-celebrate.nl/vendor/de-barista-bus-coffee-foodtruck/',
            'https://go-celebrate.nl/vendor/ovenmobiel/',
            'https://go-celebrate.nl/vendor/roasted-espresso-bar/',
            'https://go-celebrate.nl/vendor/de-smaakmobiel/',
            'https://go-celebrate.nl/vendor/groos-streetfood-homemade-pizza-foodtruck/',
            'https://go-celebrate.nl/vendor/bus-van-zus/',
            'https://go-celebrate.nl/vendor/spelty/',
            'https://go-celebrate.nl/vendor/puzzles/',
            'https://go-celebrate.nl/vendor/koffie-en-zo/',
            'https://go-celebrate.nl/vendor/ijs-zo-ijs-foodtruck/',
            'https://go-celebrate.nl/vendor/kamiel-kale-foodtruck/',
            'https://go-celebrate.nl/vendor/memory-lane/',
            'https://go-celebrate.nl/vendor/willys-chicken-special/',
            'https://go-celebrate.nl/vendor/rolled/',
            'https://go-celebrate.nl/vendor/ons-lucy/',
            'https://go-celebrate.nl/vendor/mos-comfort-food/',
            'https://go-celebrate.nl/vendor/creppies-crepe-food-truck/',
            'https://go-celebrate.nl/vendor/crepe-centraal/',
            'https://go-celebrate.nl/vendor/champagnebus/',
            'https://go-celebrate.nl/vendor/madame-cocos/',
            'https://go-celebrate.nl/vendor/antonsmealsonwheels-fish-chips-foodtruck/',
            'https://go-celebrate.nl/vendor/crepes-foodtruck-crepes-mobiel/',
            'https://go-celebrate.nl/vendor/todays-special/',
            'https://go-celebrate.nl/vendor/ecopizza/',
            'https://go-celebrate.nl/vendor/pasta-joe/',
            'https://go-celebrate.nl/vendor/tostibus/',
            'https://go-celebrate.nl/vendor/pass-the-peas/',
            'https://go-celebrate.nl/vendor/wrap-n-rolling/',
            'https://go-celebrate.nl/vendor/slagerei-salade-foodtruck/',
            'https://go-celebrate.nl/vendor/roast-beans/',
            'https://go-celebrate.nl/vendor/rays-wagen/',
            'https://go-celebrate.nl/vendor/pura-vida-on-tour/',
            'https://go-celebrate.nl/vendor/deegeluk/',
            'https://go-celebrate.nl/vendor/lekker-hotel-mama/',
            'https://go-celebrate.nl/vendor/le-cube/',
            'https://go-celebrate.nl/vendor/kitschmann-currywurst/',
            'https://go-celebrate.nl/vendor/keukengebeuren/',
            'https://go-celebrate.nl/vendor/juice-on-wheels/',
            'https://go-celebrate.nl/vendor/il-berretto/',
            'https://go-celebrate.nl/vendor/ik-wil-een-ijsje-ijs-foodtruck/',
            'https://go-celebrate.nl/vendor/hy-koffie-rotterdamse-koffie-foodtruck/',
            'https://go-celebrate.nl/vendor/dos-chicas/',
            'https://go-celebrate.nl/vendor/happy-chimney/',
            'https://go-celebrate.nl/vendor/bistrobus/',
            'https://go-celebrate.nl/vendor/photobooth-betsie/',
            'https://go-celebrate.nl/vendor/bbq-bazen/',
            'https://go-celebrate.nl/vendor/barista-bandits/',
            'https://go-celebrate.nl/vendor/frietfiets/',
            'https://go-celebrate.nl/vendor/barefoot-coffee-2/',
        ]

        const statuses = []
        let index = 0
        
        for (const url of urls) {
            const foundVedor = await strapi.entityService.findMany('api::vendor.vendor', {
                filters: {
                    legacyPortfolioPage: url
                },
                publicationState: 'preview',
                locale: 'all'
            })
            if (foundVedor && foundVedor[0]) {
                if (foundVedor[0].importStatus === 'IMPORTED') statuses.push('IMPORTED')
                if (foundVedor[0].importStatus === 'FAILED') statuses.push('FAILED')
            } else {
                const foundRedirect = await strapi.entityService.findMany('api::redirect.redirect', {
                    filters: {
                        from: url
                    }
                })
                if (foundRedirect && foundRedirect[0]) {
                    statuses.push(`REDIRECT -> ${foundRedirect[0].to}`)
                } else {
                    statuses.push('UNHANDLED')
                }
            }
            // Last resort is to find among offering
            const vendorSlug = url.split('/')[4]
            const foundOffering = await strapi.entityService.findMany('api::offering.offering', {
                filters: {
                    key: vendorSlug
                },
                publicationState: 'preview',
                locale: 'all'
            })
            if (foundOffering && foundOffering[0]) {
                statuses[index] = 'IMPORTED'
            }
            index++
        }

        return { statuses }
        // This is intended to be used only onde, when we setup the system to import legacy offerings for the vendors
       /*  const vendorService = strapi.service('api::vendor.vendor')
        try {
            const result = await vendorService.migrate()
            return result
        } catch (error) {
            console.error('FAIL', error)
            return { ok: false }
        } */
        /* const offering = await strapi.entityService.update('api::offering.offering', 1, {
            data: {
                // description: result.mainText,
                seo: {
                    metaTitle: result.meta_title,
                    metaDescription: result.meta_og_description
                }
            }
        }) */
    },
    async bulkUpdateStatuses(ctx) {
        return { error: 'Not allowed' }
        const vendors = await strapi.entityService.findMany('api::vendor.vendor', {
            filters: {
                $or: [
                    {
                        status: {
                            id: {
                                $null: true
                            }
                        }
                    },
                    {
                        $not: {
                            status: {
                                id: 5
                            }
                        }
                    },
                ]
            },
            locale: 'all',
            populate: ['status'],
        })

        for (const index in vendors) {
            const vendor = vendors[index]
            if (vendor.status && vendor.status.id !== 5) {
                const updatedVendor = await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                    data: {
                        status: 3
                    }
                })
                console.log(`${Math.round(((index + 1) / vendors.length)*100)}%`, ' | Updated vendor: ', updatedVendor.id)
            }
        }
        return vendors.length
        /* return await strapi.db.query('api::vendor.vendor').updateMany({
            where: {
                $or: [
                    {
                        status: null
                    },
                    {
                        $not: {
                            status: 5
                        }
                    },
                ]
            },
            data: {
              status: 3, // Reached out
            },
        }); */
    }
}));
