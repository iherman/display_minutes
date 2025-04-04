# Display minutes' information

At the moment, the minutes generated for W3C calls (using the "standard" `scribe` tool) are spread over W3C's date space. Unfortunately, there is no single place where all the minutes could be seen altogether, to see their original agenda, or to see the resolutions that have been passed. This small utility is built on top of the standard W3C minutes to make this possible. It relies on the assumption that the list of all minutes can be located in the same (GitHub) repository where this tool resides; it generates two files:

- `index.html`: a file listing all the minutes, grouped by years, and the possibility to look at the agenda of all those (via a `<detail>` element)
- `resolutions.html`: a file listing all the formal resolutions passed and documented, grouped by years.

The script can be installed in a GitHub repository and can be used to automatically generate those two files in a GitHub page using an action script (see below).

***At the moment*** the only way of using this script is to (manually…) regroup all the minutes in a directory within the GitHub repository. It is hoped that, eventually, there will be a W3C API entry to extract that information (e.g., by accessing the WG Calendar entries). The script should be easily adaptable for an access to the minutes via an API. The script has been developed for the [Publishing Maintenance Working Group](https://www.w3.org/groups/wg/pm) and has been deployed on the [WG repository](https://github.com/w3c/pm-wg).

## Technical details

The script is in TypeScript, and has been developed and deployed using [deno](https://deno.land). (It is meant to be compatible with [node.js+tsc](https://nodejs.org), though.) It consists of four files:

- `main.ts`: deploys the information on minutes by filling in the dedicated "slots" in two template files: `templates/index_template.html` and `templates/resolutions_template.html`. The results are stored in the `index.html` and `resolutions.html` files, respectively. Note that the `main.ts` file refers to a `const directory = "../minutes";` declaration referring to the file name (relative to the script) of the directory containing the minutes. This variable can be set in the `lib/params.ts` file, providing that the directory setup is roughly identical. It also refers to a `const location = "../minutes";` that should be used if the generated is moved away from its current location.
- `data.ts`: set of functions to access, and retrieve, table of content and resolutions from the minute files. It is based on the specificities the minutes files as generated by the standard `scribe` tool. 
- `minidom.ts`: a thin layer on top of the HTML DOM with a few handy shortcut functions. The exact choice of the DOM implementation package is also "hidden" in this module, and can be updated if needed.
- `params.ts`: parameter-like variables. Beyond aforementioned `directory` and `location` variables, the file contains a set of task force identifiers mapped onto the respective task force titles. The task force identifiers are used in the file names convention for the minutes:  `YYYY-MM-DD-suffix` where `suffix` (that may be missing) specifies that the minutes come from a particular task force call, a F2F call, or (in the case of a missing suffix) “just” the group's regular call. The script displays the minutes of these task forces in separate sections.

### Installation in GitHub pages

The tool can also be used to make the file generation automatic via a GitHub workflow. For reference, here is the workflow used on the PM WG repository (the GitHub options for `pages` deployment must be set to “GitHub actions”):

```yml
# Relies on the standard GitHub action setup to deploy to GitHub Pages
# The really specific details are in the steps that generates the index files
# (and the deployment of deno as an underling tool).
name: Publish to Github Pages
on:
  push:
    branches: [main]
  # Allows workflow to be triggered manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout/@v4
      - name: Setup Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - name: Generate the index files
        # Details depend on where the script is located
        run: |
          (cd script; deno run -A main.ts)
          rm script/deno.lock
          cp script/index.html minutes/index.html
          cp script/resolutions.html minutes/resolutions.html
      - name: Setup Github Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # Upload entire repository
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

All documents in this Repository are licensed by contributors under the [W3C Software and Document License](https://www.w3.org/Consortium/Legal/copyright-software).

Ivan Herman, @iherman
