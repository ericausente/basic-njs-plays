This README documents the setup and functionality of an NGINX configuration designed to act as an API gateway.
The setup demonstrates the use of NGINX as a reverse proxy, incorporating dynamic routing and response enrichment via external API calls using NGINX's JavaScript (njs) module.


# Overview

The configuration leverages NGINX's ability to dynamically route requests and enrich API responses by making external API calls. This is particularly useful for scenarios where responses from internal services need to be supplemented with data fetched from external services.

## Key Components

- NGINX: Serves as the reverse proxy and the platform for running JavaScript (njs) scripts.
- njs Module: Allows the execution of JavaScript within NGINX, enabling dynamic request handling and response enrichment
- External API (Tumblr): Used as an example of an external service from which data is fetched and included in the API response.

## Configuration Details

NGINX Setup

The NGINX configuration (nginx.conf) includes basic settings for running NGINX as an API gateway, with load_module directives for the njs module, allowing the execution of JavaScript:

```
load_module modules/ngx_http_js_module.so;
load_module modules/ngx_stream_js_module.so;
...
```

## Dynamic Response Enrichment

The mashup.js script is used to fetch data from the Tumblr API and enrich the API response. It handles JSONP response parsing and includes error handling:

```
$ cat mashup.js
async function fetchAndEnrich(r) {
    let externalApiResponse = await ngx.fetch('https://puppygifs.tumblr.com/api/read/json');
    let externalDataText = await externalApiResponse.text();

    // Manually extracting the JSON from the JSONP response
    let jsonStartPos = externalDataText.indexOf('{');
    let jsonEndPos = externalDataText.lastIndexOf('}') + 1;
    let jsonString = externalDataText.substring(jsonStartPos, jsonEndPos);

    let externalData;
    try {
        externalData = JSON.parse(jsonString);
    } catch (e) {
        r.return(500, `Error parsing JSON from JSONP: ${e}`);
        return;
    }

    // Now you can use externalData as a normal JavaScript object
    // This example assumes you want to extract some data from the response.
    // You might need to adjust this based on the actual structure of the Tumblr API response.
    let enrichedData = {
        original: "This is the original response data",
        // Example of extracting data, adjust the key path according to the actual data structure
        external: externalData['tumblelog'] ? externalData['tumblelog']['title'] : 'No title'
    };

    r.return(200, JSON.stringify(enrichedData));
}

export default { fetchAndEnrich };
```

Snippets from nginx configuration: 

```

http {
...
    js_path /etc/nginx/;
    js_import mashup.js;
    resolver 8.8.8.8;

server {
...
location /enriched {
    js_content mashup.fetchAndEnrich;
    js_fetch_trusted_certificate /etc/nginx/tumblr.pem;
}
}
}
```

- location /enriched: This directive specifies a location block in the NGINX configuration, matching requests that are sent to the /enriched URI. Location blocks allow you to define how NGINX responds to requests for different resources. In this case, any request to http://yourserver/enriched will be processed by the directives within this block.
- js_content mashup.fetchAndEnrich;: The js_content directive is used to specify that the content (i.e., the response body) for requests matching this location should be generated by the njs (NGINX JavaScript) function named fetchAndEnrich located within the mashup.js module/file. This function is responsible for asynchronously fetching data from an external API (Tumblr in this context), enriching the original response with this fetched data, and then returning the enriched response to the client. The fetchAndEnrich function acts as the content handler for this location, dynamically generating the response content based on the logic defined in your JavaScript code.
js_fetch_trusted_certificate
- js_fetch_trusted_certificate /etc/nginx/tumblr.pem;: This directive specifies the path to a trusted CA (Certificate Authority) certificate used to verify the SSL certificate presented by the external API (Tumblr) during the TLS/SSL handshake. When making HTTPS requests to external services, it's crucial to verify the authenticity of the SSL certificate presented by the service to prevent man-in-the-middle attacks. This directive tells NGINX's JavaScript module where to find the trusted CA certificate necessary for this verification. The certificate at /etc/nginx/tumblr.pem should be the CA certificate that issued or can verify the SSL certificate of the Tumblr API endpoint being accessed. This setup ensures that your server only establishes secure connections with trusted entities.
  

## Handling JSONP Responses

Since the external API returns data in JSONP format, the script manually parses this response to extract the JSON object. 
This involves finding the start and end of the JSON object within the JSONP response string and using JSON.parse to convert this to a JavaScript object.

### Error Handling

Error handling is crucial for dealing with issues like JSON parsing errors. The script uses a try-catch block around the JSON parsing logic to catch any errors and return an appropriate error response.
Usage

To use this setup, you'll need to ensure NGINX is compiled with the njs module enabled. Then, place the nginx.conf and mashup.js in their respective locations (/etc/nginx/nginx.conf and /etc/nginx/mashup.js).

To test the enriched API endpoint, send a request to /enriched. NGINX will route the request through the JavaScript function defined in mashup.js, which fetches additional data from the Tumblr API, enriches the response, and returns the enriched response to the clie


## Operational Flow

- A client makes a request to the /enriched endpoint on your NGINX server
- NGINX matches this request to the location block configured for /enriched
- The js_content directive triggers the execution of the fetchAndEnrich function from the mashup.js module
- This function makes an HTTPS request to the Tumblr API, verifying the API's SSL certificate against the trusted CA certificate specified by js_fetch_trusted_certificate.
- Upon successfully fetching and parsing the external data, the function enriches the original response data and sends the enriched response back to the client.


## Sample output:
```
$ curl http://localhost/enriched
{"original":"This is the original response data","external":"pups and love"}
```
