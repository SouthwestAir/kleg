# kafka-lambda-event-generator


[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) 

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo= TypeScript&logoColor=white)](https://www.typescriptlang.org/)

## 💡 Concept

Kafka Lambda Event Generator (kleg) is a tool that takes in a decoded Kafka event and converts it to a fully encoded Kafka event that can be used to mimic a message received from Kafka via an Event Source Mapping.

## 📜 Background

A current pain point for Kafka consumers is the inability to test consumer applications on-demand with custom events since consumers do not have permissions to produce to topics, even in dev environments. Testing required working with the producing team to request that they trigger their producer to send a message that matches what's needed for the specific test the consumer wants to run. This process is complicated by the fact that many producers do not have the ability to produce one-off messages containing specific data.

Kleg resolves this issue for teams using Lambda Event Source Mappings by allowing them to generate events that exactly match those that actually come from Kafka. Simply give it a decoded JSON event and it will serialize it with Avro and encode it to the correct format. This output event can then be used to manually invoke the consumer lambda via the AWS console's Test functionality, or kleg can also be configured to invoke the lambda itself.

Kleg is available as both a CLI tool and an importable package. This means that devs can use it easily use it for a quick, one-off test, or it can be incorporated into a larger testing framework.

## ⚙️ Installation

There are multiple ways to run kleg. For most projects, the recommended approach is to install as a dependency from npm or to run with Docker. If you're looking to get started as quickly as possible for testing purposes, a global npm installation might be appropriate. If you want to make changes to kleg itself, then you can clone this repo and run it directly from the source. Cloning this repo is only necessary if you want to modify kleg.

### Install To Project From npm

To install kleg into your project, add an `.npmrc` file containing the following:

```conf
registry=https://nexus-tools.swacorp.com/repository/all-npm
strict-ssl=false
```

Then install kleg with:

```bash
npm install kafka-lambda-event-generator
```

You can now invoke it manually with:

```bash
npx kleg ...
```

Or import it into a project file by adding:

```ts
import { KafkaLambdaEventGenerator } from 'kafka-lambda-event-generator';
```

### Run With Docker

Kleg can also be run inside a Docker container, giving it the flexibility to easily integrate with other testing frameworks or with non-Node.js projects.

To run in Docker, ensure that Docker is installed and running on the host machine. Next, add the [sample Dockerfile](https://gitlab-tools.swacorp.com/csr/apps/kafka-lambda-event-generator/-/blob/master/docker/Dockerfile?ref_type=heads) to your repository. Then, to build the Docker Image, run:

```bash
docker build -t kleg ./docker
```

The container can now be run using `docker run kleg <kleg args>`. You must provide the Docker container with active AWS credentials, a kleg config file, and an input file in order for it to run. There are several approaches for doing this with Docker. The simplest is to pass in AWS credentials as environment variables (retrieved using awssaml) and mount the directory containing the config and input files. This can be done with the following command:

```bash
docker run \
  -e AWS_ACCESS_KEY_ID=$(awssaml credential-value-active --key AccessKeyId) \
  -e AWS_SECRET_ACCESS_KEY=$(awssaml credential-value-active --key SecretAccessKey) \
  -e AWS_SESSION_TOKEN=$(awssaml credential-value-active --key SessionToken) \
  -e AWS_DEFAULT_REGION=us-east-1 \
  --mount type=bind,source=./docker,target=/app \
  kleg <args>
```

This assumes that you have a directory called `docker` containing a kleg config and input file. Change the `source` value if your directory is named something other than `docker`. Mounting this directory has the added benefit of allowing kleg to write the output file back to your local machine.

Another way of passing in AWS credentials is by providing Docker with access to your `~/.aws` directory, as shown here:

```bash
docker run -v ~/.aws:/root/.aws kleg <args>
```

This command mounts your local `~/.aws/` directory to the container's `~/.aws` directory. The AWS SDK will automatically check this location when looking for credentials. Using this method requires that you have active credentials in your `~/.aws/credentials` file, and that they are either named `default` or that they are listed under the same profile specified in your `~/.aws/config` file. This can be done with awssaml by starting a session with the correct credentials and running `awssaml populate-aws-credentials --aws-profile default`.

Visit the [awssaml documentation](https://docs.awssaml.ec.dev.aws.swacorp.com/working_with_docker.html) for more information on passing AWS credentials into a Docker container.

### Install Globally With npm

To install globally, run the following command:

```bash
npm install -g --registry=https://nexus-tools.swacorp.com/repository/all-npm --strict-ssl=false kafka-lambda-event-generator
```

This will set up a symlink so that you can run `kleg` from anywhere. This is the easiest approach to get kleg up and running, but doesn't add it to your project, meaning other teammates will have to manually install kleg too rather than it being added automatically when other project dependencies are installed.

### Run From Source

To run directly from source, clone this repo and run:

```bash
npm install
```

This will install kleg's dependencies. Once this is complete, you can run kleg with:

```bash
npx ts-node src/kleg.ts
```

## 💻 CLI Usage

Using kleg requires an active AWS CLI session. This is used to retrieve Schema Registry credentials from Secrets Manager and to invoke lambda functions. Kleg will only work in AWS accounts where you have the required permissions--typically this will only be dev accounts, unless you have BreakGlass access.

### Commands

Kleg offers three CLI commands:

- `kleg generate`: Generates an encoded Kafka event
- `kleg invoke`: Uses a previously-generated Kafka event to invoke a lambda
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
| Encoded event file | Y\*      | -       | Y                   | Y                  | Path to encoded Kafka event file with which to invoke lambda |
| Lambda name        | Y        | -       | Y                   | N                  | Name of lambda function to invoke                            |
| Lambda region      | Y        | -       | Y                   | N                  | AWS region where lambda is located                           |
| Lambda log file    | Y        | -       | Y                   | Y                  | Path to save file with up to 4 KB of lambda logs             |

\*This value is required if the `invoke` command is run by itself, but is not required if running the default command that both generates an encoded message and invokes the lambda.

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

Check the `sample_files/config.yml` file in this repo for a working example of a config file.

### Decoded Kafka Event File

The contents of this file should match the format of a lambda event with a decoded, deserialized Kafka message. If your consumer lambda logs the decoded Kafka message, you can obtain a sample there. Otherwise the producing team might have a sample available, or you can recreate one based on the Avro schema.

The only actual requirement for the decoded event is that it matches the basic lambda event JSON structure and contains a Kafka message value that matches the Avro schema whose ID is provided. A pared-down version looks like this:

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

The `sample_files/full_decoded_event.json` file contains a working example of an input event for the `ent.flight.paxCounts.state.v1` topic. `sample_files/stripped_decoded_event.json` contains an event with only the essential fields.

Here are some potential **future features** for `kafka-lambda-event-generator (kleg)`:

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

1. **Multi-Topic Event Generation**  
   - Allow kleg to generate and encode events across multiple Kafka topics simultaneously (useful for applications consuming events from different producers).

2. **Plugin System for Custom Serializers**  
   - Enable users to define custom serialization formats beyond Avro (e.g., JSON Schema, Protobuf).  
   - Provide an easy way to add and configure new serialization methods.

3. **Direct Kafka Publishing Mode**  
   - Instead of only generating events for Lambda invocation, allow kleg to publish the encoded event directly to a Kafka topic (would require proper authentication and producer permissions).

4. **Automated Schema Detection**  
   - Auto-fetch Avro schemas from Confluent Schema Registry based on the topic name.  
   - Reduce the need for manually specifying Schema IDs.

5. **Cloud Provider Agnostic Mode**  
   - Extend support for **Azure Event Hubs** and **Google Pub/Sub**, making it adaptable beyond AWS Kafka.

6. **Event Mutation & Replay**  
   - Allow modifying existing Kafka events with partial updates before re-encoding.  
   - Replay past events with new transformations.

7. **Debug Mode with Step-by-Step Logging**  
   - Introduce a verbose debugging mode that logs each transformation step (deserialization → encoding → event output).  
   - Helps diagnose encoding issues.

8. **Event Chaining & Workflows**  
   - Chain multiple events together in a test workflow (e.g., simulate a series of events in a stream).  
   - Useful for integration testing complex event-driven systems.

9. **Scheduled & Batch Event Execution**  
   - Introduce a scheduling feature to send batches of generated events at predefined intervals.  
   - Mimic real-world Kafka producer behavior.

10. **Web-Based UI for Interactive Testing**  
    - Provide a simple web-based front end to configure and generate Kafka events.  
    - Users can define schemas, input data, and test directly from a browser.

11. **kleg API Mode**  
    - Expose kleg as a REST or GraphQL API, allowing external services to request event generation and Lambda invocation.  
    - Enables better integration with CI/CD pipelines.

12. **Support for Consumer Offsets & Checkpointing**  
    - Simulate real-world consumer behavior by allowing generated events to respect partition offsets.  
    - Useful for end-to-end testing of consumer recovery scenarios.

13. **Visualization of Events & Payloads**  
    - A dashboard to inspect raw vs. encoded event structures side by side.  
    - Helps developers better understand transformations.

14. **Terraform & Infrastructure as Code (IaC) Support**  
    - Provide Terraform modules for automated deployment and integration into AWS Lambda-based event-driven architectures.

15. **Mobile App Integration**  
    - Develop an API that allows on-the-go event generation from mobile devices, useful for quick debugging in production environments.

## 💻 Contributors

The following members of Southwest Technology contributed to this project:

| ![Alec Rogers](screenshots/avatar_alec_rogers.png) |
| :---: | 
| Alec Rogers  |
| [![alec-rogers](https://raster.shields.io/badge/linkedin-%40alecprogers-lightblue?logo=linkedin&style=for-the-badge)](https://www.linkedin.com/in/alecprogers/) |

## 📖 Citations

If you use this software, please cite it using the following metadata:

```
@software {
	title = {kafka-lambda-event-generator},
	author = {Technology},
	affiliation = {Southwest Airlines},
	url = {https://github.com/SouthwestAir/kafka-lambda-event-generator},
	month = {03},
	year = {2025},
	license: {BSD-3-Clause}
	version: {1.0}
}
```
