# rebyte-cli

# Using a standalone script
You may install rebyte using the following scripts.

## On Windows
Using PowerShell:

```iwr
iwr https://raw.githubusercontent.com/g1g2-lab/rebyte-cli/main/install.sh -useb | iex
```

## On POSIX systems
```sh
curl -fsSL https://raw.githubusercontent.com/g1g2-lab/rebyte-cli/main/install.sh | sh -
```

If you don't have curl installed, you would like to use wget:

```sh
wget -qO- https://raw.githubusercontent.com/g1g2-lab/rebyte-cli/main/install.sh | sh -
```

<!-- On Alpine Linux
# bash
wget -qO- https://raw.githubusercontent.com/g1g2-lab/rebyte-cli/main/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -
# sh
wget -qO- https://raw.githubusercontent.com/g1g2-lab/rebyte-cli/main/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
# dash
wget -qO- https://raw.githubusercontent.com/g1g2-lab/rebyte-cli/main/install.sh | ENV="$HOME/.dashrc" SHELL="$(which dash)" dash - -->


# Using rebyte

## Login through rebyte api
1. generate rebyte api from https://rebyte.ai
2. login using your api
```
rebyte login -k <your rebyte api key>
```
## Deploy your project
Using `rebyte deploy` to deploy your project. Your project dir must have a `rebyte.json` file
```
rebyte deploy <your project dir>
```
## Show help message
```
rebyte --help
```