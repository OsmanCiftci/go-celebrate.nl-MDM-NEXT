'use strict';

/**
 * vendor service.
 */

const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')
const path = require('path')
const os = require('os')
const mime = require('mime-types')
const fs = require('fs')
const fse = require('fs-extra')

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vendor.vendor', ({ strapi }) => ({
    async migrate(ctx) {
        const uploadService = strapi.service('plugin::upload.upload')
        // Launch puppeteer and wait for it to load
        const browser = await puppeteer.launch({
            headless: true
        })
        const page = (await browser.pages())[0]

        // Load vendors
        const vendors = await strapi.entityService.findMany('api::vendor.vendor', {
            locale: 'all',
            filters: {},
            populate: {
                debtor: {
                    populate: {
                        addresses: {
                            populate: {
                                country: true
                            }
                        }
                    }
                }
            }
        })
        // Loop through vendors
        let counter = 0
        let importCounter = 0

        for (const vendor of vendors) {
            counter++
            // if (counter > 10) break
            if (!vendor.legacyPortfolioPage || !vendor.legacyPortfolioPage.startsWith('https://go-celebrate.nl/')) continue
            /* if (vendor.importStatus = 'IMPORTED') {
                console.log(counter, 'Skipping imported ', vendor.legacyPortfolioPage, vendor.importStatus)
                continue
            } */

            console.log('--- New import: ', vendor.legacyPortfolioPage)

            let actualUrl = vendor.legacyPortfolioPage
            try {
                await page.goto(vendor.legacyPortfolioPage)
                // Update because we might have a redirect
                actualUrl = page.url()
                if (actualUrl !== vendor.legacyPortfolioPage) {
                    if (actualUrl.indexOf('/foodtrucks/') > -1) {
                        // Create redirect, archive vendor and skip
                        console.log('SKIP ', vendor.legacyPortfolioPage, 'beaceuse → ', actualUrl)
                        await this.createRedirect(vendor.legacyPortfolioPage, actualUrl, '301')
                        await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                            data: {
                                importStatus: 'REDIRECT',
                                archive: true
                            }
                        })
                        continue
                    } else {
                        console.log('Redirect', `${vendor.legacyPortfolioPage} → ${actualUrl}`)
                        // The offering exist under a new URL so continue creating it and add a redirect
                        await this.createRedirect(vendor.legacyPortfolioPage, actualUrl, '301')
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${vendor.legacyPortfolioPage}`, error)
                // Mark page import error
                continue
            }
            const html = await page.$eval('*', (el) => el.innerHTML)
            let $ = cheerio.load(html)
    
            // Extract SEO fields
            const metaTitle = $('title').text()
            const locale = $('[property=og:locale]').attr('content').split('_')[0] || 'nl'
            const metaOgTitle = $('[property=og:title]').attr('content')
            let metaOgDescription = $('[property=og:description]').attr('content')
            if (metaOgDescription) {
                metaOgDescription = metaOgDescription.substring(0, 249)
            }
            const metaRobots = $('[name=robots]').attr('content')
            // TODO: OFFERINGS ARE ARTICLE types
            const metaOgType = $('[property=og:type]').attr('content')
            // TODO: Upload to won server and return media ID reference
            const metaOgImage = $('[property=og:image]').attr('content')
            const metaOgImageAlt = $('[property=og:image:alt]').attr('content')

            // Extract structured data
            const title = $('h1').text()

            // Extract content
            // First try to look for the .project-description div, but not all pages have this
            let main = $('.project-description')
            if (!main && main.length === 0) {
                main = $('main')
            }

            const heading2 = $('h2')
            const heading3 = $('h3')
            // Remove ALL tabs and replace multi newlines with a single one
            let mainText = main.text().replace(/\t/g, '\n').replace(/\n\s*\n/g, '\n\n\n')

            heading2.each((i, h2) => {
                const text = $(h2).text()
                mainText = mainText.replace(text, `<h2>${text}</h2>`)
            })
            heading3.each((i, h3) => {
                const text = $(h3).text()
                mainText = mainText.replace(text, `<h2>${text}</h2>`)
            })

            const data = {
                name: title || metaTitle,
                key: actualUrl.split('/')[4],
                slug: actualUrl.split('/')[4],
                vendor: vendor.id,
                seo: {
                    metaTitle: metaTitle,
                    metaDescription: metaOgDescription,
                    metaRobots,
                    metaSocial: [
                        { socialNetwork: 'Facebook', title: metaOgTitle, description: metaOgDescription },
                        { socialNetwork: 'Twitter', title: metaOgTitle, description: metaOgDescription }
                    ]
                },
                description: mainText,
                locale,
                images: []
            }

            if (vendor.debtor && vendor.debtor.addresses && vendor.debtor.addresses[0]) {
                if (vendor.debtor.addresses[0].city) {
                    // We possibly have a city we can assign as baseCity
                    const city = vendor.debtor.addresses[0].city
                    const cityFound = await  strapi.entityService.findMany('api::city.city', {
                        filters: {
                            name: city
                        }
                    })
                    if (cityFound && cityFound[0]){
                        data.baseCity = cityFound[0].id
                    } 
                }
                if (vendor.debtor.addresses[0].region) {
                    // We possibly have a city we can assign as baseCity
                    const region = vendor.debtor.addresses[0].region
                    const regionFound = await  strapi.entityService.findMany('api::region.region', {
                        filters: {
                            name: region
                        }
                    })
                    if (regionFound && regionFound[0]){
                        data.baseRegion = regionFound[0].id
                    } 
                }
                if (vendor.debtor.addresses[0].county) {
                    // We possibly have a city we can assign as baseCity
                    const county = vendor.debtor.addresses[0].county
                    const countyFound = await  strapi.entityService.findMany('api::county.county', {
                        filters: {
                            name: county
                        }
                    })
                    if (countyFound && countyFound[0]){
                        data.baseCounty = countyFound[0].id
                    } 
                }
                if (vendor.debtor.addresses[0].country) {
                    data.baseCountry = vendor.debtor.addresses[0].country.id
                }
            }

            // Assign OG image
            if (metaOgImage) {
                const fileName = metaOgImage.match(/[\w-]+\.(jpg|jpeg|png)/g)
                if (fileName) {
                    const imageExist = await uploadService.findMany({
                        filters: {
                            name: fileName[0]
                        }
                    })
                    if (imageExist && imageExist[0]) {
                        // Assign it to the data
                        data.seo.metaImage = imageExist[0]
                        data.seo.metaSocial[0].image = imageExist[0]
                        data.seo.metaSocial[1].image = imageExist[0]
                    } else {
                        // Image doesn't exist, let's upload
                        const uploaded = await this.uploadFileFromUrl(metaOgImage, fileName[0] || 'file.jpg',  metaOgImageAlt || '')
                        if (uploaded) {
                            data.seo.metaImage = uploaded.id
                            data.seo.metaSocial[0].image = uploaded.id
                            data.seo.metaSocial[1].image = uploaded.id
                        }
                        
                    }
                }
            }

            // Finally, upload all images
            const images = main.find('img')
            for (const img of images) {
                const src = $(img).attr('src')
                const alt = $(img).attr('alt')
                const fileName = src.match(/[\w-]+\.(jpg|jpeg|png|txt)/g)
                console.log(src, fileName && fileName.length > 0 ? `${fileName}` : 'No filename')
                if (src && fileName && fileName.length > 0) {
                    const imageExist = await uploadService.findMany({
                        filters: {
                            name: fileName[0]
                        }
                    })
                    if (imageExist && imageExist[0]) {
                        console.log('Image already exists ', imageExist[0].name)
                        data.images.push(imageExist[0].id)
                    } else {
                        const uploaded = await this.uploadFileFromUrl(src, fileName[0],  alt)
                        if (uploaded && uploaded.id) {
                            console.log('uploaded', uploaded.id)
                            data.images.push(uploaded.id)
                        }
                    }
                }
            }

            // Check if it exists already
            const existingOffering = await strapi.entityService.findMany('api::offering.offering', {
                locale,
                publicationState: 'preview',
                filters: {
                    key: actualUrl.split('/')[4],
                }
            })

            if (existingOffering && existingOffering.length > 0) {
                console.log('Updating', existingOffering[0].id)
                // Update the first instance
                try {
                    const updatedOffering = await strapi.entityService.update('api::offering.offering', existingOffering[0].id, {
                        data
                    })
                    await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                        data: {
                            importStatus: 'IMPORTED',
                            archive: false
                        }
                    })
                } catch (error) {
                    console.error('Error updating',existingOffering[0].id, error )
                    await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                        data: {
                            importStatus: 'FAILED',
                            archive: false
                        }
                    })
                }
            } else {
                // Create a new
                console.log('Creating new')
                try {
                    const newOffering = await strapi.entityService.create('api::offering.offering', {
                        data
                    })
                    // Mark as imported
                    await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                        data: {
                            importStatus: 'IMPORTED',
                            archive: false
                        }
                    })
                } catch (error) {
                    console.error('Error creating ', error)
                    await strapi.entityService.update('api::vendor.vendor', vendor.id, {
                        data: {
                            importStatus: 'FAILED',
                            archive: false
                        }
                    })
                }
            }

            console.log('OK ', importCounter)
            importCounter++
            await delay(5000)
        }

        // Close the connection
        await browser.close()
        return {
            ok: true
        }
    },
    async uploadFileFromUrl(url, fileName, alternativeText) {

        try {
            const file = await axios({
                method: 'GET',
                url,
                responseType: 'stream'
            })
            const uploadService = strapi.service('plugin::upload.upload')
            const tempFolder = await fse.mkdtemp(path.join(os.tmpdir(), 'tmp-upload-'))
            const filePath = path.join(tempFolder, fileName)

            const writer = fs.createWriteStream(filePath)
            file.data.pipe(writer)

            return new Promise((resolve, reject) => {
                writer.on('finish', async () => {
                    const fileStat = fs.statSync(filePath)
                    try {
                        const uploadedFile = await uploadService.upload({
                            files: {
                                path: filePath,
                                name: fileName,
                                type: mime.lookup(filePath),
                                size: fileStat.size

                            },
                            data: {
                                info: {
                                    name: fileName,
                                    alternativeText
                                }
                            }
                        })
                        resolve(uploadedFile)
                    } catch (error) {
                        console.error('Ooops, that didn\'t go well', error)
                    } finally {
                        console.log('Remove tmp')
                        await fse.remove(tempFolder)
                    }
                    reject()
                })
                writer.on('error', reject)
            })
        } catch (error) {
            console.error('Failed to load image ', url)
            return false
        }
    },
    async createRedirect(from, to, statusCode) {
        // Creates a redirect but first checks wether it already exists.
        try {
            const existingRedirect = await strapi.entityService.findMany('api::redirect.redirect', {
                filters: {
                    from
                }
            })
            if (existingRedirect && existingRedirect[0]) {
                return existingRedirect[0]
            } else {
                // Add a new redirect
                const newRedirect = await strapi.entityService.create('api::redirect.redirect', {
                    data: {
                        from,
                        to,
                        statusCode
                    }
                })
                console.log('Created new redirect')
                return newRedirect
            }
        } catch (error) {
            console.error('Error find/create redirect', error)
        }
    }
}));

const delay = ms => new Promise(res => setTimeout(res, ms));