# Overview

This repository contains a simple implementation of a JSON to XML converter using NGINX and njs. The script parses JSON data from the request body, converts it to XML, sends it to an external service, and then converts the XML response back to JSON.

The NGINX configuration (nginx.conf) sets up a server that listens for POST requests at the /api endpoint. The NJS script (http.js) handles the conversion between JSON and XML, communication with the external service, and response processing.

NGINX Configuration (nginx.conf)
```
load_module /usr/lib/nginx/modules/ngx_http_js_module.so;

events {}

http {
    js_import /etc/nginx/njs/http.js;

    server {
        listen 80;

        location /api {
            js_content http.json_to_xml;
            proxy_request_buffering off;  # Ensures the request body is passed to the script
        }
    }
}
```

NJS Script (http.js)

```
function json_to_xml(r) {
    try {
        // Log the raw request body for debugging purposes
        // The request body should contain JSON data like:
        // { "request_id": "12345", "user": "john_doe", "action": "get_pricing" }
        let requestBody = r.requestText || r.body;
        r.error(`Raw request body: ${requestBody}`);

        // Check if the request body is defined
        if (!requestBody) {
            throw new Error("Request body is undefined");
        }

        // Log that we are parsing the JSON body
        r.error('Parsing JSON body');
        // Parse the JSON body
        // For example, requestBody might be '{"request_id": "12345", "user": "john_doe", "action": "get_pricing"}'
        let json = JSON.parse(requestBody);

        // Log that we are converting JSON to XML
        r.error('Converting JSON to XML');
        // Convert JSON to XML (simple conversion for demonstration)
        // Example conversion:
        // { "request_id": "12345", "user": "john_doe", "action": "get_pricing" }
        // will be converted to:
        // <request><request_id>12345</request_id><user>john_doe</user><action>get_pricing</action></request>
        let xml = '<request>';
        for (let key in json) {
            xml += `<${key}>${json[key]}</${key}>`;
        }
        xml += '</request>';

        // Log the XML being sent to the ADC
        r.error(`Sending XML to ADC: ${xml}`);
        // Send the XML to the ADC and get the response
        // Example URL: http://172.29.90.23:8080/request.asmx
        ngx.fetch('http://172.29.90.23:8080/request.asmx', {
            method: 'POST',
            body: xml,
            headers: {'Content-Type': 'application/xml'}
        }).then(reply => {
            // Log that we received a response from the ADC
            r.error('Received response from ADC');
            return reply.text();
        }).then(body => {
            // Log the raw response body for debugging purposes
            // The response body might look like:
            // <response><status>success</status><data>some_data</data></response>
            r.error(`Response body: ${body}`);

            // Convert XML response back to JSON
            let jsonResponse = {};
            // Match all XML tags and their contents
            let matches = body.match(/<(\w+)>(.*?)<\/\1>/g);

            if (matches) {
                matches.forEach(match => {
                    // Extract the tag name and contents
                    // For example, <status>success</status> will be converted to { "status": "success" }
                    let parts = match.match(/<(\w+)>(.*?)<\/\1>/);
                    jsonResponse[parts[1]] = parts[2];
                });
            }

            // Log the converted JSON response
            // The final jsonResponse might look like:
            // { "status": "success", "data": "some_data" }
            r.error(`Converted JSON response: ${JSON.stringify(jsonResponse)}`);
            r.headersOut['Content-Type'] = 'application/json';
            r.return(200, JSON.stringify(jsonResponse));
        }).catch(err => {
            // Log any errors that occur during the fetch
            r.error(`Error in fetch: ${err.message}`);
            r.return(502, `Error: ${err.message}`);
        });
    } catch (e) {
        // Log any errors that occur during processing the request
        r.error(`Error in processing request: ${e.message}`);
        r.return(400, 'Invalid JSON');
    }
}

export default { json_to_xml };
```

# Limitations and Disclaimers

## Limitations

- The JSON to XML conversion logic is very basic and may not handle complex nested structures or arrays correctly.
  Example: Nested JSON objects or arrays will not be converted properly.

- Error messages are logged but not detailed enough for comprehensive debugging.
 Example: Any parsing error will simply return "Invalid JSON" without specifying the error.

- The script assumes that the external service at http://172.29.90.23:8080/request.asmx is always available and responsive.
  Example: If the external service is down, the script will return a 502 error.

- The external service URL is hardcoded, which is not flexible for different environments (development, testing, production).
  Example: The URL should be configurable via environment variables or a configuration file.

- The script does not handle large payloads efficiently and may lead to performance issues under high load.
  Example: Large JSON payloads will take longer to parse and convert, potentially causing delays

- The script does not include any security checks or validations on the input data.
  Example: Malicious JSON data could potentially cause issues if not properly sanitized.

## Disclaimers

- Not Production-Ready:
This script is intended for demonstration purposes and may not be suitable for production use without significant enhancements and testing

- No Warranty:
  The script is provided "as is" without any warranty or guarantee of its functionality or performance.

- Usage Responsibility:
  Users are responsible for thoroughly testing and validating the script in their own environment before using it in production.

- Limited Testing:
   The script has not been extensively tested and may contain bugs or unhandled edge cases.



# How to Use


Clone the Repository:
```
git clone https://github.com/ericausente/basic-njs-plays.git
cd simple-json-xml
```

## Set up a Docker backend that provides the sample ADC response, follow these steps:

Create a simple backend server using Express.js:
Dockerize the Express.js application:
Run the Docker container:

### Step 1: Create the Express.js Backend

First, set up a simple Express.js application that responds with the sample XML.

Directory structure:
```
/adc-backend
|-- Dockerfile
|-- package.json
|-- server.js
```

package.json:
```
{
  "name": "adc-backend",
  "version": "1.0.0",
  "description": "Simple ADC backend for testing",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1"
  }
}
```

server.js:
```
const express = require('express');
const app = express();
const PORT = 8080;

app.use(express.text({ type: 'application/xml' }));

app.post('/request.asmx', (req, res) => {
  console.log('Received XML:', req.body);

  const xmlResponse = `
    <response>
        <status>success</status>
        <price>100.00</price>
    </response>
  `;

  res.set('Content-Type', 'application/xml');
  res.send(xmlResponse);
});

app.listen(PORT, () => {
  console.log(`ADC backend listening on port ${PORT}`);
});
```

### Step 2: Dockerize the Express.js Application

Dockerfile:
```
# Use the official Node.js image.FROM node:14

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Expose the port the app runs on.
EXPOSE 8080

# Run the web service on container startup.
CMD [ "npm", "start" ]
```

### Step 3: Build and Run the Docker Container

Build the Docker image:

```
docker build -t adc-backend .
```

Run the Docker container:
```
docker run -d -p 8080:8080 --name adc-backend adc-backend
```


For the nginx run with Docker:

```
docker run -it -p 80:80 -v $PWD/etc/nginx.conf:/etc/nginx/nginx.conf -v $PWD/njs/:/etc/nginx/njs/ --rm nginx:stable
```

Test the Endpoint:

Use Postman or curl to send a POST request to http://localhost/api with a JSON payload:
```
curl -X POST http://localhost/api -H "Content-Type: application/json" -d '{"request_id": "12345", "user": "john_doe", "action": "get_pricing"}'
```


