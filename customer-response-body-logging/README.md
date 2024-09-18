# NGINX Configuration with Custom Response Body Logging

This document describes how to configure NGINX to log response bodies using a custom JavaScript function. The configuration uses the NGINX JavaScript module (njs) to capture and log the response body.

## Prerequisites

    NGINX compiled with the njs module (NGINX JavaScript module).
    Basic knowledge of NGINX configuration.
    Access to the server where NGINX is installed.

## Configuration

Step 1: NGINX Configuration

Create or update the NGINX configuration file (e.g., 8008_log_response_body.conf) with the following content:

```
upstream juice_shop_backend {
    zone juice_shop_backend 64k;
    server 10.201.10.168:3000;
    #server 127.0.0.1:8009; # Fallback server (if needed)
}

# Import the JavaScript module
js_import responseBody from '/etc/nginx/responseBody.js';

# Set the variable to capture the response body
js_set $response_body responseBody.getResponseBody;

# Custom log format including the response body
log_format access_debug '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" $response_body';

# Main server block
server {
    listen 8008;
    location / {
        # Apply the JavaScript function as a body filter
        js_body_filter responseBody.getResponseBody;
        proxy_pass http://juice_shop_backend;
        access_log /var/log/nginx/access_response_body.log access_debug;
    }
}

# Auxiliary server block for testing
server {
    listen 8009;
    location / {
        return 200 "Hello";
    }
}
```

## Step 2: JavaScript Code

Save the following JavaScript code to a file named responseBody.js in the /etc/nginx/ directory:
```
var accumulatedResponse = "";  // Local variable to hold data

function getResponseBody(r, data, flags) {
    accumulatedResponse += data; // Accumulate data
    if (flags.last) {
        r.variables.response_body = accumulatedResponse; // Assign only once at the end
        accumulatedResponse = ""; // Reset for next request
    }
    r.sendBuffer(data, flags); // Continue passing data to the client
}

export default { getResponseBody };
```

## Testing the Configuration

### Step 1: Apply the Configuration

    Place the configuration file (piramal_8008_log_response_body.conf) in the NGINX configuration directory (e.g., /etc/nginx/conf.d/).
    Test the NGINX configuration to ensure there are no syntax errors:

```
sudo nginx -t
```

Reload NGINX to apply the changes:
```
    sudo systemctl reload nginx
```

Step 2: Verify the Logging

    Send a request to the NGINX server on port 8008:
```
curl http://<nginx_server_ip>:8008
```

Check the access log (/var/log/nginx/access_response_body.log) to see the response body logged:
```
    tail -f /var/log/nginx/access_response_body.log
```

    You should see entries that include the response body at the end of each log line.

Step 3: Test the Auxiliary Server

    Send a request to the server on port 8009:
```
    curl http://<nginx_server_ip>:8009
```

    You should receive a response saying "Hello".

### Notes

    The JavaScript function accumulates the response body data chunks and logs the complete response body at the end of the request.
    Ensure that NGINX is compiled with the njs module to use the JavaScript functionality.

Potential Improvements

    Enhance the JavaScript function to handle large responses more efficiently.
    Add error handling in the JavaScript code to manage unexpected response data.
    Consider security and privacy implications when logging response bodies, as they may contain sensitive information.
    
