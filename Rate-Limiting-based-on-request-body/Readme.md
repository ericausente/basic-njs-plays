The following documentation details a solution using the NGINX njs module to implement rate limiting based on values extracted from the JSON request body. This method is preferred over using the ngx_http_lua_module, as it leverages NGINX's native JavaScript module, which is designed for high performance and seamless integration with NGINX's processing phases.


## Objective
Enable rate limiting in NGINX based on user_id extracted from the JSON body of incoming HTTP requests.

## Requirements

    NGINX compiled with the njs module.
    Incoming requests must contain a JSON body with a user_id field.

## Configuration Overview

    JavaScript Module (njs) Setup: A JavaScript script will parse the JSON request body to extract the user_id and use it for rate limiting.
    NGINX Configuration: Configure NGINX to use the njs script for extracting the user_id and applying rate limiting based on this identifier.

## Step-by-Step Implementation

### Step 1: Preparing the njs Script

Create a JavaScript file (check_user_id.js) that includes a function to extract user_id from the request body and perform an internal redirect to a location that handles rate limiting.
```
// /etc/nginx/check_user_id.js
function extract_user_id_then_internal_redirect(r) {
    var body = JSON.parse(r.requestBuffer);
    var user_id = body.user_id;
    if (user_id) {
        r.variables.user_id = user_id;
    }
    r.internalRedirect('@internal_redirect');
}

export default {extract_user_id_then_internal_redirect};
```

### Step 2: NGINX Configuration

Modify your nginx.conf to include the njs module and use the script for handling requests.
```
// /etc/nginx/nginx.conf
load_module modules/ngx_http_js_module.so;

http {
    js_import /etc/nginx/check_user_id.js;

    server {
        listen 80;

        location / {
            js_content check_user_id.extract_user_id_then_internal_redirect;
        }

        location @internal_redirect {
            internal;
            limit_req zone=test_zone burst=5 nodelay;  // Adjust rate limiting settings as needed
            proxy_pass http://backend_upstream;
        }
    }

    limit_req_zone $user_id zone=test_zone:10m rate=1r/s;  // Define rate limiting zone
}
```

## Key Notes
- Rate Limiting: The rate limiting is applied using limit_req_zone and limit_req directives based on the extracted user_id
- Error Handling: Add error handling in the JavaScript code to manage cases where the JSON parsing fails or the user_id is not present
- Security: Ensure that the NGINX and JavaScript configurations do not expose sensitive data and are protected against malicious inputs.

## Testing and Validation

- Local Testing: Test the configuration in a controlled environment before deploying to production. Use tools like curl to send requests with various user_id values to verify that rate limiting is working as expected
- Monitoring: Monitor the NGINX logs for errors and ensure that rate limiting is being applied correctly. Adjust the burst and rate parameters based on observed traffic patterns.

## Conclusion

This NGINX configuration uses the njs module to dynamically extract user_id from JSON request bodies for granular rate limiting. It provides a flexible and efficient solution suitable for environments where user-based rate limiting is required. Adjustments may be necessary based on specific use cases and traffic patterns.
