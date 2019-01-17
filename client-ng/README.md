# DLRG Ettlingen TLA-DB Client

## Compiling

Run the following to compile the web app:

  npm build

To run a development version locally, run the following command:

  ng serve

If you changed any JSON schema files, you need to install
json-schema-to-typescript globally in order to compile the JSON schema files
to TypeScript:

  npm install json-schema-to-typescript -g

After that, run the following command:

  npm run buildschemas

## Acknowledgements

The template is based on SB-Admin-BS4-Angular-4.