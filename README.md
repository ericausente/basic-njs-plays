# basic-njs-plays

```
# ls -lrt
total 3880
-rw-r--r-- 1 root root  978096 Feb 10 12:00 ngx_stream_js_module.so
-rw-r--r-- 1 root root  982224 Feb 10 12:00 ngx_stream_js_module-debug.so
-rw-r--r-- 1 root root 1000136 Feb 10 12:00 ngx_http_js_module.so
-rw-r--r-- 1 root root 1004200 Feb 10 12:00 ngx_http_js_module-debug.so
```



# 1. Fetching a website resource and convert it to text; serve it to the customer
Server can be found:  ssh -i /Users/e.ausente/ausente-f5-account-key-value-pair.pem ubuntu@18.143.74.2
Manner of accessing: https://public.kushikimi.xyz/nginxorg


/etc/nginx/conf.d/bpi.conf
```
js_path /etc/nginx/conf.d/js/;
js_import main from fetch_https.js;

server {
	server_name public.kushikimi.xyz;
	status_zone public_kushikimi_xyz_page;

        location /nginxorg {
	resolver 1.1.1.1;
	js_content main.fetch; 
  #js_fetch_trusted_certificate /etc/nginx/conf.d/rootca.crt;
	}
....
```

$ sudo cat /etc/nginx/conf.d/js/fetch_https.js 
```
async function fetch(r) {
    let reply = await ngx.fetch('http://www.kushikimi.xyz:8080/');
    let text = await reply.text();
    let footer = "----------NGINX.ORG-----------";
    
    r.headersOut['Content-Type'] = 'text/html';
    r.return(200, `${footer}\n${text.substring(0, 200)} ...${text.length - 200} left...\n${footer}`);
}
```

## Explanation
nginx.conf Configuration File

    js_path "/etc/nginx/njs/";: Sets the path for JavaScript modules, telling Nginx where to find the JavaScript files you want to use.

    js_import main from http/certs/js/fetch_https.js;: Imports a JavaScript module from the specified path (fetch_https.js) and gives it the alias main. This module must contain a function named fetch, as you'll see in the example.js file.

    resolver 1.1.1.1;: Configures DNS resolution using the specified IP address (1.1.1.1 is Cloudflare's DNS server). This is required for Nginx to resolve domain names when making HTTP requests.

    server {: Begins the definition of a server block, configuring how Nginx will handle incoming requests.

    listen 80;: Tells Nginx to listen on port 80, the standard port for HTTP.

    location / {: Defines a location block, specifying how requests to the root URL ("/") will be handled.

    js_content main.fetch;: Tells Nginx to use the fetch function from the imported main module to handle requests to this location.

    js_fetch_trusted_certificate /etc/nginx/njs/http/certs/ISRG_Root_X1.pem;: Specifies a trusted certificate file that Nginx should use when making HTTPS requests from JavaScript.

example.js JavaScript File

    async function fetch(r) {: Defines an asynchronous function named fetch. It takes a request object r, representing the incoming HTTP request.

    let reply = await ngx.fetch('https://nginx.org/');: Makes an asynchronous HTTP request to 'https://nginx.org/' using Nginx's ngx.fetch function, and stores the response in reply.

    let text = await reply.text();: Reads the response body as text and stores it in text.

    let footer = "----------NGINX.ORG-----------";: Defines a string footer to be added at the beginning and end of the response.

    r.return(200, ${footer}\n${text.substring(0, 200)} ...${text.length - 200} left...\n${footer});: Constructs a response string that includes the footer, the first 200 characters of text, and a note about how many characters are left. It then returns this response with a 200 OK status code.

    export default {fetch};: Exports the fetch function so it can be imported by Nginx.

    
