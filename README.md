# TRSI website

our new website \o/

build using 11ty & Bulma

## Commands
- ```npm install``` to install dependencies
- ```npm run build``` for CMS content download and post processing. 
- ```npm run build:c-process``` to run post processing only
- ```npm run serve``` to run the Eleventy dev server without refetching content

## Checks
- ```npm run build:c-verify``` verifies that every URL in ```src/_data/legacySlugs.json``` is still generated. It runs as part of ```npm run build:content``` and fails the build if a title change would retire a link that has already been shared.

## ENV vars
- ```NODE_ENV: development/production``` prod runs minimisations
- ```DELIVERY_TOKEN``` from Contentful space config
- ```MANAGEMENT_TOKEN``` from Contentful space config

check the [readme in /cms](./cms/README.md) for content integration details.


#### the sleeping gods are back!