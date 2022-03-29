# dump-organization

This is a simple script that utilizes the Kitemaker GraphQL API to dump all of the contents of an organization, including its work items and themes. It outputs things as JSON or CSV.

## Usage

Options:

- `--output`: Specify the output format. Must be either `json` or `csv`
- `--space`: Limit the output to the specified space, as idenitified by its key. Can be specified multiple times
- `--no-description`: Don't include the work item or theme descriptions in the output

```bash
yarn
export KITEMAKER_TOKEN=<your-kitemaker-api-token>

# dump the whole org
yarn --silent dump

# specify the output format
yarn --silent dump --output=json

# limit it to a few spaces
yarn --silent dump --output=csv --space=ABC --space=ACM

# don't output descriptions
yarn --silent dump --no-description
```
