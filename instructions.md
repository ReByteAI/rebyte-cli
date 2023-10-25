# Create your own action extension


## Install deno

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
```

## install rebyte cli

```sh
curl -fsSL https://raw.githubusercontent.com/rebyteai/rebyte-cli/main/install.sh | sudo sh -
```


## Login to rebyte using your api key

**API** access is only available for **Pro** users and **Team User**. 

```sh
rebyte login -k <your rebyte api key>
```

## Start from template

```sh
mkdir -p my-extension
cd my-extension
git clone https://github.com/ReByteAI/action-extension-template/
```

## Define your action
You need to specify a json file to define your extension. The file name must be named `rebyte.json`.

This is an example of `rebyte.json` for [call_agent](https://github.com/ReByteAI/ext_call_agent/tree/main)

```json
{
  "name": "call_agent",
  "description": "Action that calls another ReByte agent",
  "version": "0.0.3",
  "main": "./src/main.ts",
  "inputArgs": [
    {
      "name": "callableId",
      "type": "string",
      "description": "Id of target agent to call",
      "required": true
    },
    {
      "name": "projectId",
      "type": "string",
      "description": "project id of the agent",
      "required": true
    },
    {
      "name": "apiKey",
      "type": "credential",
      "description": "API key to use for targeting project",
      "required": true
    },
    {
      "name": "version",
      "type": "string",
      "description": "version of the agent, latest if not specified",
      "required": false
    },
    {
      "name": "inputArgs",
      "type": "array",
      "description": "input arguments to pass to the agent",
      "required": false
    }
  ]
}
```

## Create an action extension on project settings page

`https://rebyte.ai/p/<your project id>/settings/extensions`

```sh
rebyte create <your project dir>
```

**Extension created will only be visible to your project.**

## Test your action

## Deploy your action

```sh
rebyte deploy <your project dir>
```