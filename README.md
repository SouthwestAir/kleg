# Kafka Lambda Event Generator (kleg)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

## 💡 Concept

Kafka Lambda Event Generator (kleg) is a tool that takes in a decoded Kafka event and converts it to a fully encoded, serialized Kafka event that perfectly matches the format of events actually consumed via a Lambda Event Source Mapping.

## 📜 Background

A common pain point for devs who are building Kafka consumers is the inability to run ad hoc tests on their consumer with custom events. Since the Lambda is expecting messages to be encoded and serialized with Avro, a dev cannot simply create a test event by hand; the message actually needs to come from Kafka. But in many enterprise contexts, the team building the consumer does not have permissions to publish messages to the topic they are consuming, even in dev.

One option is to send ad hoc requests to the publishing team to produce a message that fits the needed test case. Another common solution to this problem is for dev teams to provision their own Kafka topic for testing purposes, which they can publish messages to at any time. However, both of these approaches waste time and slow down devs, who should just be focused on the consumer application they're building.

Kleg solves this problem by allowing devs to generate test messages in the exact format as if they had actually come from Kafka. Just provide a sample JSON message and the schema required to serialize it, and Kleg will give you a valid Kafka event in the format expected by your consumer application. It'll even invoke your Lambda for you and spit out the logs. No more waiting for the producer team to reply to your messages begging them to trigger a test event!

Combined with the ability for devs to quickly deploy a Lambda from their local machine, Kleg enables extremely short testing cycles where the dev can deploy their code and test it with any custom event in under a minute.

Kleg is primarily used as a CLI tool, but is also an importable package. This allows it to be incorporated into broader testing frameworks.

## ⚙️ Installation

The recommended and most common way to use Kleg is to add it as a dev dependency in your consumer app repo. It can also be installed globally, run from source, or even run through a Docker container.

### Install To Project From npm

To install kleg into your project, run:

```bash
npm install --save-dev @southwestair/kleg
```

You can now invoke it manually with:

```bash
npx kleg <args>
```

Or import it into a project file by adding:

```ts
import { KafkaLambdaEventGenerator } from '@southwestair/kleg';
```

### Run With Docker

Kleg can also be run inside a Docker container, giving it the flexibility to easily integrate with other testing frameworks or with non-Node.js projects.

To run in Docker, ensure that Docker is installed and running on the host machine. Next, add the [sample Dockerfile](https://github.com/SouthwestAir/kleg/blob/main/docker/Dockerfile) to your repository. Then, to build the Docker Image, run:

```bash
docker build -t kleg ./docker
```

The container can now be run using `docker run kleg <kleg args>`. You must provide the Docker container with active AWS credentials, a kleg config file, and an input file in order for it to run. There are several approaches for doing this with Docker. The simplest is to pass in AWS credentials as environment variables and mount the directory containing the config and input files. This can be done with the following command:

```bash
docker run \
  -e AWS_ACCESS_KEY_ID=<AccessKeyId> \
  -e AWS_SECRET_ACCESS_KEY=<SecretAccessKey> \
  -e AWS_SESSION_TOKEN=<SessionToken> \
  -e AWS_DEFAULT_REGION=us-east-1 \
  --mount type=bind,source=./docker,target=/app \
  kleg <args>
```

This assumes that you have a directory called `docker` containing a kleg config and input file. Change the `source` value if your directory is named something other than `docker`. Mounting this directory has the added benefit of allowing kleg to write the output file back to your local machine.

Another way of passing in AWS credentials is by providing Docker with access to your `~/.aws` directory, as shown here:

```bash
docker run -v ~/.aws:/root/.aws kleg <args>
```

This command mounts your local `~/.aws/` directory to the container's `~/.aws` directory. The AWS SDK will automatically check this location when looking for credentials. Using this method requires that you have active credentials in your `~/.aws/credentials` file, and that they are either named `default` or that they are listed under the same profile specified in your `~/.aws/config` file.

### Install Globally With npm

To install globally, run the following command:

```bash
npm install -g @southwestair/kleg
```

This will set up a symlink so that you can run `kleg` from anywhere. This is the easiest approach to get kleg up and running, but doesn't add it to your project, meaning other teammates will have to manually install kleg too rather than it being added automatically when other project dependencies are installed.

### Run From Source

To run directly from source, clone this repo and run:

```bash
npm install
```

This will install kleg's dependencies. Once this is complete, you can run kleg with:

```bash
npm run dev -- <args>
```

## 💻 CLI Usage

Using kleg requires an active AWS CLI session. This is used to retrieve Schema Registry credentials from Secrets Manager and to invoke Lambda functions. Kleg will only work in AWS accounts where you have the required permissions--typically this will only be dev accounts, unless you have BreakGlass access.

### Commands

Kleg offers three CLI commands:

- `kleg generate`: Generates an encoded Kafka event
- `kleg invoke`: Uses a previously-generated Kafka event to invoke a Lambda
- `kleg` (default): Generates and invokes in one step

The configuration values for each command are defined below. See the CLI Flags and Config File Values sections for specifics on how to set each value. If a value is set via CLI flags and the config file, the value from the CLI flag will be used.

#### Generic Configuration

The following config values are relevant for all commands:

| Name             | Required | Default      | Set in config file? | Set with CLI flag? | Description                             |
| ---------------- | -------- | ------------ | ------------------- | ------------------ | --------------------------------------- |
| Config file path | Y        | `config.yml` | N                   | Y                  | Path to kleg config file                |
| Console          | N        | False        | Y                   | Y                  | Whether to print outputs to the console |
| Verbose          | N        | False        | Y                   | Y                  | Whether to enable debug logs            |

Note: By default, kleg will check for both `./config.yml` and `./kleg/config.yml`.

#### `Generate` Command Configuration

| Name                         | Required | Default | Set in config file? | Set with CLI flag? | Description                                                    |
| ---------------------------- | -------- | ------- | ------------------- | ------------------ | -------------------------------------------------------------- |
| Schema registry host         | Y        | -       | Y                   | N                  | URL for Confluent Schema Registry                              |
| Registry credentials secret  | Y        | -       | Y                   | N                  | AWS secret containing credentials for Schema Registry          |
| Registry cred. secret region | Y        | -       | Y                   | N                  | AWS region where credentials secret is located                 |
| Schema ID                    | Y        | -       | Y                   | N                  | Confluent ID of Avro schema to use for serialization           |
| Decoded event file           | Y        | -       | Y                   | Y                  | Path to decoded Kafka event file to use as input for generator |
| Encoded event file           | N        | -       | Y                   | Y                  | Path to save file with encoded output Kafka event              |
| Batch size                   | N        | 1       | Y                   | Y                  | Number of copies of Kafka message(s) to insert into event      |

#### `Invoke` Command Configuration

| Name               | Required | Default | Set in config file? | Set with CLI flag? | Description                                                  |
| ------------------ | -------- | ------- | ------------------- | ------------------ | ------------------------------------------------------------ |
| Encoded event file | Y\*      | -       | Y                   | Y                  | Path to encoded Kafka event file with which to invoke Lambda |
| Lambda name        | Y        | -       | Y                   | N                  | Name of Lambda function to invoke                            |
| Lambda region      | Y        | -       | Y                   | N                  | AWS region where Lambda is located                           |
| Lambda log file    | Y        | -       | Y                   | Y                  | Path to save file with up to 4 KB of Lambda logs             |

\*This value is required if the `invoke` command is run by itself, but is not required if running the default command that both generates an encoded message and invokes the Lambda.

### CLI Flags

| Name               | Long Flag                    | Short Flag |
| ------------------ | ---------------------------- | ---------- |
| Config file path   | `--config-file <arg>`        | `-f <arg>` |
| Console            | `--console`                  | `-c`       |
| Verbose            | `--verbose`                  | `-v`       |
| Decoded event file | `--decoded-event-file <arg>` | `-d <arg>` |
| Encoded event file | `--encoded-event-file <arg>` | `-e <arg>` |
| Lambda log file    | `--lambda-log-file <arg>`    | `-l <arg>` |
| Batch size         | `--batch-size <arg>`         | `-b <arg>` |

Check the command configuration section above to see which flags are required for each command.

### Kleg Config File Values

Following is the structure of the kleg config file:

```yml
SchemaRegistry:
  Host: <string>
  CredentialsSecret: <string>
  CredentialsSecretRegion: <string>
  SchemaId: <number>
DecodedEventFile: <string>
EncodedEventFile: <string>
Console: <boolean>
Verbose: <boolean>
BatchSize: <number>
Lambda:
  Name: <string>
  Region: <string>
  LogFile: <string>
```

Check the [sample_files/config.yml](https://github.com/SouthwestAir/kleg/blob/main/sample_files/config.yml) file in this
repo for a working example of a config file.

### Decoded Kafka Event File

The contents of this file should match the format of a Lambda event with a decoded, deserialized Kafka message. If your consumer Lambda logs the decoded Kafka message, you can obtain a sample there. Otherwise the producing team might have a sample available, or you can recreate one based on the Avro schema.

The only actual requirement for the decoded event is that it matches the basic Lambda event JSON structure and contains a Kafka message value that matches the Avro schema whose ID is provided. A pared-down version looks like this:

```json
{
  "records": {
    "topic.name-partition": [
      {
        "value": {
          // Kafka message
        }
      }
    ]
  }
}
```

The key and headers will also be properly encoded if they are included, but are not required.

See [sample_files/decoded-event.json](https://github.com/SouthwestAir/kleg/blob/main/sample_files/decoded-event.yml) for a
sample message with a simplistic schema.

## Contributing

To contribute to this package:

1. Fork this repository
1. Clone your fork to your computer
1. Create a branch to work on
1. Commit your code
1. Create a pull request

From: <https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project>

## 🚀 Future Ideas

Here are some ideas for future enhancements of this project:

1. **Support for non-AWS Secrets Manager credentials**

   - Improve flexibility by allowing credentials to be passed in via command line argument or config file, rather than just an AWS Secrets Manager secret.
     - Credentials could be passed in via command line argument or potentially via config file (though some thought should be given to security implications).

1. **Automated Schema Detection**

   - Auto-fetch Avro schemas from Confluent Schema Registry based on the topic name.
   - Reduce the need for manually specifying Schema IDs.

1. **Add Support for Kinesis Events**

   - Extend kleg to also support the generation of AWS Kinesis events.

1. **Plugin System for Custom Serializers**

   - Enable users to define custom serialization formats beyond Avro (e.g., JSON Schema, Protobuf).

1. **Improve Batching Functionality**

   - Introduce the ability to provide multiple different events to send, rather than just multiple copies of the same event.
   - Consider implementing functionality to produce messages at specific time intervals, rather than immediately.

## 💻 Contributors

The following members of Southwest Technology contributed to this project:

|                                                       ![Alec Rogers](screenshots/avatar_alec_rogers.png)                                                        |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                           Alec Rogers                                                                           |
| [![alec-rogers](https://raster.shields.io/badge/linkedin-%40alecprogers-lightblue?logo=linkedin&style=for-the-badge)](https://www.linkedin.com/in/alecprogers/) |

## 📖 Citations

If you use this software, please cite it using the following metadata:

```
@software {
	title = {kleg},
	author = {Technology},
	affiliation = {Southwest Airlines},
	url = {https://github.com/SouthwestAir/kleg},
	month = {03},
	year = {2025},
	license: {BSD-3-Clause}
	version: {1.0}
}
```
